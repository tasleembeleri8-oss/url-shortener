from datetime import datetime, timedelta
from fastapi import FastAPI, Depends, HTTPException, Request, BackgroundTasks
from fastapi.responses import RedirectResponse
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import func
from sqlalchemy.orm import Session
from .ratelimit import limit_by_ip, limit_by_user

from . import models, schemas
from .analytics import record_click
from .auth import hash_password, verify_password, create_access_token, get_current_user
from .database import engine, get_db
from .config import settings
from .utils import encode_base62
from .cache import get_cached_link, cache_link, delete_cached, CACHE_TTL

models.Base.metadata.create_all(bind=engine)
app = FastAPI(title="URL Shortener")


@app.get("/")
def root():
    return {"message": "URL Shortener API", "docs": "/docs"}


@app.post("/auth/signup", response_model=schemas.Token, status_code=201,
          dependencies=[Depends(limit_by_ip("signup", 5, 3600))])
def signup(payload: schemas.UserCreate, db: Session = Depends(get_db)):
    if db.query(models.User).filter_by(username=payload.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")
    user = models.User(username=payload.username, password_hash=hash_password(payload.password))
    db.add(user)
    db.commit()
    return schemas.Token(access_token=create_access_token(user.id))


@app.post("/auth/login", response_model=schemas.Token,
          dependencies=[Depends(limit_by_ip("login", 10, 60))])
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter_by(username=form.username).first()
    if not user or not verify_password(form.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    return schemas.Token(access_token=create_access_token(user.id))


@app.post("/shorten", response_model=schemas.LinkOut,
          dependencies=[Depends(limit_by_user("shorten", 10, 60))])
def shorten(
    payload: schemas.LinkCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    link = models.Link(original_url=str(payload.url), user_id=user.id)
    db.add(link)
    db.flush()
    link.short_code = encode_base62(link.id + 100000)
    db.commit()
    return schemas.LinkOut(
        short_code=link.short_code,
        short_url=f"{settings.base_url}/{link.short_code}",
        original_url=link.original_url,
    )


@app.get("/links", response_model=list[schemas.LinkInfo])
def my_links(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    return (
        db.query(models.Link)
        .filter_by(user_id=user.id)
        .order_by(models.Link.created_at.desc())
        .all()
    )


@app.get("/stats/{short_code}", response_model=schemas.LinkStats)
def link_stats(
    short_code: str,
    days: int = 7,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    link = db.query(models.Link).filter_by(short_code=short_code, user_id=user.id).first()
    if not link:
        raise HTTPException(status_code=404, detail="Link not found")

    since = datetime.utcnow() - timedelta(days=days)
    day = func.date(models.Click.clicked_at)
    daily = (
        db.query(day, func.count())
        .filter(models.Click.link_id == link.id, models.Click.clicked_at >= since)
        .group_by(day)
        .order_by(day)
        .all()
    )
    browsers = (
        db.query(models.Click.browser, func.count())
        .filter(models.Click.link_id == link.id)
        .group_by(models.Click.browser)
        .all()
    )
    devices = (
        db.query(models.Click.device, func.count())
        .filter(models.Click.link_id == link.id)
        .group_by(models.Click.device)
        .all()
    )
    return schemas.LinkStats(
        short_code=link.short_code,
        original_url=link.original_url,
        total_clicks=link.click_count,
        daily_clicks={str(d): c for d, c in daily},
        browsers={b or "Other": c for b, c in browsers},
        devices={d or "desktop": c for d, c in devices},
    )


@app.delete("/links/{short_code}", status_code=204)
def delete_link(
    short_code: str,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    link = db.query(models.Link).filter_by(short_code=short_code, user_id=user.id).first()
    if not link:
        raise HTTPException(status_code=404, detail="Link not found")
    db.query(models.Click).filter_by(link_id=link.id).delete()
    db.delete(link)
    db.commit()
    delete_cached(short_code)


@app.get("/{short_code}", dependencies=[Depends(limit_by_ip("redirect", 120, 60))])
def redirect(
    short_code: str,
    request: Request,
    background: BackgroundTasks,
    db: Session = Depends(get_db),
):
    user_agent = request.headers.get("user-agent")
    referrer = request.headers.get("referer")

    cached = get_cached_link(short_code)
    if cached:
        link_id, url = cached
        background.add_task(record_click, link_id, user_agent, referrer)
        return RedirectResponse(url, status_code=307)

    link = db.query(models.Link).filter_by(short_code=short_code).first()
    if not link:
        raise HTTPException(status_code=404, detail="Link not found")

    ttl = CACHE_TTL
    if link.expires_at:
        remaining = int((link.expires_at - datetime.utcnow()).total_seconds())
        if remaining <= 0:
            raise HTTPException(status_code=410, detail="Link expired")
        ttl = min(ttl, remaining)

    cache_link(short_code, link.id, link.original_url, ttl)
    background.add_task(record_click, link.id, user_agent, referrer)
    return RedirectResponse(link.original_url, status_code=307)
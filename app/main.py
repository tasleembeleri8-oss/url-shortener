from datetime import datetime
from fastapi import FastAPI, Depends, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from . import models, schemas
from .database import engine, get_db
from .config import settings
from .utils import encode_base62
from .cache import get_cached_url, cache_url, incr_clicks, CACHE_TTL

models.Base.metadata.create_all(bind=engine)
app = FastAPI(title="URL Shortener")


@app.get("/")
def root():
    return {"message": "URL Shortener API", "docs": "/docs"}


@app.post("/shorten", response_model=schemas.LinkOut)
def shorten(payload: schemas.LinkCreate, db: Session = Depends(get_db)):
    link = models.Link(original_url=str(payload.url))
    db.add(link)
    db.flush()
    link.short_code = encode_base62(link.id + 100000)
    db.commit()
    return schemas.LinkOut(
        short_code=link.short_code,
        short_url=f"{settings.base_url}/{link.short_code}",
        original_url=link.original_url,
    )


@app.get("/{short_code}")
def redirect(short_code: str, db: Session = Depends(get_db)):
    cached = get_cached_url(short_code)
    if cached:
        incr_clicks(short_code)
        return RedirectResponse(cached, status_code=307)

    link = db.query(models.Link).filter_by(short_code=short_code).first()
    if not link:
        raise HTTPException(status_code=404, detail="Link not found")

    ttl = CACHE_TTL
    if link.expires_at:
        remaining = int((link.expires_at - datetime.utcnow()).total_seconds())
        if remaining <= 0:
            raise HTTPException(status_code=410, detail="Link expired")
        ttl = min(ttl, remaining)

    cache_url(short_code, link.original_url, ttl)
    incr_clicks(short_code)
    return RedirectResponse(link.original_url, status_code=307)
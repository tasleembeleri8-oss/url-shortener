from . import models
from .database import SessionLocal
from .utils import parse_user_agent

def record_click(link_id: int, user_agent: str | None, referrer: str | None):
    browser, device = parse_user_agent(user_agent)
    db = SessionLocal()          # own session: the request's session is closed by now
    try:
        db.add(models.Click(link_id=link_id, browser=browser, device=device, referrer=referrer))
        db.query(models.Link).filter_by(id=link_id).update(
            {models.Link.click_count: models.Link.click_count + 1}
        )
        db.commit()
    except Exception as e:
        db.rollback()
        print("Click record error:", e)
    finally:
        db.close()
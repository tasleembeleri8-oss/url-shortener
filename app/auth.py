from . import models
from .database import SessionLocal
from .utils import parse_user_agent


def record_click(link_id: int, user_agent: str | None, referrer: str | None):
    browser, device = parse_user_agent(user_agent)
    db = SessionLocal()
    try:
        db.add(models.Click(link_id=link_id, browser=browser, device=device, referrer=referrer))
        db.commit()
    except Exception as e:
        db.rollback()
        print("Click record error:", e)
    finally:
        db.close()
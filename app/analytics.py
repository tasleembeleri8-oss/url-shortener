import json
import threading
from datetime import datetime, timezone

import redis
from sqlalchemy import insert

from . import cache, models
from .database import SessionLocal
from .utils import parse_user_agent

QUEUE_KEY = "clicks:queue"
BATCH_SIZE = 1000
FLUSH_INTERVAL = 2  # seconds


def _to_row(event: dict) -> dict:
    return {**event, "clicked_at": datetime.fromisoformat(event["clicked_at"])}


def _insert_clicks(rows: list[dict]):
    db = SessionLocal()
    try:
        db.execute(insert(models.Click), rows)
        db.commit()
    finally:
        db.close()



def record_click(
    link_id: int,
    user_agent: str | None,
    referrer: str | None,
    visitor_id: str | None = None,
):
    browser, device, operating_system = parse_user_agent(user_agent)

    event = {
        "link_id": link_id,
        "browser": browser,
        "device": device,
        "operating_system": operating_system,
        "visitor_id": visitor_id,
        "referrer": referrer,
        "clicked_at": datetime.now(timezone.utc).replace(tzinfo=None).isoformat(),
    }

    try:
        cache.redis_client.rpush(QUEUE_KEY, json.dumps(event))
    except redis.RedisError as e:
        print("Click queue error, writing directly:", e)
        try:
            _insert_clicks([_to_row(event)])
        except Exception as e2:
            print("Click insert error:", e2)



def flush_clicks() -> int:
    try:
        pipe = cache.redis_client.pipeline(transaction=True)
        pipe.lrange(QUEUE_KEY, 0, BATCH_SIZE - 1)
        pipe.ltrim(QUEUE_KEY, BATCH_SIZE, -1)
        items, _ = pipe.execute()
    except redis.RedisError as e:
        print("Click flush error:", e)
        return 0
    if not items:
        return 0
    try:
        _insert_clicks([_to_row(json.loads(i)) for i in items])
    except Exception as e:
        print("Click insert error, requeueing:", e)
        try:
            cache.redis_client.rpush(QUEUE_KEY, *items)
        except redis.RedisError:
            pass
        return 0
    return len(items)


_stop = threading.Event()


def _flush_loop():
    while not _stop.is_set():
        while flush_clicks() == BATCH_SIZE:  # drain a backlog quickly
            pass
        _stop.wait(FLUSH_INTERVAL)


def start_flusher():
    _stop.clear()
    threading.Thread(target=_flush_loop, daemon=True).start()


def stop_flusher():
    _stop.set()
    flush_clicks()
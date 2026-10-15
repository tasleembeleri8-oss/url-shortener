import redis
from fastapi import Depends, HTTPException, Request

from . import models
from .auth import get_current_user
from .cache import redis_client
from .config import settings


def client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:                       # set by the host (Render, Railway) when deployed
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _check(key: str, limit: int, window: int):
    if not settings.rate_limit_enabled:
        return
    try:
        pipe = redis_client.pipeline()
        pipe.incr(key)
        pipe.ttl(key)
        count, ttl = pipe.execute()
        if count == 1 or ttl == -1:     # first hit, or a key that lost its expiry
            redis_client.expire(key, window)
            ttl = window
    except redis.RedisError as e:
        print("Rate limit error:", e)   # if Redis is down, allow the request
        return

    if count > limit:
        raise HTTPException(
            status_code=429,
            detail="Too many requests. Please slow down.",
            headers={"Retry-After": str(max(ttl, 1))},
        )


def limit_by_ip(name: str, limit: int, window: int):
    def dependency(request: Request):
        _check(f"rl:{name}:{client_ip(request)}", limit, window)
    return dependency


def limit_by_user(name: str, limit: int, window: int):
    def dependency(user: models.User = Depends(get_current_user)):
        _check(f"rl:{name}:user:{user.id}", limit, window)
    return dependency
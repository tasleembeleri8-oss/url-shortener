import redis
from .config import settings

redis_client = redis.Redis.from_url(settings.redis_url, decode_responses=True)
CACHE_TTL = 3600  # 1 hour

def get_cached_link(code: str):
    try:
        value = redis_client.get(f"link:{code}")
    except redis.RedisError as e:
        print("Redis error:", e)
        return None
    if not value:
        return None
    link_id, _, url = value.partition("|")
    if not link_id.isdigit() or not url:
        return None
    return int(link_id), url

def cache_link(code: str, link_id: int, url: str, ttl: int = CACHE_TTL):
    try:
        redis_client.setex(f"link:{code}", ttl, f"{link_id}|{url}")
    except redis.RedisError as e:
        print("Redis error:", e)

def delete_cached(code: str):
    try:
        redis_client.delete(f"link:{code}")
    except redis.RedisError as e:
        print("Redis error:", e)
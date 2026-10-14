import redis
from .config import settings

redis_client = redis.Redis.from_url(settings.redis_url, decode_responses=True)
CACHE_TTL = 3600  # 1 hour

def get_cached_url(code: str):
    try:
        return redis_client.get(f"url:{code}")
    except redis.RedisError as e:
        print("Redis error:", e)
        return None

def cache_url(code: str, url: str, ttl: int = CACHE_TTL):
    try:
        redis_client.setex(f"url:{code}", ttl, url)
    except redis.RedisError as e:
        print("Redis error:", e)

def incr_clicks(code: str):
    try:
        redis_client.incr(f"clicks:{code}")
    except redis.RedisError as e:
        print("Redis error:", e)

def delete_cached(code: str):
    try:
        redis_client.delete(f"url:{code}", f"clicks:{code}")
    except redis.RedisError as e:
        print("Redis error:", e)
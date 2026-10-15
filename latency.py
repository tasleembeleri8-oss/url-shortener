import time
import statistics
from sqlalchemy import text
from app.database import engine
from app.cache import redis_client


def timeit(fn, n=15):
    times = []
    for _ in range(n):
        start = time.perf_counter()
        fn()
        times.append((time.perf_counter() - start) * 1000)
    return round(statistics.median(times)), round(max(times))


with engine.connect() as conn:
    conn.execute(text("select 1"))  # warm-up: Neon may be waking from sleep
    print("Neon select 1 (median ms, max ms):", timeit(lambda: conn.execute(text("select 1"))))

redis_client.ping()
print("Upstash ping (median ms, max ms):", timeit(redis_client.ping))
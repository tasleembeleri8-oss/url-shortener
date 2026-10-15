![CI](https://github.com/tasleembeleri8-oss/url-shortener/actions/workflows/ci.yml/badge.svg)


# url-shortener
A URL shortener built with FastAPI, PostgreSQL, Redis, rate limiting, and click analytics.

# URL Shortener API

![CI](https://github.com/tasleembeleri8-oss/url-shortener/actions/workflows/ci.yml/badge.svg)

A URL shortener with JWT auth, Redis caching, click analytics and rate limiting.

**Live demo:** [YOUR RENDER URL]/docs (free tier: the first request may be slow while it wakes up)

![Swagger UI](docs/swagger.png)

## Features
- Shorten URLs with collision-free base62 codes (database ID encoded in base 62)
- JWT signup/login; users can only see, delete and view stats for their own links
- Redis cache for redirects; the app keeps working if Redis is down
- Click analytics: daily counts, browser and device breakdown
- Redis rate limiting per IP and per user (returns 429 with Retry-After)
- 15 Pytest tests, GitHub Actions CI, Docker and docker-compose

## Architecture
[Insert the diagram: Client -> FastAPI -> Redis (cache, rate limits, click queue) -> PostgreSQL]

1. `POST /shorten` stores the URL and returns a base62 code.
2. `GET /{code}` checks Redis first and falls back to PostgreSQL on a miss.
3. Each click is pushed to a Redis queue and written to PostgreSQL in batches, so redirects never wait on analytics writes.

## Tech stack
FastAPI, PostgreSQL (Neon), Redis (Upstash), SQLAlchemy, PyJWT, bcrypt, Pytest, Docker, GitHub Actions

## Design decisions
- **Base62 from the row ID:** unique by construction, no collision checks.
- **Cache fails open:** Redis errors fall back to the database.
- **Batched click writes:** a first version updated a counter row on every redirect; a Locust test showed response times climbing from 140 ms to 13 s because of row contention and slow remote writes. I moved clicks to a Redis queue flushed in batches. Trade-off: stats can lag by about 2 seconds, and a crash can lose clicks not yet flushed.
- **Rate limiter:** fixed window counters in Redis. A sliding window would be smoother at window edges.

## Benchmark
Setup: [GitHub Codespace / machine], app, PostgreSQL and Redis on the same host via docker-compose, Locust, 20 users, 60 seconds, rate limiting off.

| Run | Median | p95 | Requests/s | Failures |
|---|---|---|---|---|
| Cache off | [x] ms | [x] ms | [x] | [x] |
| Cache on | [x] ms | [x] ms | [x] | [x] |

## Run locally
```bash
git clone https://github.com/tasleembeleri8-oss/url-shortener
cd url-shortener
docker compose up --build
# open http://localhost:8000/docs
```

## Run the tests
```bash
pip install -r requirements-dev.txt
pytest
```

## What I'd do next
Sliding-window rate limiting, Alembic migrations, per-link expiry in the API, a small front-end.
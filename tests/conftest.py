import os

os.environ["DATABASE_URL"] = "sqlite:///./test.db"
os.environ["REDIS_URL"] = "redis://localhost:6379/0"
os.environ["SECRET_KEY"] = "test-secret-key-for-automated-tests-only-0123456789"
os.environ["BASE_URL"] = "http://testserver"
os.environ["RATE_LIMIT_ENABLED"] = "true"
os.environ["CACHE_ENABLED"] = "true"

import fakeredis
import pytest
from fastapi.testclient import TestClient

from app import cache, ratelimit
from app.database import Base, engine
from app.main import app


@pytest.fixture(autouse=True)
def clean_state(monkeypatch):
    fake = fakeredis.FakeRedis(decode_responses=True)
    fake.flushall()
    monkeypatch.setattr(cache, "redis_client", fake)
    monkeypatch.setattr(ratelimit, "redis_client", fake)
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield


@pytest.fixture
def client():
    return TestClient(app)
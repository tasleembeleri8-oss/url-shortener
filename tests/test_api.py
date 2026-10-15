from datetime import datetime, timedelta

from app import cache, models
from app.database import SessionLocal
from app.utils import encode_base62, parse_user_agent

IPHONE_UA = (
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 "
    "(KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
)
CHROME_UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)


def signup(client, username="alice", password="password123"):
    r = client.post("/auth/signup", json={"username": username, "password": password})
    assert r.status_code == 201
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


def make_link(client, headers, url="https://github.com"):
    r = client.post("/shorten", json={"url": url}, headers=headers)
    assert r.status_code == 200
    return r.json()["short_code"]


def test_base62_encoding():
    assert encode_base62(0) == "0"
    assert encode_base62(61) == "Z"
    assert encode_base62(62) == "10"


def test_user_agent_parsing():
    assert parse_user_agent(IPHONE_UA) == ("Safari", "mobile")
    assert parse_user_agent(CHROME_UA) == ("Chrome", "desktop")
    assert parse_user_agent("curl/8.4.0") == ("Other", "bot")


def test_signup_returns_token(client):
    r = client.post("/auth/signup", json={"username": "alice", "password": "password123"})
    assert r.status_code == 201
    assert "access_token" in r.json()


def test_duplicate_username_rejected(client):
    signup(client)
    r = client.post("/auth/signup", json={"username": "alice", "password": "password123"})
    assert r.status_code == 400


def test_login_success_and_wrong_password(client):
    signup(client)
    ok = client.post("/auth/login", data={"username": "alice", "password": "password123"})
    assert ok.status_code == 200
    assert "access_token" in ok.json()
    bad = client.post("/auth/login", data={"username": "alice", "password": "wrongpass1"})
    assert bad.status_code == 401


def test_shorten_requires_token(client):
    r = client.post("/shorten", json={"url": "https://github.com"})
    assert r.status_code == 401


def test_shorten_rejects_invalid_url(client):
    headers = signup(client)
    r = client.post("/shorten", json={"url": "not-a-url"}, headers=headers)
    assert r.status_code == 422


def test_redirect_goes_to_original_url(client):
    headers = signup(client)
    code = make_link(client, headers)
    r = client.get(f"/{code}", follow_redirects=False)
    assert r.status_code == 307
    assert r.headers["location"] == "https://github.com/"


def test_unknown_code_returns_404(client):
    assert client.get("/doesnotexist", follow_redirects=False).status_code == 404


def test_redirect_populates_cache(client):
    headers = signup(client)
    code = make_link(client, headers)
    assert cache.redis_client.get(f"link:{code}") is None
    client.get(f"/{code}", follow_redirects=False)
    assert cache.redis_client.get(f"link:{code}") is not None


def test_users_cannot_see_or_touch_each_others_links(client):
    alice = signup(client, "alice")
    bob = signup(client, "bob")
    code = make_link(client, alice)

    assert client.get("/links", headers=bob).json() == []
    assert client.delete(f"/links/{code}", headers=bob).status_code == 404
    assert client.get(f"/stats/{code}", headers=bob).status_code == 404
    assert len(client.get("/links", headers=alice).json()) == 1


def test_delete_removes_link_and_cache(client):
    headers = signup(client)
    code = make_link(client, headers)
    client.get(f"/{code}", follow_redirects=False)
    assert client.delete(f"/links/{code}", headers=headers).status_code == 204
    assert cache.redis_client.get(f"link:{code}") is None
    assert client.get(f"/{code}", follow_redirects=False).status_code == 404


def test_stats_count_clicks_by_browser_and_device(client):
    headers = signup(client)
    code = make_link(client, headers)
    client.get(f"/{code}", headers={"user-agent": CHROME_UA}, follow_redirects=False)
    client.get(f"/{code}", headers={"user-agent": IPHONE_UA}, follow_redirects=False)

    stats = client.get(f"/stats/{code}", headers=headers).json()
    assert stats["total_clicks"] == 2
    assert stats["browsers"] == {"Chrome": 1, "Safari": 1}
    assert stats["devices"] == {"desktop": 1, "mobile": 1}


def test_expired_link_returns_410(client):
    headers = signup(client)
    code = make_link(client, headers)
    db = SessionLocal()
    db.query(models.Link).filter_by(short_code=code).update(
        {"expires_at": datetime.utcnow() - timedelta(hours=1)}
    )
    db.commit()
    db.close()
    assert client.get(f"/{code}", follow_redirects=False).status_code == 410


def test_login_is_rate_limited(client):
    for _ in range(10):
        r = client.post("/auth/login", data={"username": "nobody", "password": "wrongpass1"})
        assert r.status_code == 401
    blocked = client.post("/auth/login", data={"username": "nobody", "password": "wrongpass1"})
    assert blocked.status_code == 429
    assert "retry-after" in blocked.headers
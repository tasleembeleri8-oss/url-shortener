from datetime import datetime
from pydantic import BaseModel, HttpUrl, Field

class UserCreate(BaseModel):
    username: str = Field(min_length=3, max_length=30)
    password: str = Field(min_length=8, max_length=72)

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class LinkCreate(BaseModel):
    url: HttpUrl

class LinkOut(BaseModel):
    short_code: str
    short_url: str
    original_url: str

class LinkInfo(BaseModel):
    short_code: str
    original_url: str
    click_count: int
    created_at: datetime
    model_config = {"from_attributes": True}


class LinkStats(BaseModel):
    short_code: str
    original_url: str
    total_clicks: int
    unique_visitors: int
    daily_clicks: dict[str, int]
    browsers: dict[str, int]
    devices: dict[str, int]
    operating_systems: dict[str, int]
    referrers: dict[str, int]

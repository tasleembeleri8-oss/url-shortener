from pydantic import BaseModel, HttpUrl

class LinkCreate(BaseModel):
    url: HttpUrl

class LinkOut(BaseModel):
    short_code: str
    short_url: str
    original_url: str
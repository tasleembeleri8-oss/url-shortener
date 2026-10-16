from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from .database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class Link(Base):
    __tablename__ = "links"
    id = Column(Integer, primary_key=True, index=True)
    original_url = Column(String, nullable=False)
    short_code = Column(String, unique=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)
    click_count = Column(Integer, default=0)


class Click(Base):
    __tablename__ = "clicks"

    id = Column(Integer, primary_key=True)
    link_id = Column(
        Integer,
        ForeignKey("links.id"),
        nullable=False,
        index=True,
    )
    clicked_at = Column(
        DateTime,
        default=datetime.utcnow,
        index=True,
    )
    browser = Column(String)
    device = Column(String)
    referrer = Column(String, nullable=True)
    operating_system = Column(String, nullable=True)
    visitor_id = Column(String(64), nullable=True, index=True)

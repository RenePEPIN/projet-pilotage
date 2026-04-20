import hmac

from fastapi import Header, HTTPException

from core.config import WRITE_API_KEY
from database import SessionLocal


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def require_write_auth(
    x_api_key: str | None = Header(default=None, alias="X-API-Key"),
) -> None:
    provided_key = x_api_key or ""
    if not hmac.compare_digest(provided_key, WRITE_API_KEY):
        raise HTTPException(status_code=401, detail="Cle API invalide")

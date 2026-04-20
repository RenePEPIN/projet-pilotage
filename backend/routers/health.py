import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from core.rate_limit import limiter
from database import db_backend_name, ping_database
from dependencies import get_db

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/health/db", summary="Verifier la connexion base de donnees")
@limiter.limit("100/minute")  # type: ignore[misc]
def health_db(request: Request, db: Session = Depends(get_db)) -> dict[str, Any]:
    try:
        ping_database(db)
        return {"status": "ok", "database": db_backend_name()}
    except Exception as exc:
        logger.exception("Database health check failed")
        raise HTTPException(status_code=503, detail="DB indisponible") from exc

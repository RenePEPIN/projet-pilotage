from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from core.rate_limit import limiter
from crud.strategic_note import get_or_create_global, update_global_content
from dependencies import get_db, require_write_auth
from schemas.strategic_note import StrategicNotePublic, StrategicNoteUpdate

router = APIRouter()


@router.get(
    "/strategic-notes/",
    response_model=StrategicNotePublic,
    summary="Lire la note strategique globale",
)
@limiter.limit("100/minute")  # type: ignore[misc]
def get_strategic_note(
    request: Request,
    db: Session = Depends(get_db),
) -> StrategicNotePublic:
    row = get_or_create_global(db)
    return StrategicNotePublic(content=row.content, updated_at=row.updated_at)


@router.put(
    "/strategic-notes/",
    response_model=StrategicNotePublic,
    dependencies=[Depends(require_write_auth)],
    summary="Mettre a jour la note strategique globale",
)
@limiter.limit("30/minute")  # type: ignore[misc]
def put_strategic_note(
    request: Request,
    payload: StrategicNoteUpdate,
    db: Session = Depends(get_db),
) -> StrategicNotePublic:
    row = update_global_content(db, payload.content)
    return StrategicNotePublic(content=row.content, updated_at=row.updated_at)

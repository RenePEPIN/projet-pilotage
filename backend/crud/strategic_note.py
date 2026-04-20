from datetime import UTC, datetime

from sqlalchemy.orm import Session

from models.strategic_note import StrategicNoteModel

GLOBAL_WORKSPACE = "global"


def get_or_create_global(db: Session) -> StrategicNoteModel:
    row = (
        db.query(StrategicNoteModel)
        .filter(StrategicNoteModel.workspace_id == GLOBAL_WORKSPACE)
        .first()
    )
    if row is None:
        now = datetime.now(UTC)
        row = StrategicNoteModel(
            workspace_id=GLOBAL_WORKSPACE,
            content="",
            updated_at=now,
        )
        db.add(row)
        db.commit()
        db.refresh(row)
    return row


def update_global_content(db: Session, content: str) -> StrategicNoteModel:
    row = get_or_create_global(db)
    row.content = content
    row.updated_at = datetime.now(UTC)
    db.commit()
    db.refresh(row)
    return row

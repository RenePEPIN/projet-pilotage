from datetime import datetime

from sqlalchemy import DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


class StrategicNoteModel(Base):
    """
    Note de pilotage partagée (workspace unique « global » en MVP).
    Une ligne par workspace_id ; extensible multi-workspace plus tard.
    """

    __tablename__ = "strategic_notes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    workspace_id: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False, default="")
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

from datetime import date

from sqlalchemy import Date, Enum, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from core.task_status import Etat, enum_values
from database import Base


class TacheModel(Base):
    __tablename__ = "taches"
    _status_enum = Enum(
        Etat,
        name="tache_etat",
        native_enum=False,
        create_constraint=True,
        validate_strings=True,
        values_callable=enum_values,
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    titre: Mapped[str] = mapped_column(String(150), nullable=False)
    description: Mapped[str] = mapped_column(String(1000), default="", nullable=False)
    etat: Mapped[Etat] = mapped_column(_status_enum, nullable=False)
    section: Mapped[str] = mapped_column(String(80), default="backend", nullable=False)
    project_id: Mapped[str] = mapped_column(String(120), default="projet-api-principal", nullable=False)
    parent_task_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("taches.id", ondelete="SET NULL"), nullable=True, default=None, index=True)
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True, default=None, index=True)

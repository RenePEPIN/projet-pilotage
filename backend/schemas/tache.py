from datetime import date
from typing import Optional

from core.task_status import Etat
from pydantic import BaseModel, ConfigDict, Field


class TacheBase(BaseModel):
    titre: str = Field(min_length=1, max_length=150)
    description: str = Field(default="", max_length=1000)
    etat: Etat
    section: str = Field(default="backend", min_length=1, max_length=80)
    project_id: str = Field(
        default="projet-api-principal",
        min_length=1,
        max_length=120,
        pattern=r"^[a-z0-9-]+$",
    )
    parent_task_id: Optional[int] = Field(default=None, description="ID of parent task (dependency)")
    due_date: Optional[date] = Field(default=None, description="Optional due date for project planning")


class TacheCreate(TacheBase):
    pass


class TacheUpdate(BaseModel):
    titre: Optional[str] = Field(default=None, min_length=1, max_length=150)
    description: Optional[str] = Field(default=None, max_length=1000)
    etat: Optional[Etat] = None
    section: Optional[str] = Field(default=None, min_length=1, max_length=80)
    project_id: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=120,
        pattern=r"^[a-z0-9-]+$",
    )
    parent_task_id: Optional[int] = Field(
        default=None,
        description="ID of parent task (dependency)",
    )
    due_date: Optional[date] = Field(
        default=None,
        description="Optional due date for project planning",
    )


class Tache(TacheBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


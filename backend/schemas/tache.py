from datetime import date

from pydantic import BaseModel, ConfigDict, Field

from core.task_status import Etat


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
    parent_task_id: int | None = Field(
        default=None,
        ge=1,
        description="ID of parent task (dependency)",
    )
    due_date: date | None = Field(
        default=None, description="Optional due date for project planning"
    )


class TacheCreate(TacheBase):
    pass


class TacheUpdate(BaseModel):
    titre: str | None = Field(default=None, min_length=1, max_length=150)
    description: str | None = Field(default=None, max_length=1000)
    etat: Etat | None = None
    section: str | None = Field(default=None, min_length=1, max_length=80)
    project_id: str | None = Field(
        default=None,
        min_length=1,
        max_length=120,
        pattern=r"^[a-z0-9-]+$",
    )
    parent_task_id: int | None = Field(
        default=None,
        ge=1,
        description="ID of parent task (dependency)",
    )
    due_date: date | None = Field(
        default=None,
        description="Optional due date for project planning",
    )


class Tache(TacheBase):
    id: int

    model_config = ConfigDict(from_attributes=True)

from datetime import datetime

from pydantic import BaseModel, Field


class StrategicNotePublic(BaseModel):
    content: str
    updated_at: datetime


class StrategicNoteUpdate(BaseModel):
    content: str = Field(default="", max_length=500_000)

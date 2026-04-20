from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


class ProjectModel(Base):
    __tablename__ = "projects"

    id: Mapped[str] = mapped_column(String(120), primary_key=True)
    name: Mapped[str] = mapped_column(String(180), nullable=False)

from pydantic import BaseModel, ConfigDict, Field


class ProjectBase(BaseModel):
    id: str = Field(min_length=1, max_length=120, pattern=r"^[a-z0-9-]+$")
    name: str = Field(min_length=1, max_length=180)


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    name: str = Field(min_length=1, max_length=180)


class Project(ProjectBase):
    model_config = ConfigDict(from_attributes=True)

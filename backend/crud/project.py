from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from models.project import ProjectModel
from schemas.project import ProjectCreate, ProjectUpdate

DEFAULT_PROJECTS = [
    {"id": "projet-api-principal", "name": "Projet API Principal"},
    {"id": "lis-taches-apres-reunion", "name": "lis taches apres reunion"},
]


def ensure_default_projects(db: Session) -> None:
    existing_ids = {item.id for item in db.query(ProjectModel.id).all()}

    to_insert = [
        ProjectModel(**project) for project in DEFAULT_PROJECTS if project["id"] not in existing_ids
    ]

    if to_insert:
        db.add_all(to_insert)
        db.commit()


def list_projects(db: Session) -> list[ProjectModel]:
    return db.query(ProjectModel).order_by(ProjectModel.name.asc()).all()


def create_project(db: Session, project: ProjectCreate) -> ProjectModel | None:
    """Create a new project with proper error handling for duplicates."""
    existing = db.query(ProjectModel).filter(ProjectModel.id == project.id).first()
    if existing:
        return None

    project_db = ProjectModel(**project.model_dump())
    db.add(project_db)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise
    db.refresh(project_db)
    return project_db


def update_project_name(
    db: Session,
    project_id: str,
    payload: ProjectUpdate,
) -> ProjectModel | None:
    """Update project name with proper error handling for constraint violations."""
    project = db.query(ProjectModel).filter(ProjectModel.id == project_id).first()
    if project is None:
        return None

    project.name = payload.name
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise
    db.refresh(project)
    return project

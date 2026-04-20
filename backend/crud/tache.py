from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from models.tache import TacheModel
from schemas.tache import TacheCreate, TacheUpdate
from validators.dependency import (
    DependencyValidationError,
    validate_no_cycle,
    validate_no_self_dependency,
    validate_parent_exists,
    validate_same_project,
)


def count_taches(db: Session, project_id: str | None = None) -> int:
    query = db.query(TacheModel)
    if project_id:
        query = query.filter(TacheModel.project_id == project_id)
    return query.count()


def list_taches(
    db: Session,
    project_id: str | None = None,
    limit: int = 100,
    offset: int = 0,
) -> list[TacheModel]:
    query = db.query(TacheModel)
    if project_id:
        query = query.filter(TacheModel.project_id == project_id)
    return query.order_by(TacheModel.id.asc()).offset(offset).limit(limit).all()


def get_tache(db: Session, tache_id: int) -> TacheModel | None:
    return db.query(TacheModel).filter(TacheModel.id == tache_id).first()


def create_tache(db: Session, tache: TacheCreate) -> TacheModel:
    if tache.parent_task_id is not None:
        parent = validate_parent_exists(db, tache.parent_task_id)
        validate_same_project(parent, tache.project_id)

    nouvelle_tache = TacheModel(**tache.model_dump())
    db.add(nouvelle_tache)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise
    db.refresh(nouvelle_tache)
    return nouvelle_tache


def update_tache(db: Session, tache_id: int, tache: TacheUpdate) -> TacheModel | None:
    tache_db = get_tache(db, tache_id)
    if tache_db is None:
        return None

    payload = tache.model_dump(exclude_unset=True)
    next_project_id = payload.get("project_id", tache_db.project_id)
    next_parent_task_id = payload.get("parent_task_id", tache_db.parent_task_id)

    validate_no_self_dependency(tache_id, next_parent_task_id)
    validate_no_cycle(db, tache_id, next_parent_task_id, next_project_id)

    if next_parent_task_id is not None:
        parent = validate_parent_exists(db, next_parent_task_id)
        validate_same_project(parent, next_project_id)

    allowed_fields = (
        "titre",
        "description",
        "etat",
        "section",
        "project_id",
        "parent_task_id",
        "due_date",
    )
    for champ, valeur in payload.items():
        if champ in allowed_fields:
            setattr(tache_db, champ, valeur)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise
    db.refresh(tache_db)
    return tache_db


def delete_tache(db: Session, tache_id: int) -> TacheModel | None:
    tache_db = get_tache(db, tache_id)
    if tache_db is None:
        return None

    db.delete(tache_db)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise
    return tache_db

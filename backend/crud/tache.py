from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from models.tache import TacheModel
from schemas.tache import TacheCreate, TacheUpdate


class DependencyValidationError(ValueError):
    pass


def _validate_parent_exists(db: Session, parent_task_id: int) -> TacheModel:
    parent = get_tache(db, parent_task_id)
    if parent is None:
        raise DependencyValidationError("Tache parente introuvable")
    return parent


def _validate_same_project(parent: TacheModel, project_id: str) -> None:
    if parent.project_id != project_id:
        raise DependencyValidationError(
            "La dependance doit appartenir au meme projet",
        )


def _validate_no_self_dependency(tache_id: int, parent_task_id: int | None) -> None:
    if parent_task_id is not None and parent_task_id == tache_id:
        raise DependencyValidationError(
            "Une tache ne peut pas dependre d'elle-meme",
        )


def _validate_no_cycle(
    db: Session,
    tache_id: int,
    parent_task_id: int | None,
    project_id: str | None = None,
) -> None:
    """
    Validate that adding a parent_task_id to tache_id does not create a cycle.
    
    Optimized to load all parent mappings in a single DB query instead of
    querying for each level of the dependency tree.
    """
    if parent_task_id is None:
        return

    # Build a map of task_id -> parent_task_id for the project (or all if project_id is None)
    # This avoids O(depth) queries, reducing to O(1) query + O(depth) memory traversal
    query = db.query(TacheModel.id, TacheModel.parent_task_id)
    if project_id:
        query = query.filter(TacheModel.project_id == project_id)
    
    parent_map = {tache.id: tache.parent_task_id for tache in query.all()}

    # Traverse the dependency chain in memory
    visited: set[int] = set()
    current_parent_id = parent_task_id

    while current_parent_id is not None:
        if current_parent_id == tache_id:
            raise DependencyValidationError("Cycle de dependances detecte")

        if current_parent_id in visited:
            raise DependencyValidationError("Cycle de dependances detecte")

        visited.add(current_parent_id)
        current_parent_id = parent_map.get(current_parent_id)


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
        parent = _validate_parent_exists(db, tache.parent_task_id)
        _validate_same_project(parent, tache.project_id)

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

    _validate_no_self_dependency(tache_id, next_parent_task_id)
    _validate_no_cycle(db, tache_id, next_parent_task_id, next_project_id)

    if next_parent_task_id is not None:
        parent = _validate_parent_exists(db, next_parent_task_id)
        _validate_same_project(parent, next_project_id)

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

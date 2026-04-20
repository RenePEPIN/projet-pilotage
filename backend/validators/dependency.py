"""
QW-52: Dependency validation logic extracted from crud/tache.py
This module isolates all parent-child task dependency validation rules.
Benefits:
  - Easier to test and maintain business logic
  - Reusable across endpoints and services
  - Clear separation of concerns
"""

from sqlalchemy.orm import Session

from models.tache import TacheModel


class DependencyValidationError(ValueError):
    """Raised when a dependency validation fails."""

    pass


def validate_parent_exists(db: Session, parent_task_id: int) -> TacheModel:
    """
    Validate that a parent task exists in the database.

    Args:
        db: Database session
        parent_task_id: ID of the parent task

    Returns:
        The parent TacheModel if it exists

    Raises:
        DependencyValidationError: If parent task not found
    """
    parent = db.query(TacheModel).filter(TacheModel.id == parent_task_id).first()
    if parent is None:
        raise DependencyValidationError("Tache parente introuvable")
    return parent


def validate_same_project(parent: TacheModel, project_id: str) -> None:
    """
    Validate that parent and child tasks belong to the same project.

    Args:
        parent: Parent TacheModel
        project_id: Project ID of the child task

    Raises:
        DependencyValidationError: If tasks are in different projects
    """
    if parent.project_id != project_id:
        raise DependencyValidationError(
            "La dependance doit appartenir au meme projet",
        )


def validate_no_self_dependency(tache_id: int, parent_task_id: int | None) -> None:
    """
    Validate that a task does not depend on itself.

    Args:
        tache_id: ID of the task
        parent_task_id: ID of the proposed parent task

    Raises:
        DependencyValidationError: If task would depend on itself
    """
    if parent_task_id is not None and parent_task_id == tache_id:
        raise DependencyValidationError(
            "Une tache ne peut pas dependre d'elle-meme",
        )


def validate_no_cycle(
    db: Session,
    tache_id: int,
    parent_task_id: int | None,
    project_id: str | None = None,
) -> None:
    """
    Validate that adding a parent_task_id to tache_id does not create a cycle.

    Optimized to load all parent mappings in a single DB query instead of
    querying for each level of the dependency tree.

    Args:
        db: Database session
        tache_id: ID of the task being updated
        parent_task_id: ID of the proposed parent task
        project_id: Optional project ID to filter cycle detection

    Raises:
        DependencyValidationError: If adding this dependency would create a cycle
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

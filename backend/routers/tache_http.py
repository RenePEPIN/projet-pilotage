"""Aides HTTP partagées pour les routes de mutation sur les tâches."""

from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError

from crud.tache import DependencyValidationError


def raise_from_tache_write_error(exc: BaseException) -> None:
    """Lève HTTP 422 pour les erreurs métier / intégrité connues ; propage sinon."""
    if isinstance(exc, DependencyValidationError):
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    if isinstance(exc, IntegrityError):
        raise HTTPException(
            status_code=422,
            detail="Contrainte de dependance invalide",
        ) from exc
    raise exc

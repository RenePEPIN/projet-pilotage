import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from core.rate_limit import limiter
from crud.tache import (
    DependencyValidationError,
    count_taches,
    create_tache,
    delete_tache,
    get_tache,
    list_taches,
    update_tache,
)
from dependencies import get_db, require_write_auth
from schemas.tache import Tache, TacheCreate, TacheUpdate


logger = logging.getLogger(__name__)
router = APIRouter()


@router.get(
    "/taches/",
    summary="Recuperer toutes les taches",
    description="Toutes les taches de la BDD se retrouvent dans un JSON",
    response_description="Liste de toutes les taches au format JSON",
)
@limiter.limit("100/minute")  # type: ignore[misc]
def get_all_taches(
    request: Request,
    project_id: str | None = None,
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0, le=10_000_000),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    if offset > 1000:
        logger.warning("Large offset requested: %d (project_id=%s)", offset, project_id)
    total = count_taches(db, project_id=project_id)
    taches = list_taches(
        db,
        project_id=project_id,
        limit=limit,
        offset=offset,
    )
    return {
        "taches": [Tache.model_validate(item) for item in taches],
        "limit": limit,
        "offset": offset,
        "count": total,
    }


@router.get("/taches/{tache_id}", response_model=Tache)
@limiter.limit("100/minute")  # type: ignore[misc]
def get_tache_route(
    request: Request,
    tache_id: int,
    db: Session = Depends(get_db),
):
    tache = get_tache(db, tache_id)
    if tache is None:
        raise HTTPException(status_code=404, detail="Tache introuvable")
    return tache


@router.post(
    "/taches/",
    response_model=Tache,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_write_auth)],
)
@limiter.limit("30/minute")  # type: ignore[misc]
def create_tache_route(
    request: Request,
    tache_payload: TacheCreate,
    db: Session = Depends(get_db),
) -> Tache:
    try:
        return Tache.model_validate(create_tache(db, tache_payload))
    except DependencyValidationError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except IntegrityError as exc:
        raise HTTPException(
            status_code=422,
            detail="Contrainte de dependance invalide",
        ) from exc


@router.put(
    "/taches/{tache_id}",
    response_model=Tache,
    dependencies=[Depends(require_write_auth)],
)
@limiter.limit("30/minute")  # type: ignore[misc]
def update_tache_route(
    request: Request,
    tache_id: int,
    tache_payload: TacheUpdate,
    db: Session = Depends(get_db),
) -> Tache:
    try:
        tache_modifiee = update_tache(db, tache_id, tache_payload)
    except DependencyValidationError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except IntegrityError as exc:
        raise HTTPException(
            status_code=422,
            detail="Contrainte de dependance invalide",
        ) from exc
    if tache_modifiee is None:
        raise HTTPException(status_code=404, detail="Tache introuvable")
    return Tache.model_validate(tache_modifiee)


@router.delete(
    "/taches/{tache_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_write_auth)],
)
@limiter.limit("30/minute")  # type: ignore[misc]
def delete_tache_route(
    request: Request,
    tache_id: int,
    db: Session = Depends(get_db),
) -> None:
    tache_supprimee = delete_tache(db, tache_id)
    if tache_supprimee is None:
        raise HTTPException(status_code=404, detail="Tache introuvable")
    return None

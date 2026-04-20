from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from core.rate_limit import limiter
from crud.project import (
    DEFAULT_PROJECTS,
    create_project,
    list_projects,
    update_project_name,
)
from dependencies import get_db, require_write_auth
from schemas.project import Project, ProjectCreate, ProjectUpdate

router = APIRouter()


@router.get("/projects/defaults", response_model=dict[str, list[dict[str, str]]])
@limiter.limit("100/minute")  # type: ignore[misc]
def get_default_projects(request: Request) -> dict[str, list[dict[str, str]]]:
    return {"defaults": DEFAULT_PROJECTS}


@router.get("/projects/", response_model=dict[str, list[Project]])
@limiter.limit("100/minute")  # type: ignore[misc]
def get_all_projects(
    request: Request,
    db: Session = Depends(get_db),
) -> dict[str, list[Project]]:
    return {"projects": [Project.model_validate(item) for item in list_projects(db)]}


@router.post(
    "/projects/",
    response_model=Project,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_write_auth)],
)
@limiter.limit("30/minute")  # type: ignore[misc]
def create_project_route(
    request: Request,
    project: ProjectCreate,
    db: Session = Depends(get_db),
) -> Project:
    try:
        created = create_project(db, project)
    except IntegrityError as exc:
        raise HTTPException(
            status_code=409,
            detail="Un projet avec cet identifiant existe deja",
        ) from exc
    if created is None:
        raise HTTPException(status_code=409, detail="Projet deja existant")
    return Project.model_validate(created)


@router.patch(
    "/projects/{project_id}",
    response_model=Project,
    dependencies=[Depends(require_write_auth)],
)
@limiter.limit("30/minute")  # type: ignore[misc]
def update_project_name_route(
    request: Request,
    project_id: str,
    payload: ProjectUpdate,
    db: Session = Depends(get_db),
) -> Project:
    try:
        updated = update_project_name(db, project_id, payload)
    except IntegrityError as exc:
        raise HTTPException(
            status_code=409,
            detail="Contrainte de projet violee",
        ) from exc
    if updated is None:
        raise HTTPException(status_code=404, detail="Projet introuvable")
    return Project.model_validate(updated)

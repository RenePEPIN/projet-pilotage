from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi.middleware import SlowAPIMiddleware

from core.config import ALLOWED_ORIGINS
from core.rate_limit import limiter
from crud.project import ensure_default_projects
from database import SessionLocal
from routers.health import router as health_router
from routers.projects import router as projects_router
from routers.taches import router as taches_router


@asynccontextmanager
async def lifespan(_: FastAPI):
    db = SessionLocal()
    try:
        ensure_default_projects(db)
    finally:
        db.close()
    yield


def create_app() -> FastAPI:
    app = FastAPI(
        title="API de gestion des taches",
        description="""
Cette application permet de :
- Lister les taches
- Recuperer les details d'une tache
- Ajouter une tache
- Mettre a jour une tache
- Supprimer une tache
""",
        lifespan=lifespan,
    )

    app.state.limiter = limiter
    app.add_middleware(SlowAPIMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization", "X-API-Key"],
    )

    app.include_router(health_router)
    app.include_router(projects_router)
    app.include_router(taches_router)
    return app

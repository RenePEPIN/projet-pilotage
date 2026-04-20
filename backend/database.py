import os
import sys
from pathlib import Path
from typing import Any

from sqlalchemy import create_engine, event, text
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

_BACKEND_DIR = Path(__file__).resolve().parent
_DEFAULT_SQLITE_URL = "sqlite:///./data/api_tache.db"


def _is_test_context() -> bool:
    if os.getenv("ALLOW_TEST_DATABASE") == "1":
        return True
    if os.getenv("PYTEST_CURRENT_TEST"):
        return True
    return any("pytest" in arg.lower() for arg in sys.argv)


def _resolve_sqlite_url(url: str) -> str:
    # Preserve special SQLite URLs (memory / URI modes) as-is.
    if url in {"sqlite://", "sqlite:///:memory:"}:
        return url

    prefix = "sqlite:///"
    if not url.startswith(prefix):
        return url

    raw_path = url[len(prefix) :]
    if raw_path.startswith("/"):
        db_path = Path(raw_path)
    else:
        db_path = (_BACKEND_DIR / raw_path).resolve()

    if "test" in db_path.name.lower() and not _is_test_context():
        raise RuntimeError(
            "Refus d'utiliser une base de test hors contexte test. "
            "Definir ALLOW_TEST_DATABASE=1 pour forcer explicitement."
        )

    db_path.parent.mkdir(parents=True, exist_ok=True)
    return f"sqlite:///{db_path.as_posix()}"


def resolve_database_url() -> str:
    raw_url = os.getenv("DATABASE_URL", _DEFAULT_SQLITE_URL).strip()
    if raw_url.startswith("sqlite"):
        return _resolve_sqlite_url(raw_url)
    return raw_url


DATABASE_URL = resolve_database_url()

is_sqlite = DATABASE_URL.startswith("sqlite")
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if is_sqlite else {},
)

if is_sqlite:

    def _enable_sqlite_foreign_keys(dbapi_connection: Any, _connection_record: Any) -> None:
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    event.listen(engine, "connect", _enable_sqlite_foreign_keys)


SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def db_backend_name() -> str:
    if is_sqlite:
        return "sqlite"
    if "postgresql" in DATABASE_URL:
        return "postgresql"
    return "unknown"


def ping_database(db: Session) -> bool:
    db.execute(text("SELECT 1"))
    return True

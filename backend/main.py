from pathlib import Path

from dotenv import load_dotenv

# Charge backend/.env avant tout import qui lit les variables (ex. WRITE_API_KEY).
load_dotenv(Path(__file__).resolve().parent / ".env")

from app_factory import create_app  # noqa: E402
from database import ping_database  # noqa: E402

# Backward-compatibility export used by some tests/patches.
__all__ = ["app", "ping_database"]

app = create_app()

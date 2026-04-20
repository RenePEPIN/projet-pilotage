from app_factory import create_app
from database import ping_database

# Backward-compatibility export used by some tests/patches.
__all__ = ["app", "ping_database"]

app = create_app()

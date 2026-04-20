"""Contrat d’import : évite qu’un refactor casse les imports (ex. DependencyValidationError)."""

from crud.tache import DependencyValidationError as FromCrud
from validators.dependency import DependencyValidationError as FromValidators


def test_dependency_validation_error_reexported_from_crud_matches_validators() -> None:
    assert FromCrud is FromValidators


def test_main_app_imports_without_error() -> None:
    from main import app  # noqa: F401

    assert app is not None

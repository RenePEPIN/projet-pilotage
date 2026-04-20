from alembic import op
import sqlalchemy as sa


def _get_inspector() -> sa.Inspector:
    return sa.inspect(op.get_bind())


def column_exists(table_name: str, column_name: str) -> bool:
    columns = _get_inspector().get_columns(table_name)
    return any(column["name"] == column_name for column in columns)


def foreign_key_exists(table_name: str, fk_name: str) -> bool:
    foreign_keys = _get_inspector().get_foreign_keys(table_name)
    return any((foreign_key.get("name") or "") == fk_name for foreign_key in foreign_keys)


def index_exists(table_name: str, index_name: str) -> bool:
    indexes = _get_inspector().get_indexes(table_name)
    return any(index.get("name") == index_name for index in indexes)


def check_constraint_exists(table_name: str, constraint_name: str) -> bool:
    constraints = _get_inspector().get_check_constraints(table_name)
    return any((constraint.get("name") or "") == constraint_name for constraint in constraints)
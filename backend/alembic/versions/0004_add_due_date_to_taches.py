"""add due date to tasks

Revision ID: 0004_add_due_date_to_taches
Revises: 0003_add_parent_task_dependency
Create Date: 2026-04-19

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op
from alembic_inspection import column_exists, index_exists

revision: str = "0004_add_due_date_to_taches"
down_revision: str | Sequence[str] | None = "0003_add_parent_task_dependency"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    table_name = "taches"
    idx_name = "ix_taches_due_date"
    bind = op.get_bind()

    if bind.dialect.name == "sqlite":
        with op.batch_alter_table("taches", recreate="always") as batch_op:
            if not column_exists(table_name, "due_date"):
                batch_op.add_column(sa.Column("due_date", sa.Date(), nullable=True))
    else:
        if not column_exists(table_name, "due_date"):
            op.add_column("taches", sa.Column("due_date", sa.Date(), nullable=True))

    if not index_exists(table_name, idx_name):
        op.create_index(idx_name, "taches", ["due_date"], unique=False)


def downgrade() -> None:
    table_name = "taches"
    idx_name = "ix_taches_due_date"
    if index_exists(table_name, idx_name):
        op.drop_index(idx_name, table_name="taches")

    bind = op.get_bind()
    if bind.dialect.name == "sqlite":
        if column_exists(table_name, "due_date"):
            with op.batch_alter_table("taches", recreate="always") as batch_op:
                batch_op.drop_column("due_date")
    else:
        if column_exists(table_name, "due_date"):
            op.drop_column("taches", "due_date")

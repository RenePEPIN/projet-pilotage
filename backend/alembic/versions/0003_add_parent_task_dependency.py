"""add parent task dependency column

Revision ID: 0003_add_parent_task_dependency
Revises: 0002_projects_and_task_scope
Create Date: 2026-04-19

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

from alembic_inspection import column_exists, foreign_key_exists, index_exists


# revision identifiers, used by Alembic.
revision: str = "0003_add_parent_task_dependency"
down_revision: Union[str, Sequence[str], None] = "0002_projects_and_task_scope"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    table_name = "taches"
    fk_name = "fk_taches_parent_task_id_taches"
    idx_name = "ix_taches_parent_task_id"
    bind = op.get_bind()
    dialect_name = bind.dialect.name

    if dialect_name == "sqlite":
        with op.batch_alter_table("taches", recreate="always") as batch_op:
            if not column_exists(table_name, "parent_task_id"):
                batch_op.add_column(sa.Column("parent_task_id", sa.Integer(), nullable=True))

            if not foreign_key_exists(table_name, fk_name):
                batch_op.create_foreign_key(
                    fk_name,
                    "taches",
                    ["parent_task_id"],
                    ["id"],
                    ondelete="SET NULL",
                )
    else:
        if not column_exists(table_name, "parent_task_id"):
            op.add_column("taches", sa.Column("parent_task_id", sa.Integer(), nullable=True))

        if not foreign_key_exists(table_name, fk_name):
            op.create_foreign_key(
                fk_name,
                "taches",
                "taches",
                ["parent_task_id"],
                ["id"],
                ondelete="SET NULL",
            )

    if not index_exists(table_name, idx_name):
        op.create_index(idx_name, "taches", ["parent_task_id"], unique=False)


def downgrade() -> None:
    table_name = "taches"
    idx_name = "ix_taches_parent_task_id"
    if index_exists(table_name, idx_name):
        op.drop_index(idx_name, table_name="taches")

    fk_name = "fk_taches_parent_task_id_taches"
    bind = op.get_bind()
    dialect_name = bind.dialect.name

    if dialect_name == "sqlite":
        if column_exists(table_name, "parent_task_id"):
            with op.batch_alter_table("taches", recreate="always") as batch_op:
                if foreign_key_exists(table_name, fk_name):
                    batch_op.drop_constraint(fk_name, type_="foreignkey")
                batch_op.drop_column("parent_task_id")
    else:
        if foreign_key_exists(table_name, fk_name):
            op.drop_constraint(fk_name, "taches", type_="foreignkey")

        if column_exists(table_name, "parent_task_id"):
            op.drop_column("taches", "parent_task_id")

"""constrain task status with enum check

Revision ID: 0005_constrain_tache_etat_enum
Revises: 0004_add_due_date_to_taches
Create Date: 2026-04-19

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op
from alembic_inspection import check_constraint_exists

revision: str = "0005_constrain_tache_etat_enum"
down_revision: str | Sequence[str] | None = "0004_add_due_date_to_taches"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


ALLOWED_STATUS_VALUES = ("A faire", "En cours", "Terminee")
CONSTRAINT_NAME = "tache_etat"


def upgrade() -> None:
    table_name = "taches"
    bind = op.get_bind()
    status_enum = sa.Enum(
        *ALLOWED_STATUS_VALUES,
        name=CONSTRAINT_NAME,
        native_enum=False,
        create_constraint=True,
    )

    if bind.dialect.name == "sqlite":
        with op.batch_alter_table("taches", recreate="always") as batch_op:
            batch_op.alter_column(
                "etat",
                existing_type=sa.String(length=50),
                type_=status_enum,
                existing_nullable=False,
            )
    elif not check_constraint_exists(table_name, CONSTRAINT_NAME):
        op.alter_column(
            "taches",
            "etat",
            existing_type=sa.String(length=50),
            type_=status_enum,
            existing_nullable=False,
        )


def downgrade() -> None:
    table_name = "taches"
    bind = op.get_bind()

    if bind.dialect.name == "sqlite":
        with op.batch_alter_table("taches", recreate="always") as batch_op:
            batch_op.alter_column(
                "etat",
                existing_type=sa.Enum(
                    *ALLOWED_STATUS_VALUES,
                    name=CONSTRAINT_NAME,
                    native_enum=False,
                    create_constraint=True,
                ),
                type_=sa.String(length=50),
                existing_nullable=False,
            )
    elif check_constraint_exists(table_name, CONSTRAINT_NAME):
        op.alter_column(
            "taches",
            "etat",
            existing_type=sa.Enum(
                *ALLOWED_STATUS_VALUES,
                name=CONSTRAINT_NAME,
                native_enum=False,
                create_constraint=True,
            ),
            type_=sa.String(length=50),
            existing_nullable=False,
        )

"""create taches table

Revision ID: 0001_create_taches_table
Revises:
Create Date: 2026-04-19

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0001_create_taches_table"
down_revision: str | Sequence[str] | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "taches",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("titre", sa.String(length=150), nullable=False),
        sa.Column("description", sa.String(length=1000), nullable=False, server_default=""),
        sa.Column("etat", sa.String(length=50), nullable=False),
    )
    op.create_index("ix_taches_id", "taches", ["id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_taches_id", table_name="taches")
    op.drop_table("taches")

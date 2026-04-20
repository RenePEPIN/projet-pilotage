"""strategic notes table (workspace global)

Revision ID: 0006_strategic_notes
Revises: 0005_constrain_tache_etat_enum
Create Date: 2026-04-20

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0006_strategic_notes"
down_revision: str | Sequence[str] | None = "0005_constrain_tache_etat_enum"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "strategic_notes",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("workspace_id", sa.String(length=64), nullable=False),
        sa.Column("content", sa.Text(), nullable=False, server_default=""),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("workspace_id", name="uq_strategic_notes_workspace_id"),
    )


def downgrade() -> None:
    op.drop_table("strategic_notes")

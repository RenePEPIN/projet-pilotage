"""add projects and task scope columns

Revision ID: 0002_projects_and_task_scope
Revises: 0001_create_taches_table
Create Date: 2026-04-19

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0002_projects_and_task_scope"
down_revision: str | Sequence[str] | None = "0001_create_taches_table"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "projects",
        sa.Column("id", sa.String(length=120), nullable=False),
        sa.Column("name", sa.String(length=180), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    op.add_column(
        "taches",
        sa.Column("section", sa.String(length=80), nullable=False, server_default="backend"),
    )
    op.add_column(
        "taches",
        sa.Column(
            "project_id",
            sa.String(length=120),
            nullable=False,
            server_default="projet-api-principal",
        ),
    )


def downgrade() -> None:
    op.drop_column("taches", "project_id")
    op.drop_column("taches", "section")
    op.drop_table("projects")

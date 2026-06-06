"""create skills table

Revision ID: 002
Revises: 001
Create Date: 2026-06-05

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import ENUM

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    sa.Enum(
        "beginner", "intermediate", "advanced", "expert", name="proficiency_level"
    ).create(op.get_bind(), checkfirst=True)

    op.create_table(
        "skills",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("category", sa.String(length=100), nullable=True),
        sa.Column(
            "proficiency",
            ENUM(
                "beginner",
                "intermediate",
                "advanced",
                "expert",
                name="proficiency_level",
                create_type=False,
            ),
            nullable=False,
            server_default="intermediate",
        ),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_skills_user_id", "skills", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_skills_user_id", table_name="skills")
    op.drop_table("skills")
    sa.Enum(name="proficiency_level").drop(op.get_bind(), checkfirst=True)

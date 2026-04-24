"""Add region code

Revision ID: 2b6f8a4d5c11
Revises: 99de00e32082
Create Date: 2026-04-24 11:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "2b6f8a4d5c11"
down_revision: Union[str, Sequence[str], None] = "99de00e32082"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    column_names = {column["name"] for column in inspector.get_columns("region")}

    if "code" not in column_names:
        op.add_column("region", sa.Column("code", sa.String(length=10), nullable=True))

    op.execute("UPDATE region SET code = substr(upper(name), 1, 3) WHERE code IS NULL")

    index_names = {index["name"] for index in inspector.get_indexes("region")}
    if op.f("ix_region_code") not in index_names:
        op.create_index(op.f("ix_region_code"), "region", ["code"], unique=False)


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    index_names = {index["name"] for index in inspector.get_indexes("region")}
    column_names = {column["name"] for column in inspector.get_columns("region")}

    if op.f("ix_region_code") in index_names:
        op.drop_index(op.f("ix_region_code"), table_name="region")
    if "code" in column_names:
        op.drop_column("region", "code")

"""Add performance indexes for high-traffic queries

Revision ID: b5b4ac1f2201
Revises: 2b6f8a4d5c11
Create Date: 2026-04-27 18:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


# revision identifiers, used by Alembic.
revision: str = "b5b4ac1f2201"
down_revision: Union[str, Sequence[str], None] = "2b6f8a4d5c11"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _create_index_if_missing(table: str, index_name: str, columns: list[str]) -> None:
    inspector = sa.inspect(op.get_bind())
    existing_indexes = {index["name"] for index in inspector.get_indexes(table)}
    if index_name not in existing_indexes:
        op.create_index(index_name, table, columns, unique=False)


def _drop_index_if_present(table: str, index_name: str) -> None:
    inspector = sa.inspect(op.get_bind())
    existing_indexes = {index["name"] for index in inspector.get_indexes(table)}
    if index_name in existing_indexes:
        op.drop_index(index_name, table_name=table)


def upgrade() -> None:
    _create_index_if_missing("election", op.f("ix_election_region_id"), ["region_id"])
    _create_index_if_missing("election", op.f("ix_election_year"), ["year"])
    _create_index_if_missing("stage", op.f("ix_stage_election_id"), ["election_id"])
    _create_index_if_missing("stage", op.f("ix_stage_sequence_order"), ["sequence_order"])
    _create_index_if_missing("deadline", op.f("ix_deadline_election_id"), ["election_id"])
    _create_index_if_missing("deadline", op.f("ix_deadline_date"), ["date"])
    _create_index_if_missing("eligibilityrule", op.f("ix_eligibilityrule_rule_key"), ["rule_key"])
    _create_index_if_missing("eligibilityrule", op.f("ix_eligibilityrule_sequence_order"), ["sequence_order"])


def downgrade() -> None:
    _drop_index_if_present("eligibilityrule", op.f("ix_eligibilityrule_sequence_order"))
    _drop_index_if_present("eligibilityrule", op.f("ix_eligibilityrule_rule_key"))
    _drop_index_if_present("deadline", op.f("ix_deadline_date"))
    _drop_index_if_present("deadline", op.f("ix_deadline_election_id"))
    _drop_index_if_present("stage", op.f("ix_stage_sequence_order"))
    _drop_index_if_present("stage", op.f("ix_stage_election_id"))
    _drop_index_if_present("election", op.f("ix_election_year"))
    _drop_index_if_present("election", op.f("ix_election_region_id"))

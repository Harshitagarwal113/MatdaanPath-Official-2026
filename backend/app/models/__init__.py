from datetime import UTC, datetime
from typing import Optional
from sqlmodel import SQLModel, Field

# --- Shared Models ---


class Source(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    url: str
    source_type: str
    last_verified_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC)
    )  # noqa: E501
    status: str = Field(default="approved")


# --- Region & Election Models ---


class Region(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    code: str = Field(index=True, min_length=2, max_length=10)
    country: str = Field(default="India")
    description: Optional[str] = None


class Election(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    region_id: Optional[int] = Field(
        default=None, foreign_key="region.id", index=True
    )  # noqa: E501
    election_type: str  # e.g., Lok Sabha, Vidhan Sabha
    year: int = Field(index=True)


class Stage(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    election_id: Optional[int] = Field(
        default=None, foreign_key="election.id", index=True
    )
    name: str
    description: str
    sequence_order: int = Field(index=True)


class Deadline(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    election_id: Optional[int] = Field(
        default=None, foreign_key="election.id", index=True
    )
    name: str
    date: datetime = Field(index=True)
    description: Optional[str] = None


# --- MVP Feature Models ---


class GlossaryItem(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    term: str = Field(index=True)
    definition: str
    example: Optional[str] = None
    category: str = Field(default="General")


class EligibilityRule(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    question: str
    rule_key: str = Field(index=True)  # e.g., "age_check", "residency_check"
    expected_value: str
    explanation_if_failed: str
    sequence_order: int = Field(index=True)

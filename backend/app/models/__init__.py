from datetime import datetime
from typing import List, Optional
from sqlmodel import SQLModel, Field

# --- Shared Models ---

class Source(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    url: str
    source_type: str
    last_verified_at: datetime = Field(default_factory=datetime.utcnow)
    status: str = Field(default="approved")

# --- Region & Election Models ---

class Region(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    country: str = Field(default="India")
    description: Optional[str] = None

class Election(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    region_id: Optional[int] = Field(default=None, foreign_key="region.id")
    election_type: str  # e.g., Lok Sabha, Vidhan Sabha
    year: int

class Stage(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    election_id: Optional[int] = Field(default=None, foreign_key="election.id")
    name: str
    description: str
    sequence_order: int

class Deadline(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    election_id: Optional[int] = Field(default=None, foreign_key="election.id")
    name: str
    date: datetime
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
    rule_key: str  # e.g., "age_check", "residency_check"
    expected_value: str
    explanation_if_failed: str
    sequence_order: int

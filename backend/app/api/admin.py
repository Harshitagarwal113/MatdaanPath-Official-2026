from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlmodel import Session

from app.core.auth import RequestIdentity, require_admin
from app.core.cache import clear_cache
from app.core.database import get_session
from app.models import Deadline, EligibilityRule, GlossaryItem, Source, Stage

router = APIRouter()


class GlossaryUpsert(BaseModel):
    term: str = Field(..., min_length=2, max_length=120)
    definition: str = Field(..., min_length=5, max_length=1200)
    category: str = Field(default="General", min_length=2, max_length=80)
    example: str | None = Field(default=None, max_length=500)


class SourceUpsert(BaseModel):
    name: str = Field(..., min_length=3, max_length=180)
    url: str = Field(..., min_length=8, max_length=500)
    source_type: str = Field(..., min_length=2, max_length=80)
    status: str = Field(default="approved", min_length=3, max_length=40)
    last_verified_at: datetime | None = None


class EligibilityRuleUpsert(BaseModel):
    question: str = Field(..., min_length=5, max_length=300)
    rule_key: str = Field(..., min_length=2, max_length=80)
    expected_value: str = Field(..., min_length=1, max_length=80)
    explanation_if_failed: str = Field(..., min_length=5, max_length=400)
    sequence_order: int = Field(..., ge=1, le=1000)


class StageUpsert(BaseModel):
    election_id: int | None = None
    name: str = Field(..., min_length=3, max_length=140)
    description: str = Field(..., min_length=5, max_length=800)
    sequence_order: int = Field(..., ge=1, le=1000)


class DeadlineUpsert(BaseModel):
    election_id: int | None = None
    name: str = Field(..., min_length=3, max_length=150)
    date: datetime
    description: str | None = Field(default=None, max_length=500)


def _commit_with_cache_invalidation(session: Session, cache_prefixes: list[str]) -> None:
    session.commit()
    for prefix in cache_prefixes:
        clear_cache(prefix=prefix)


@router.get("/me")
def get_admin_identity(identity: RequestIdentity = Depends(require_admin)):
    return {
        "user_id": identity.user_id,
        "is_admin": identity.is_admin,
        "auth_provider": identity.auth_provider,
        "email": identity.email,
    }


@router.post("/glossary", response_model=GlossaryItem)
def create_glossary_item(
    payload: GlossaryUpsert,
    _: RequestIdentity = Depends(require_admin),
    session: Session = Depends(get_session),
):
    item = GlossaryItem(
        term=payload.term,
        definition=payload.definition,
        category=payload.category,
        example=payload.example,
    )
    session.add(item)
    _commit_with_cache_invalidation(session, ["glossary:"])
    session.refresh(item)
    return item


@router.put("/glossary/{item_id}", response_model=GlossaryItem)
def update_glossary_item(
    item_id: int,
    payload: GlossaryUpsert,
    _: RequestIdentity = Depends(require_admin),
    session: Session = Depends(get_session),
):
    item = session.get(GlossaryItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Glossary item not found")

    item.term = payload.term
    item.definition = payload.definition
    item.category = payload.category
    item.example = payload.example
    _commit_with_cache_invalidation(session, ["glossary:"])
    session.refresh(item)
    return item


@router.delete("/glossary/{item_id}")
def delete_glossary_item(
    item_id: int,
    _: RequestIdentity = Depends(require_admin),
    session: Session = Depends(get_session),
):
    item = session.get(GlossaryItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Glossary item not found")
    session.delete(item)
    _commit_with_cache_invalidation(session, ["glossary:"])
    return {"deleted": True}


@router.post("/sources", response_model=Source)
def create_source(
    payload: SourceUpsert,
    _: RequestIdentity = Depends(require_admin),
    session: Session = Depends(get_session),
):
    source = Source(
        name=payload.name,
        url=payload.url,
        source_type=payload.source_type,
        status=payload.status,
        last_verified_at=payload.last_verified_at or datetime.utcnow(),
    )
    session.add(source)
    _commit_with_cache_invalidation(session, ["chat:"])
    session.refresh(source)
    return source


@router.put("/sources/{source_id}", response_model=Source)
def update_source(
    source_id: int,
    payload: SourceUpsert,
    _: RequestIdentity = Depends(require_admin),
    session: Session = Depends(get_session),
):
    source = session.get(Source, source_id)
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")

    source.name = payload.name
    source.url = payload.url
    source.source_type = payload.source_type
    source.status = payload.status
    source.last_verified_at = payload.last_verified_at or source.last_verified_at
    _commit_with_cache_invalidation(session, ["chat:"])
    session.refresh(source)
    return source


@router.post("/eligibility-rules", response_model=EligibilityRule)
def create_eligibility_rule(
    payload: EligibilityRuleUpsert,
    _: RequestIdentity = Depends(require_admin),
    session: Session = Depends(get_session),
):
    rule = EligibilityRule(
        question=payload.question,
        rule_key=payload.rule_key,
        expected_value=payload.expected_value,
        explanation_if_failed=payload.explanation_if_failed,
        sequence_order=payload.sequence_order,
    )
    session.add(rule)
    _commit_with_cache_invalidation(session, ["eligibility:"])
    session.refresh(rule)
    return rule


@router.put("/eligibility-rules/{rule_id}", response_model=EligibilityRule)
def update_eligibility_rule(
    rule_id: int,
    payload: EligibilityRuleUpsert,
    _: RequestIdentity = Depends(require_admin),
    session: Session = Depends(get_session),
):
    rule = session.get(EligibilityRule, rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Eligibility rule not found")
    rule.question = payload.question
    rule.rule_key = payload.rule_key
    rule.expected_value = payload.expected_value
    rule.explanation_if_failed = payload.explanation_if_failed
    rule.sequence_order = payload.sequence_order
    _commit_with_cache_invalidation(session, ["eligibility:"])
    session.refresh(rule)
    return rule


@router.post("/stages", response_model=Stage)
def create_stage(
    payload: StageUpsert,
    _: RequestIdentity = Depends(require_admin),
    session: Session = Depends(get_session),
):
    stage = Stage(
        election_id=payload.election_id,
        name=payload.name,
        description=payload.description,
        sequence_order=payload.sequence_order,
    )
    session.add(stage)
    _commit_with_cache_invalidation(session, ["timeline:"])
    session.refresh(stage)
    return stage


@router.put("/stages/{stage_id}", response_model=Stage)
def update_stage(
    stage_id: int,
    payload: StageUpsert,
    _: RequestIdentity = Depends(require_admin),
    session: Session = Depends(get_session),
):
    stage = session.get(Stage, stage_id)
    if not stage:
        raise HTTPException(status_code=404, detail="Stage not found")

    stage.election_id = payload.election_id
    stage.name = payload.name
    stage.description = payload.description
    stage.sequence_order = payload.sequence_order
    _commit_with_cache_invalidation(session, ["timeline:"])
    session.refresh(stage)
    return stage


@router.post("/deadlines", response_model=Deadline)
def create_deadline(
    payload: DeadlineUpsert,
    _: RequestIdentity = Depends(require_admin),
    session: Session = Depends(get_session),
):
    deadline = Deadline(
        election_id=payload.election_id,
        name=payload.name,
        date=payload.date,
        description=payload.description,
    )
    session.add(deadline)
    _commit_with_cache_invalidation(session, ["deadlines:"])
    session.refresh(deadline)
    return deadline


@router.put("/deadlines/{deadline_id}", response_model=Deadline)
def update_deadline(
    deadline_id: int,
    payload: DeadlineUpsert,
    _: RequestIdentity = Depends(require_admin),
    session: Session = Depends(get_session),
):
    deadline = session.get(Deadline, deadline_id)
    if not deadline:
        raise HTTPException(status_code=404, detail="Deadline not found")

    deadline.election_id = payload.election_id
    deadline.name = payload.name
    deadline.date = payload.date
    deadline.description = payload.description
    _commit_with_cache_invalidation(session, ["deadlines:"])
    session.refresh(deadline)
    return deadline

from typing import List

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlmodel import Session, select

from app.core.database import get_session
from app.models import EligibilityRule

router = APIRouter()


class EligibilityRuleRead(BaseModel):
    id: int
    question: str
    requirement_description: str
    rule_key: str
    sequence_order: int


class EligibilityCheckRequest(BaseModel):
    answers: dict[str, str]


class EligibilityCheckResponse(BaseModel):
    eligible: bool
    message: str
    failed_rules: list[str]

@router.get("/rules", response_model=List[EligibilityRuleRead])
def get_eligibility_rules(session: Session = Depends(get_session)):
    """
    Get all eligibility rules/questions in order.
    """
    statement = select(EligibilityRule).order_by(EligibilityRule.sequence_order)
    rules = session.exec(statement).all()
    return [
        EligibilityRuleRead(
            id=rule.id,
            question=rule.question,
            requirement_description=rule.explanation_if_failed,
            rule_key=rule.rule_key,
            sequence_order=rule.sequence_order,
        )
        for rule in rules
        if rule.id is not None
    ]

@router.post("/check", response_model=EligibilityCheckResponse)
def check_eligibility(
    payload: EligibilityCheckRequest,
    session: Session = Depends(get_session),
):
    """
    Check eligibility based on submitted answers and the configured rules.
    """
    rules = session.exec(select(EligibilityRule).order_by(EligibilityRule.sequence_order)).all()
    failed_rules: list[str] = []

    for rule in rules:
        submitted_value = payload.answers.get(rule.rule_key, "").strip().lower()
        expected_value = rule.expected_value.strip().lower()
        if submitted_value != expected_value:
            failed_rules.append(rule.question)

    eligible = len(failed_rules) == 0
    return EligibilityCheckResponse(
        eligible=eligible,
        message=(
            "You appear eligible to vote based on the answers provided."
            if eligible
            else "One or more eligibility requirements were not met."
        ),
        failed_rules=failed_rules,
    )

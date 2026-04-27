from typing import List

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlmodel import Session, select

from app.core.cache import get_or_set_cache
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


class FailedRequirementDetail(BaseModel):
    question: str
    submitted_value: str
    expected_value: str
    reason: str
    next_step: str
    official_url: str


class EligibilityCheckResponse(BaseModel):
    eligible: bool
    message: str
    failed_rules: list[str]
    failed_requirements: list[FailedRequirementDetail] = Field(default_factory=list)


RULE_NEXT_STEPS = {
    "age": "You can register once you are 18 on the qualifying date and have valid age proof ready.",
    "citizenship": "Only Indian citizens can vote in Indian elections. Verify your status before applying.",
    "residency": "Update your current address and constituency details in the voter roll before rechecking.",
}
OFFICIAL_VOTER_PORTAL = "https://voters.eci.gov.in"


def _build_next_step(rule_key: str) -> str:
    normalized_rule_key = rule_key.strip().lower()
    return RULE_NEXT_STEPS.get(
        normalized_rule_key,
        "Review this answer with supporting documents and verify details on the official voter portal.",
    )

@router.get("/rules", response_model=List[EligibilityRuleRead])
def get_eligibility_rules(session: Session = Depends(get_session)):
    """
    Get all eligibility rules/questions in order.
    """
    def _resolver():
        statement = select(EligibilityRule).order_by(EligibilityRule.sequence_order)
        rules = session.exec(statement).all()
        return [
            {
                "id": rule.id,
                "question": rule.question,
                "requirement_description": rule.explanation_if_failed,
                "rule_key": rule.rule_key,
                "sequence_order": rule.sequence_order,
            }
            for rule in rules
            if rule.id is not None
        ]

    return get_or_set_cache("eligibility:rules", _resolver)

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
    failed_requirements: list[FailedRequirementDetail] = []
    normalized_answers = {key: value.strip().lower() for key, value in payload.answers.items()}

    for rule in rules:
        submitted_value = normalized_answers.get(rule.rule_key, "")
        expected_value = rule.expected_value.strip().lower()
        if submitted_value != expected_value:
            failed_rules.append(rule.question)
            failed_requirements.append(
                FailedRequirementDetail(
                    question=rule.question,
                    submitted_value=submitted_value or "not_answered",
                    expected_value=expected_value,
                    reason=rule.explanation_if_failed,
                    next_step=_build_next_step(rule.rule_key),
                    official_url=OFFICIAL_VOTER_PORTAL,
                )
            )

    eligible = len(failed_rules) == 0
    return EligibilityCheckResponse(
        eligible=eligible,
        message=(
            "You appear eligible to vote based on the answers provided."
            if eligible
            else "Some eligibility requirements were not met. Review the guidance below before trying again."
        ),
        failed_rules=failed_rules,
        failed_requirements=failed_requirements,
    )

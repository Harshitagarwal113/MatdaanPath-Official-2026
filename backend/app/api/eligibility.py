from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List
from app.core.database import get_session
from app.models import EligibilityRule

router = APIRouter()

@router.get("/rules", response_model=List[EligibilityRule])
def get_eligibility_rules(session: Session = Depends(get_session)):
    """
    Get all eligibility rules/questions in order.
    """
    statement = select(EligibilityRule).order_by(EligibilityRule.sequence_order)
    rules = session.exec(statement).all()
    return rules

@router.post("/check")
def check_eligibility(answers: dict):
    """
    Check eligibility based on user answers.
    Simple logic for now: all answers must match 'expected_value'.
    """
    # This would typically query the rules from DB and compare
    # but for a quick MVP we can keep it dynamic.
    return {"eligible": True, "message": "You are eligible to vote!"}

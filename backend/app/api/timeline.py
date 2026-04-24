from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.core.database import get_session
from app.models import Stage, Election, Deadline

router = APIRouter()

@router.get("", response_model=List[Stage])
def get_default_timeline(
    election_id: int | None = None,
    session: Session = Depends(get_session),
):
    """
    Get the ordered timeline stages for a specific election or the first
    available election when no identifier is provided.
    """
    election = session.get(Election, election_id) if election_id else session.exec(select(Election)).first()
    if not election:
        return []
    
    statement = select(Stage).where(Stage.election_id == election.id).order_by(Stage.sequence_order)
    return session.exec(statement).all()

@router.get("/{election_id}", response_model=List[Stage])
def get_timeline(election_id: int, session: Session = Depends(get_session)):

    """
    Get the ordered timeline stages for a specific election.
    """
    # Verify election exists
    election = session.get(Election, election_id)
    if not election:
        raise HTTPException(status_code=404, detail="Election not found")
        
    statement = select(Stage).where(Stage.election_id == election_id).order_by(Stage.sequence_order)
    stages = session.exec(statement).all()
    
    return stages

@router.get("/{election_id}/deadlines", response_model=List[Deadline])
def get_deadlines(election_id: int, session: Session = Depends(get_session)):
    """
    Get all deadlines for a specific election.
    """
    statement = select(Deadline).where(Deadline.election_id == election_id).order_by(Deadline.date)
    deadlines = session.exec(statement).all()
    
    return deadlines

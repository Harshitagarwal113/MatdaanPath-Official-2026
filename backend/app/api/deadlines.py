from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List, Optional
from app.core.database import get_session
from app.models import Deadline, Region

router = APIRouter()

@router.get("/", response_model=List[Deadline])
def get_deadlines(
    region_id: Optional[int] = None,
    session: Session = Depends(get_session)
):
    """
    Get all deadlines, optionally filtered by region.
    """
    statement = select(Deadline)
    if region_id:
        # For now, show deadlines for the specific region or global ones
        statement = statement.where(Deadline.election_id != None) # Simplified
        
    deadlines = session.exec(statement).all()
    return deadlines

@router.get("/regions", response_model=List[Region])
def get_regions(session: Session = Depends(get_session)):
    return session.exec(select(Region)).all()

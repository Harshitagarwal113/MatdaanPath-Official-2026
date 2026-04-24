from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from typing import List, Optional

from app.core.database import get_session
from app.models import Deadline, Election, Region

router = APIRouter()

@router.get("/", response_model=List[Deadline])
def get_deadlines(
    region_id: Optional[int] = None,
    session: Session = Depends(get_session)
):
    """
    Get all deadlines, optionally filtered by region while still including
    national deadlines that apply everywhere.
    """
    statement = (
        select(Deadline)
        .join(Election, Deadline.election_id == Election.id, isouter=True)
        .order_by(Deadline.date)
    )
    if region_id:
        statement = statement.where(
            (Election.region_id == region_id) | (Election.region_id.is_(None))
        )
        
    deadlines = session.exec(statement).all()
    return deadlines

@router.get("/regions", response_model=List[Region])
def get_regions(session: Session = Depends(get_session)):
    statement = select(Region).order_by(Region.name)
    return session.exec(statement).all()

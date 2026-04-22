from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select, or_
from typing import List, Optional
from app.core.database import get_session
from app.models import GlossaryItem

router = APIRouter()

@router.get("/", response_model=List[GlossaryItem])
def list_glossary(
    search: Optional[str] = None, 
    category: Optional[str] = None,
    session: Session = Depends(get_session)
):
    """
    List all glossary items with optional search and category filtering.
    """
    statement = select(GlossaryItem)
    if search:
        statement = statement.where(
            or_(
                GlossaryItem.term.ilike(f"%{search}%"),
                GlossaryItem.definition.ilike(f"%{search}%")
            )
        )
    if category:
        statement = statement.where(GlossaryItem.category == category)
        
    items = session.exec(statement).all()
    return items

@router.get("/{term_id}", response_model=GlossaryItem)
def get_glossary_item(term_id: int, session: Session = Depends(get_session)):
    item = session.get(GlossaryItem, term_id)
    if not item:
        raise HTTPException(status_code=404, detail="Term not found")
    return item

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, or_, select

from app.core.cache import get_or_set_cache
from app.core.database import get_session
from app.models import GlossaryItem

router = APIRouter()


@router.get("/", response_model=List[GlossaryItem])
def list_glossary(
    search: Optional[str] = None,
    category: Optional[str] = None,
    limit: int = Query(default=80, ge=1, le=200),
    session: Session = Depends(get_session),
):
    """
    List glossary items with optional search/category filtering.
    The limit protects response size for better latency and frontend rendering.
    """
    normalized_search = (search or "").strip()
    normalized_category = (category or "").strip()
    cache_key = f"glossary:search={normalized_search}:category={normalized_category}:limit={limit}"

    def _resolver():
        statement = select(GlossaryItem).order_by(GlossaryItem.term)
        if normalized_search:
            statement = statement.where(
                or_(
                    GlossaryItem.term.ilike(f"%{normalized_search}%"),
                    GlossaryItem.definition.ilike(f"%{normalized_search}%"),
                )
            )
        if normalized_category:
            statement = statement.where(GlossaryItem.category == normalized_category)
        statement = statement.limit(limit)
        items = session.exec(statement).all()
        return [item.model_dump() for item in items]

    return get_or_set_cache(cache_key, _resolver)


@router.get("/{term_id}", response_model=GlossaryItem)
def get_glossary_item(term_id: int, session: Session = Depends(get_session)):
    item = session.get(GlossaryItem, term_id)
    if not item:
        raise HTTPException(status_code=404, detail="Term not found")
    return item

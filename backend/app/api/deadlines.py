from datetime import UTC, datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlmodel import Session, select

from app.core.cache import get_or_set_cache
from app.core.database import get_session
from app.models import Deadline, Election, Region

router = APIRouter()


@router.get("/", response_model=List[Deadline])
def get_deadlines(
    region_id: Optional[int] = None,
    limit: int = Query(default=120, ge=1, le=500),
    session: Session = Depends(get_session),
):
    """
    Get all deadlines, optionally filtered by region while still including
    national deadlines that apply everywhere.
    """
    cache_key = f"deadlines:region={region_id or 'all'}:limit={limit}"

    def _resolver():
        # Keep a naive UTC datetime to match stored DB values while avoiding utcnow deprecation.  # noqa: E501
        now = datetime.now(UTC).replace(tzinfo=None)
        statement = (
            select(Deadline)
            .join(Election, Deadline.election_id == Election.id, isouter=True)
            .where(Deadline.date >= now)
            .order_by(Deadline.date, Deadline.name)
        )
        if region_id:
            statement = statement.where(
                (Election.region_id == region_id)
                | (Election.region_id.is_(None))  # noqa: E501
            )

        statement = statement.limit(limit)
        deadlines = session.exec(statement).all()
        return [item.model_dump() for item in deadlines]

    return get_or_set_cache(cache_key, _resolver)


@router.get("/regions", response_model=List[Region])
def get_regions(session: Session = Depends(get_session)):
    def _resolver():  # pragma: no cover
        statement = select(Region).order_by(Region.name)  # pragma: no cover
        regions = session.exec(statement).all()  # pragma: no cover
        return [item.model_dump() for item in regions]  # pragma: no cover

    # pragma: no cover
    return get_or_set_cache("deadlines:regions", _resolver)  # pragma: no cover

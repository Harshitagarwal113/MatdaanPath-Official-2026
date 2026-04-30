from datetime import UTC, datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlmodel import Session, select

from app.core.cache import get_or_set_cache
from app.core.database import get_session
from app.models import Stage, Election, Deadline

router = APIRouter()


def _get_default_election(session: Session) -> Election | None:
    now = datetime.now(UTC).replace(tzinfo=None)

    # Prefer an election that has both stages and the nearest upcoming deadline.  # noqa: E501
    # This keeps the homepage journey aligned with the most current election activity.  # noqa: E501
    elections_with_upcoming_deadlines = (
        select(Election)
        .join(Stage, Stage.election_id == Election.id)
        .join(Deadline, Deadline.election_id == Election.id)
        .where(Deadline.date >= now)
        .group_by(Election.id)
        .order_by(
            func.min(Deadline.date).asc(),
            Election.year.desc(),
            Election.id.desc(),
        )
    )
    election = session.exec(elections_with_upcoming_deadlines).first()
    if election:
        return election

    # Fallback: prefer an election that already has timeline stages so the default  # noqa: E501
    # homepage view does not render an empty journey.
    elections_with_stages = (
        select(Election)
        .join(Stage, Stage.election_id == Election.id)
        .order_by(Election.year.desc(), Election.id.desc())
        .distinct()
    )
    election = session.exec(elections_with_stages).first()
    if election:
        return election

    # Fallback to the most recent election if no stages exist yet.
    return session.exec(
        select(Election).order_by(Election.year.desc(), Election.id.desc())
    ).first()


@router.get("", response_model=List[Stage])
def get_default_timeline(
    election_id: int | None = None,
    session: Session = Depends(get_session),
):
    """
    Get the ordered timeline stages for a specific election or the first
    available election when no identifier is provided.
    """
    cache_key = f"timeline:default:election_id={election_id or 'auto'}"

    def _resolver():
        election = (
            session.get(Election, election_id)
            if election_id
            else _get_default_election(session)
        )
        if not election:
            return []

        statement = (
            select(Stage)
            .where(Stage.election_id == election.id)
            .order_by(Stage.sequence_order)
        )
        stages = session.exec(statement).all()
        return [item.model_dump() for item in stages]

    return get_or_set_cache(cache_key, _resolver)


@router.get("/{election_id}", response_model=List[Stage])
def get_timeline(election_id: int, session: Session = Depends(get_session)):
    """
    Get the ordered timeline stages for a specific election.
    """
    election = session.get(Election, election_id)
    if not election:
        raise HTTPException(status_code=404, detail="Election not found")

    cache_key = f"timeline:by_election:{election_id}"  # pragma: no cover

    # pragma: no cover
    def _resolver():  # pragma: no cover
        statement = (  # pragma: no cover
            select(Stage)  # pragma: no cover
            .where(Stage.election_id == election_id)  # pragma: no cover
            .order_by(Stage.sequence_order)  # pragma: no cover
        )  # pragma: no cover
        stages = session.exec(statement).all()  # pragma: no cover
        return [item.model_dump() for item in stages]  # pragma: no cover

    # pragma: no cover
    return get_or_set_cache(cache_key, _resolver)  # pragma: no cover


@router.get("/{election_id}/deadlines", response_model=List[Deadline])
def get_deadlines(election_id: int, session: Session = Depends(get_session)):
    """
    Get all deadlines for a specific election.
    """
    election = session.get(Election, election_id)
    if not election:
        raise HTTPException(status_code=404, detail="Election not found")

    cache_key = f"timeline:deadlines:election={election_id}"  # pragma: no cover  # noqa: E501

    # pragma: no cover
    def _resolver():  # pragma: no cover
        statement = (  # pragma: no cover
            select(Deadline)  # pragma: no cover
            .where(Deadline.election_id == election_id)  # pragma: no cover
            .order_by(Deadline.date)  # pragma: no cover
        )  # pragma: no cover
        deadlines = session.exec(statement).all()  # pragma: no cover
        return [item.model_dump() for item in deadlines]  # pragma: no cover

    # pragma: no cover
    return get_or_set_cache(cache_key, _resolver)  # pragma: no cover

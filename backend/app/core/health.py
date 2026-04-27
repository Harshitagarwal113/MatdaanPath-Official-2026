from sqlalchemy import func
from sqlmodel import Session, select

from app.models import Deadline, Election, EligibilityRule, GlossaryItem, Region, Stage


def _to_int_count(value: object) -> int:
    if isinstance(value, tuple):
        return int(value[0])
    return int(value)


def _count_rows(session: Session, model: type) -> int:
    statement = select(func.count()).select_from(model)
    result = session.exec(statement).one()
    return _to_int_count(result)


def get_table_counts(session: Session) -> dict[str, int]:
    return {
        "regions": _count_rows(session, Region),
        "elections": _count_rows(session, Election),
        "stages": _count_rows(session, Stage),
        "deadlines": _count_rows(session, Deadline),
        "glossary_items": _count_rows(session, GlossaryItem),
        "eligibility_rules": _count_rows(session, EligibilityRule),
    }

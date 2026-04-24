import sys
import os
from datetime import datetime

# Add the app directory to the path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlmodel import Session, select

from app.models import Deadline, Election, EligibilityRule, GlossaryItem, Region, Source, Stage

from app.core.database import engine

def get_or_create(session: Session, model, defaults: dict | None = None, **lookup):
    instance = session.exec(select(model).filter_by(**lookup)).first()
    if instance:
        if defaults:
            for key, value in defaults.items():
                setattr(instance, key, value)
        return instance

    params = {**lookup, **(defaults or {})}
    instance = model(**params)
    session.add(instance)
    session.flush()
    return instance


def deduplicate_regions(session: Session) -> None:
    canonical_regions: dict[str, Region] = {}
    regions = session.exec(select(Region).order_by(Region.id)).all()

    for region in regions:
        existing_region = canonical_regions.get(region.name)
        if existing_region is None:
            canonical_regions[region.name] = region
            continue

        elections = session.exec(select(Election).where(Election.region_id == region.id)).all()
        for election in elections:
            election.region_id = existing_region.id

        session.delete(region)

    session.flush()


def deduplicate_elections(session: Session) -> None:
    canonical_elections: dict[str, Election] = {}
    elections = session.exec(select(Election).order_by(Election.id)).all()

    for election in elections:
        existing_election = canonical_elections.get(election.name)
        if existing_election is None:
            canonical_elections[election.name] = election
            continue

        deadlines = session.exec(select(Deadline).where(Deadline.election_id == election.id)).all()
        for deadline in deadlines:
            deadline.election_id = existing_election.id

        stages = session.exec(select(Stage).where(Stage.election_id == election.id)).all()
        for stage in stages:
            stage.election_id = existing_election.id

        session.delete(election)

    session.flush()


def deduplicate_records(session: Session, model, key_fields: tuple[str, ...]) -> None:
    seen_records: set[tuple[object, ...]] = set()
    rows = session.exec(select(model).order_by(model.id)).all()

    for row in rows:
        dedupe_key = tuple(getattr(row, field) for field in key_fields)
        if dedupe_key in seen_records:
            session.delete(row)
            continue

        seen_records.add(dedupe_key)

    session.flush()


def seed_data():
    with Session(engine) as session:
        deduplicate_regions(session)
        deduplicate_elections(session)
        deduplicate_records(session, Deadline, ("name", "election_id"))
        deduplicate_records(session, Stage, ("name", "election_id"))
        deduplicate_records(session, GlossaryItem, ("term",))
        deduplicate_records(session, EligibilityRule, ("question",))
        deduplicate_records(session, Source, ("name",))

        # 1. Regions
        india = get_or_create(
            session,
            Region,
            name="India",
            defaults={"code": "IN", "description": "National election coverage."},
        )
        up = get_or_create(
            session,
            Region,
            name="Uttar Pradesh",
            defaults={"code": "UP", "description": "State-specific updates and deadlines."},
        )
        mh = get_or_create(
            session,
            Region,
            name="Maharashtra",
            defaults={"code": "MH", "description": "State-specific updates and deadlines."},
        )

        # 2. Election
        lok_sabha = get_or_create(
            session,
            Election,
            name="Lok Sabha General Election 2024",
            defaults={
                "region_id": india.id,
                "election_type": "General Election",
                "year": 2024,
            },
        )
        up_byelection = get_or_create(
            session,
            Election,
            name="Uttar Pradesh Assembly By-Election 2026",
            defaults={
                "region_id": up.id,
                "election_type": "Assembly By-Election",
                "year": 2026,
            },
        )
        mh_local = get_or_create(
            session,
            Election,
            name="Maharashtra Local Body Election 2026",
            defaults={
                "region_id": mh.id,
                "election_type": "Local Body Election",
                "year": 2026,
            },
        )

        # 4. Deadlines
        deadlines = [
            (lok_sabha.id, "Voter Registration Deadline", datetime(2024, 4, 15), "Last day to register for Phase 1."),
            (lok_sabha.id, "Phase 1 Polling Day", datetime(2024, 4, 19), "Voting begins across 21 States/UTs."),
            (lok_sabha.id, "Counting Day", datetime(2024, 6, 4), "Result announcement for all phases."),
            (up_byelection.id, "UP Nomination Deadline", datetime(2026, 5, 2), "Last date for candidate nominations in Uttar Pradesh."),
            (up_byelection.id, "UP Polling Day", datetime(2026, 5, 12), "Polling for the Uttar Pradesh by-election."),
            (mh_local.id, "Maharashtra Ward Roll Revision", datetime(2026, 6, 6), "Final publication of the local body electoral roll."),
            (mh_local.id, "Maharashtra Polling Day", datetime(2026, 6, 18), "Polling for participating municipal wards."),
        ]
        for election_id, name, date, description in deadlines:
            get_or_create(
                session,
                Deadline,
                name=name,
                election_id=election_id,
                defaults={
                    "date": date,
                    "description": description,
                },
            )

        # 5. Sources
        sources = [
            ("ECI Official Website", "https://eci.gov.in", "Government"),
            ("Voter Service Portal", "https://voters.eci.gov.in", "Portal"),
        ]
        for name, url, source_type in sources:
            get_or_create(
                session,
                Source,
                name=name,
                defaults={"url": url, "source_type": source_type},
            )


        # 3. Stages
        stages = [
            (lok_sabha.id, "Voter Registration", "Ensure you are on the electoral roll.", 1),
            (lok_sabha.id, "Nomination of Candidates", "Candidates file their papers.", 2),
            (lok_sabha.id, "Campaign Period", "Parties present their manifestos.", 3),
            (lok_sabha.id, "Polling Day", "Cast your vote at the assigned booth.", 4),
            (lok_sabha.id, "Counting and Results", "Votes are counted and winners declared.", 5),
        ]
        for election_id, name, description, sequence_order in stages:
            get_or_create(
                session,
                Stage,
                name=name,
                election_id=election_id,
                defaults={
                    "description": description,
                    "sequence_order": sequence_order,
                },
            )

        # 4. Glossary
        glossary = [
            ("EVM", "Electronic Voting Machine used in India.", "Technology"),
            ("VVPAT", "Voter Verifiable Paper Audit Trail.", "Technology"),
            ("NOTA", "None Of The Above option for voters.", "General"),
            ("Model Code of Conduct", "Guidelines for parties during elections.", "Legal"),
        ]
        for term, definition, category in glossary:
            get_or_create(
                session,
                GlossaryItem,
                term=term,
                defaults={"definition": definition, "category": category},
            )

        # 5. Eligibility Rules
        rules = [
            (
                "Are you an Indian Citizen?",
                "citizenship",
                "yes",
                "Only Indian citizens can vote.",
                1,
            ),
            (
                "Are you 18+ years old?",
                "age",
                "yes",
                "The minimum age to vote is 18.",
                2,
            ),
        ]
        for question, rule_key, expected_value, explanation_if_failed, sequence_order in rules:
            get_or_create(
                session,
                EligibilityRule,
                question=question,
                defaults={
                    "rule_key": rule_key,
                    "expected_value": expected_value,
                    "explanation_if_failed": explanation_if_failed,
                    "sequence_order": sequence_order,
                },
            )

        session.commit()
        print("Data seeded successfully!")

if __name__ == "__main__":
    seed_data()

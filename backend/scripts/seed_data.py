import sys
import os
from datetime import datetime

# Add the app directory to the path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlmodel import Session, create_engine, select
from app.models import Region, Election, Stage, Deadline, GlossaryItem, EligibilityRule, Source

from app.core.database import engine

def seed_data():
    with Session(engine) as session:
        # 1. Regions
        india = Region(name="India", code="IN")
        up = Region(name="Uttar Pradesh", code="UP")
        mh = Region(name="Maharashtra", code="MH")
        session.add_all([india, up, mh])
        session.commit()
        session.refresh(india)

        # 2. Election
        lok_sabha = Election(
            name="Lok Sabha General Election 2024",
            region_id=india.id,
            election_type="General Election",
            year=2024
        )
        session.add(lok_sabha)
        session.commit()
        session.refresh(lok_sabha)

        # 4. Deadlines
        deadlines = [
            Deadline(election_id=lok_sabha.id, name="Voter Registration Deadline", date=datetime(2024, 4, 15), description="Last day to register for Phase 1."),
            Deadline(election_id=lok_sabha.id, name="Phase 1 Polling Day", date=datetime(2024, 4, 19), description="Voting begins across 21 States/UTs."),
            Deadline(election_id=lok_sabha.id, name="Counting Day", date=datetime(2024, 6, 4), description="Result announcement for all phases.")
        ]
        for d in deadlines: session.add(d)

        # 5. Sources
        sources = [
            Source(name="ECI Official Website", url="https://eci.gov.in", source_type="Government"),
            Source(name="Voter Service Portal", url="https://voters.eci.gov.in", source_type="Portal")
        ]
        for src in sources: session.add(src)


        # 3. Stages
        stages = [
            Stage(election_id=lok_sabha.id, name="Voter Registration", description="Ensure you are on the electoral roll.", sequence_order=1),
            Stage(election_id=lok_sabha.id, name="Nomination of Candidates", description="Candidates file their papers.", sequence_order=2),
            Stage(election_id=lok_sabha.id, name="Campaign Period", description="Parties present their manifestos.", sequence_order=3),
            Stage(election_id=lok_sabha.id, name="Polling Day", description="Cast your vote at the assigned booth.", sequence_order=4),
            Stage(election_id=lok_sabha.id, name="Counting and Results", description="Votes are counted and winners declared.", sequence_order=5)
        ]
        for s in stages: session.add(s)

        # 4. Glossary
        glossary = [
            GlossaryItem(term="EVM", definition="Electronic Voting Machine used in India.", category="Technology"),
            GlossaryItem(term="VVPAT", definition="Voter Verifiable Paper Audit Trail.", category="Technology"),
            GlossaryItem(term="NOTA", definition="None Of The Above option for voters.", category="General"),
            GlossaryItem(term="Model Code of Conduct", definition="Guidelines for parties during elections.", category="Legal")
        ]
        for g in glossary: session.add(g)

        # 5. Eligibility Rules
        rules = [
            EligibilityRule(question="Are you an Indian Citizen?", rule_key="citizenship", expected_value="yes", explanation_if_failed="Only Indian citizens can vote.", sequence_order=1),
            EligibilityRule(question="Are you 18+ years old?", rule_key="age", expected_value="yes", explanation_if_failed="The minimum age to vote is 18.", sequence_order=2)
        ]
        for r in rules: session.add(r)

        session.commit()
        print("Data seeded successfully!")

if __name__ == "__main__":
    seed_data()

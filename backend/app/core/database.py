from sqlmodel import create_engine, Session
import os

# Use SQLite for local development
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./matdaanpath.db")

engine = create_engine(
    DATABASE_URL, 
    echo=True, 
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)

def get_session():
    with Session(engine) as session:
        yield session

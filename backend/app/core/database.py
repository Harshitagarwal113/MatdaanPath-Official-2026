from sqlmodel import create_engine, Session
import os

# Database URL configuration
# For Cloud SQL: postgresql+psycopg2://<user>:<pass>@/<db>?host=/cloudsql/<project>:<region>:<instance>
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./matdaanpath.db")

# Engine options
connect_args = {}
if "sqlite" in DATABASE_URL:
    connect_args = {"check_same_thread": False}
elif "postgresql" in DATABASE_URL:
    # Cloud SQL PostgreSQL optimizations
    connect_args = {
        "connect_timeout": 10,
        "application_name": "MatdaanPath"
    }

engine = create_engine(
    DATABASE_URL, 
    echo=True, 
    connect_args=connect_args
)

def get_session():
    with Session(engine) as session:
        yield session

import os
from collections.abc import Generator

from sqlmodel import Session, create_engine

# Database URL configuration
# For Cloud SQL: postgresql+psycopg2://<user>:<pass>@/<db>?host=/cloudsql/<project>:<region>:<instance>  # noqa: E501
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./matdaanpath.db")
DEBUG_SQL = os.getenv("DEBUG_SQL", "false").lower() == "true"

# Engine options
connect_args = {}
engine_kwargs = {}
if "sqlite" in DATABASE_URL:
    connect_args = {"check_same_thread": False}
elif "postgresql" in DATABASE_URL:  # pragma: no cover
    # Cloud SQL PostgreSQL optimizations  # pragma: no cover
    connect_args = {
        "connect_timeout": 10,
        "application_name": "MatdaanPath",
    }  # pragma: no cover
    engine_kwargs = {  # pragma: no cover
        "pool_pre_ping": True,
        "pool_recycle": 1800,
        "pool_size": int(os.getenv("DB_POOL_SIZE", "5")),
        "max_overflow": int(os.getenv("DB_MAX_OVERFLOW", "10")),
    }

engine = create_engine(
    DATABASE_URL,
    echo=DEBUG_SQL,
    connect_args=connect_args,
    **engine_kwargs,
)


def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:  # pragma: no cover
        yield session  # pragma: no cover

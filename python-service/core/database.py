from sqlmodel import SQLModel, create_engine, Session
from typing import Generator
import os
from dotenv import load_dotenv

load_dotenv()

# Database URL from environment. Never ship a real hosted database fallback.
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./taketoday-dev.db")

# Create engine
engine = create_engine(DATABASE_URL, echo=False)

# Create all tables
def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

# Dependency to get DB session
def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session

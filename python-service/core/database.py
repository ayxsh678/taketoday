from sqlmodel import SQLModel, create_engine, Session
from typing import Generator
import os
from dotenv import load_dotenv

load_dotenv()

# Database URL from environment
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://neondb_owner:npg_kBA6Ph2CgKcw@ep-rapid-tree-aqauzz06-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require")

# Create engine
engine = create_engine(DATABASE_URL, echo=False)

# Create all tables
def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

# Dependency to get DB session
def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session
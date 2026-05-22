from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List
from typing import TYPE_CHECKING
from datetime import datetime

if TYPE_CHECKING:
    from .job import Job

class SourceBase(SQLModel):
    name: str = Field(index=True)
    url: str = Field(index=True, unique=True)
    type: str  # rss, website, api
    active: bool = Field(default=True)

class Source(SourceBase, table=True):
    id: Optional[str] = Field(default=None, primary_key=True)
    last_scraped: Optional[datetime] = Field(default=None)
    
    # Relationships
    articles: List["Article"] = Relationship(back_populates="source")
    jobs: List["Job"] = Relationship(back_populates="source")

class SourceCreate(SourceBase):
    pass

class SourceRead(SourceBase):
    id: str
    last_scraped: Optional[datetime]
    created_at: datetime

class SourceUpdate(SQLModel):
    name: Optional[str] = None
    url: Optional[str] = None
    type: Optional[str] = None
    active: Optional[bool] = None
    last_scraped: Optional[datetime] = None
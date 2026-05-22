from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List
from typing import TYPE_CHECKING
from datetime import datetime
from enum import Enum
import json

if TYPE_CHECKING:
    from .source import Source

class JobType(str, Enum):
    SCRAPE = "scrape"
    PIPELINE = "pipeline"
    GENERATE_HEADLINES = "generate-headlines"
    GENERATE_DELIVERABLE = "generate-deliverable"

class JobStatus(str, Enum):
    PENDING = "pending"
    QUEUED = "queued"
    RUNNING = "running"
    SUCCEEDED = "succeeded"
    FAILED = "failed"
    RETRYING = "retrying"

class JobBase(SQLModel):
    type: JobType
    status: JobStatus = Field(default=JobStatus.QUEUED)
    # Store JSON data as text in the database
    result_json: Optional[str] = Field(default=None)
    started_at: Optional[datetime] = Field(default=None)
    completed_at: Optional[datetime] = Field(default=None)
    error: Optional[str] = Field(default=None)
    user_id: Optional[str] = Field(default=None, index=True)

class Job(JobBase, table=True):
    id: Optional[str] = Field(default=None, primary_key=True)
    # Store JSON data as text in the database
    input_json: Optional[str] = Field(default=None)
    
    # Relationships
    source: Optional["Source"] = Relationship(back_populates="jobs")
    
    # Helper properties for working with JSON data
    @property
    def result(self):
        if self.result_json:
            try:
                return json.loads(self.result_json)
            except:
                return self.result_json
        return None
    
    @result.setter
    def result(self, value):
        if value is None:
            self.result_json = None
        else:
            self.result_json = json.dumps(value)
    
    @property
    def input(self):
        if self.input_json:
            try:
                return json.loads(self.input_json)
            except:
                return self.input_json
        return None
    
    @input.setter
    def input(self, value):
        if value is None:
            self.input_json = None
        else:
            self.input_json = json.dumps(value)

class JobCreate(SQLModel):
    type: JobType
    input: Optional[dict] = None
    user_id: Optional[str] = None

class JobRead(JobBase):
    id: str
    created_at: datetime
    updated_at: datetime
    
    @property
    def result(self):
        if self.result_json:
            try:
                return json.loads(self.result_json)
            except:
                return self.result_json
        return None
    
    @property
    def input(self):
        if self.input_json:
            try:
                return json.loads(self.input_json)
            except:
                return self.input_json
        return None

class JobUpdate(SQLModel):
    status: Optional[JobStatus] = None
    result: Optional[dict] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error: Optional[str] = None
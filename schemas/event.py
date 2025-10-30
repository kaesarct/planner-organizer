from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class EventBase(BaseModel):
    title: str
    description: Optional[str] = None
    type: str
    start_date: datetime
    end_date: datetime
    location: Optional[str] = None

class EventCreate(EventBase):
    group_id: int

class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    type: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    location: Optional[str] = None

class Event(EventBase):
    id: int
    group_id: int
    created_by: int
    created_at: datetime
    
    class Config:
        from_attributes = True
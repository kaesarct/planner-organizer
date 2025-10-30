from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    priority: str = "medium"
    due_date: Optional[datetime] = None

class TaskCreate(TaskBase):
    assigned_to: int
    created_by: int
    event_id: Optional[int] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    due_date: Optional[datetime] = None

class Task(TaskBase):
    id: int
    status: str
    assigned_to: int
    created_by: int
    event_id: Optional[int] = None
    created_at: datetime
    
    class Config:
        from_attributes = True
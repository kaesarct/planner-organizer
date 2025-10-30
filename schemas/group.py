from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class GroupBase(BaseModel):
    name: str
    type: str
    description: Optional[str] = None

class GroupCreate(GroupBase):
    pass

class GroupUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    description: Optional[str] = None

class Group(GroupBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True
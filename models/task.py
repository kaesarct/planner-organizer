from peewee import *
from datetime import datetime
from database import BaseModel
from .user import User
from .event import Event

class Task(BaseModel):
    title = CharField(index=True)
    description = TextField(null=True)
    status = CharField(default="pending")  # pending, in_progress, completed
    priority = CharField(default="medium")  # low, medium, high
    due_date = DateTimeField(null=True)
    assigned_to = ForeignKeyField(User, backref='assigned_tasks')
    created_by = ForeignKeyField(User, backref='created_tasks')
    event = ForeignKeyField(Event, backref='tasks', null=True)
    created_at = DateTimeField(default=datetime.now)
from peewee import *
from datetime import datetime
from database import BaseModel
from .group import Group
from .user import User

class Event(BaseModel):
    title = CharField(index=True)
    description = TextField(null=True)
    type = CharField()  # riunione, uscita, campo, consiglio
    start_date = DateTimeField()
    end_date = DateTimeField()
    location = CharField(null=True)
    group = ForeignKeyField(Group, backref='events')
    created_by = ForeignKeyField(User, backref='created_events')
    created_at = DateTimeField(default=datetime.now)
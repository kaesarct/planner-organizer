from peewee import *
from database import BaseModel

class EventType(BaseModel):
    name = CharField(unique=True)
    color = CharField(default='primary')  # Bootstrap color class
    is_active = BooleanField(default=True)

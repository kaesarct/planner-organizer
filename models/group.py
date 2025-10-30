from peewee import *
from datetime import datetime
from database import BaseModel

class Group(BaseModel):
    name = CharField(index=True)
    type = CharField()  # clan, comunita_capi
    description = TextField(null=True)
    created_at = DateTimeField(default=datetime.now)
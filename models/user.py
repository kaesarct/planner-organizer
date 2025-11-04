from peewee import *
from datetime import datetime
from database import BaseModel

class Group(BaseModel):
    name = CharField()
    type = CharField()  # clan, comunita_capi
    description = TextField(null=True)
    created_at = DateTimeField(default=datetime.now)

class User(BaseModel):
    email = CharField(unique=True, index=True)
    name = CharField()
    hashed_password = CharField()
    role = CharField(default="base")  # base, reviewer, admin
    group = ForeignKeyField(Group, backref='users', null=True)
    is_active = BooleanField(default=True)
    created_at = DateTimeField(default=datetime.now)
from peewee import *
from database import BaseModel

class Permission(BaseModel):
    role = CharField()  # base, reviewer, admin
    field = CharField()  # title, description, status, priority, due_date, assigned_to
    can_edit = BooleanField(default=False)
    
    class Meta:
        indexes = (
            (('role', 'field'), True),  # Unique constraint
        )

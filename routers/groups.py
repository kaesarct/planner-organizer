from fastapi import APIRouter
from typing import List
from schemas.group import Group as GroupSchema
from models.group import Group

router = APIRouter()

@router.get("/", response_model=List[GroupSchema])
async def get_groups():
    groups = Group.select()
    return [{
        "id": g.id,
        "name": g.name,
        "type": g.type,
        "description": g.description,
        "created_at": g.created_at
    } for g in groups]
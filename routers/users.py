from fastapi import APIRouter
from typing import List
from schemas.user import User

router = APIRouter()

@router.get("/", response_model=List[User])
async def get_users():
    return []

@router.get("/me", response_model=User)
async def get_current_user():
    return {
        "id": 1,
        "email": "admin@scout.it",
        "name": "Admin",
        "role": "admin",
        "group_id": 1,
        "is_active": True,
        "created_at": "2024-01-01T00:00:00"
    }
from fastapi import APIRouter, HTTPException, Depends, Request
from typing import List
from schemas.user import User as UserSchema, UserUpdate, UserCreate
from models.user import User
from services.session import require_admin, get_session_user

router = APIRouter()

@router.get("/", response_model=List[UserSchema])
async def get_users(request: Request, user = Depends(require_admin)):
    users = User.select()
    return [UserSchema.model_validate(u) for u in users]

@router.post("/", response_model=UserSchema)
async def create_user_admin(user_data: UserCreate, request: Request, user = Depends(require_admin)):
    from services.simple_auth import hash_password
    from models.group import Group
    
    try:
        User.get(User.email == user_data.email)
        raise HTTPException(status_code=400, detail="Email già registrata")
    except User.DoesNotExist:
        pass
    
    # Assegna gruppo di default
    default_group = Group.select().first()
    group_id = default_group.id if default_group else None
    
    hashed_password = hash_password(user_data.password)
    new_user = User.create(
        email=user_data.email,
        name=user_data.name,
        hashed_password=hashed_password,
        role=user_data.role,
        group_id=group_id
    )
    
    return UserSchema.model_validate(new_user)

@router.get("/{user_id}", response_model=UserSchema)
async def get_user(user_id: int, request: Request, user = Depends(require_admin)):
    try:
        target_user = User.get_by_id(user_id)
        return UserSchema.model_validate(target_user)
    except User.DoesNotExist:
        raise HTTPException(status_code=404, detail="Utente non trovato")

@router.put("/{user_id}", response_model=UserSchema)
async def update_user(user_id: int, user_update: UserUpdate, request: Request, user = Depends(require_admin)):
    try:
        target_user = User.get_by_id(user_id)
        if user_update.name:
            target_user.name = user_update.name
        if user_update.role:
            target_user.role = user_update.role
        target_user.save()
        return UserSchema.model_validate(target_user)
    except User.DoesNotExist:
        raise HTTPException(status_code=404, detail="Utente non trovato")

@router.post("/{user_id}/toggle")
async def toggle_user_status(user_id: int, request: Request, user = Depends(require_admin)):
    try:
        target_user = User.get_by_id(user_id)
        target_user.is_active = not target_user.is_active
        target_user.save()
        return {"message": f"Utente {'attivato' if target_user.is_active else 'disattivato'} con successo"}
    except User.DoesNotExist:
        raise HTTPException(status_code=404, detail="Utente non trovato")
from datetime import timedelta
from fastapi import APIRouter, HTTPException, Depends, status, Request, Response
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from fastapi import Form
from schemas.user import UserCreate, User as UserSchema
from models.user import User
from services.simple_auth import authenticate_user, hash_password
from services.session import login_user, logout_user

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserSchema

@router.post("/login")
async def login(request: Request, form_data: OAuth2PasswordRequestForm = Depends()):
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o password non corretti"
        )
    
    login_user(request, user)
    return RedirectResponse(url="/dashboard", status_code=302)

@router.post("/register")
async def register(
    request: Request,
    name: str = Form(...),
    email: str = Form(...),
    password: str = Form(...)
):
    try:
        User.get(User.email == email)
        raise HTTPException(status_code=400, detail="Email già registrata")
    except User.DoesNotExist:
        pass
    
    # Se non ci sono utenti, il primo diventa admin
    user_count = User.select().count()
    role = "admin" if user_count == 0 else "base"
    
    # Assegna gruppo di default
    from models.group import Group
    default_group = Group.select().first()
    group_id = default_group.id if default_group else None
    
    hashed_password = hash_password(password)
    user = User.create(
        email=email,
        name=name,
        hashed_password=hashed_password,
        role=role,
        group_id=group_id
    )
    
    login_user(request, user)
    return RedirectResponse(url="/dashboard", status_code=302)

@router.post("/logout")
async def logout(request: Request):
    logout_user(request)
    return RedirectResponse(url="/login", status_code=302)

@router.get("/check-first-user")
async def check_first_user():
    user_count = User.select().count()
    return {"is_first_user": user_count == 0}
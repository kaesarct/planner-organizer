import hashlib
import secrets
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from fastapi import HTTPException
from models.user import User

SECRET_KEY = "scout-planner-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

def hash_password(password: str) -> str:
    """Hash password usando SHA256 + salt"""
    salt = secrets.token_hex(16)
    pwd_hash = hashlib.sha256((password + salt).encode()).hexdigest()
    return f"{salt}:{pwd_hash}"

def verify_password(password: str, hashed: str) -> bool:
    """Verifica password"""
    try:
        salt, pwd_hash = hashed.split(':')
        return hashlib.sha256((password + salt).encode()).hexdigest() == pwd_hash
    except:
        return False

def authenticate_user(email: str, password: str):
    try:
        user = User.get(User.email == email)
        if not verify_password(password, user.hashed_password):
            return False
        return user
    except User.DoesNotExist:
        return False

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def verify_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return email
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

def get_current_user(token: str):
    email = verify_token(token)
    try:
        user = User.get(User.email == email)
        return user
    except User.DoesNotExist:
        raise HTTPException(status_code=401, detail="User not found")

def check_permission(user: User, required_role: str):
    roles_hierarchy = {"base": 1, "reviewer": 2, "admin": 3}
    user_level = roles_hierarchy.get(user.role, 0)
    required_level = roles_hierarchy.get(required_role, 0)
    return user_level >= required_level
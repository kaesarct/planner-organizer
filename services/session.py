from fastapi import Request, HTTPException, Depends
from itsdangerous import URLSafeSerializer
from models.user import User

SECRET_KEY = "scout-planner-session-key"
serializer = URLSafeSerializer(SECRET_KEY)

def get_session_user(request: Request):
    """Ottiene l'utente dalla sessione"""
    session_data = request.session.get("user")
    if not session_data:
        return None
    
    try:
        user_id = serializer.loads(session_data)
        user = User.get_by_id(user_id)
        return user
    except:
        return None

def require_auth(request: Request):
    """Richiede autenticazione"""
    user = get_session_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Login richiesto")
    return user

def require_admin(request: Request):
    """Richiede ruolo admin"""
    user = require_auth(request)
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Accesso negato - Solo admin")
    return user

def require_reviewer(request: Request):
    """Richiede ruolo reviewer o superiore"""
    user = require_auth(request)
    if user.role not in ["reviewer", "admin"]:
        raise HTTPException(status_code=403, detail="Accesso negato - Reviewer o admin richiesto")
    return user

def login_user(request: Request, user: User):
    """Effettua login dell'utente"""
    request.session["user"] = serializer.dumps(user.id)

def logout_user(request: Request):
    """Effettua logout dell'utente"""
    request.session.pop("user", None)
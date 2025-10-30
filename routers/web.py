from fastapi import APIRouter, Request
from fastapi.templating import Jinja2Templates

router = APIRouter()
templates = Jinja2Templates(directory="templates")

@router.get("/dashboard")
def dashboard(request: Request):
    return templates.TemplateResponse("dashboard.html", {"request": request})

@router.get("/events")
def events_page(request: Request):
    return templates.TemplateResponse("events.html", {"request": request})

@router.get("/tasks")
def tasks_page(request: Request):
    return templates.TemplateResponse("tasks.html", {"request": request})

@router.get("/login")
def login_page(request: Request):
    return templates.TemplateResponse("login.html", {"request": request})

@router.get("/admin")
def admin_page(request: Request):
    return templates.TemplateResponse("admin.html", {"request": request})
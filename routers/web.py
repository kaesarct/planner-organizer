from fastapi import APIRouter, Request, Depends
from fastapi.responses import RedirectResponse
from fastapi.templating import Jinja2Templates
from services.session import get_session_user, require_admin
from models.task import Task
from models.user import User
from models.event import Event

router = APIRouter()
templates = Jinja2Templates(directory="templates")


@router.get("/login")
def login_page(request: Request):
    return templates.TemplateResponse("login.html", {"request": request})


@router.get("/register")
def register_page(request: Request):
    return templates.TemplateResponse("register.html", {"request": request})


@router.get("/admin")
def admin_page(request: Request, user=Depends(require_admin)):
    # Carica dati per admin
    users = User.select()
    tasks = Task.select()
    events = Event.select()

    user_list = [
        {
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "role": u.role,
            "is_active": u.is_active,
        }
        for u in users
    ]

    task_list = [
        {
            "id": t.id,
            "title": t.title,
            "description": t.description or "",
            "status": t.status,
            "priority": t.priority,
            "due_date": t.due_date,
            "visible": getattr(t, "visible", True),
        }
        for t in tasks
    ]

    event_list = [
        {
            "id": e.id,
            "title": e.title,
            "type": e.type,
            "start_date": e.start_date,
            "end_date": e.end_date,
            "location": e.location,
        }
        for e in events
    ]

    return templates.TemplateResponse(
        "admin.html",
        {
            "request": request,
            "user": user,
            "users": user_list,
            "tasks": task_list,
            "events": event_list,
        },
    )


@router.post("/admin/toggle-task/{task_id}")
def toggle_task_visibility(task_id: int, request: Request, user=Depends(require_admin)):
    try:
        task = Task.get_by_id(task_id)
        # Toggle visibilità
        try:
            task.visible = not task.visible
        except:
            task.visible = False
        task.save()
    except Task.DoesNotExist:
        pass

    return RedirectResponse(url="/admin", status_code=302)


@router.get("/dashboard")
def dashboard(request: Request):
    user = get_session_user(request)
    if not user:
        return templates.TemplateResponse("login.html", {"request": request})
    return templates.TemplateResponse(
        "dashboard.html", {"request": request, "user": user}
    )


@router.get("/events")
def events_page(request: Request):
    user = get_session_user(request)
    if not user:
        return templates.TemplateResponse("login.html", {"request": request})
    return templates.TemplateResponse("events.html", {"request": request, "user": user})


@router.get("/tasks")
def tasks_page(request: Request):
    user = get_session_user(request)
    if not user:
        return templates.TemplateResponse("login.html", {"request": request})

    # Carica task dal database
    tasks = Task.select()
    task_list = []
    for t in tasks:
        task_list.append(
            {
                "id": t.id,
                "title": t.title,
                "description": t.description or "",
                "status": t.status,
                "priority": t.priority,
                "due_date": t.due_date,
                "assigned_to": t.assigned_to.id,
                "created_by": t.created_by.id,
            }
        )

    print(f"DEBUG: Trovati {len(task_list)} task")

    return templates.TemplateResponse(
        "tasks.html", {"request": request, "user": user, "tasks": task_list}
    )

@router.get("/task/{task_id}")
def task_detail(task_id: int, request: Request):
    user = get_session_user(request)
    if not user:
        return templates.TemplateResponse("login.html", {"request": request})
    
    try:
        task = Task.get_by_id(task_id)
        assigned_user = User.get_by_id(task.assigned_to.id)
        created_user = User.get_by_id(task.created_by.id)
        
        task_data = {
            "id": task.id,
            "title": task.title,
            "description": task.description or "",
            "status": task.status,
            "priority": task.priority,
            "due_date": task.due_date,
            "assigned_to": assigned_user.name,
            "created_by": created_user.name
        }
        
        return templates.TemplateResponse("task_detail.html", {
            "request": request, 
            "user": user, 
            "task": task_data
        })
    except Task.DoesNotExist:
        return RedirectResponse(url="/tasks", status_code=302)

@router.post("/task/{task_id}/update")
def update_task(task_id: int, request: Request):
    user = get_session_user(request)
    if not user:
        return RedirectResponse(url="/login", status_code=302)
    
    # Solo reviewer+ può modificare
    if user.role not in ["reviewer", "admin"]:
        return RedirectResponse(url=f"/task/{task_id}", status_code=302)
    
    return RedirectResponse(url=f"/task/{task_id}", status_code=302)

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
            "assigned_to": t.assigned_to.name if t.assigned_to else "Non assegnato",
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

    return RedirectResponse(url="/admin#tasks", status_code=302)


@router.get("/dashboard")
def dashboard(request: Request):
    user = get_session_user(request)
    if not user:
        return templates.TemplateResponse("login.html", {"request": request})
    
    # Carica tutti i task per debug
    tasks = Task.select()
    print(f"DEBUG Dashboard: User ID = {user.id}, Found {len(tasks)} total tasks")
    for t in tasks:
        print(f"Task {t.id}: {t.title}, assigned_to={t.assigned_to.id if t.assigned_to else None}")
    
    # Filtra solo quelli assegnati all'utente
    user_tasks = [t for t in tasks if t.assigned_to and t.assigned_to.id == user.id]
    print(f"DEBUG Dashboard: Filtered to {len(user_tasks)} user tasks")
    
    # Debug: mostra tutti i task per confronto
    all_tasks = Task.select()
    print(f"DEBUG Dashboard: Total tasks in DB = {len(all_tasks)}")
    for t in all_tasks:
        print(f"All Task {t.id}: {t.title}, assigned_to={t.assigned_to.id if t.assigned_to else None}")
    
    # Ordina per: 1) priorità, 2) data scadenza, 3) stato
    priority_order = {'high': 1, 'medium': 2, 'low': 3}
    status_order = {'in_progress': 1, 'pending': 2, 'completed': 3, 'cancelled': 4}
    
    task_list = []
    for t in user_tasks:
        task_list.append({
            "id": t.id,
            "title": t.title,
            "description": t.description or "",
            "status": t.status,
            "priority": t.priority,
            "due_date": t.due_date,
            "priority_order": priority_order.get(t.priority, 3),
            "status_order": status_order.get(t.status, 4)
        })
    
    # Ordina task
    task_list.sort(key=lambda x: (
        x['priority_order'],
        x['due_date'] if x['due_date'] else '9999-12-31',
        x['status_order']
    ))
    
    print(f"DEBUG Dashboard: Final task_list has {len(task_list)} tasks")
    
    return templates.TemplateResponse(
        "dashboard.html", {"request": request, "user": user, "my_tasks": task_list}
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
        assigned_name = t.assigned_to.name if t.assigned_to else None
        print(f"DEBUG Task {t.id}: {t.title}, assigned_to_id={t.assigned_to.id if t.assigned_to else None}, assigned_name={assigned_name}")
        task_list.append(
            {
                "id": t.id,
                "title": t.title,
                "description": t.description or "",
                "status": t.status,
                "priority": t.priority,
                "due_date": t.due_date,
                "assigned_to": assigned_name,
                "assigned_to_id": t.assigned_to.id if t.assigned_to else None,
                "created_by": t.created_by.id if t.created_by else None,
                "visible": getattr(t, "visible", True),
            }
        )

    print(f"DEBUG: Trovati {len(task_list)} task")

    # Carica utenti per select
    users = User.select()
    user_list = [{"id": u.id, "name": u.name} for u in users]

    return templates.TemplateResponse(
        "tasks.html",
        {"request": request, "user": user, "tasks": task_list, "users": user_list},
    )


@router.post("/task/{task_id}/update")
async def update_task(task_id: int, request: Request):
    user = get_session_user(request)
    if not user:
        return RedirectResponse(url="/login", status_code=302)

    if user.role not in ["reviewer", "admin"]:
        return RedirectResponse(url="/tasks", status_code=302)

    form = await request.form()

    try:
        task = Task.get_by_id(task_id)

        if "status" in form and user.role in ["reviewer", "admin"]:
            task.status = form["status"]

        if "priority" in form and user.role == "admin":
            task.priority = form["priority"]

        if "assigned_to" in form and user.role == "admin":
            task.assigned_to = form["assigned_to"]

        task.save()
    except Task.DoesNotExist:
        pass

    return RedirectResponse(url="/tasks", status_code=302)


@router.post("/task/create")
async def create_task(request: Request):
    user = get_session_user(request)
    if not user or user.role not in ["admin", "reviewer"]:
        return RedirectResponse(url="/tasks", status_code=302)

    form = await request.form()

    try:
        assigned_to_value = form.get("assigned_to")
        assigned_to_id = None
        if assigned_to_value and assigned_to_value.strip():
            assigned_to_id = int(assigned_to_value)

        task = Task.create(
            title=form["title"],
            description=form.get("description", ""),
            status=form["status"],
            priority=form["priority"],
            assigned_to=assigned_to_id,
            created_by=user.id,
        )
    except Exception as e:
        print(f"Error creating task: {e}")

    return RedirectResponse(url="/tasks", status_code=302)

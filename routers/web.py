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
    from datetime import date
    from services.permissions import get_permissions, init_permissions
    
    today = date.today()
    
    # Inizializza permessi se non esistono
    init_permissions()
    
    # Carica dati per admin
    users = User.select()
    tasks = Task.select()
    events = Event.select()
    
    # Carica permessi
    permissions = {
        'base': get_permissions('base'),
        'reviewer': get_permissions('reviewer'),
        'admin': get_permissions('admin')
    }
    
    # Carica tipi evento
    from models.event_type import EventType
    event_types = EventType.select()
    event_types_list = [{'id': et.id, 'name': et.name, 'color': et.color, 'is_active': et.is_active} for et in event_types]

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
            "today": today,
            "permissions": permissions,
            "event_types": event_types_list,
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


@router.post("/admin/toggle-user/{user_id}")
def toggle_user_status(user_id: int, request: Request, admin_user=Depends(require_admin)):
    try:
        user = User.get_by_id(user_id)
        user.is_active = not user.is_active
        user.save()
    except User.DoesNotExist:
        pass
    return RedirectResponse(url="/admin", status_code=302)


@router.post("/admin/change-role/{user_id}")
async def change_user_role(user_id: int, request: Request, admin_user=Depends(require_admin)):
    form = await request.form()
    try:
        user = User.get_by_id(user_id)
        user.role = form["role"]
        user.save()
    except User.DoesNotExist:
        pass
    return RedirectResponse(url="/admin", status_code=302)


@router.post("/admin/delete-user/{user_id}")
def delete_user(user_id: int, request: Request, admin_user=Depends(require_admin)):
    try:
        user = User.get_by_id(user_id)
        # Non permettere di eliminare se stesso
        if user.id != admin_user.id:
            user.delete_instance()
    except User.DoesNotExist:
        pass
    return RedirectResponse(url="/admin", status_code=302)


@router.post("/admin/toggle-permission/{role}/{field}")
def toggle_permission(role: str, field: str, request: Request, admin_user=Depends(require_admin)):
    from services.permissions import toggle_permission as toggle_perm
    toggle_perm(role, field)
    return RedirectResponse(url="/admin#permissions", status_code=302)


@router.post("/admin/delete-event/{event_id}")
def delete_event(event_id: int, request: Request, admin_user=Depends(require_admin)):
    try:
        event = Event.get_by_id(event_id)
        event.delete_instance()
    except Event.DoesNotExist:
        pass
    return RedirectResponse(url="/admin#events", status_code=302)


@router.post("/admin/toggle-event-type/{type_id}")
def toggle_event_type(type_id: int, request: Request, admin_user=Depends(require_admin)):
    from models.event_type import EventType
    try:
        event_type = EventType.get_by_id(type_id)
        event_type.is_active = not event_type.is_active
        event_type.save()
    except EventType.DoesNotExist:
        pass
    return RedirectResponse(url="/admin#permissions", status_code=302)


@router.post("/admin/add-event-type")
async def add_event_type(request: Request, admin_user=Depends(require_admin)):
    from models.event_type import EventType
    form = await request.form()
    try:
        EventType.create(
            name=form["name"],
            color=form["color"],
            is_active=True
        )
    except:
        pass
    return RedirectResponse(url="/admin#permissions", status_code=302)


@router.get("/dashboard")
def dashboard(request: Request):
    user = get_session_user(request)
    if not user:
        return templates.TemplateResponse("login.html", {"request": request})
    
    from services.permissions import get_permissions, init_permissions
    init_permissions()
    permissions = get_permissions(user.role)
    
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
        "dashboard.html", {"request": request, "user": user, "my_tasks": task_list, "permissions": permissions}
    )


@router.get("/events")
def events_page(request: Request):
    user = get_session_user(request)
    if not user:
        return templates.TemplateResponse("login.html", {"request": request})
    
    from services.permissions import get_permissions, init_permissions
    init_permissions()
    permissions = get_permissions(user.role)
    
    return templates.TemplateResponse("events.html", {"request": request, "user": user, "permissions": permissions})


@router.get("/tasks")
def tasks_page(request: Request):
    user = get_session_user(request)
    if not user:
        return templates.TemplateResponse("login.html", {"request": request})

    from datetime import date
    from services.permissions import get_permissions, init_permissions
    
    today = date.today()
    init_permissions()
    permissions = get_permissions(user.role)

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
        {"request": request, "user": user, "tasks": task_list, "users": user_list, "today": today, "permissions": permissions},
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

        from services.permissions import can_edit_field
        
        if "title" in form and can_edit_field(user.role, "title"):
            task.title = form["title"]
        
        if "description" in form and can_edit_field(user.role, "description"):
            task.description = form["description"]

        if "status" in form and can_edit_field(user.role, "status"):
            task.status = form["status"]

        if "priority" in form and can_edit_field(user.role, "priority"):
            task.priority = form["priority"]
        
        if "due_date" in form and can_edit_field(user.role, "due_date"):
            due_date_value = form["due_date"]
            if due_date_value and due_date_value.strip():
                from datetime import datetime
                task.due_date = datetime.strptime(due_date_value, "%Y-%m-%d")
            else:
                task.due_date = None

        if "assigned_to" in form and can_edit_field(user.role, "assigned_to"):
            assigned_value = form["assigned_to"]
            if assigned_value and assigned_value.strip():
                task.assigned_to = int(assigned_value)
            else:
                task.assigned_to = None

        task.save()
    except Task.DoesNotExist:
        pass
    except Exception as e:
        print(f"Error updating task: {e}")

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
        
        due_date_value = form.get("due_date")
        due_date = None
        if due_date_value and due_date_value.strip():
            from datetime import datetime
            due_date = datetime.strptime(due_date_value, "%Y-%m-%d")

        task = Task.create(
            title=form["title"],
            description=form.get("description", ""),
            status=form["status"],
            priority=form["priority"],
            due_date=due_date,
            assigned_to=assigned_to_id,
            created_by=user.id,
        )
    except Exception as e:
        print(f"Error creating task: {e}")

    return RedirectResponse(url="/tasks", status_code=302)

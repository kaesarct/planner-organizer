from fastapi import APIRouter, HTTPException, Depends, Request
from typing import List
from schemas.task import Task as TaskSchema, TaskCreate, TaskUpdate
from models.task import Task
from models.user import User
from services.session import require_auth, require_reviewer, require_admin, get_session_user

router = APIRouter()

@router.get("/")
async def get_tasks():
    tasks = Task.select()
    return [{
        "id": t.id,
        "title": t.title,
        "description": t.description or "",
        "status": t.status,
        "priority": t.priority,
        "due_date": t.due_date.isoformat() if t.due_date else None,
        "assigned_to": t.assigned_to.id,
        "created_by": t.created_by.id,
        "event_id": t.event.id if t.event else None,
        "visible": getattr(t, 'visible', True),
        "created_at": t.created_at.isoformat()
    } for t in tasks]

@router.post("/")
async def create_task(task: TaskCreate, request: Request, user = Depends(require_reviewer)):
    new_task = Task.create(
        title=task.title,
        description=task.description or "",
        priority=task.priority,
        due_date=task.due_date,
        assigned_to=task.assigned_to,
        created_by=user.id,
        visible=True
    )
    
    return {"id": new_task.id, "message": "Task creato"}

@router.get("/{task_id}", response_model=TaskSchema)
async def get_task(task_id: int):
    try:
        task = Task.get_by_id(task_id)
        return {
            "id": task.id,
            "title": task.title,
            "description": task.description,
            "status": task.status,
            "priority": task.priority,
            "due_date": task.due_date,
            "assigned_to": task.assigned_to.id,
            "created_by": task.created_by.id,
            "event_id": task.event.id if task.event else None,
            "created_at": task.created_at
        }
    except Task.DoesNotExist:
        raise HTTPException(status_code=404, detail="Task not found")

@router.put("/{task_id}", response_model=TaskSchema)
async def update_task(task_id: int, task_update: TaskUpdate, request: Request, user = Depends(require_reviewer)):
    try:
        existing_task = Task.get_by_id(task_id)
        
        if task_update.title is not None:
            existing_task.title = task_update.title
        if task_update.description is not None:
            existing_task.description = task_update.description
        if task_update.status is not None:
            existing_task.status = task_update.status
        if task_update.priority is not None:
            existing_task.priority = task_update.priority
        if task_update.due_date is not None:
            existing_task.due_date = task_update.due_date
            
        existing_task.save()
        
        return {
            "id": existing_task.id,
            "title": existing_task.title,
            "description": existing_task.description,
            "status": existing_task.status,
            "priority": existing_task.priority,
            "due_date": existing_task.due_date,
            "assigned_to": existing_task.assigned_to.id,
            "created_by": existing_task.created_by.id,
            "event_id": existing_task.event.id if existing_task.event else None,
            "created_at": existing_task.created_at
        }
    except Task.DoesNotExist:
        raise HTTPException(status_code=404, detail="Task not found")



@router.post("/{task_id}/toggle-visibility")
async def toggle_task_visibility(task_id: int, request: Request, user = Depends(require_admin)):
    try:
        task = Task.get_by_id(task_id)
        task.visible = not task.visible
        task.save()
        return {"message": f"Task {'mostrato' if task.visible else 'nascosto'} con successo"}
    except Task.DoesNotExist:
        raise HTTPException(status_code=404, detail="Task not found")

@router.delete("/{task_id}")
async def delete_task(task_id: int, request: Request, user = Depends(require_admin)):
    try:
        task = Task.get_by_id(task_id)
        task.delete_instance()
        return {"message": "Task deleted successfully"}
    except Task.DoesNotExist:
        raise HTTPException(status_code=404, detail="Task not found")
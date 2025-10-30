from fastapi import APIRouter, HTTPException
from typing import List
from schemas.task import Task as TaskSchema, TaskCreate, TaskUpdate
from models.task import Task
from models.user import User

router = APIRouter()

@router.get("/", response_model=List[TaskSchema])
async def get_tasks():
    tasks = Task.select()
    return [{
        "id": t.id,
        "title": t.title,
        "description": t.description,
        "status": t.status,
        "priority": t.priority,
        "due_date": t.due_date,
        "assigned_to": t.assigned_to.id,
        "created_by": t.created_by.id,
        "event_id": t.event.id if t.event else None,
        "created_at": t.created_at
    } for t in tasks]

@router.post("/", response_model=TaskSchema)
async def create_task(task: TaskCreate):
    assigned_user = User.get_by_id(task.assigned_to)
    creator = User.get_by_id(task.created_by)
    
    new_task = Task.create(
        title=task.title,
        description=task.description,
        priority=task.priority,
        due_date=task.due_date,
        assigned_to=assigned_user.id,
        created_by=creator.id,
        event=task.event_id if hasattr(task, 'event_id') and task.event_id else None
    )
    
    return {
        "id": new_task.id,
        "title": new_task.title,
        "description": new_task.description,
        "status": new_task.status,
        "priority": new_task.priority,
        "due_date": new_task.due_date,
        "assigned_to": new_task.assigned_to.id,
        "created_by": new_task.created_by.id,
        "event_id": new_task.event.id if new_task.event else None,
        "created_at": new_task.created_at
    }

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
async def update_task(task_id: int, task_update: TaskUpdate):
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

@router.delete("/{task_id}")
async def delete_task(task_id: int):
    try:
        task = Task.get_by_id(task_id)
        task.delete_instance()
        return {"message": "Task deleted successfully"}
    except Task.DoesNotExist:
        raise HTTPException(status_code=404, detail="Task not found")
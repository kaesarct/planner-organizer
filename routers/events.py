from fastapi import APIRouter, HTTPException
from typing import List
from schemas.event import Event as EventSchema, EventCreate, EventUpdate
from models.event import Event
from models.group import Group
from models.user import User

router = APIRouter()

@router.get("/", response_model=List[EventSchema])
async def get_events():
    events = Event.select()
    return [{
        "id": e.id,
        "title": e.title,
        "description": e.description,
        "type": e.type,
        "start_date": e.start_date,
        "end_date": e.end_date,
        "location": e.location,
        "group_id": e.group.id,
        "created_by": e.created_by.id,
        "created_at": e.created_at
    } for e in events]

@router.post("/", response_model=EventSchema)
async def create_event(event: EventCreate):
    group = Group.get_by_id(event.group_id)
    user = User.get_by_id(1)  # Mock user
    
    new_event = Event.create(
        title=event.title,
        description=event.description,
        type=event.type,
        start_date=event.start_date,
        end_date=event.end_date,
        location=event.location,
        group=group.id,
        created_by=user.id
    )
    
    return {
        "id": new_event.id,
        "title": new_event.title,
        "description": new_event.description,
        "type": new_event.type,
        "start_date": new_event.start_date,
        "end_date": new_event.end_date,
        "location": new_event.location,
        "group_id": new_event.group.id,
        "created_by": new_event.created_by.id,
        "created_at": new_event.created_at
    }

@router.get("/{event_id}", response_model=EventSchema)
async def get_event(event_id: int):
    try:
        event = Event.get_by_id(event_id)
        return {
            "id": event.id,
            "title": event.title,
            "description": event.description,
            "type": event.type,
            "start_date": event.start_date,
            "end_date": event.end_date,
            "location": event.location,
            "group_id": event.group.id,
            "created_by": event.created_by.id,
            "created_at": event.created_at
        }
    except Event.DoesNotExist:
        raise HTTPException(status_code=404, detail="Event not found")

@router.delete("/{event_id}")
async def delete_event(event_id: int):
    try:
        event = Event.get_by_id(event_id)
        event.delete_instance()
        return {"message": "Event deleted successfully"}
    except Event.DoesNotExist:
        raise HTTPException(status_code=404, detail="Event not found")

@router.put("/{event_id}", response_model=EventSchema)
async def update_event(event_id: int, event: EventUpdate):
    try:
        existing_event = Event.get_by_id(event_id)
        
        # Aggiorna solo i campi forniti
        if event.title is not None:
            existing_event.title = event.title
        if event.description is not None:
            existing_event.description = event.description
        if event.type is not None:
            existing_event.type = event.type
        if event.start_date is not None:
            existing_event.start_date = event.start_date
        if event.end_date is not None:
            existing_event.end_date = event.end_date
        if event.location is not None:
            existing_event.location = event.location
            
        existing_event.save()
        
        return {
            "id": existing_event.id,
            "title": existing_event.title,
            "description": existing_event.description,
            "type": existing_event.type,
            "start_date": existing_event.start_date,
            "end_date": existing_event.end_date,
            "location": existing_event.location,
            "group_id": existing_event.group.id,
            "created_by": existing_event.created_by.id,
            "created_at": existing_event.created_at
        }
    except Event.DoesNotExist:
        raise HTTPException(status_code=404, detail="Event not found")
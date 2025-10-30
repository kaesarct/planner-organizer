#!/usr/bin/env python3

# Script per creare task di esempio
from database import db
from models import User, Task
from datetime import datetime, timedelta

def create_sample_tasks():
    """Crea alcuni task di esempio"""
    db.connect()
    
    # Prendi il primo utente disponibile
    try:
        user = User.select().first()
        if not user:
            print("Nessun utente trovato. Crea prima degli utenti.")
            return
        
        # Crea task di esempio
        tasks_data = [
            {
                'title': 'Preparare materiale per uscita',
                'description': 'Controllare zaini, corde e materiale da campo',
                'priority': 'high',
                'due_date': datetime.now() + timedelta(days=2),
                'status': 'pending'
            },
            {
                'title': 'Organizzare riunione capi',
                'description': 'Pianificare agenda e inviare convocazioni',
                'priority': 'medium',
                'due_date': datetime.now() + timedelta(days=5),
                'status': 'in_progress'
            },
            {
                'title': 'Aggiornare registro presenze',
                'description': 'Inserire presenze ultimo mese',
                'priority': 'low',
                'due_date': datetime.now() + timedelta(days=10),
                'status': 'pending'
            },
            {
                'title': 'Preparare campo estivo',
                'description': 'Prenotare location e organizzare attività',
                'priority': 'high',
                'due_date': datetime.now() + timedelta(days=30),
                'status': 'pending'
            }
        ]
        
        for task_data in tasks_data:
            Task.create(
                title=task_data['title'],
                description=task_data['description'],
                priority=task_data['priority'],
                due_date=task_data['due_date'],
                status=task_data['status'],
                assigned_to=user.id,
                created_by=user.id
            )
        
        print(f"Creati {len(tasks_data)} task di esempio!")
        
    except Exception as e:
        print(f"Errore: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    create_sample_tasks()
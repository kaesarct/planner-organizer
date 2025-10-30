from peewee import *
import os

DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://scout:scout123@localhost:5432/scout_planner')

# Parse DATABASE_URL
if DATABASE_URL.startswith('postgresql://'):
    url_parts = DATABASE_URL.replace('postgresql://', '').split('@')
    user_pass = url_parts[0].split(':')
    host_db = url_parts[1].split('/')
    host_port = host_db[0].split(':')
    
    db = PostgresqlDatabase(
        host_db[1],
        user=user_pass[0],
        password=user_pass[1],
        host=host_port[0],
        port=int(host_port[1]) if len(host_port) > 1 else 5432
    )
else:
    db = SqliteDatabase('scout_planner.db')

class BaseModel(Model):
    class Meta:
        database = db
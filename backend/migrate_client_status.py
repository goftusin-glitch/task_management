from database import engine, SessionLocal
from sqlalchemy import text
from models.client import Client

def migrate():
    print("Starting migration...")
    try:
        with engine.connect() as connection:
            connection.execute(text("ALTER TABLE clients ADD COLUMN status VARCHAR(50) DEFAULT 'active'"))
            connection.commit()
        print("Migration successful: Added status column to clients table.")
    except Exception as e:
        print(f"Migration failed: {e}")

if __name__ == "__main__":
    migrate()

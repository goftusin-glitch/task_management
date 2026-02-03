"""
Migration script to add CASCADE delete to client_id foreign keys.
Run this once to update existing database constraints.

Usage:
    python migrate_cascade_delete.py
"""

from database import engine
from sqlalchemy import text


def migrate():
    with engine.connect() as conn:
        try:
            # Drop existing foreign key constraint on tasks table
            # First, find the constraint name
            result = conn.execute(text("""
                SELECT CONSTRAINT_NAME
                FROM information_schema.KEY_COLUMN_USAGE
                WHERE TABLE_NAME = 'tasks'
                AND COLUMN_NAME = 'client_id'
                AND REFERENCED_TABLE_NAME = 'clients'
                AND TABLE_SCHEMA = DATABASE()
            """))
            
            constraint_row = result.fetchone()
            if constraint_row:
                constraint_name = constraint_row[0]
                print(f"Found constraint: {constraint_name}")
                
                # Drop the old constraint
                conn.execute(text(f"ALTER TABLE tasks DROP FOREIGN KEY {constraint_name}"))
                print("Dropped old foreign key constraint")
                
                # Add new constraint with CASCADE
                conn.execute(text("""
                    ALTER TABLE tasks 
                    ADD CONSTRAINT fk_tasks_client_id 
                    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
                """))
                print("Added new foreign key constraint with CASCADE delete")
                
                conn.commit()
                print("Migration completed successfully!")
            else:
                print("No existing constraint found. Adding new one...")
                conn.execute(text("""
                    ALTER TABLE tasks 
                    ADD CONSTRAINT fk_tasks_client_id 
                    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
                """))
                conn.commit()
                print("Added foreign key constraint with CASCADE delete")
                
        except Exception as e:
            print(f"Error during migration: {e}")
            conn.rollback()


if __name__ == "__main__":
    migrate()

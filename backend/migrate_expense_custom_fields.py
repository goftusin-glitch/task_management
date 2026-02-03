"""
Migration script to add custom_fields column to expenses table.
Run this once to update existing database.

Usage:
    python migrate_expense_custom_fields.py
"""

from database import engine
from sqlalchemy import text


def migrate():
    with engine.connect() as conn:
        try:
            # Check if column exists
            result = conn.execute(text("""
                SELECT COUNT(*) 
                FROM information_schema.COLUMNS 
                WHERE TABLE_SCHEMA = DATABASE()
                AND TABLE_NAME = 'expenses' 
                AND COLUMN_NAME = 'custom_fields'
            """))
            
            exists = result.fetchone()[0] > 0
            
            if exists:
                print("custom_fields column already exists in expenses table")
                return
            
            # Add custom_fields column
            conn.execute(text("""
                ALTER TABLE expenses 
                ADD COLUMN custom_fields JSON DEFAULT (JSON_OBJECT())
            """))
            conn.commit()
            print("Successfully added custom_fields column to expenses table!")
            
        except Exception as e:
            print(f"Error during migration: {e}")
            conn.rollback()


if __name__ == "__main__":
    migrate()

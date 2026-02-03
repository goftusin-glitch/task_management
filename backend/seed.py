"""
Seed script to create the initial admin user.
Run this after setting up the database.

Admin credentials:
- Email: thirumurugan24r@gmail.com
- Password: ThiruMurugan@240320
"""

from database import SessionLocal, engine, Base
from models.user import User
from services.auth import get_password_hash

# Create all tables
Base.metadata.create_all(bind=engine)


def seed_admin():
    db = SessionLocal()
    try:
        # Check if admin already exists
        existing_admin = db.query(User).filter(User.email == "thirumurugan24r@gmail.com").first()
        if existing_admin:
            print("Admin user already exists!")
            return
        
        # Create admin user
        admin = User(
            name="Thiru Murugan",
            email="thirumurugan24r@gmail.com",
            password_hash=get_password_hash("ThiruMurugan@240320"),
            is_admin=True,
            page_access=["clients", "my_task", "my_progress", "completed_task", "expenses", "users", "tasks"]
        )
        db.add(admin)
        db.commit()
        print("Admin user created successfully!")
        print("Email: thirumurugan24r@gmail.com")
        print("Password: ThiruMurugan@240320")
    except Exception as e:
        print(f"Error creating admin user: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    seed_admin()

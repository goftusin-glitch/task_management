# Deployment Guide - Task Management Application

Complete guide for deploying the Task Management application using Docker.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- 2GB RAM minimum
- 10GB disk space

## Quick Start

```bash
# Clone and navigate to project
cd task_management

# Start all services
docker-compose up -d

# Wait for containers to be healthy (about 30-60 seconds)
docker-compose ps

# Seed the admin user
docker-compose exec backend python seed.py

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

## Environment Configuration

### Option 1: Using .env file (Recommended)

Create a `.env` file in the project root:

```env
# Database
MYSQL_ROOT_PASSWORD=your_secure_root_password
MYSQL_DATABASE=goftustask
MYSQL_USER=taskuser
MYSQL_PASSWORD=your_secure_password

# Backend
SECRET_KEY=your-super-secret-key-min-32-characters
```

### Option 2: Inline Environment Variables

```bash
MYSQL_ROOT_PASSWORD=strongpassword SECRET_KEY=your-secret-key docker-compose up -d
```

---

## Database Migration

### Automatic Migration
Tables are automatically created when the backend starts via:
```python
Base.metadata.create_all(bind=engine)
```

### Manual Migration (if needed)
```bash
# Connect to running backend container
docker-compose exec backend bash

# Inside container, run Python
python -c "from database import engine, Base; from models import *; Base.metadata.create_all(bind=engine)"
```

### Check Database Tables
```bash
# Connect to MySQL
docker-compose exec db mysql -u root -p goftustask

# View tables
SHOW TABLES;
```

---

## Seeding Initial Data

### Create Admin User
```bash
docker-compose exec backend python seed.py
```

**Default Admin Credentials:**
- Email: `thirumurugan24r@gmail.com`
- Password: `ThiruMurugan@240320`

> ⚠️ **Important**: Change these credentials after first login!

---

## Service Management

```bash
# View logs
docker-compose logs -f              # All services
docker-compose logs -f backend      # Backend only

# Restart services
docker-compose restart backend

# Stop all services
docker-compose down

# Stop and remove volumes (⚠️ deletes data)
docker-compose down -v

# Rebuild after code changes
docker-compose build --no-cache
docker-compose up -d
```

---

## Production Deployment

### 1. Security Hardening

```env
# Use strong passwords (32+ characters)
SECRET_KEY=generate-with-openssl-rand-hex-32
MYSQL_ROOT_PASSWORD=strong-random-password
MYSQL_PASSWORD=another-strong-password
```

### 2. Update CORS in main.py

Modify `backend/main.py` to include your production domain:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://your-domain.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 3. SSL/HTTPS Setup

For production, add an SSL reverse proxy (Traefik or Nginx):

```yaml
# Add to docker-compose.yml
reverse-proxy:
  image: traefik:v2.10
  # ... configure SSL with Let's Encrypt
```

### 4. Backup Strategy

```bash
# Backup database
docker-compose exec db mysqldump -u root -p goftustask > backup.sql

# Restore database
docker-compose exec -T db mysql -u root -p goftustask < backup.sql
```

---

## Troubleshooting

### Container Won't Start
```bash
docker-compose logs db       # Check MySQL logs
docker-compose logs backend  # Check backend logs
```

### Database Connection Failed
```bash
# Verify db container is healthy
docker-compose ps

# Test connection from backend
docker-compose exec backend python -c "from database import engine; print(engine.connect())"
```

### Build Errors
```bash
# Clean rebuild
docker-compose down
docker system prune -f
docker-compose build --no-cache
docker-compose up -d
```

---

## Port Reference

| Service  | Internal Port | External Port | URL                     |
|----------|---------------|---------------|-------------------------|
| Frontend | 80            | 3000          | http://localhost:3000   |
| Backend  | 8000          | 8000          | http://localhost:8000   |
| MySQL    | 3306          | 3307          | localhost:3307          |

---

## File Structure

```
task_management/
├── docker-compose.yml      # Service orchestration
├── .env                    # Environment variables (create this)
├── backend/
│   ├── Dockerfile         # Backend container config
│   ├── main.py            # FastAPI app entry
│   └── seed.py            # Admin user seeding
└── frontend/
    ├── Dockerfile         # Frontend container config
    └── nginx.conf         # Nginx configuration
```

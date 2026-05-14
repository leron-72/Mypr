# Nomenclature Management System (Item Master Reference System)

A full-stack web application for managing product nomenclature, bills of materials (BOM), and item master data.

## Tech Stack

- **Backend:** Python 3.11, FastAPI, PostgreSQL 15 (pgvector), Redis, Celery, MinIO
- **Frontend:** React 18, TypeScript, Vite, TanStack Query, Tailwind CSS, shadcn/ui

## Part Number Format

`NNN.CC.SSSS`
- `NNN` — product type (000–129)
- `CC` — zone/department (01–30)
- `SSSS` — sequential number (0001–9999)

Example: `042.12.0001`

## Quick Start

### Prerequisites

- Docker and Docker Compose
- (Optional) Node.js 18+ and Python 3.11+ for local development

### 1. Clone and Configure

```bash
git clone <repo-url>
cd Mypr
cp .env.example .env
# Edit .env to set your secrets
```

### 2. Start All Services

```bash
docker-compose up -d
```

This starts:
- PostgreSQL 15 with pgvector on port 5432
- Redis on port 6379
- MinIO (S3-compatible storage) on ports 9000 / 9001
- FastAPI backend on port 8000
- Celery worker
- React frontend on port 3000

### 3. Access the Application

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/docs |
| MinIO Console | http://localhost:9001 |

### Default Admin Account

On first startup a default admin user is created automatically:

| Field | Value |
|---|---|
| Email | admin@system.local |
| Password | admin123 |

**Change this password immediately in production.**

## Local Development

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Copy and configure environment
cp ../.env.example .env

# Run database migrations
alembic upgrade head

# Start development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd frontend
npm install
cp ../.env.example .env
# Set VITE_API_URL=http://localhost:8000

npm run dev
```

## User Roles & Permissions

| Role | Products | BOM | Files | Admin |
|---|---|---|---|---|
| `viewer` | Read | Read | Read | — |
| `production` | Read | Read | Read | — |
| `engineer` | Read/Write | Read/Write | Read/Write | — |
| `accounting` | Read (cost) | Read | Read | — |
| `admin` | Full | Full | Full | Full |

## API Endpoints

### Auth
- `POST /api/auth/login` — obtain JWT token
- `POST /api/auth/register` — create user (admin only)
- `GET /api/auth/me` — current user info

### Products
- `GET /api/products` — list with pagination, search, filters
- `POST /api/products` — create product
- `GET /api/products/{id}` — product detail
- `PUT /api/products/{id}` — update product
- `DELETE /api/products/{id}` — soft delete
- `GET /api/products/{id}/history` — change log

### Product Groups
- `GET /api/groups` — list groups
- `GET /api/groups/tree` — full recursive tree
- `POST /api/groups` — create group
- `PUT /api/groups/{id}` — update group
- `DELETE /api/groups/{id}` — soft delete

### Bill of Materials
- `GET /api/products/{id}/bom` — full BOM tree
- `POST /api/products/{id}/bom/items` — add BOM item
- `PUT /api/bom/{item_id}` — update BOM item
- `DELETE /api/bom/{item_id}` — remove BOM item

### Versions
- `GET /api/products/{id}/versions` — version history
- `POST /api/products/{id}/versions` — create new version

### Files
- `POST /api/products/{id}/files` — upload file
- `GET /api/products/{id}/files` — list files
- `DELETE /api/files/{file_id}` — delete file

### Search & Export
- `GET /api/search?q=...` — full-text search
- `GET /api/export/products/csv` — export all products to CSV
- `GET /api/products/{id}/bom/export/excel` — export BOM to Excel

### Notifications
- `GET /api/notifications` — list notifications
- `PUT /api/notifications/{id}/read` — mark as read

## Database Migrations

```bash
# Create a new migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback one step
alembic downgrade -1
```

## Environment Variables

See `.env.example` for a full list with descriptions.

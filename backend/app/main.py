from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import AsyncSessionLocal
from app.api import auth, products, groups, bom, versions, files, search, export, notifications, admin


async def seed_admin():
    """Create default admin user if no users exist."""
    from sqlalchemy import select, func
    from app.models.user import User, UserRole
    from app.core.security import hash_password

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(func.count()).select_from(User))
        count = result.scalar_one()
        if count == 0:
            admin_user = User(
                email=settings.DEFAULT_ADMIN_EMAIL,
                username=settings.DEFAULT_ADMIN_USERNAME,
                hashed_password=hash_password(settings.DEFAULT_ADMIN_PASSWORD),
                role=UserRole.admin,
                is_active=True,
            )
            db.add(admin_user)
            await db.commit()
            print(
                f"[startup] Default admin created: {settings.DEFAULT_ADMIN_EMAIL} / {settings.DEFAULT_ADMIN_PASSWORD}"
            )


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    try:
        await seed_admin()
    except Exception as e:
        print(f"[startup] Could not seed admin: {e}")
    yield
    # Shutdown (nothing to clean up)


app = FastAPI(
    title=settings.APP_TITLE,
    version=settings.APP_VERSION,
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if settings.BACKEND_CORS_ORIGINS == "*" else settings.BACKEND_CORS_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router)
app.include_router(products.router)
app.include_router(groups.router)
app.include_router(bom.router)
app.include_router(versions.router)
app.include_router(files.router)
app.include_router(search.router)
app.include_router(export.router)
app.include_router(notifications.router)
app.include_router(admin.router)


@app.get("/health")
async def health_check():
    return {"status": "ok", "version": settings.APP_VERSION}

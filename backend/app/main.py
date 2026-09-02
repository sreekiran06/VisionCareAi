from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from .core.config import settings
from .db.session import engine, SessionLocal
from .models.base import Base
from .models.user import User
from .models.hospital import Hospital
from .models.camera import Camera
from .models.alert import Alert
from .models.audit_log import AuditLog
from .core.security import get_password_hash

# Import existing routers
from .api.routes import auth, patient, gesture_mappings, calibration, detections, websocket

# Import new admin routers
from .api.routes import (
    admin_hospitals,
    admin_users,
    admin_cameras,
    admin_patients,
    admin_alerts,
    admin_analytics,
    admin_stats,
    admin_audit,
    admin_notifications,
    admin_websocket,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def _init_db():
    """Create tables and seed default accounts if DB is empty."""
    logger.info("Initializing database tables...")
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables initialized successfully.")
    except Exception as e:
        logger.error(f"Failed to initialize database tables: {e}")

    db = SessionLocal()
    try:
        if db.query(User).count() == 0:
            # Default nurse
            default_nurse = User(
                email="nurse@visioncare.com",
                name="Default Nurse",
                hashed_password=get_password_hash("password123"),
                role="nurse",
                ward_id="ICU-1",
            )
            # Default super admin
            default_admin = User(
                email="admin@visioncare.com",
                name="Super Admin",
                hashed_password=get_password_hash("admin123"),
                role="super_admin",
                ward_id="ADMIN",
            )
            db.add(default_nurse)
            db.add(default_admin)
            db.commit()
            logger.info("Seeded nurse@visioncare.com / password123")
            logger.info("Seeded admin@visioncare.com / admin123")
    except Exception as e:
        logger.error(f"Error seeding database: {e}")
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    _init_db()
    yield


app = FastAPI(
    title="VisionCare AI Backend",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Existing routes ───────────────────────────────────────────────────────────
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(patient.router, prefix="/api/patients", tags=["patients"])
app.include_router(gesture_mappings.router, prefix="/api/gesture-mappings", tags=["gesture-mappings"])
app.include_router(calibration.router, prefix="/api/calibration", tags=["calibration"])
app.include_router(detections.router, prefix="/api/detections", tags=["detections"])
app.include_router(websocket.router, tags=["websockets"])

# ── Admin routes ──────────────────────────────────────────────────────────────
app.include_router(admin_hospitals.router,     prefix="/api/admin/hospitals",     tags=["admin-hospitals"])
app.include_router(admin_users.router,         prefix="/api/admin/users",         tags=["admin-users"])
app.include_router(admin_cameras.router,       prefix="/api/admin/cameras",       tags=["admin-cameras"])
app.include_router(admin_patients.router,      prefix="/api/admin/patients",      tags=["admin-patients"])
app.include_router(admin_alerts.router,        prefix="/api/admin/alerts",        tags=["admin-alerts"])
app.include_router(admin_analytics.router,     prefix="/api/admin/analytics",     tags=["admin-analytics"])
app.include_router(admin_stats.router,         prefix="/api/admin/stats",         tags=["admin-stats"])
app.include_router(admin_audit.router,         prefix="/api/admin/audit-logs",    tags=["admin-audit"])
app.include_router(admin_notifications.router, prefix="/api/admin/notifications", tags=["admin-notifications"])
app.include_router(admin_websocket.router,     tags=["admin-websockets"])


@app.get("/health", tags=["health"])
def health_check():
    return {"status": "healthy"}


from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import (
    auth,
    departments,
    asset_categories,
    employees,
    assets,
    allocations,
    transfer_requests,
    bookings,
    maintenance,
    dashboard,
    activity_log,
)

app = FastAPI(
    title="AssetFlow API",
    description=(
        "Backend API for the AssetFlow Asset Management ERP.\n\n"
        "Roles: `Employee` | `DepartmentHead` | `AssetManager` | `Admin`\n\n"
        "Authenticate via **POST /auth/login** and pass the token as `Bearer <token>` in the `Authorization` header."
    ),
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ─── CORS ────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routers ─────────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(departments.router)
app.include_router(asset_categories.router)
app.include_router(employees.router)
app.include_router(assets.router)
app.include_router(allocations.router)
app.include_router(transfer_requests.router)
app.include_router(bookings.router)
app.include_router(maintenance.router)
app.include_router(dashboard.router)
app.include_router(activity_log.router)


# ─── Health ──────────────────────────────────────────────────────────────────
@app.get("/", tags=["Health"])
def read_root():
    return {"message": "Welcome to AssetFlow API", "status": "healthy", "version": "2.0.0"}

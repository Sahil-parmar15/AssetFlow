# AssertFlow — Asset Management ERP Backend

AssertFlow is the backend REST API for a modern Asset Management ERP. It is built using **FastAPI** and integrated with **Supabase Postgres**. It provides secure role-based access control, asset lifecycle tracking, resource scheduling, transfer approvals, maintenance logs, and a full system audit trail.

---

## 📖 Essential Documentation

To make collaboration easy for both frontend and backend developers, we have prepared dedicated guides:

*   🌐 **For Frontend Developers:** Read the [Frontend Integration Guide](file:///D:/Odoo/assertflow/FRONTEND_INTEGRATION_GUIDE.md) for clear instructions on JWT authentication flow, token storage, role-based page routing, API conflict handlers (409 error schemas), and complete **TypeScript interfaces** for all models.
*   ⚙️ **For Backend Developers:** Read the [Backend Operations Manual](file:///D:/Odoo/assertflow/BACKEND_OPERATIONS_MANUAL.md) for an in-depth breakdown of the directory layout, setup steps, environment configuration, database schema details, and step-by-step instructions on **how to extend the codebase** (adding new tables/routes).
*   📋 **Full API Specification:** Read [API_DOCS.md](file:///D:/Odoo/assertflow/API_DOCS.md) for a raw endpoint-by-endpoint reference of headers, bodies, parameters, and database DDL scripts.

---

## 🚀 Key Features

*   **FastAPI & Pydantic:** Auto-validating endpoints with automatic interactive documentation (Swagger & ReDoc).
*   **Role-Based Access Control (RBAC):** Supports 4 hierarchical roles: `Employee` ➔ `DepartmentHead` ➔ `AssetManager` ➔ `Admin`.
*   **Supabase Integration:** Realtime, secure remote Postgres instance connectivity.
*   **Lifecycle Management:** Handles full asset transition states: `Available`, `Allocated`, `Reserved`, `UnderMaintenance`, `Lost`, `Retired`, and `Disposed`.
*   **Booking Overlap Guard:** A timezone-aware overlap checking mechanism that prevents double-booking shared assets.
*   **Activity Audit Trail:** Automatically logs critical operations (allocations, returns, maintenance, schedules) to an immutable table for administrator oversight.

---

## 🛠️ Installation & Setup (Quick Start)

For a detailed walkthrough, refer to the [Backend Operations Manual](file:///D:/Odoo/assertflow/BACKEND_OPERATIONS_MANUAL.md).

### 1. Setup Environment
```bash
# Create and activate virtual environment
python -m venv venv
# Windows:
.\venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install package requirements
pip install -r requirements.txt
```

### 2. Configure Environment Variables
Create a `.env` file in the root folder:
```ini
SUPABASE_URL=https://your-supabase-project.supabase.co
SUPABASE_SECRET_KEY=your-supabase-service-role-key
JWT_SECRET_KEY=generate-a-secure-secret-key-for-local-dev
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

### 3. Bootstrap Admin User
Create your first backend administrator account:
```bash
python scripts/create_admin.py
```

### 4. Run the Dev Server
```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
*   **Swagger Docs:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
*   **ReDoc Docs:** [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)
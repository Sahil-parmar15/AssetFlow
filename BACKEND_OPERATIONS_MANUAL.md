# AssertFlow — Backend Operations & Architecture Manual

This document provides a comprehensive operational guide for the AssertFlow backend architecture. It explains how the system is structured, how to install and run it locally, how it communicates with Supabase, and how to extend it with new features.

---

## 🏗️ 1. Architecture & Tech Stack

AssertFlow is a REST API designed around **FastAPI** for route handling and data validation, combined with **Supabase** as the database backend.

*   **FastAPI:** Asynchronous Python web framework that handles requests, routing, middleware (CORS), and security. It utilizes **Pydantic v2** for strict request/response data validation.
*   **Supabase Python Client:** Acts as the communication layer with the PostgreSQL database hosted on Supabase. It allows direct query builder capabilities, bypassing heavy ORM setups.
*   **JSON Web Tokens (JWT):** Handled via `python-jose` to sign and decode user session tokens securely.
*   **Password Hashing:** Handled via `passlib[bcrypt]` to hash and verify user passwords.

---

## 📁 2. File & Directory Structure Walkthrough

Here is a breakdown of the backend files and their specific responsibilities:

*   [app/main.py](file:///D:/Odoo/assertflow/app/main.py): The entry point of the application. It initializes the FastAPI app, configures global CORS middleware, and includes all sub-routers.
*   [app/config.py](file:///D:/Odoo/assertflow/app/config.py): Validates and loads environment variables from the `.env` file (JWT key, expiration time, Supabase connection details).
*   [app/database.py](file:///D:/Odoo/assertflow/app/database.py): Instantiates the Supabase client and provides the `get_db` dependency to inject the database client into endpoints.
*   [app/dependencies.py](file:///D:/Odoo/assertflow/app/dependencies.py): Houses security guards and Role-Based Access Control (RBAC) helpers (e.g. `require_admin`, `require_asset_manager_or_admin`).
*   [app/routers/](file:///D:/Odoo/assertflow/app/routers): Modular controllers grouping endpoint definitions by domain context:
    *   [auth.py](file:///D:/Odoo/assertflow/app/routers/auth.py): Handles signup, login, and `/me` profiles.
    *   [assets.py](file:///D:/Odoo/assertflow/app/routers/assets.py): Handles asset registration, detail retrieval, and search filters.
    *   [allocations.py](file:///D:/Odoo/assertflow/app/routers/allocations.py): Allocating assets to employees/departments and returns.
    *   [bookings.py](file:///D:/Odoo/assertflow/app/routers/bookings.py): Handles booking requests and overlaps for shared assets.
    *   [maintenance.py](file:///D:/Odoo/assertflow/app/routers/maintenance.py): Tracks maintenance requests, technician assignment, and repairs.
    *   [departments.py](file:///D:/Odoo/assertflow/app/routers/departments.py) & [asset_categories.py](file:///D:/Odoo/assertflow/app/routers/asset_categories.py): Departmental structures and product groups.
    *   [employees.py](file:///D:/Odoo/assertflow/app/routers/employees.py): User query endpoints and role modifications.
    *   [dashboard.py](file:///D:/Odoo/assertflow/app/routers/dashboard.py): Aggregate statistics for charts and dashboard grids.
    *   [activity_log.py](file:///D:/Odoo/assertflow/app/routers/activity_log.py): View historical audit trails.
*   [app/schemas/](file:///D:/Odoo/assertflow/app/schemas): Contains Pydantic models enforcing serialization rules for incoming request JSONs and outgoing response JSONs.
*   [app/utils/](file:///D:/Odoo/assertflow/app/utils): Common helper functions:
    *   [auth.py](file:///D:/Odoo/assertflow/app/utils/auth.py): JWT token signature/decoding and bcrypt hashing algorithms.
    *   [helpers.py](file:///D:/Odoo/assertflow/app/utils/helpers.py): Sequential asset tag generator, activity logger, and runtime booking status calculators.
*   [scripts/create_admin.py](file:///D:/Odoo/assertflow/scripts/create_admin.py): Bootstrap utility to insert the first administrative user bypass-signing up.

---

## 🛠️ 3. Setup and Running Locally

### Prerequisites
*   Python 3.10 or higher.
*   An active Supabase project with tables configured (see SQL schema at the bottom of [API_DOCS.md](file:///D:/Odoo/assertflow/API_DOCS.md)).

### Step 1: Install Dependencies
Open your terminal at the project root folder and execute:
```bash
# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# Windows (cmd):
.\venv\Scripts\activate
# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# macOS/Linux:
source venv/bin/activate

# Install requirements
pip install -r requirements.txt
```

### Step 2: Configure Environment Variables
Create a file named `.env` in the project root containing the following settings:
```ini
SUPABASE_URL=https://your-supabase-project.supabase.co
SUPABASE_SECRET_KEY=your-supabase-service-role-key
JWT_SECRET_KEY=generate-a-secure-random-secret-key-string
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
```
> [!IMPORTANT]
> The `SUPABASE_SECRET_KEY` must be your project's **service_role** secret (found in Supabase under Project Settings ➔ API). The *anon* key will not work because the backend needs to bypass Row Level Security (RLS) to manage cross-user transactions and generate internal logs.

### Step 3: Bootstrap the Admin Account
Since the `POST /auth/signup` endpoint strictly restricts new accounts to the `Employee` role, run this script to create your first `Admin` profile directly in the database:
```bash
python scripts/create_admin.py
```
Follow the interactive prompts to set up the Name, Email, and Password.

### Step 4: Run the Development Server
Start the API server with auto-reload enabled:
```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
You can now access the interactive documentation at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs) to verify everything is working.

---

## 🏗️ 4. Developer Guide: How to Extend & Update

When extending the backend (for example, adding a new `Vendor` resource), follow these five steps to maintain architecture integrity:

### Step 1: Create the Supabase DB Table
Add your table in the Supabase SQL editor:
```sql
CREATE TABLE vendors (
  id          BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  name        TEXT NOT NULL,
  contact_info TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

### Step 2: Define Pydantic Schemas
Create a new schema file `app/schemas/vendor.py` specifying the input verification and output formats:
```python
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class VendorBase(BaseModel):
    name: str
    contact_info: Optional[str] = None

class VendorCreate(VendorBase):
    pass

class VendorResponse(VendorBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
```

### Step 3: Create the Router
Create `app/routers/vendors.py` with standard CRUD handlers:
```python
from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client
from typing import List

from app.database import get_db
from app.dependencies import require_asset_manager_or_admin
from app.schemas.vendor import VendorCreate, VendorResponse

router = APIRouter(prefix="/vendors", tags=["Vendors"])

@router.post("", response_model=VendorResponse, status_code=status.HTTP_201_CREATED)
def create_vendor(
    vendor: VendorCreate,
    db: Client = Depends(get_db),
    current_user: dict = Depends(require_asset_manager_or_admin)
):
    resp = db.table("vendors").insert(vendor.model_dump()).execute()
    if not resp.data:
        raise HTTPException(status_code=400, detail="Failed to create vendor")
    return resp.data[0]

@router.get("", response_model=List[VendorResponse])
def list_vendors(db: Client = Depends(get_db)):
    resp = db.table("vendors").select("*").execute()
    return resp.data
```

### Step 4: Register in main.py
Open [app/main.py](file:///D:/Odoo/assertflow/app/main.py), import the router, and register it:
```python
# Import
from app.routers import vendors

# Include
app.include_router(vendors.router)
```

### Step 5: Update Documentation & Metadata
*   If you added any endpoints, document them in [API_DOCS.md](file:///D:/Odoo/assertflow/API_DOCS.md) and update [FRONTEND_INTEGRATION_GUIDE.md](file:///D:/Odoo/assertflow/FRONTEND_INTEGRATION_GUIDE.md) if the frontend needs new TypeScript interfaces or integration helpers.
*   If you install new packages (e.g. `requests`), save them to the lockfile by updating `requirements.txt`:
    ```bash
    pip freeze > requirements.txt
    ```

---

## 🧪 5. Testing & Verification

1.  **Swagger UI validation:** After starting the server, go to `http://127.0.0.1:8000/docs`. Make sure all route descriptions look correct and that Swagger executes successfully.
2.  **Lint Check:** Ensure code is well-formatted before submitting a pull request. We recommend using `black` or `flake8` for standard PEP-8 style checks.

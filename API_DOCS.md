# AssetFlow API — Frontend Developer Documentation

> **Base URL (dev):** `http://127.0.0.1:8000`
> **Interactive Docs:** `http://127.0.0.1:8000/docs` (Swagger UI)
> **Alt Docs:** `http://127.0.0.1:8000/redoc`

---

## Table of Contents
1. [Authentication](#1-authentication)
2. [Role Matrix](#2-role-matrix)
3. [Error Shapes](#3-error-shapes)
4. [Departments](#4-departments)
5. [Asset Categories](#5-asset-categories)
6. [Employees](#6-employees)
7. [Assets](#7-assets)
8. [Allocations](#8-allocations)
9. [Transfer Requests](#9-transfer-requests)
10. [Bookings](#10-bookings)
11. [Maintenance Requests](#11-maintenance-requests)
12. [Dashboard KPIs](#12-dashboard-kpis)
13. [Activity Log](#13-activity-log)
14. [Database Schema (Supabase SQL)](#14-database-schema-supabase-sql)

---

## 1. Authentication

All protected endpoints require the header:
```
Authorization: Bearer <access_token>
```

### POST `/auth/signup`
Register a new employee (default role: `Employee`).

**Request body:**
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "password": "securepass123",
  "department_id": 1
}
```

**Response `201`:**
```json
{
  "id": 1, "name": "Jane Smith", "email": "jane@example.com",
  "department_id": 1, "role": "Employee", "status": "active"
}
```

### POST `/auth/login`
Authenticate and receive a JWT token.

**Request body:**
```json
{ "email": "jane@example.com", "password": "securepass123" }
```

**Response `200`:**
```json
{
  "access_token": "eyJhbGci...",
  "token_type": "bearer",
  "user": { "id": 1, "name": "Jane Smith", "email": "jane@example.com", "role": "Employee", "status": "active" }
}
```

Store `access_token` and attach as `Authorization: Bearer <token>` on every request.

### GET `/auth/me`
Return the current user's profile (requires token).

---

## 2. Role Matrix

| Role | Permissions |
|---|---|
| `Employee` | View assets, raise maintenance requests, create bookings |
| `DepartmentHead` | All Employee + approve transfer requests |
| `AssetManager` | All Employee + register assets, allocate, manage maintenance & bookings |
| `Admin` | Full access including departments, categories, employee promotion, activity log |

---

## 3. Error Shapes

Standard error:
```json
{ "detail": "Human readable message" }
```

**409 Conflict — Allocation already active:**
```json
{
  "detail": {
    "message": "Asset is already allocated",
    "current_holder": "Jane Smith",
    "allocation_id": 42
  }
}
```

**409 Conflict — Booking overlap:**
```json
{
  "detail": {
    "message": "Booking overlaps with an existing booking",
    "conflicting_booking_id": 7,
    "conflicting_start": "2024-01-15T09:00:00+00:00",
    "conflicting_end": "2024-01-15T10:00:00+00:00"
  }
}
```

---

## 4. Departments
> Admin only

| Method | Path | Description |
|---|---|---|
| `POST` | `/departments` | Create department |
| `PATCH` | `/departments/{id}` | Edit fields |
| `POST` | `/departments/{id}/deactivate` | Deactivate |

**Body:** `{ "name": "Engineering", "parent_department_id": null, "head_id": 5 }`

**Response:** `{ "id": 1, "name": "Engineering", "parent_department_id": null, "head_id": 5, "status": "active" }`

---

## 5. Asset Categories
> Admin only

| Method | Path | Description |
|---|---|---|
| `POST` | `/asset-categories` | Create |
| `GET` | `/asset-categories` | List all |
| `GET` | `/asset-categories/{id}` | Get one |
| `PATCH` | `/asset-categories/{id}` | Update |
| `DELETE` | `/asset-categories/{id}` | Delete |

**Body:** `{ "name": "Laptops", "custom_fields": { "warranty_period": "2 years" } }`

---

## 6. Employees

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/employees` | All | List employees |
| `PATCH` | `/employees/{id}/role` | Admin | Promote role |

**GET query params:** `department_id` (int), `status` (`"active"` / `"inactive"`)

**PATCH body:** `{ "role": "DepartmentHead" }` — Valid: `"DepartmentHead"`, `"AssetManager"`

---

## 7. Assets

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/assets` | AssetManager/Admin | Register asset |
| `GET` | `/assets` | All | Search/filter |
| `GET` | `/assets/{id}` | All | Detail + history |
| `GET` | `/assets/{id}/maintenance-history` | All | Maintenance history |

**POST body:**
```json
{
  "name": "Dell XPS 15", "category_id": 1, "serial_number": "SN-ABC123",
  "acquisition_date": "2024-01-15", "acquisition_cost": 89999.00,
  "condition": "New", "location": "Floor 3 - IT Room",
  "is_shared_bookable": false, "photo_url": null
}
```

`asset_tag` is **auto-generated** (`AF-0001`, `AF-0002` …).

**GET query params:** `asset_tag`, `serial_number`, `category_id`, `status`, `location` (all optional, partial-match strings)

**Asset statuses:** `Available` | `Allocated` | `Reserved` | `UnderMaintenance` | `Lost` | `Retired` | `Disposed`

---

## 8. Allocations

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/assets/{id}/allocate` | AssetManager/Admin | Allocate |
| `POST` | `/allocations/{id}/return` | AssetManager/Admin | Return |
| `GET` | `/allocations/overdue` | AssetManager/Admin | Overdue list |

**Allocate body:** `{ "employee_id": 3, "department_id": null, "expected_return_date": "2024-06-30" }`

> Returns **409** if asset is already allocated — body contains `current_holder` name.

**Return body:** `{ "condition_notes": "Minor scratches on lid" }`

---

## 9. Transfer Requests

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/assets/{id}/transfer-request` | All | Request transfer |
| `POST` | `/transfer-requests/{id}/approve` | AssetManager/DeptHead | Approve |

**Body:** `{ "requested_to": 5 }`

On approve: old allocation closed → new allocation created for `requested_to` → asset stays `Allocated`.

---

## 10. Bookings

> Asset must have `is_shared_bookable: true`

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/bookings` | All | Create booking |
| `GET` | `/bookings` | All | List (for calendar) |
| `POST` | `/bookings/{id}/cancel` | Booker/AssetManager/Admin | Cancel |

**Create body:**
```json
{
  "asset_id": 2,
  "start_time": "2024-01-15T09:00:00Z",
  "end_time": "2024-01-15T10:00:00Z"
}
```

**Overlap rule:** Reject if `existing.start < new.end AND existing.end > new.start`

| Existing | New Request | Result |
|---|---|---|
| 09:00–10:00 | 09:30–10:30 | ❌ 409 |
| 09:00–10:00 | 10:00–11:00 | ✅ 201 |

**Booking status (computed on read, no cron):**
- `now < start` → `Upcoming`
- `start ≤ now < end` → `Ongoing`
- `now ≥ end` → `Completed`
- Manually set → `Cancelled`

**GET query params:** `asset_id` (int, optional)

---

## 11. Maintenance Requests

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/maintenance-requests` | All | Raise request |
| `POST` | `/maintenance-requests/{id}/approve` | AssetManager/Admin | Approve → asset `UnderMaintenance` |
| `POST` | `/maintenance-requests/{id}/reject` | AssetManager/Admin | Reject with reason |
| `PATCH` | `/maintenance-requests/{id}/assign-technician` | AssetManager/Admin | Assign technician |
| `POST` | `/maintenance-requests/{id}/resolve` | AssetManager/Admin | Resolve → asset `Available` |

**Status flow:** `Pending → Approved → TechnicianAssigned → InProgress → Resolved` or `Rejected`

**Create body:**
```json
{
  "asset_id": 1,
  "issue_description": "Screen flickering intermittently",
  "priority": "High",
  "photo_url": null
}
```
`priority`: `"Low"` | `"Medium"` | `"High"`

**Reject body:** `{ "rejection_reason": "Asset past warranty" }`

**Assign Technician body:** `{ "technician_name": "Rahul Sharma" }`

---

## 12. Dashboard KPIs

### GET `/dashboard/kpis`
> Any authenticated user

```json
{
  "assets_available": 42,
  "assets_allocated": 18,
  "maintenance_today": 3,
  "active_bookings": 7,
  "pending_transfers": 2,
  "upcoming_returns": 5,
  "overdue_returns": 1
}
```

---

## 13. Activity Log

### GET `/activity-log`
> Admin only · Paginated · Most recent first

**Query params:** `user_id` (int), `page` (default 1), `page_size` (default 20, max 100)

```json
[{
  "id": 99, "user_id": 1,
  "action": "Asset Allocated",
  "details": "Asset ID 3 (AF-0003) allocated. Allocation ID: 12",
  "created_at": "2024-01-15T09:15:00+00:00"
}]
```

---

## 14. Database Schema (Supabase SQL)

```sql
CREATE TABLE asset_categories (
  id            BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  name          TEXT NOT NULL,
  custom_fields JSONB DEFAULT NULL
);

CREATE TABLE assets (
  id                 BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  name               TEXT NOT NULL,
  asset_tag          TEXT NOT NULL UNIQUE,
  category_id        BIGINT REFERENCES asset_categories(id),
  serial_number      TEXT,
  acquisition_date   DATE,
  acquisition_cost   NUMERIC,
  condition          TEXT,
  location           TEXT,
  is_shared_bookable BOOLEAN DEFAULT FALSE,
  status             TEXT NOT NULL DEFAULT 'Available',
  photo_url          TEXT
);

CREATE TABLE allocations (
  id                   BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  asset_id             BIGINT REFERENCES assets(id) NOT NULL,
  employee_id          BIGINT REFERENCES users(id),
  department_id        BIGINT REFERENCES departments(id),
  allocated_at         TIMESTAMPTZ NOT NULL,
  expected_return_date DATE,
  returned_at          TIMESTAMPTZ,
  condition_notes      TEXT,
  status               TEXT NOT NULL DEFAULT 'Active'
);

CREATE TABLE transfer_requests (
  id           BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  asset_id     BIGINT REFERENCES assets(id) NOT NULL,
  requested_by BIGINT REFERENCES users(id) NOT NULL,
  requested_to BIGINT REFERENCES users(id) NOT NULL,
  status       TEXT NOT NULL DEFAULT 'Requested',
  created_at   TIMESTAMPTZ NOT NULL
);

CREATE TABLE bookings (
  id         BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  asset_id   BIGINT REFERENCES assets(id) NOT NULL,
  booked_by  BIGINT REFERENCES users(id) NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time   TIMESTAMPTZ NOT NULL,
  status     TEXT NOT NULL DEFAULT 'Upcoming'
);

CREATE TABLE maintenance_requests (
  id                BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  asset_id          BIGINT REFERENCES assets(id) NOT NULL,
  raised_by         BIGINT REFERENCES users(id) NOT NULL,
  issue_description TEXT NOT NULL,
  priority          TEXT NOT NULL,
  photo_url         TEXT,
  status            TEXT NOT NULL DEFAULT 'Pending',
  technician_name   TEXT,
  rejection_reason  TEXT,
  created_at        TIMESTAMPTZ NOT NULL,
  resolved_at       TIMESTAMPTZ
);

CREATE TABLE activity_logs (
  id         BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  user_id    BIGINT REFERENCES users(id) NOT NULL,
  action     TEXT NOT NULL,
  details    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL
);
```

---

## Running the Server

```bash
# Development (with auto-reload)
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

# Production
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

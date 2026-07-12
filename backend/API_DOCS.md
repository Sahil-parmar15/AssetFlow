# AssertFlow API — Frontend Developer Documentation

> **Base URL (dev):** `http://127.0.0.1:8000`
> **Interactive Docs (Swagger UI):** `http://127.0.0.1:8000/docs`
> **ReDoc:** `http://127.0.0.1:8000/redoc`
> **API Version:** `2.0.0`

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [Role Matrix](#2-role-matrix)
3. [Global Error Shapes](#3-global-error-shapes)
4. [Health Check](#4-health-check)
5. [Departments](#5-departments)
6. [Asset Categories](#6-asset-categories)
7. [Employees](#7-employees)
8. [Assets](#8-assets)
9. [Allocations](#9-allocations)
10. [Transfer Requests](#10-transfer-requests)
11. [Bookings](#11-bookings)
12. [Maintenance Requests](#12-maintenance-requests)
13. [Dashboard KPIs](#13-dashboard-kpis)
14. [Activity Log](#14-activity-log)
15. [Data Models Reference](#15-data-models-reference)
16. [Database Schema (Supabase SQL)](#16-database-schema-supabase-sql)

---

## 1. Authentication

### How it works

All protected endpoints require a **JWT Bearer token** in the `Authorization` header:

```http
Authorization: Bearer <access_token>
```

The token is obtained from `POST /auth/login`. It expires after **60 minutes** by default.

---

### `POST /auth/signup`

Register a new user account. **Role is always set to `Employee` on signup.** Use the Admin panel to promote roles later.

**No authentication required.**

**Request Body:**
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "password": "securepass123",
  "department_id": 1
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | `string` | ✅ | 2–100 characters |
| `email` | `string (email)` | ✅ | Must be unique |
| `password` | `string` | ✅ | Min 6 characters |
| `department_id` | `integer` | ❌ | Must be a valid dept ID if provided |

**Response `201 Created`:**
```json
{
  "id": 1,
  "name": "Jane Smith",
  "email": "jane@example.com",
  "department_id": 1,
  "role": "Employee",
  "status": "active"
}
```

**Errors:**
| Code | Reason |
|---|---|
| `400` | Email already exists |
| `400` | `department_id` does not exist |
| `500` | Internal insert failure |

---

### `POST /auth/login`

Authenticate and receive a JWT access token.

**No authentication required.**

**Request Body:**
```json
{
  "email": "jane@example.com",
  "password": "securepass123"
}
```

**Response `200 OK`:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "name": "Jane Smith",
    "email": "jane@example.com",
    "department_id": 1,
    "role": "Employee",
    "status": "active"
  }
}
```

> **Frontend tip:** Store `access_token` in memory or `sessionStorage`. On every subsequent API call attach it as `Authorization: Bearer <access_token>`.

**Errors:**
| Code | Reason |
|---|---|
| `401` | Incorrect email or password |
| `403` | Account is deactivated |

---

### `GET /auth/me`

Returns the currently authenticated user's profile. Use this to hydrate the user context on app load.

**Requires:** Any valid token.

**Response `200 OK`:**
```json
{
  "id": 1,
  "name": "Jane Smith",
  "email": "jane@example.com",
  "department_id": 1,
  "role": "Employee",
  "status": "active"
}
```

**Errors:**
| Code | Reason |
|---|---|
| `401` | Missing or invalid token |
| `403` | Account is inactive |

---

## 2. Role Matrix

| Role | Who | Permissions |
|---|---|---|
| `Employee` | All registered users | View assets & employees, raise maintenance requests, create bookings, create transfer requests |
| `DepartmentHead` | Head of a department | All `Employee` permissions + approve transfer requests |
| `AssetManager` | Asset management staff | All `Employee` permissions + register/manage assets, approve/reject/resolve maintenance, manage allocations, manage bookings |
| `Admin` | Super users (bootstrap via script) | Full access — all of the above + manage departments, categories, promote roles, view activity log |

> The `Admin` role cannot be assigned via the API. It must be created using the bootstrap script (`scripts/create_admin.py`).

---

## 3. Global Error Shapes

All API errors follow the same structure:

**Standard error (most cases):**
```json
{
  "detail": "Human readable message"
}
```

**Structured 409 Conflict — Asset already allocated:**
```json
{
  "detail": {
    "message": "Asset is already allocated",
    "current_holder": "Jane Smith",
    "allocation_id": 42
  }
}
```

**Structured 409 Conflict — Booking time overlap:**
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

**Common HTTP status codes:**
| Code | Meaning |
|---|---|
| `200` | Success (GET, PATCH, POST actions) |
| `201` | Created (resource creation) |
| `400` | Bad request / validation error |
| `401` | Not authenticated |
| `403` | Authenticated but not authorized |
| `404` | Resource not found |
| `409` | Conflict (already allocated / overlapping booking) |
| `500` | Internal server error |

---

## 4. Health Check

### `GET /`

Check if the server is running. No authentication required.

**Response `200 OK`:**
```json
{
  "message": "Welcome to AssetFlow API",
  "status": "healthy",
  "version": "2.0.0"
}
```

---

## 5. Departments

> **Required role:** `Admin`

### `POST /departments`

Create a new department.

**Request Body:**
```json
{
  "name": "Engineering",
  "parent_department_id": null,
  "head_id": 5
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | `string` | ✅ | 2–100 characters |
| `parent_department_id` | `integer` | ❌ | Must be a valid department ID if provided |
| `head_id` | `integer` | ❌ | Must be a valid user ID if provided |

**Response `201 Created`:**
```json
{
  "id": 1,
  "name": "Engineering",
  "parent_department_id": null,
  "head_id": 5,
  "status": "active"
}
```

---

### `PATCH /departments/{id}`

Update one or more fields of an existing department. Only provided fields are updated.

**Path param:** `id` — Department ID

**Request Body (all fields optional):**
```json
{
  "name": "Software Engineering",
  "head_id": 7,
  "status": "active"
}
```

**Response `200 OK`:** Updated `DepartmentResponse` object.

---

### `POST /departments/{id}/deactivate`

Soft-deactivate a department (sets `status` to `inactive`).

**Path param:** `id` — Department ID

**No request body required.**

**Response `200 OK`:** Updated `DepartmentResponse` with `"status": "inactive"`.

---

## 6. Asset Categories

> **Required role:** `Admin`

### `POST /asset-categories`

Create a new asset category.

**Request Body:**
```json
{
  "name": "Laptops",
  "custom_fields": {
    "warranty_period": "2 years",
    "brand": ""
  }
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | `string` | ✅ | |
| `custom_fields` | `object` | ❌ | Free-form JSON for extra metadata |

**Response `201 Created`:**
```json
{
  "id": 1,
  "name": "Laptops",
  "custom_fields": { "warranty_period": "2 years", "brand": "" }
}
```

---

### `GET /asset-categories`

List all asset categories.

**Response `200 OK`:** Array of category objects.

---

### `GET /asset-categories/{id}`

Get a single category by ID.

**Response `200 OK`:** Single category object.

**Errors:** `404` if not found.

---

### `PATCH /asset-categories/{id}`

Update a category.

**Request Body (all optional):**
```json
{
  "name": "Notebooks",
  "custom_fields": { "warranty_period": "3 years" }
}
```

**Response `200 OK`:** Updated category object.

---

### `DELETE /asset-categories/{id}`

Delete a category.

**Response `200 OK`** or `204 No Content`.

---

## 7. Employees

### `GET /employees`

List all employees. Supports optional filters.

**Required role:** Any authenticated user.

**Query Parameters (all optional):**
| Param | Type | Example | Description |
|---|---|---|---|
| `department_id` | `integer` | `?department_id=2` | Filter by department |
| `status` | `string` | `?status=active` | `"active"` or `"inactive"` |

**Example request:**
```
GET /employees?department_id=2&status=active
```

**Response `200 OK`:**
```json
[
  {
    "id": 1,
    "name": "Jane Smith",
    "email": "jane@example.com",
    "department_id": 2,
    "role": "Employee",
    "status": "active"
  }
]
```

---

### `PATCH /employees/{id}/role`

Promote an employee's role. **Admin only.**

**Path param:** `id` — Employee (user) ID

**Request Body:**
```json
{
  "role": "DepartmentHead"
}
```

Valid values for `role`: `"DepartmentHead"` | `"AssetManager"`

> Note: `"Admin"` cannot be assigned via this endpoint.

**Response `200 OK`:** Updated `UserResponse` object.

**Errors:**
| Code | Reason |
|---|---|
| `400` | Invalid role value |
| `404` | Employee not found |

---

## 8. Assets

### `POST /assets`

Register a new asset. **AssetManager or Admin only.**

The `asset_tag` is **auto-generated** in the format `AF-0001`, `AF-0002`, etc.

**Request Body:**
```json
{
  "name": "Dell XPS 15",
  "category_id": 1,
  "serial_number": "SN-ABC123",
  "acquisition_date": "2024-01-15",
  "acquisition_cost": 89999.00,
  "condition": "New",
  "location": "Floor 3 - IT Room",
  "is_shared_bookable": false,
  "photo_url": null
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | `string` | ✅ | 2–200 characters |
| `category_id` | `integer` | ✅ | Must be a valid category ID |
| `serial_number` | `string` | ❌ | |
| `acquisition_date` | `string` | ❌ | ISO date: `"YYYY-MM-DD"` |
| `acquisition_cost` | `float` | ❌ | |
| `condition` | `string` | ❌ | `"New"` / `"Good"` / `"Fair"` / `"Poor"` |
| `location` | `string` | ❌ | Free-text location description |
| `is_shared_bookable` | `boolean` | ❌ | Default `false`. Set `true` for conference rooms, shared equipment, etc. |
| `photo_url` | `string` | ❌ | URL to an image |

**Response `201 Created`:** `AssetResponse` object (see [Data Models](#15-data-models-reference)).

**Asset statuses (lifecycle):**

| Status | Meaning |
|---|---|
| `Available` | Default on creation; ready to allocate |
| `Allocated` | Currently assigned to an employee or department |
| `Reserved` | Reserved (future use) |
| `UnderMaintenance` | Maintenance request approved |
| `Lost` | Reported as lost |
| `Retired` | End of life |
| `Disposed` | Physically discarded |

---

### `GET /assets`

Search and filter assets. **Any authenticated user.**

**Query Parameters (all optional, string params support partial matching):**
| Param | Type | Example | Match type |
|---|---|---|---|
| `asset_tag` | `string` | `?asset_tag=AF-001` | Partial, case-insensitive |
| `serial_number` | `string` | `?serial_number=SN-AB` | Partial, case-insensitive |
| `category_id` | `integer` | `?category_id=1` | Exact |
| `status` | `string` | `?status=Available` | Exact |
| `location` | `string` | `?location=Floor 3` | Partial, case-insensitive |

**Example request:**
```
GET /assets?status=Available&category_id=1
```

**Response `200 OK`:** Array of `AssetResponse` objects.

---

### `GET /assets/{id}`

Get full asset detail including its **allocation history** and **maintenance history**.

**Required role:** Any authenticated user.

**Path param:** `id` — Asset ID

**Response `200 OK`:**
```json
{
  "id": 3,
  "name": "Dell XPS 15",
  "asset_tag": "AF-0003",
  "category_id": 1,
  "serial_number": "SN-ABC123",
  "acquisition_date": "2024-01-15",
  "acquisition_cost": 89999.0,
  "condition": "New",
  "location": "Floor 3 - IT Room",
  "is_shared_bookable": false,
  "status": "Allocated",
  "photo_url": null,
  "allocation_history": [
    {
      "id": 12,
      "asset_id": 3,
      "employee_id": 5,
      "department_id": null,
      "allocated_at": "2024-01-20T09:00:00+00:00",
      "expected_return_date": "2024-06-30",
      "returned_at": null,
      "condition_notes": null,
      "status": "Active"
    }
  ],
  "maintenance_history": []
}
```

---

### `GET /assets/{id}/maintenance-history`

Get all maintenance requests for a specific asset, ordered newest first.

**Required role:** Any authenticated user.

**Response `200 OK`:** Array of `MaintenanceRequestResponse` objects.

---

## 9. Allocations

### `POST /assets/{id}/allocate`

Allocate an asset to an employee or department. **AssetManager or Admin only.**

**Path param:** `id` — Asset ID

**Request Body:**
```json
{
  "employee_id": 3,
  "department_id": null,
  "expected_return_date": "2024-06-30"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `employee_id` | `integer` | ❌ | Provide either `employee_id` or `department_id` |
| `department_id` | `integer` | ❌ | Allocate to a department instead of an individual |
| `expected_return_date` | `string` | ❌ | ISO date: `"YYYY-MM-DD"` |

**Response `201 Created`:** `AllocationResponse` object.

**Errors:**
| Code | Reason |
|---|---|
| `404` | Asset not found |
| `409` | Asset is already allocated — body includes `current_holder` and `allocation_id` |

---

### `POST /allocations/{id}/return`

Mark an allocation as returned, setting asset status back to `Available`. **AssetManager or Admin only.**

**Path param:** `id` — Allocation ID

**Request Body:**
```json
{
  "condition_notes": "Minor scratches on lid"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `condition_notes` | `string` | ❌ | Optional notes on asset condition upon return |

**Response `200 OK`:** Updated `AllocationResponse` with `"status": "Returned"` and `returned_at` timestamp.

**Errors:**
| Code | Reason |
|---|---|
| `404` | Allocation not found |
| `400` | Allocation is already returned |

---

### `GET /allocations/overdue`

List all active allocations that are past their `expected_return_date`. **AssetManager or Admin only.**

**Response `200 OK`:** Array of `AllocationResponse` objects.

---

## 10. Transfer Requests

Transfer requests allow employees to formally request that an allocated asset be reassigned to them.

### `POST /assets/{id}/transfer-request`

Create a transfer request for an asset. **Any authenticated user.**

**Path param:** `id` — Asset ID

**Request Body:**
```json
{
  "requested_to": 5
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `requested_to` | `integer` | ✅ | User ID of the employee to transfer the asset to |

**Response `201 Created`:** `TransferRequestResponse` object.

**Errors:**
| Code | Reason |
|---|---|
| `404` | Asset not found |
| `400` | Target employee (`requested_to`) not found |

---

### `POST /transfer-requests/{id}/approve`

Approve a transfer request. **AssetManager, DepartmentHead, or Admin only.**

When approved:
1. The existing active allocation is closed (`status: "Returned"`, `returned_at` = now)
2. A new allocation is created for `requested_to` (`status: "Active"`)
3. Asset status remains `Allocated`

**Path param:** `id` — Transfer Request ID

**No request body required.**

**Response `200 OK`:** Updated `TransferRequestResponse` with `"status": "Approved"`.

**Errors:**
| Code | Reason |
|---|---|
| `404` | Transfer request not found |
| `400` | Request is not in `"Requested"` status |

---

## 11. Bookings

Bookings are for **shared/bookable assets** (assets with `is_shared_bookable: true`), such as conference rooms or shared equipment.

### `POST /bookings`

Create a new booking. **Any authenticated user.**

**Request Body:**
```json
{
  "asset_id": 2,
  "start_time": "2024-01-15T09:00:00Z",
  "end_time": "2024-01-15T10:00:00Z"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `asset_id` | `integer` | ✅ | Must have `is_shared_bookable: true` |
| `start_time` | `datetime` | ✅ | ISO 8601 datetime with timezone |
| `end_time` | `datetime` | ✅ | Must be after `start_time` |

**Response `201 Created`:** `BookingResponse` object.

**Overlap rule:**
A booking is rejected (`409`) if any non-cancelled booking on the same asset satisfies:
```
existing.start_time < new.end_time  AND  existing.end_time > new.start_time
```

| Scenario | Existing | New Request | Result |
|---|---|---|---|
| Overlap | 09:00–10:00 | 09:30–10:30 | ❌ `409 Conflict` |
| Adjacent (OK) | 09:00–10:00 | 10:00–11:00 | ✅ `201 Created` |
| No overlap | 09:00–10:00 | 11:00–12:00 | ✅ `201 Created` |

**Errors:**
| Code | Reason |
|---|---|
| `400` | Asset not found or not bookable |
| `400` | `start_time` >= `end_time` |
| `409` | Time slot overlaps an existing booking |

---

### `GET /bookings`

List bookings. **Any authenticated user.** Commonly used to populate a calendar view.

**Query Parameters:**
| Param | Type | Required | Description |
|---|---|---|---|
| `asset_id` | `integer` | ❌ | Filter bookings for a specific asset |

**Booking status is computed dynamically on read (no database cron):**

| Condition | Status |
|---|---|
| `now < start_time` | `Upcoming` |
| `start_time ≤ now < end_time` | `Ongoing` |
| `now ≥ end_time` | `Completed` |
| Manually cancelled | `Cancelled` |

**Response `200 OK`:** Array of `BookingResponse` objects with live status.

---

### `POST /bookings/{id}/cancel`

Cancel a booking.

**Allowed for:**
- The user who created the booking (`booked_by`)
- `AssetManager` or `Admin`

**Path param:** `id` — Booking ID

**No request body required.**

**Response `200 OK`:** Updated `BookingResponse` with `"status": "Cancelled"`.

**Errors:**
| Code | Reason |
|---|---|
| `404` | Booking not found |
| `400` | Booking is already cancelled |
| `403` | Not authorised to cancel this booking |

---

## 12. Maintenance Requests

### `POST /maintenance-requests`

Raise a maintenance request for an asset. **Any authenticated user.**

**Request Body:**
```json
{
  "asset_id": 1,
  "issue_description": "Screen flickering intermittently",
  "priority": "High",
  "photo_url": null
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `asset_id` | `integer` | ✅ | Must be a valid asset |
| `issue_description` | `string` | ✅ | |
| `priority` | `string` | ✅ | `"Low"` \| `"Medium"` \| `"High"` |
| `photo_url` | `string` | ❌ | URL to an image of the issue |

**Response `201 Created`:** `MaintenanceRequestResponse` with `"status": "Pending"`.

---

### `POST /maintenance-requests/{id}/approve`

Approve a pending request. **AssetManager or Admin only.**

Side effect: Asset status → `UnderMaintenance`.

**Path param:** `id` — Maintenance Request ID

**No request body required.**

**Response `200 OK`:** Updated request with `"status": "Approved"`.

**Errors:**
| Code | Reason |
|---|---|
| `404` | Request not found |
| `400` | Request is not in `"Pending"` status |

---

### `POST /maintenance-requests/{id}/reject`

Reject a pending or approved request. **AssetManager or Admin only.**

**Request Body:**
```json
{
  "rejection_reason": "Asset is past warranty period"
}
```

**Response `200 OK`:** Updated request with `"status": "Rejected"` and `rejection_reason` set.

**Errors:**
| Code | Reason |
|---|---|
| `404` | Request not found |
| `400` | Cannot reject a request not in `"Pending"` or `"Approved"` state |

---

### `PATCH /maintenance-requests/{id}/assign-technician`

Assign a technician name to the request. **AssetManager or Admin only.**

Side effect: Status advances to `TechnicianAssigned`.

**Request Body:**
```json
{
  "technician_name": "Rahul Sharma"
}
```

**Response `200 OK`:** Updated request with `"status": "TechnicianAssigned"`.

---

### `POST /maintenance-requests/{id}/resolve`

Mark a request as resolved. **AssetManager or Admin only.**

Can only resolve requests in status: `Approved`, `TechnicianAssigned`, or `InProgress`.

Side effects:
- `status` → `Resolved`
- `resolved_at` → current UTC timestamp
- Asset status → `Available`

**No request body required.**

**Response `200 OK`:** Updated request with `"status": "Resolved"` and `resolved_at` timestamp.

**Errors:**
| Code | Reason |
|---|---|
| `404` | Request not found |
| `400` | Request is not in a resolvable state |

---

**Maintenance Status Flow:**

```
Pending → Approved → TechnicianAssigned → InProgress → Resolved
    └──────────────────────────────────────────────────────→ Rejected
```

---

## 13. Dashboard KPIs

### `GET /dashboard/kpis`

Returns a real-time snapshot of key asset management metrics. **Any authenticated user.**

**No query parameters.**

**Response `200 OK`:**
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

| Field | Description |
|---|---|
| `assets_available` | Count of assets with status `Available` |
| `assets_allocated` | Count of assets with status `Allocated` |
| `maintenance_today` | Maintenance requests created today |
| `active_bookings` | All non-cancelled bookings |
| `pending_transfers` | Transfer requests with status `Requested` |
| `upcoming_returns` | Active allocations with `expected_return_date` in the next 7 days |
| `overdue_returns` | Active allocations past their `expected_return_date` |

---

## 14. Activity Log

### `GET /activity-log`

Paginated activity log of all system actions. **Admin only.** Ordered most-recent first.

**Query Parameters:**
| Param | Type | Default | Notes |
|---|---|---|---|
| `user_id` | `integer` | — | Filter to a specific user's actions |
| `page` | `integer` | `1` | Page number (1-indexed) |
| `page_size` | `integer` | `20` | Items per page. Max `100` |

**Example request:**
```
GET /activity-log?page=1&page_size=20&user_id=3
```

**Response `200 OK`:**
```json
[
  {
    "id": 99,
    "user_id": 1,
    "action": "Asset Allocated",
    "details": "Asset ID 3 (AF-0003) allocated. Allocation ID: 12",
    "created_at": "2024-01-15T09:15:00+00:00"
  },
  {
    "id": 98,
    "user_id": 2,
    "action": "Maintenance Requested",
    "details": "Maintenance request raised for Asset ID 5. Priority: High.",
    "created_at": "2024-01-15T08:45:00+00:00"
  }
]
```

**Logged actions include:**
- `Asset Registered`
- `Asset Allocated`
- `Asset Returned`
- `Booking Created`
- `Booking Cancelled`
- `Transfer Requested`
- `Transfer Approved`
- `Maintenance Requested`
- `Maintenance Approved`
- `Maintenance Rejected`
- `Technician Assigned`
- `Maintenance Resolved`

---

## 15. Data Models Reference

### UserResponse
```json
{
  "id": 1,
  "name": "Jane Smith",
  "email": "jane@example.com",
  "department_id": 1,
  "role": "Employee",
  "status": "active"
}
```

### AssetResponse
```json
{
  "id": 3,
  "name": "Dell XPS 15",
  "asset_tag": "AF-0003",
  "category_id": 1,
  "serial_number": "SN-ABC123",
  "acquisition_date": "2024-01-15",
  "acquisition_cost": 89999.0,
  "condition": "New",
  "location": "Floor 3 - IT Room",
  "is_shared_bookable": false,
  "status": "Available",
  "photo_url": null
}
```

### AllocationResponse
```json
{
  "id": 12,
  "asset_id": 3,
  "employee_id": 5,
  "department_id": null,
  "allocated_at": "2024-01-20T09:00:00+00:00",
  "expected_return_date": "2024-06-30",
  "returned_at": null,
  "condition_notes": null,
  "status": "Active"
}
```

### BookingResponse
```json
{
  "id": 7,
  "asset_id": 2,
  "booked_by": 1,
  "start_time": "2024-01-15T09:00:00+00:00",
  "end_time": "2024-01-15T10:00:00+00:00",
  "status": "Upcoming"
}
```

### MaintenanceRequestResponse
```json
{
  "id": 5,
  "asset_id": 1,
  "raised_by": 3,
  "issue_description": "Screen flickering intermittently",
  "priority": "High",
  "photo_url": null,
  "status": "Pending",
  "technician_name": null,
  "created_at": "2024-01-15T08:45:00+00:00",
  "resolved_at": null,
  "rejection_reason": null
}
```

### TransferRequestResponse
```json
{
  "id": 4,
  "asset_id": 3,
  "requested_by": 2,
  "requested_to": 5,
  "status": "Requested",
  "created_at": "2024-01-15T10:00:00+00:00"
}
```

### DepartmentResponse
```json
{
  "id": 1,
  "name": "Engineering",
  "parent_department_id": null,
  "head_id": 5,
  "status": "active"
}
```

### ActivityLogResponse
```json
{
  "id": 99,
  "user_id": 1,
  "action": "Asset Allocated",
  "details": "Asset ID 3 (AF-0003) allocated. Allocation ID: 12",
  "created_at": "2024-01-15T09:15:00+00:00"
}
```

---

## 16. Database Schema (Supabase SQL)

```sql
CREATE TABLE departments (
  id                   BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  name                 TEXT NOT NULL,
  parent_department_id BIGINT REFERENCES departments(id),
  head_id              BIGINT,
  status               TEXT NOT NULL DEFAULT 'active'
);

CREATE TABLE users (
  id                BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  name              TEXT NOT NULL,
  email             TEXT NOT NULL UNIQUE,
  hashed_password   TEXT NOT NULL,
  department_id     BIGINT REFERENCES departments(id),
  role              TEXT NOT NULL DEFAULT 'Employee',
  status            TEXT NOT NULL DEFAULT 'active'
);

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

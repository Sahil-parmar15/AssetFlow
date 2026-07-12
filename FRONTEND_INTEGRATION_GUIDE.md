# AssertFlow — Frontend Integration Guide

Welcome to the **AssertFlow** frontend integration guide! This document is designed to help you integrate your frontend application seamlessly with the FastAPI backend. It covers authentication, role-based UI rendering, error handling, timezone management, and includes a full suite of TypeScript types.

---

## 🔗 Connection Details

*   **Base API URL (Development):** `http://127.0.0.1:8000`
*   **Interactive Swagger UI:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
*   **ReDoc Documentation:** [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

---

## 🔐 1. Authentication & Session Management

AssertFlow uses **JWT Bearer Token** authentication. 

### A. Signup and Login Flow
1.  **Signup (`POST /auth/signup`):** New users can register with their name, email, department, and password. **All signups default to the `Employee` role** for security reasons.
2.  **Login (`POST /auth/login`):** On successful login, the server returns an `access_token` and the user profile object.

### B. Secure Token Storage
*   **Recommendation:** Store the `access_token` in `sessionStorage` or in-memory state. Storing tokens in `localStorage` makes the application vulnerable to Cross-Site Scripting (XSS) attacks.
*   **Re-hydration:** When the app loads, check if a token exists in `sessionStorage`. If it does, fetch the profile at `GET /auth/me` to hydrate the global user context.

### C. Axios Client Setup & Interceptors
To avoid adding the `Authorization` header manually to every request, configure an Axios instance with an **interceptors** chain:

```typescript
import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT token to all requests
apiClient.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle auth failures (e.g. Expired JWT)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token and redirect to login
      sessionStorage.removeItem('access_token');
      window.location.href = '/login?expired=true';
    }
    return Promise.reject(error);
  }
);
```

---

## 🛡️ 2. Role-Based Routing & UI Rendering

AssertFlow has four roles: `Employee` ➔ `DepartmentHead` ➔ `AssetManager` ➔ `Admin`. Each role inherits permissions from the previous ones.

| Role | Permissions Summary | UI Actions to Control |
|---|---|---|
| **Employee** | View assets, make bookings, request transfers, raise maintenance. | View public dashboard, submit requests. |
| **DepartmentHead** | All above + approve asset transfer requests. | "Approve Transfer" buttons, department tab. |
| **AssetManager** | All above + register assets, allocate/return, resolve maintenance. | "Register Asset", "Allocate", "Mark Returned" forms. |
| **Admin** | Full system control + manage departments, categories, view logs. | "System Settings", "User Management", "Activity Log" page. |

### Client-Side Guard (React Example)
Ensure users cannot access unauthorized pages by reading their role on route transitions:

```tsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

interface ProtectedRouteProps {
  allowedRoles: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const user = useAuthUser(); // Custom hook that reads state hydrated by GET /auth/me
  const token = sessionStorage.getItem('access_token');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (!user || !allowedRoles.includes(user.role)) {
    // Show an access denied page or redirect to safety
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};
```

---

## ⚠️ 3. Global Error Handling & Conflict Resolution

Most API error payloads follow a standard shape. However, critical conflicts (`409 Conflict`) return structured objects to help you display detailed warning dialogs to the user.

### A. Standard Error Shape (400, 401, 403, 404, 500)
```json
{
  "detail": "Asset not found"
}
```

### B. 409 Conflict — Asset Already Allocated
Returned when attempting to allocate an asset that is currently assigned.
```json
{
  "detail": {
    "message": "Asset is already allocated",
    "current_holder": "Jane Smith",
    "allocation_id": 42
  }
}
```

### C. 409 Conflict — Booking Time Overlap
Returned when a booking request conflicts with an existing schedule.
```json
{
  "detail": {
    "message": "Booking overlaps with an existing booking",
    "conflicting_booking_id": 7,
    "conflicting_start": "2026-01-15T09:00:00+00:00",
    "conflicting_end": "2026-01-15T10:00:00+00:00"
  }
}
```

### D. Parsing and Displaying Conflicts in Frontend
```typescript
import { AxiosError } from 'axios';

export interface ConflictErrorDetails {
  message: string;
  current_holder?: string;
  allocation_id?: number;
  conflicting_booking_id?: number;
  conflicting_start?: string;
  conflicting_end?: string;
}

export function handleApiError(err: AxiosError) {
  if (err.response) {
    const status = err.response.status;
    const data = err.response.data as any;

    if (status === 409 && typeof data.detail === 'object') {
      const details = data.detail as ConflictErrorDetails;
      if (details.current_holder) {
        alert(
          `⚠️ Allocation Conflict!\n${details.message}. Currently held by: ${details.current_holder} (Allocation #${details.allocation_id}).`
        );
      } else if (details.conflicting_booking_id) {
        const start = new Date(details.conflicting_start!).toLocaleTimeString();
        const end = new Date(details.conflicting_end!).toLocaleTimeString();
        alert(
          `📅 Scheduling Overlap!\n${details.message} (Overlap starts at ${start} and ends at ${end}). Please choose another time.`
        );
      }
      return;
    }

    // Standard string detail error
    alert(data.detail || 'An unexpected error occurred.');
  } else {
    alert('Network error. Please check your connection.');
  }
}
```

---

## 📅 4. Booking & Timezone Management

The AssertFlow backend handles and stores all datetimes in UTC (`ISO 8601` format with timezone offsets).

1.  **Submission Format:** Always convert dates to ISO strings with UTC zone before sending: `new Date().toISOString()`.
2.  **Dynamic Status:** Booking statuses (`Upcoming`, `Ongoing`, `Completed`) are computed dynamically on the server by comparing current server UTC time to `start_time` and `end_time`. You do not need to manage status transitions yourself.
3.  **Boundary contact is exclusive:** A booking starting at `10:00` can be saved even if a prior booking ends at `10:00` (no conflict).

---

## 📁 5. TypeScript Interfaces

Copy and paste these definitions into your frontend types file (e.g., `src/types/api.d.ts`):

```typescript
export type UserRole = 'Employee' | 'DepartmentHead' | 'AssetManager' | 'Admin';
export type UserStatus = 'active' | 'inactive';
export type AssetCondition = 'New' | 'Good' | 'Fair' | 'Poor';
export type AssetStatus = 'Available' | 'Allocated' | 'Reserved' | 'UnderMaintenance' | 'Lost' | 'Retired' | 'Disposed';
export type AllocationStatus = 'Active' | 'Returned';
export type BookingStatus = 'Upcoming' | 'Ongoing' | 'Completed' | 'Cancelled';
export type MaintenanceStatus = 'Pending' | 'Approved' | 'TechnicianAssigned' | 'InProgress' | 'Resolved' | 'Rejected';
export type MaintenancePriority = 'Low' | 'Medium' | 'High';

export interface UserResponse {
  id: number;
  name: string;
  email: string;
  department_id: number | null;
  role: UserRole;
  status: UserStatus;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: UserResponse;
}

export interface DepartmentResponse {
  id: number;
  name: string;
  parent_department_id: number | null;
  head_id: number | null;
  status: UserStatus;
}

export interface AssetCategoryResponse {
  id: number;
  name: string;
  custom_fields: Record<string, any> | null;
}

export interface AssetResponse {
  id: number;
  name: string;
  asset_tag: string;
  category_id: number;
  serial_number: string | null;
  acquisition_date: string | null; // YYYY-MM-DD
  acquisition_cost: number | null;
  condition: AssetCondition | null;
  location: string | null;
  is_shared_bookable: boolean;
  status: AssetStatus;
  photo_url: string | null;
}

export interface AssetDetailResponse extends AssetResponse {
  allocation_history: AllocationResponse[];
  maintenance_history: MaintenanceRequestResponse[];
}

export interface AllocationResponse {
  id: number;
  asset_id: number;
  employee_id: number | null;
  department_id: number | null;
  allocated_at: string; // ISO DateTime
  expected_return_date: string | null; // YYYY-MM-DD
  returned_at: string | null; // ISO DateTime
  condition_notes: string | null;
  status: AllocationStatus;
}

export interface TransferRequestResponse {
  id: number;
  asset_id: number;
  requested_by: number;
  requested_to: number;
  status: 'Requested' | 'Approved' | 'Rejected';
  created_at: string; // ISO DateTime
}

export interface BookingResponse {
  id: number;
  asset_id: number;
  booked_by: number;
  start_time: string; // ISO DateTime
  end_time: string; // ISO DateTime
  status: BookingStatus;
}

export interface MaintenanceRequestResponse {
  id: number;
  asset_id: number;
  raised_by: number;
  issue_description: string;
  priority: MaintenancePriority;
  photo_url: string | null;
  status: MaintenanceStatus;
  technician_name: string | null;
  rejection_reason: string | null;
  created_at: string; // ISO DateTime
  resolved_at: string | null; // ISO DateTime
}

export interface DashboardKpiResponse {
  assets_available: number;
  assets_allocated: number;
  maintenance_today: number;
  active_bookings: number;
  pending_transfers: number;
  upcoming_returns: number;
  overdue_returns: number;
}

export interface ActivityLogResponse {
  id: number;
  user_id: number;
  action: string;
  details: string;
  created_at: string; // ISO DateTime
}
```

---

## ⚡ 6. Practical API Operations (Code Examples)

Here is how you can invoke standard operations using the custom `apiClient` instance defined above:

### Fetching Assets with Search Filters
```typescript
export async function getAssets(filters?: {
  status?: AssetStatus;
  category_id?: number;
  location?: string;
}) {
  const response = await apiClient.get<AssetResponse[]>('/assets', {
    params: filters,
  });
  return response.data;
}
```

### Submitting a Shared Booking
```typescript
export async function createBooking(assetId: number, start: Date, end: Date) {
  try {
    const response = await apiClient.post<BookingResponse>('/bookings', {
      asset_id: assetId,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
    });
    return response.data;
  } catch (error: any) {
    handleApiError(error);
    throw error;
  }
}
```

### Raising a Maintenance Request
```typescript
export async function reportMaintenance(
  assetId: number,
  description: string,
  priority: MaintenancePriority,
  photoUrl?: string
) {
  const response = await apiClient.post<MaintenanceRequestResponse>('/maintenance-requests', {
    asset_id: assetId,
    issue_description: description,
    priority: priority,
    photo_url: photoUrl || null,
  });
  return response.data;
}
```

---

> [!NOTE]
> All detailed endpoint schemas, path/query parameter names, and SQL table properties are documented in [API_DOCS.md](file:///D:/Odoo/assertflow/API_DOCS.md).

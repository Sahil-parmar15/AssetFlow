import { apiClient } from './apiClient';

// ─── AUTH ────────────────────────────────────────────────────────────────────

export const authApi = {
  login: (email, password) =>
    apiClient.post('/auth/login', { email, password }).then((r) => r.data),

  signup: (name, email, password, department_id = null) =>
    apiClient
      .post('/auth/signup', { name, email, password, ...(department_id ? { department_id } : {}) })
      .then((r) => r.data),

  me: () => apiClient.get('/auth/me').then((r) => r.data),
};

// ─── DEPARTMENTS ─────────────────────────────────────────────────────────────

export const departmentsApi = {
  list: () => apiClient.get('/departments').then((r) => r.data),

  create: (payload) => apiClient.post('/departments', payload).then((r) => r.data),

  update: (id, payload) =>
    apiClient.patch(`/departments/${id}`, payload).then((r) => r.data),

  deactivate: (id) =>
    apiClient.post(`/departments/${id}/deactivate`).then((r) => r.data),
};

// ─── ASSET CATEGORIES ────────────────────────────────────────────────────────

export const categoriesApi = {
  list: () => apiClient.get('/asset-categories').then((r) => r.data),

  create: (payload) => apiClient.post('/asset-categories', payload).then((r) => r.data),

  update: (id, payload) =>
    apiClient.patch(`/asset-categories/${id}`, payload).then((r) => r.data),

  delete: (id) => apiClient.delete(`/asset-categories/${id}`).then((r) => r.data),
};

// ─── EMPLOYEES ───────────────────────────────────────────────────────────────

export const employeesApi = {
  list: (params = {}) => apiClient.get('/employees', { params }).then((r) => r.data),

  get: (id) => apiClient.get(`/employees/${id}`).then((r) => r.data),

  promoteRole: (id, role) =>
    apiClient.patch(`/employees/${id}/role`, { role }).then((r) => r.data),

  updateStatus: (id, status) =>
    apiClient.patch(`/employees/${id}/status`, { status }).then((r) => r.data),
};

// ─── ASSETS ──────────────────────────────────────────────────────────────────

export const assetsApi = {
  list: (params = {}) => apiClient.get('/assets', { params }).then((r) => r.data),

  get: (id) => apiClient.get(`/assets/${id}`).then((r) => r.data),

  create: (payload) => apiClient.post('/assets', payload).then((r) => r.data),

  update: (id, payload) =>
    apiClient.patch(`/assets/${id}`, payload).then((r) => r.data),
};

// ─── ALLOCATIONS ─────────────────────────────────────────────────────────────

export const allocationsApi = {
  list: (params = {}) => apiClient.get('/allocations', { params }).then((r) => r.data),

  allocate: (payload) => apiClient.post('/allocations', payload).then((r) => r.data),

  returnAsset: (id, payload) =>
    apiClient.post(`/allocations/${id}/return`, payload).then((r) => r.data),
};

// ─── TRANSFER REQUESTS ───────────────────────────────────────────────────────

export const transfersApi = {
  list: (params = {}) => apiClient.get('/transfer-requests', { params }).then((r) => r.data),

  create: (asset_id, requested_to) =>
    apiClient.post('/transfer-requests', { asset_id, requested_to }).then((r) => r.data),

  approve: (id) =>
    apiClient.post(`/transfer-requests/${id}/approve`).then((r) => r.data),

  reject: (id) =>
    apiClient.post(`/transfer-requests/${id}/reject`).then((r) => r.data),
};

// ─── BOOKINGS ────────────────────────────────────────────────────────────────

export const bookingsApi = {
  list: (params = {}) => apiClient.get('/bookings', { params }).then((r) => r.data),

  create: (payload) => apiClient.post('/bookings', payload).then((r) => r.data),

  update: (id, payload) =>
    apiClient.patch(`/bookings/${id}`, payload).then((r) => r.data),

  cancel: (id) => apiClient.post(`/bookings/${id}/cancel`).then((r) => r.data),
};

// ─── MAINTENANCE REQUESTS ────────────────────────────────────────────────────

export const maintenanceApi = {
  list: (params = {}) =>
    apiClient.get('/maintenance-requests', { params }).then((r) => r.data),

  create: (payload) =>
    apiClient.post('/maintenance-requests', payload).then((r) => r.data),

  update: (id, payload) =>
    apiClient.patch(`/maintenance-requests/${id}`, payload).then((r) => r.data),
};

// ─── DASHBOARD KPIs ──────────────────────────────────────────────────────────

export const dashboardApi = {
  kpis: () => apiClient.get('/dashboard/kpis').then((r) => r.data),
};

// ─── ACTIVITY LOG ────────────────────────────────────────────────────────────

export const logsApi = {
  list: (params = {}) => apiClient.get('/activity-log', { params }).then((r) => r.data),
};

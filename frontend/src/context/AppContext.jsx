import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import {
  authApi,
  departmentsApi,
  categoriesApi,
  employeesApi,
  assetsApi,
  allocationsApi,
  transfersApi,
  bookingsApi,
  maintenanceApi,
  dashboardApi,
  logsApi,
} from '../services/api';
import { parseApiError } from '../services/apiClient';

export const AppContext = createContext();

// ─── Custom hook for convenience ─────────────────────────────────────────────
export const useAppContext = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
  // ── Auth state ────────────────────────────────────────────────────────────
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true); // hydration guard

  // ── Remote data caches ────────────────────────────────────────────────────
  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [assets, setAssets] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [logs, setLogs] = useState([]);
  const [kpis, setKpis] = useState(null);

  // ── UI-only notifications (in-memory, not persisted) ─────────────────────
  const [notifications, setNotifications] = useState([]);

  // ── Loading / error state per resource ────────────────────────────────────
  const [loading, setLoading] = useState({});
  const [errors, setErrors] = useState({});

  // ─── Helpers ─────────────────────────────────────────────────────────────

  const setResourceLoading = (key, val) =>
    setLoading((prev) => ({ ...prev, [key]: val }));

  const setResourceError = (key, val) =>
    setErrors((prev) => ({ ...prev, [key]: val }));

  const pushNotification = useCallback((userId, message, type) => {
    const newNotif = {
      id: `NT-${Date.now()}`,
      userId: String(userId),
      message,
      type,
      date: new Date().toISOString().split('T')[0],
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  }, []);

  // ─── Listen for JWT expiry event from apiClient interceptor ──────────────
  useEffect(() => {
    const onExpired = () => {
      setCurrentUser(null);
      pushNotification('system', 'Your session has expired. Please log in again.', 'System');
    };
    window.addEventListener('auth:expired', onExpired);
    return () => window.removeEventListener('auth:expired', onExpired);
  }, [pushNotification]);

  // ─── Re-hydrate session on mount ─────────────────────────────────────────
  useEffect(() => {
    const token = sessionStorage.getItem('access_token');
    if (!token) {
      setAuthLoading(false);
      return;
    }
    authApi
      .me()
      .then((user) => {
        setCurrentUser(normalizeUser(user));
      })
      .catch(() => {
        sessionStorage.removeItem('access_token');
      })
      .finally(() => setAuthLoading(false));
  }, []);

  // ─── Load all data once user is authenticated ─────────────────────────────
  useEffect(() => {
    if (!currentUser) return;
    refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  const refreshAll = () => {
    fetchDepartments();
    fetchCategories();
    fetchUsers();
    fetchAssets();
    fetchAllocations();
    fetchTransfers();
    fetchBookings();
    fetchMaintenance();
    fetchLogs();
    fetchKpis();
  };

  // ─── Normalize helpers (backend uses snake_case, frontend used camelCase) ─

  const normalizeUser = (u) => ({
    id: String(u.id),
    name: u.name,
    email: u.email,
    department_id: u.department_id,
    role: normalizeRole(u.role),
    status: u.status === 'active' ? 'Active' : 'Inactive',
  });

  const normalizeRole = (role) => {
    const map = {
      Employee: 'Employee',
      DepartmentHead: 'Department Head',
      AssetManager: 'Asset Manager',
      Admin: 'Admin',
    };
    return map[role] || role;
  };

  const denormalizeRole = (role) => {
    const map = {
      Employee: 'Employee',
      'Department Head': 'DepartmentHead',
      'Asset Manager': 'AssetManager',
      Admin: 'Admin',
    };
    return map[role] || role;
  };

  // ─── Fetch functions ──────────────────────────────────────────────────────

  const fetchDepartments = async () => {
    try {
      setResourceLoading('departments', true);
      const data = await departmentsApi.list();
      setDepartments(
        data.map((d) => ({
          id: String(d.id),
          name: d.name,
          head: d.head_id ? String(d.head_id) : null,
          parent: d.parent_department_id ? String(d.parent_department_id) : null,
          status: d.status === 'active' ? 'Active' : 'Inactive',
        }))
      );
    } catch (e) {
      setResourceError('departments', parseApiError(e));
    } finally {
      setResourceLoading('departments', false);
    }
  };

  const fetchCategories = async () => {
    try {
      setResourceLoading('categories', true);
      const data = await categoriesApi.list();
      setCategories(
        data.map((c) => ({
          id: String(c.id),
          name: c.name,
          customFields: c.custom_fields
            ? Object.entries(c.custom_fields).map(([name, label]) => ({ name, label: String(label) }))
            : [],
        }))
      );
    } catch (e) {
      setResourceError('categories', parseApiError(e));
    } finally {
      setResourceLoading('categories', false);
    }
  };

  const fetchUsers = async () => {
    try {
      setResourceLoading('users', true);
      const data = await employeesApi.list();
      setUsers(data.map(normalizeUser));
    } catch (e) {
      setResourceError('users', parseApiError(e));
    } finally {
      setResourceLoading('users', false);
    }
  };

  const fetchAssets = async () => {
    try {
      setResourceLoading('assets', true);
      const data = await assetsApi.list();
      setAssets(
        data.map((a) => ({
          id: String(a.id),
          name: a.name,
          assetTag: a.asset_tag,
          categoryId: String(a.category_id),
          serialNumber: a.serial_number,
          cost: a.acquisition_cost,
          condition: a.condition,
          location: a.location,
          shared: a.is_shared_bookable,
          status: a.status,
          photo: a.photo_url,
        }))
      );
    } catch (e) {
      setResourceError('assets', parseApiError(e));
    } finally {
      setResourceLoading('assets', false);
    }
  };

  const fetchAllocations = async () => {
    try {
      setResourceLoading('allocations', true);
      const data = await allocationsApi.list();
      setAllocations(
        data.map((al) => ({
          id: String(al.id),
          assetId: String(al.asset_id),
          allocateToId: al.employee_id ? String(al.employee_id) : null,
          departmentId: al.department_id ? String(al.department_id) : null,
          type: al.employee_id ? 'employee' : 'department',
          allocationDate: al.allocated_at?.split('T')[0],
          expectedReturnDate: al.expected_return_date,
          returnDate: al.returned_at?.split('T')[0] || null,
          status: al.status,
          notes: al.condition_notes || '',
        }))
      );
    } catch (e) {
      setResourceError('allocations', parseApiError(e));
    } finally {
      setResourceLoading('allocations', false);
    }
  };

  const fetchTransfers = async () => {
    try {
      setResourceLoading('transfers', true);
      const data = await transfersApi.list();
      setTransfers(
        data.map((t) => ({
          id: String(t.id),
          assetId: String(t.asset_id),
          requesterId: String(t.requested_to),
          currentHolderId: String(t.requested_by),
          status: t.status,
          dateRequested: t.created_at?.split('T')[0],
        }))
      );
    } catch (e) {
      setResourceError('transfers', parseApiError(e));
    } finally {
      setResourceLoading('transfers', false);
    }
  };

  const fetchBookings = async () => {
    try {
      setResourceLoading('bookings', true);
      const data = await bookingsApi.list();
      setBookings(
        data.map((b) => ({
          id: String(b.id),
          resourceId: String(b.asset_id),
          userId: String(b.booked_by),
          start: b.start_time,
          end: b.end_time,
          status: b.status,
        }))
      );
    } catch (e) {
      setResourceError('bookings', parseApiError(e));
    } finally {
      setResourceLoading('bookings', false);
    }
  };

  const fetchMaintenance = async () => {
    try {
      setResourceLoading('maintenance', true);
      const data = await maintenanceApi.list();
      setMaintenance(
        data.map((m) => ({
          id: String(m.id),
          assetId: String(m.asset_id),
          description: m.issue_description,
          priority: m.priority,
          status: m.status,
          raisedBy: String(m.raised_by),
          dateRaised: m.created_at?.split('T')[0],
          technician: m.technician_name,
          photo: m.photo_url,
          rejectionReason: m.rejection_reason,
          resolvedAt: m.resolved_at,
        }))
      );
    } catch (e) {
      setResourceError('maintenance', parseApiError(e));
    } finally {
      setResourceLoading('maintenance', false);
    }
  };

  const fetchLogs = async () => {
    try {
      setResourceLoading('logs', true);
      const data = await logsApi.list();
      setLogs(
        data.map((l) => ({
          id: String(l.id),
          userId: String(l.user_id),
          userName: l.user_name || '',
          action: l.action,
          details: l.details,
          timestamp: l.created_at,
        }))
      );
    } catch (e) {
      setResourceError('logs', parseApiError(e));
    } finally {
      setResourceLoading('logs', false);
    }
  };

  const fetchKpis = async () => {
    try {
      const data = await dashboardApi.kpis();
      setKpis(data);
    } catch (e) {
      // non-critical, silently fail
    }
  };

  // ─── AUTH ACTIONS ─────────────────────────────────────────────────────────

  const login = async (email, password) => {
    try {
      const data = await authApi.login(email, password);
      sessionStorage.setItem('access_token', data.access_token);
      setCurrentUser(normalizeUser(data.user));
      return { success: true, user: data.user };
    } catch (e) {
      return { success: false, message: parseApiError(e) };
    }
  };

  const signup = async (name, email, password, department_id = null) => {
    try {
      const data = await authApi.signup(name, email, password, department_id);
      // After signup, auto-login
      return await login(email, password);
    } catch (e) {
      return { success: false, message: parseApiError(e) };
    }
  };

  const logout = () => {
    sessionStorage.removeItem('access_token');
    setCurrentUser(null);
    // Clear cached data
    setDepartments([]);
    setCategories([]);
    setUsers([]);
    setAssets([]);
    setAllocations([]);
    setTransfers([]);
    setBookings([]);
    setMaintenance([]);
    setLogs([]);
    setKpis(null);
    setNotifications([]);
  };

  // Developer-only role switcher (does NOT hit backend, just for UI preview)
  const switchRole = (role) => {
    if (!currentUser) return;
    setCurrentUser((prev) => ({ ...prev, role }));
  };

  // ─── ORGANIZATION SETUP ACTIONS ───────────────────────────────────────────

  const addDepartment = async (name, headId, parentId) => {
    try {
      await departmentsApi.create({
        name,
        head_id: headId ? Number(headId) : null,
        parent_department_id: parentId ? Number(parentId) : null,
      });
      await fetchDepartments();
      return { success: true };
    } catch (e) {
      return { success: false, message: parseApiError(e) };
    }
  };

  const updateDepartment = async (id, fields) => {
    try {
      const payload = {};
      if (fields.name !== undefined) payload.name = fields.name;
      if (fields.head !== undefined) payload.head_id = fields.head ? Number(fields.head) : null;
      if (fields.status !== undefined) payload.status = fields.status === 'Active' ? 'active' : 'inactive';
      await departmentsApi.update(Number(id), payload);
      await fetchDepartments();
      return { success: true };
    } catch (e) {
      return { success: false, message: parseApiError(e) };
    }
  };

  const deleteDepartment = async (id) => {
    try {
      await departmentsApi.deactivate(Number(id));
      await fetchDepartments();
      return { success: true };
    } catch (e) {
      return { success: false, message: parseApiError(e) };
    }
  };

  const addCategory = async (name, customFields = []) => {
    try {
      const custom_fields = {};
      customFields.forEach((f) => { custom_fields[f.name] = f.label; });
      await categoriesApi.create({ name, custom_fields });
      await fetchCategories();
      return { success: true };
    } catch (e) {
      return { success: false, message: parseApiError(e) };
    }
  };

  const updateCategory = async (id, name, customFields = []) => {
    try {
      const custom_fields = {};
      customFields.forEach((f) => { custom_fields[f.name] = f.label; });
      await categoriesApi.update(Number(id), { name, custom_fields });
      await fetchCategories();
      return { success: true };
    } catch (e) {
      return { success: false, message: parseApiError(e) };
    }
  };

  const deleteCategory = async (id) => {
    try {
      await categoriesApi.delete(Number(id));
      await fetchCategories();
      return { success: true };
    } catch (e) {
      return { success: false, message: parseApiError(e) };
    }
  };

  const promoteEmployee = async (employeeId, newRole) => {
    try {
      await employeesApi.promoteRole(Number(employeeId), denormalizeRole(newRole));
      await fetchUsers();
      pushNotification(employeeId, `You have been promoted to ${newRole}.`, 'Promotion');
      return { success: true };
    } catch (e) {
      return { success: false, message: parseApiError(e) };
    }
  };

  const updateUserStatus = async (employeeId, newStatus) => {
    try {
      await employeesApi.updateStatus(Number(employeeId), newStatus === 'Active' ? 'active' : 'inactive');
      await fetchUsers();
      pushNotification(employeeId, `Your account status has been changed to ${newStatus}.`, 'System');
      return { success: true };
    } catch (e) {
      return { success: false, message: parseApiError(e) };
    }
  };

  // ─── ASSET ACTIONS ────────────────────────────────────────────────────────

  const registerAsset = async (assetData) => {
    try {
      const payload = {
        name: assetData.name,
        category_id: Number(assetData.categoryId),
        asset_tag: assetData.assetTag || `TAG-${Date.now()}`,
        serial_number: assetData.serialNumber || null,
        acquisition_date: assetData.acquisitionDate || null,
        acquisition_cost: assetData.cost ? Number(assetData.cost) : null,
        condition: assetData.condition || null,
        location: assetData.location || null,
        is_shared_bookable: assetData.shared || false,
        photo_url: assetData.photo || null,
      };
      await assetsApi.create(payload);
      await fetchAssets();
      await fetchKpis();
      return { success: true };
    } catch (e) {
      return { success: false, message: parseApiError(e) };
    }
  };

  const updateAssetDetails = async (assetId, fields) => {
    try {
      const payload = {};
      if (fields.name !== undefined) payload.name = fields.name;
      if (fields.condition !== undefined) payload.condition = fields.condition;
      if (fields.location !== undefined) payload.location = fields.location;
      if (fields.status !== undefined) payload.status = fields.status;
      if (fields.cost !== undefined) payload.acquisition_cost = Number(fields.cost);
      if (fields.shared !== undefined) payload.is_shared_bookable = fields.shared;
      await assetsApi.update(Number(assetId), payload);
      await fetchAssets();
      return { success: true };
    } catch (e) {
      return { success: false, message: parseApiError(e) };
    }
  };

  const updateAssetCondition = async (assetId, condition) => {
    return updateAssetDetails(assetId, { condition });
  };

  // ─── ALLOCATION ACTIONS ───────────────────────────────────────────────────

  const allocateAsset = async (assetId, allocateToId, type, expectedReturnDate) => {
    try {
      const payload = {
        asset_id: Number(assetId),
        expected_return_date: expectedReturnDate || null,
      };
      if (type === 'employee') {
        payload.employee_id = Number(allocateToId);
      } else {
        payload.department_id = Number(allocateToId);
      }
      await allocationsApi.allocate(payload);
      await fetchAssets();
      await fetchAllocations();
      await fetchKpis();
      const asset = assets.find((a) => a.id === String(assetId));
      if (type === 'employee') {
        pushNotification(allocateToId, `Asset ${asset?.name || assetId} has been allocated to you.`, 'Allocation');
      }
      return { success: true };
    } catch (e) {
      const msg = parseApiError(e);
      // Check if it's a 409 conflict from backend
      if (e.response?.status === 409) {
        const d = e.response.data?.detail;
        if (typeof d === 'object') {
          return {
            success: false,
            conflict: true,
            currentHolder: d.current_holder || 'Unknown',
            message: d.message || msg,
          };
        }
      }
      return { success: false, message: msg };
    }
  };

  const returnAsset = async (assetId, conditionNotes, conditionState) => {
    try {
      // Find the active allocation for this asset
      const activeAlloc = allocations.find(
        (al) => al.assetId === String(assetId) && al.status === 'Active'
      );
      if (!activeAlloc) return { success: false, message: 'No active allocation found.' };
      await allocationsApi.returnAsset(Number(activeAlloc.id), {
        condition_notes: conditionNotes || null,
      });
      await fetchAssets();
      await fetchAllocations();
      await fetchKpis();
      return { success: true };
    } catch (e) {
      return { success: false, message: parseApiError(e) };
    }
  };

  // ─── TRANSFER ACTIONS ─────────────────────────────────────────────────────

  const requestTransfer = async (assetId, targetEmployeeId) => {
    try {
      await transfersApi.create(Number(assetId), Number(targetEmployeeId));
      await fetchTransfers();
      const asset = assets.find((a) => a.id === String(assetId));
      pushNotification(targetEmployeeId, `A transfer request has been made for: ${asset?.name || assetId}.`, 'Transfer');
      return { success: true };
    } catch (e) {
      return { success: false, message: parseApiError(e) };
    }
  };

  const approveTransfer = async (transferId) => {
    try {
      await transfersApi.approve(Number(transferId));
      await fetchTransfers();
      await fetchAllocations();
      await fetchAssets();
      return { success: true };
    } catch (e) {
      return { success: false, message: parseApiError(e) };
    }
  };

  const rejectTransfer = async (transferId) => {
    try {
      await transfersApi.reject(Number(transferId));
      await fetchTransfers();
      return { success: true };
    } catch (e) {
      return { success: false, message: parseApiError(e) };
    }
  };

  // ─── BOOKING ACTIONS ──────────────────────────────────────────────────────

  const bookResource = async (resourceId, startStr, endStr) => {
    try {
      await bookingsApi.create({
        asset_id: Number(resourceId),
        start_time: new Date(startStr).toISOString(),
        end_time: new Date(endStr).toISOString(),
      });
      await fetchBookings();
      await fetchKpis();
      const res = assets.find((a) => a.id === String(resourceId));
      pushNotification(currentUser.id, `Booking confirmed for ${res?.name || resourceId}.`, 'Booking');
      return { success: true };
    } catch (e) {
      if (e.response?.status === 409) {
        const d = e.response.data?.detail;
        if (typeof d === 'object') {
          const start = d.conflicting_start ? new Date(d.conflicting_start).toLocaleTimeString() : '';
          const end = d.conflicting_end ? new Date(d.conflicting_end).toLocaleTimeString() : '';
          return { success: false, message: `📅 ${d.message}. Conflict: ${start} – ${end}` };
        }
      }
      return { success: false, message: parseApiError(e) };
    }
  };

  const rescheduleBooking = async (bookingId, startStr, endStr) => {
    try {
      await bookingsApi.update(Number(bookingId), {
        start_time: new Date(startStr).toISOString(),
        end_time: new Date(endStr).toISOString(),
      });
      await fetchBookings();
      return { success: true };
    } catch (e) {
      if (e.response?.status === 409) {
        const d = e.response.data?.detail;
        if (typeof d === 'object') {
          return { success: false, message: `📅 ${d.message}` };
        }
      }
      return { success: false, message: parseApiError(e) };
    }
  };

  const cancelBooking = async (bookingId) => {
    try {
      await bookingsApi.cancel(Number(bookingId));
      await fetchBookings();
      await fetchKpis();
      return { success: true };
    } catch (e) {
      return { success: false, message: parseApiError(e) };
    }
  };

  // ─── MAINTENANCE ACTIONS ──────────────────────────────────────────────────

  const raiseMaintenance = async (assetId, priority, description, photo = null) => {
    try {
      await maintenanceApi.create({
        asset_id: Number(assetId),
        issue_description: description,
        priority,
        photo_url: photo || null,
      });
      await fetchMaintenance();
      await fetchKpis();
      return { success: true };
    } catch (e) {
      return { success: false, message: parseApiError(e) };
    }
  };

  const updateMaintenanceStatus = async (requestId, newStatus, technician = null) => {
    try {
      const payload = { status: newStatus };
      if (technician) payload.technician_name = technician;
      await maintenanceApi.update(Number(requestId), payload);
      await fetchMaintenance();
      await fetchAssets();
      await fetchKpis();
      return { success: true };
    } catch (e) {
      return { success: false, message: parseApiError(e) };
    }
  };

  // ─── AUDIT (stub – no backend endpoint, kept for UI compatibility) ─────────
  const [audits, setAudits] = useState([]);

  const createAuditCycle = (name, scope, auditorIds, startDate, endDate) => {
    const newAudit = {
      id: `AU-${Date.now()}`,
      name, scope, auditors: auditorIds, startDate, endDate,
      status: 'Active', results: {},
    };
    setAudits((prev) => [...prev, newAudit]);
    auditorIds.forEach((id) =>
      pushNotification(id, `You have been assigned to audit: ${name}.`, 'Audit')
    );
    return { success: true };
  };

  const updateAuditAsset = (cycleId, assetId, auditStatus) => {
    setAudits((prev) =>
      prev.map((a) =>
        a.id === cycleId ? { ...a, results: { ...a.results, [assetId]: auditStatus } } : a
      )
    );
  };

  const closeAuditCycle = (cycleId) => {
    const audit = audits.find((a) => a.id === cycleId);
    if (!audit) return { success: false, message: 'Audit cycle not found.' };
    setAudits((prev) =>
      prev.map((a) => (a.id === cycleId ? { ...a, status: 'Completed' } : a))
    );
    return { success: true };
  };

  // ─── Legacy logAction stub (for components that still call it) ────────────
  const logAction = () => {
    // Logging is now handled server-side; this is a no-op.
  };

  // ─── Context value ────────────────────────────────────────────────────────
  const value = {
    // State
    currentUser,
    authLoading,
    users,
    departments,
    categories,
    assets,
    allocations,
    transfers,
    bookings,
    maintenance,
    audits,
    notifications,
    logs,
    kpis,
    loading,
    errors,

    // Auth
    login,
    signup,
    logout,
    switchRole,

    // Org setup
    addDepartment,
    updateDepartment,
    deleteDepartment,
    addCategory,
    updateCategory,
    deleteCategory,
    promoteEmployee,
    updateUserStatus,

    // Assets
    registerAsset,
    updateAssetCondition,
    updateAssetDetails,

    // Allocations
    allocateAsset,
    returnAsset,

    // Transfers
    requestTransfer,
    approveTransfer,
    rejectTransfer,

    // Bookings
    bookResource,
    rescheduleBooking,
    cancelBooking,

    // Maintenance
    raiseMaintenance,
    updateMaintenanceStatus,

    // Audits
    createAuditCycle,
    updateAuditAsset,
    closeAuditCycle,

    // Utilities
    logAction,
    pushNotification,

    // Refresh helpers
    refreshAll,
    fetchKpis,
  };

  if (authLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)',
        fontFamily: 'var(--font-sans)',
        flexDirection: 'column',
        gap: '16px',
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid var(--border-glass)',
          borderTopColor: 'var(--accent-primary)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          Connecting to AssertFlow…
        </span>
      </div>
    );
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

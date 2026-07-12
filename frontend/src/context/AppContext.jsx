import React, { createContext, useState, useEffect } from 'react';

export const AppContext = createContext();

// Setup initial data helper
const INITIAL_USERS = [
  { id: 'E-0001', name: 'Priya Sharma', email: 'priya@assetflow.com', department: 'IT Department', role: 'Employee', status: 'Active' },
  { id: 'E-0002', name: 'Raj Patel', email: 'raj@assetflow.com', department: 'Operations Department', role: 'Employee', status: 'Active' },
  { id: 'E-0003', name: 'Sarah Jenkins', email: 'head@assetflow.com', department: 'HR Department', role: 'Department Head', status: 'Active' },
  { id: 'E-0004', name: 'David Vance', email: 'manager@assetflow.com', department: 'Operations Department', role: 'Asset Manager', status: 'Active' },
  { id: 'E-0005', name: 'Alice Cooper', email: 'admin@assetflow.com', department: 'IT Department', role: 'Admin', status: 'Active' }
];

const INITIAL_PASSWORDS = {
  'priya@assetflow.com': 'priya123',
  'raj@assetflow.com': 'raj123',
  'head@assetflow.com': 'head123',
  'manager@assetflow.com': 'manager123',
  'admin@assetflow.com': 'admin123'
};

const INITIAL_DEPARTMENTS = [
  { id: 'D-0001', name: 'IT Department', head: 'E-0005', parent: null, status: 'Active' },
  { id: 'D-0002', name: 'HR Department', head: 'E-0003', parent: null, status: 'Active' },
  { id: 'D-0003', name: 'Operations Department', head: 'E-0004', parent: null, status: 'Active' }
];

const INITIAL_CATEGORIES = [
  { id: 'C-0001', name: 'Electronics', customFields: [{ name: 'warranty', label: 'Warranty (Months)' }, { name: 'brand', label: 'Brand' }] },
  { id: 'C-0002', name: 'Furniture', customFields: [{ name: 'material', label: 'Material' }] },
  { id: 'C-0003', name: 'Vehicles', customFields: [{ name: 'licensePlate', label: 'License Plate' }] }
];

const INITIAL_ASSETS = [
  { id: 'AF-0001', name: 'MacBook Pro 16', categoryId: 'C-0001', serialNumber: 'MVP-8392-DK', cost: 2499, condition: 'Excellent', location: 'Main Office Room 302', status: 'Allocated', shared: false, warranty: '24', brand: 'Apple', holderId: 'E-0001', holderType: 'employee' },
  { id: 'AF-0002', name: 'Office Chair Ergo', categoryId: 'C-0002', serialNumber: 'CH-8283-ER', cost: 350, condition: 'Good', location: 'Main Office Room 101', status: 'Available', shared: false, material: 'Mesh', holderId: null, holderType: null },
  { id: 'AF-0003', name: 'Conference Room Alpha', categoryId: 'C-0001', serialNumber: 'SPACE-CONF-A', cost: 0, condition: 'Excellent', location: 'Headquarters Floor 2', status: 'Available', shared: true },
  { id: 'AF-0004', name: 'Company Van', categoryId: 'C-0003', serialNumber: 'VN-9382-LT', cost: 35000, condition: 'Good', location: 'Parking Garage', status: 'Available', shared: true, licensePlate: 'TX-738-DF' }
];

const INITIAL_ALLOCATIONS = [
  { id: 'AL-0001', assetId: 'AF-0001', allocateToId: 'E-0001', type: 'employee', allocatedBy: 'E-0004', allocationDate: '2026-07-01', expectedReturnDate: '2026-08-01', status: 'Active', notes: 'Initial setup' }
];

const INITIAL_BOOKINGS = [
  { id: 'BK-0001', resourceId: 'AF-0003', userId: 'E-0003', start: '2026-07-12T09:00:00', end: '2026-07-12T10:00:00', status: 'Completed' },
  { id: 'BK-0002', resourceId: 'AF-0003', userId: 'E-0001', start: '2026-07-12T14:00:00', end: '2026-07-12T15:30:00', status: 'Upcoming' }
];

const INITIAL_MAINTENANCE = [
  { id: 'MN-0001', assetId: 'AF-0002', description: 'Wobbles when sitting. Gas lift failing.', priority: 'High', status: 'Pending', raisedBy: 'E-0002', dateRaised: '2026-07-10', technician: null, photo: null }
];

const INITIAL_AUDITS = [
  { id: 'AU-0001', name: 'Q3 Asset Verification', scope: 'IT Department', auditors: ['E-0004'], startDate: '2026-07-01', endDate: '2026-07-10', status: 'Completed', results: { 'AF-0001': 'Verified' } }
];

const INITIAL_NOTIFICATIONS = [
  { id: 'NT-0001', userId: 'E-0001', message: 'Asset MacBook Pro 16 has been allocated to you.', type: 'Allocation', date: '2026-07-01', read: false },
  { id: 'NT-0002', userId: 'E-0004', message: 'New maintenance request raised for Office Chair Ergo.', type: 'Maintenance', date: '2026-07-10', read: false }
];

const INITIAL_LOGS = [
  { id: 'LG-0001', userId: 'E-0004', userName: 'David Vance', action: 'Asset Registered', details: 'MacBook Pro 16 registered (AF-0001)', timestamp: '2026-07-01T10:00:00' },
  { id: 'LG-0002', userId: 'E-0004', userName: 'David Vance', action: 'Asset Allocated', details: 'Allocated MacBook Pro 16 (AF-0001) to Priya Sharma', timestamp: '2026-07-01T10:15:00' }
];

export const AppProvider = ({ children }) => {
  // Database States
  const [users, setUsers] = useState(() => JSON.parse(localStorage.getItem('af_users')) || INITIAL_USERS);
  const [passwords, setPasswords] = useState(() => JSON.parse(localStorage.getItem('af_passwords')) || INITIAL_PASSWORDS);
  const [departments, setDepartments] = useState(() => JSON.parse(localStorage.getItem('af_departments')) || INITIAL_DEPARTMENTS);
  const [categories, setCategories] = useState(() => JSON.parse(localStorage.getItem('af_categories')) || INITIAL_CATEGORIES);
  const [assets, setAssets] = useState(() => JSON.parse(localStorage.getItem('af_assets')) || INITIAL_ASSETS);
  const [allocations, setAllocations] = useState(() => JSON.parse(localStorage.getItem('af_allocations')) || INITIAL_ALLOCATIONS);
  const [bookings, setBookings] = useState(() => JSON.parse(localStorage.getItem('af_bookings')) || INITIAL_BOOKINGS);
  const [maintenance, setMaintenance] = useState(() => JSON.parse(localStorage.getItem('af_maintenance')) || INITIAL_MAINTENANCE);
  const [audits, setAudits] = useState(() => JSON.parse(localStorage.getItem('af_audits')) || INITIAL_AUDITS);
  const [notifications, setNotifications] = useState(() => JSON.parse(localStorage.getItem('af_notifications')) || INITIAL_NOTIFICATIONS);
  const [logs, setLogs] = useState(() => JSON.parse(localStorage.getItem('af_logs')) || INITIAL_LOGS);
  
  // Active session
  const [currentUser, setCurrentUser] = useState(() => JSON.parse(localStorage.getItem('af_current_user')) || INITIAL_USERS[4]); // default to Admin Alice
  
  // Transfer request table (computed or stateful)
  const [transfers, setTransfers] = useState(() => JSON.parse(localStorage.getItem('af_transfers')) || [
    { id: 'TR-0001', assetId: 'AF-0001', requesterId: 'E-0002', currentHolderId: 'E-0001', status: 'Pending', dateRequested: '2026-07-11' }
  ]);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('af_users', JSON.stringify(users));
  }, [users]);
  useEffect(() => {
    localStorage.setItem('af_passwords', JSON.stringify(passwords));
  }, [passwords]);
  useEffect(() => {
    localStorage.setItem('af_departments', JSON.stringify(departments));
  }, [departments]);
  useEffect(() => {
    localStorage.setItem('af_categories', JSON.stringify(categories));
  }, [categories]);
  useEffect(() => {
    localStorage.setItem('af_assets', JSON.stringify(assets));
  }, [assets]);
  useEffect(() => {
    localStorage.setItem('af_allocations', JSON.stringify(allocations));
  }, [allocations]);
  useEffect(() => {
    localStorage.setItem('af_bookings', JSON.stringify(bookings));
  }, [bookings]);
  useEffect(() => {
    localStorage.setItem('af_maintenance', JSON.stringify(maintenance));
  }, [maintenance]);
  useEffect(() => {
    localStorage.setItem('af_audits', JSON.stringify(audits));
  }, [audits]);
  useEffect(() => {
    localStorage.setItem('af_notifications', JSON.stringify(notifications));
  }, [notifications]);
  useEffect(() => {
    localStorage.setItem('af_logs', JSON.stringify(logs));
  }, [logs]);
  useEffect(() => {
    localStorage.setItem('af_current_user', JSON.stringify(currentUser));
  }, [currentUser]);
  useEffect(() => {
    localStorage.setItem('af_transfers', JSON.stringify(transfers));
  }, [transfers]);

  // SYSTEM LOG UTILITY
  const logAction = (action, details, overrideUser = null) => {
    const active = overrideUser || currentUser;
    const newLog = {
      id: `LG-${String(logs.length + 1).padStart(4, '0')}`,
      userId: active ? active.id : 'SYSTEM',
      userName: active ? active.name : 'System',
      action,
      details,
      timestamp: new Date().toISOString()
    };
    setLogs(prev => [newLog, ...prev]);
  };

  // SYSTEM NOTIFICATION UTILITY
  const pushNotification = (userId, message, type) => {
    const newNotif = {
      id: `NT-${String(notifications.length + 1).padStart(4, '0')}`,
      userId,
      message,
      type,
      date: new Date().toISOString().split('T')[0],
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  // AUTHENTICATION
  const login = (email, password) => {
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return { success: false, message: 'User does not exist.' };
    
    const correctPassword = passwords[email.toLowerCase()];
    if (correctPassword === password) {
      setCurrentUser(user);
      logAction('Login', 'User logged in successfully', user);
      return { success: true, user };
    }
    return { success: false, message: 'Incorrect password.' };
  };

  const signup = (name, email, password) => {
    const exists = users.some(u => u.email.toLowerCase() === email.toLowerCase());
    if (exists) return { success: false, message: 'Email already registered.' };

    const newId = `E-${String(users.length + 1).padStart(4, '0')}`;
    const newUser = {
      id: newId,
      name,
      email: email.toLowerCase(),
      department: 'IT Department', // Default
      role: 'Employee', // ALWAYS SIGNUP AS EMPLOYEE (no self promotion)
      status: 'Active'
    };

    setUsers(prev => [...prev, newUser]);
    setPasswords(prev => ({ ...prev, [email.toLowerCase()]: password }));
    setCurrentUser(newUser);
    logAction('Signup', `Signed up as a new Employee: ${name}`, newUser);
    pushNotification(newId, `Welcome to AssetFlow, ${name}! Your account is registered as Employee.`, 'System');
    return { success: true, user: newUser };
  };

  const logout = () => {
    logAction('Logout', 'User logged out');
    setCurrentUser(null);
  };

  // DEVELOPER ROLE SWITCHER
  const switchRole = (role) => {
    if (!currentUser) return;
    const updatedUser = { ...currentUser, role };
    setCurrentUser(updatedUser);
    
    // Also update in users list so role promotion is simulated properly
    setUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, role } : u));
    logAction('Role Switch', `Switched developer role simulation to: ${role}`);
  };

  // ORGANIZATION SETUP (Admin only)
  const addDepartment = (name, headId, parentId) => {
    const newId = `D-${String(departments.length + 1).padStart(4, '0')}`;
    const newDept = {
      id: newId,
      name,
      head: headId || null,
      parent: parentId || null,
      status: 'Active'
    };
    setDepartments(prev => [...prev, newDept]);
    logAction('Create Department', `Created department ${name}`);
  };

  const updateDepartment = (id, fields) => {
    setDepartments(prev => prev.map(d => d.id === id ? { ...d, ...fields } : d));
    logAction('Update Department', `Updated department ID ${id}`);
  };

  const deleteDepartment = (id) => {
    setDepartments(prev => prev.filter(d => d.id !== id));
    logAction('Delete Department', `Deleted department ID ${id}`);
  };

  const addCategory = (name, customFields) => {
    const newId = `C-${String(categories.length + 1).padStart(4, '0')}`;
    const newCat = {
      id: newId,
      name,
      customFields: customFields || []
    };
    setCategories(prev => [...prev, newCat]);
    logAction('Create Category', `Created asset category ${name}`);
  };

  const updateCategory = (id, name, customFields) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, name, customFields } : c));
    logAction('Update Category', `Updated category ${name} (${id})`);
  };

  const deleteCategory = (id) => {
    setCategories(prev => prev.filter(c => c.id !== id));
    logAction('Delete Category', `Deleted category ID ${id}`);
  };

  const promoteEmployee = (employeeId, newRole) => {
    setUsers(prev => prev.map(u => u.id === employeeId ? { ...u, role: newRole } : u));
    const emp = users.find(u => u.id === employeeId);
    logAction('Role Promotion', `Promoted ${emp.name} to ${newRole}`);
    pushNotification(employeeId, `You have been promoted to ${newRole} by the Administrator.`, 'Promotion');
  };

  const updateUserStatus = (employeeId, newStatus) => {
    setUsers(prev => prev.map(u => u.id === employeeId ? { ...u, status: newStatus } : u));
    const emp = users.find(u => u.id === employeeId);
    logAction('User Status Change', `Set status of ${emp.name} to ${newStatus}`);
    pushNotification(employeeId, `Your account status has been changed to ${newStatus}.`, 'System');
  };

  // ASSETS
  const registerAsset = (assetData) => {
    const newId = `AF-${String(assets.length + 1).padStart(4, '0')}`;
    const newAsset = {
      id: newId,
      status: 'Available',
      holderId: null,
      holderType: null,
      ...assetData
    };
    setAssets(prev => [...prev, newAsset]);
    logAction('Register Asset', `Registered new asset: ${assetData.name} (${newId})`);
  };

  const updateAssetCondition = (assetId, condition) => {
    setAssets(prev => prev.map(a => a.id === assetId ? { ...a, condition } : a));
  };

  const updateAssetDetails = (assetId, fields) => {
    setAssets(prev => prev.map(a => a.id === assetId ? { ...a, ...fields } : a));
    logAction('Update Asset Details', `Updated details and lifecycle parameter for asset ${assetId}`);
  };

  // ASSET ALLOCATION
  const allocateAsset = (assetId, allocateToId, type, expectedReturnDate) => {
    // 1. Conflict checking
    const asset = assets.find(a => a.id === assetId);
    if (!asset) return { success: false, message: 'Asset not found.' };

    if (asset.status !== 'Available') {
      const currentHolder = users.find(u => u.id === asset.holderId) || { name: 'Department' };
      return { 
        success: false, 
        conflict: true, 
        currentHolder: currentHolder.name,
        currentHolderId: asset.holderId,
        message: `Asset is already taken. Currently held by ${currentHolder.name}.`
      };
    }

    // 2. Do allocation
    const newAllocId = `AL-${String(allocations.length + 1).padStart(4, '0')}`;
    const newAlloc = {
      id: newAllocId,
      assetId,
      allocateToId,
      type, // 'employee' or 'department'
      allocatedBy: currentUser.id,
      allocationDate: new Date().toISOString().split('T')[0],
      expectedReturnDate: expectedReturnDate || null,
      status: 'Active',
      notes: ''
    };

    setAllocations(prev => [...prev, newAlloc]);
    setAssets(prev => prev.map(a => a.id === assetId ? { ...a, status: 'Allocated', holderId: allocateToId, holderType: type } : a));

    logAction('Allocate Asset', `Allocated ${asset.name} (${assetId}) to ${type === 'employee' ? 'Employee' : 'Department'} ID: ${allocateToId}`);
    
    if (type === 'employee') {
      pushNotification(allocateToId, `Asset ${asset.name} (${assetId}) has been allocated to you. Expected return: ${expectedReturnDate || 'N/A'}.`, 'Allocation');
    }
    
    return { success: true };
  };

  // TRANSFER SYSTEM
  const requestTransfer = (assetId, targetEmployeeId) => {
    const asset = assets.find(a => a.id === assetId);
    if (!asset) return { success: false, message: 'Asset not found' };

    const newTransId = `TR-${String(transfers.length + 1).padStart(4, '0')}`;
    const newTransfer = {
      id: newTransId,
      assetId,
      requesterId: targetEmployeeId,
      currentHolderId: asset.holderId,
      status: 'Pending',
      dateRequested: new Date().toISOString().split('T')[0]
    };

    setTransfers(prev => [...prev, newTransfer]);
    logAction('Request Transfer', `Requested transfer of asset ${asset.name} (${assetId}) from Employee ${asset.holderId} to ${targetEmployeeId}`);
    
    // Notify Asset Manager & Current Holder
    pushNotification(asset.holderId, `A transfer request has been initiated for your asset: ${asset.name} (${assetId}).`, 'Transfer');
    return { success: true, transfer: newTransfer };
  };

  const approveTransfer = (transferId) => {
    const transfer = transfers.find(t => t.id === transferId);
    if (!transfer) return { success: false, message: 'Transfer not found.' };

    const asset = assets.find(a => a.id === transfer.assetId);
    const requester = users.find(u => u.id === transfer.requesterId);
    if (!asset || !requester) return { success: false, message: 'Asset or requester not found.' };

    // Close current allocation
    setAllocations(prev => prev.map(al => 
      al.assetId === transfer.assetId && al.status === 'Active' 
        ? { ...al, status: 'Closed', returnDate: new Date().toISOString().split('T')[0], checkInNotes: 'Transferred' } 
        : al
    ));

    // Create new allocation
    const newAllocId = `AL-${String(allocations.length + 1).padStart(4, '0')}`;
    const newAlloc = {
      id: newAllocId,
      assetId: transfer.assetId,
      allocateToId: transfer.requesterId,
      type: 'employee',
      allocatedBy: currentUser.id,
      allocationDate: new Date().toISOString().split('T')[0],
      expectedReturnDate: null,
      status: 'Active',
      notes: `Transferred from employee ${transfer.currentHolderId}`
    };

    setAllocations(prev => [...prev, newAlloc]);
    setAssets(prev => prev.map(a => a.id === transfer.assetId ? { ...a, holderId: transfer.requesterId, holderType: 'employee' } : a));
    setTransfers(prev => prev.map(t => t.id === transferId ? { ...t, status: 'Approved' } : t));

    logAction('Approve Transfer', `Approved transfer of ${asset.name} to ${requester.name}`);
    pushNotification(transfer.requesterId, `Transfer approved! Asset ${asset.name} is now allocated to you.`, 'Transfer');
    pushNotification(transfer.currentHolderId, `Transfer completed. Asset ${asset.name} has been transferred.`, 'Transfer');
    return { success: true };
  };

  const rejectTransfer = (transferId) => {
    setTransfers(prev => prev.map(t => t.id === transferId ? { ...t, status: 'Rejected' } : t));
    const transfer = transfers.find(t => t.id === transferId);
    logAction('Reject Transfer', `Rejected transfer of asset ID ${transfer.assetId}`);
    pushNotification(transfer.requesterId, `Your transfer request for asset ${transfer.assetId} has been declined.`, 'Transfer');
  };

  // RETURN ASSET
  const returnAsset = (assetId, conditionNotes, conditionState) => {
    const asset = assets.find(a => a.id === assetId);
    if (!asset) return { success: false, message: 'Asset not found' };

    setAllocations(prev => prev.map(al => 
      al.assetId === assetId && al.status === 'Active' 
        ? { ...al, status: 'Returned', returnDate: new Date().toISOString().split('T')[0], checkInNotes: conditionNotes } 
        : al
    ));

    setAssets(prev => prev.map(a => a.id === assetId ? { ...a, status: 'Available', holderId: null, holderType: null, condition: conditionState } : a));
    
    logAction('Return Asset', `Asset ${asset.name} (${assetId}) returned in ${conditionState} condition.`);
    return { success: true };
  };

  // RESOURCE BOOKING (overlap validation rule)
  const bookResource = (resourceId, startStr, endStr, bookOnBehalfDeptName = null) => {
    const start = new Date(startStr);
    const end = new Date(endStr);

    if (start >= end) {
      return { success: false, message: 'End time must be after start time.' };
    }

    // Overlap validation check
    const resourceBookings = bookings.filter(b => b.resourceId === resourceId && b.status !== 'Cancelled');
    const overlap = resourceBookings.some(b => {
      const bStart = new Date(b.start);
      const bEnd = new Date(b.end);
      return (start < bEnd && end > bStart); // Overlap formula
    });

    if (overlap) {
      return { 
        success: false, 
        message: 'Booking conflict! This slot overlaps with an existing booking.' 
      };
    }

    const newBkId = `BK-${String(bookings.length + 1).padStart(4, '0')}`;
    const newBooking = {
      id: newBkId,
      resourceId,
      userId: currentUser.id,
      start: startStr,
      end: endStr,
      status: 'Upcoming',
      behalfOfDepartment: bookOnBehalfDeptName || null
    };

    setBookings(prev => [...prev, newBooking]);
    const res = assets.find(a => a.id === resourceId);
    logAction('Book Resource', `Booked ${res.name} from ${startStr} to ${endStr}${bookOnBehalfDeptName ? ` on behalf of ${bookOnBehalfDeptName}` : ''}`);
    pushNotification(currentUser.id, `Booking confirmed for ${res.name} (${startStr} - ${endStr})`, 'Booking');

    return { success: true };
  };

  const rescheduleBooking = (bookingId, startStr, endStr) => {
    const start = new Date(startStr);
    const end = new Date(endStr);

    if (start >= end) {
      return { success: false, message: 'End time must be after start time.' };
    }

    const targetBooking = bookings.find(b => b.id === bookingId);
    if (!targetBooking) return { success: false, message: 'Booking not found.' };

    // Overlap validation check (excluding current booking)
    const resourceBookings = bookings.filter(b => b.resourceId === targetBooking.resourceId && b.id !== bookingId && b.status !== 'Cancelled');
    const overlap = resourceBookings.some(b => {
      const bStart = new Date(b.start);
      const bEnd = new Date(b.end);
      return (start < bEnd && end > bStart);
    });

    if (overlap) {
      return { 
        success: false, 
        message: 'Booking conflict! The rescheduled time overlaps with an existing booking.' 
      };
    }

    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, start: startStr, end: endStr, status: 'Upcoming' } : b));
    logAction('Reschedule Booking', `Rescheduled booking ${bookingId} to ${startStr} - ${endStr}`);
    return { success: true };
  };

  const cancelBooking = (bookingId) => {
    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'Cancelled' } : b));
    const bk = bookings.find(b => b.id === bookingId);
    logAction('Cancel Booking', `Cancelled booking ID ${bookingId}`);
    pushNotification(bk.userId, `Booking ${bookingId} has been cancelled.`, 'Booking');
  };

  // MAINTENANCE WORKFLOW
  const raiseMaintenance = (assetId, priority, description, photo = null) => {
    const newId = `MN-${String(maintenance.length + 1).padStart(4, '0')}`;
    const newRequest = {
      id: newId,
      assetId,
      description,
      priority,
      status: 'Pending',
      raisedBy: currentUser.id,
      dateRaised: new Date().toISOString().split('T')[0],
      technician: null,
      photo
    };

    setMaintenance(prev => [...prev, newRequest]);
    logAction('Raise Maintenance', `Raised maintenance request for Asset ID ${assetId} (Priority: ${priority})`);
    
    // Notify all Asset Managers
    users.filter(u => u.role === 'Asset Manager').forEach(mgr => {
      pushNotification(mgr.id, `New pending maintenance ticket for Asset ${assetId}`, 'Maintenance');
    });

    return { success: true };
  };

  const updateMaintenanceStatus = (requestId, newStatus, technician = null) => {
    const request = maintenance.find(m => m.id === requestId);
    if (!request) return { success: false, message: 'Request not found.' };

    setMaintenance(prev => prev.map(m => m.id === requestId 
      ? { ...m, status: newStatus, technician: technician || m.technician } 
      : m
    ));

    // Asset status changes
    if (newStatus === 'Approved') {
      setAssets(prev => prev.map(a => a.id === request.assetId ? { ...a, status: 'Under Maintenance' } : a));
      logAction('Approve Maintenance', `Approved maintenance for Asset ID ${request.assetId}. Status set to Under Maintenance.`);
      pushNotification(request.raisedBy, `Maintenance approved for asset ${request.assetId}. Repairs will begin.`, 'Maintenance');
    } else if (newStatus === 'Resolved') {
      setAssets(prev => prev.map(a => a.id === request.assetId ? { ...a, status: 'Available' } : a));
      logAction('Resolve Maintenance', `Resolved maintenance for Asset ID ${request.assetId}. Status reverted to Available.`);
      pushNotification(request.raisedBy, `Maintenance resolved for asset ${request.assetId}. Asset is back in service!`, 'Maintenance');
    } else if (newStatus === 'Rejected') {
      logAction('Reject Maintenance', `Rejected maintenance request ID ${requestId}`);
      pushNotification(request.raisedBy, `Maintenance request for asset ${request.assetId} has been rejected.`, 'Maintenance');
    }

    return { success: true };
  };

  // AUDIT SCREEN (cycles, auditor tool & discrepancy report)
  const createAuditCycle = (name, scope, auditors, startDate, endDate) => {
    const newId = `AU-${String(audits.length + 1).padStart(4, '0')}`;
    const newAudit = {
      id: newId,
      name,
      scope, // e.g. IT Department or Operations Department
      auditors, // list of auditor employee IDs
      startDate,
      endDate,
      status: 'Active',
      results: {} // assetId: 'Verified' | 'Missing' | 'Damaged'
    };

    setAudits(prev => [...prev, newAudit]);
    logAction('Create Audit', `Initiated audit cycle: ${name}`);

    // Notify assigned auditors
    auditors.forEach(audId => {
      pushNotification(audId, `You have been assigned to audit cycle: ${name}.`, 'Audit');
    });

    return { success: true };
  };

  const updateAuditAsset = (cycleId, assetId, auditStatus) => {
    setAudits(prev => prev.map(aud => {
      if (aud.id === cycleId) {
        return {
          ...aud,
          results: {
            ...aud.results,
            [assetId]: auditStatus
          }
        };
      }
      return aud;
    }));
  };

  const closeAuditCycle = (cycleId) => {
    const audit = audits.find(aud => aud.id === cycleId);
    if (!audit) return { success: false, message: 'Audit cycle not found' };

    // Update statuses of affected assets
    const updatedResults = audit.results;
    setAssets(prev => prev.map(a => {
      const auditResult = updatedResults[a.id];
      if (auditResult === 'Missing') {
        return { ...a, status: 'Lost' }; // Auto-sets missing to Lost
      } else if (auditResult === 'Damaged') {
        return { ...a, condition: 'Poor' };
      }
      return a;
    }));

    setAudits(prev => prev.map(aud => aud.id === cycleId ? { ...aud, status: 'Completed' } : aud));
    logAction('Close Audit', `Closed audit cycle ${audit.name}. Assets marked missing are now set to Lost.`);
    
    // Check if discrepancies exist to send manager alert
    const discrepancies = Object.keys(updatedResults).filter(k => updatedResults[k] !== 'Verified');
    if (discrepancies.length > 0) {
      users.filter(u => u.role === 'Asset Manager').forEach(mgr => {
        pushNotification(mgr.id, `Audit ${audit.name} completed with ${discrepancies.length} discrepancies.`, 'Audit');
      });
    }

    return { success: true };
  };

  return (
    <AppContext.Provider value={{
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
      currentUser,
      
      login,
      signup,
      logout,
      switchRole,
      
      addDepartment,
      updateDepartment,
      deleteDepartment,
      addCategory,
      updateCategory,
      deleteCategory,
      promoteEmployee,
      updateUserStatus,
      
      registerAsset,
      updateAssetCondition,
      updateAssetDetails,
      
      allocateAsset,
      requestTransfer,
      approveTransfer,
      rejectTransfer,
      returnAsset,
      
      bookResource,
      rescheduleBooking,
      cancelBooking,
      
      raiseMaintenance,
      updateMaintenanceStatus,
      
      createAuditCycle,
      updateAuditAsset,
      closeAuditCycle,
      logAction,
      pushNotification
    }}>
      {children}
    </AppContext.Provider>
  );
};

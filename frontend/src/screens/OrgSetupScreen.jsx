import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { 
  Building2, 
  FolderLock, 
  Users, 
  Plus, 
  Edit3, 
  ShieldAlert,
  Save,
  Trash2,
  AlertTriangle,
  X
} from 'lucide-react';

export default function OrgSetupScreen() {
  const { 
    currentUser, 
    departments, 
    categories, 
    users, 
    addDepartment, 
    updateDepartment,
    deleteDepartment,
    addCategory,
    updateCategory,
    deleteCategory,
    promoteEmployee,
    updateUserStatus
  } = useContext(AppContext);

  const [activeTab, setActiveTab] = useState('departments');

  // Form states for Department (Create)
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [deptName, setDeptName] = useState('');
  const [deptHead, setDeptHead] = useState('');
  const [deptParent, setDeptParent] = useState('');

  // Form states for Department (Edit)
  const [editingDeptId, setEditingDeptId] = useState(null);
  const [editDeptName, setEditDeptName] = useState('');
  const [editDeptHead, setEditDeptHead] = useState('');
  const [editDeptParent, setEditDeptParent] = useState('');

  // Form states for Category (Create)
  const [showCatModal, setShowCatModal] = useState(false);
  const [catName, setCatName] = useState('');
  const [customFields, setCustomFields] = useState([{ name: '', label: '' }]);

  // Form states for Category (Edit)
  const [editingCatId, setEditingCatId] = useState(null);
  const [editCatName, setEditCatName] = useState('');
  const [editCustomFields, setEditCustomFields] = useState([{ name: '', label: '' }]);

  if (currentUser?.role !== 'Admin') {
    return (
      <div className="glass-panel" style={{
        textAlign: 'center',
        padding: '3rem',
        color: '#ef4444',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: '2rem'
      }}>
        <ShieldAlert size={48} style={{ marginBottom: '1rem' }} />
        <h2>Access Denied</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
          Only system Administrators have access to the Organization Setup module.
        </p>
      </div>
    );
  }

  // Department Handlers
  const handleSaveDept = (e) => {
    e.preventDefault();
    if (!deptName.trim()) return;
    addDepartment(deptName, deptHead, deptParent);
    setDeptName('');
    setDeptHead('');
    setDeptParent('');
    setShowDeptModal(false);
  };

  const handleOpenEditDept = (dept) => {
    setEditingDeptId(dept.id);
    setEditDeptName(dept.name);
    setEditDeptHead(dept.head || '');
    setEditDeptParent(dept.parent || '');
  };

  const handleUpdateDeptSubmit = (e) => {
    e.preventDefault();
    if (!editDeptName.trim()) return;
    updateDepartment(editingDeptId, {
      name: editDeptName,
      head: editDeptHead || null,
      parent: editDeptParent || null
    });
    setEditingDeptId(null);
  };

  const handleDeleteDept = (id, name) => {
    const confirm = window.confirm(`Are you sure you want to delete the department: "${name}"? This cannot be undone.`);
    if (confirm) {
      deleteDepartment(id);
    }
  };

  const handleToggleDeptStatus = (deptId, currentStatus) => {
    const nextStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    updateDepartment(deptId, { status: nextStatus });
  };

  // Category Handlers
  const handleSaveCat = (e) => {
    e.preventDefault();
    if (!catName.trim()) return;
    const cleanFields = customFields.filter(f => f.name.trim() !== '');
    addCategory(catName, cleanFields);
    setCatName('');
    setCustomFields([{ name: '', label: '' }]);
    setShowCatModal(false);
  };

  const handleOpenEditCat = (cat) => {
    setEditingCatId(cat.id);
    setEditCatName(cat.name);
    setEditCustomFields(cat.customFields && cat.customFields.length > 0 ? [...cat.customFields] : [{ name: '', label: '' }]);
  };

  const handleUpdateCatSubmit = (e) => {
    e.preventDefault();
    if (!editCatName.trim()) return;
    const cleanFields = editCustomFields.filter(f => f.name.trim() !== '');
    updateCategory(editingCatId, editCatName, cleanFields);
    setEditingCatId(null);
  };

  const handleDeleteCat = (id, name) => {
    const confirm = window.confirm(`Are you sure you want to delete the category: "${name}"?`);
    if (confirm) {
      deleteCategory(id);
    }
  };

  const addCustomFieldRow = (isEdit = false) => {
    if (isEdit) {
      setEditCustomFields([...editCustomFields, { name: '', label: '' }]);
    } else {
      setCustomFields([...customFields, { name: '', label: '' }]);
    }
  };

  const handleCustomFieldChange = (index, field, val, isEdit = false) => {
    const copy = isEdit ? [...editCustomFields] : [...customFields];
    copy[index][field] = val;
    if (field === 'name') {
      copy[index]['label'] = val.charAt(0).toUpperCase() + val.slice(1);
    }
    if (isEdit) {
      setEditCustomFields(copy);
    } else {
      setCustomFields(copy);
    }
  };

  return (
    <div className="animate-fade-in" style={{ fontFamily: 'var(--font-sans)' }}>
      {/* Title */}
      <div style={{ marginBottom: '2rem' }}>
        <h1>Organization Setup</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Manage organizational departments, metadata categories, and corporate permissions.
        </p>
      </div>

      {/* Tabs Menu */}
      <div className="tabs-container">
        <button 
          className={`tab-btn ${activeTab === 'departments' ? 'active' : ''}`}
          onClick={() => setActiveTab('departments')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Building2 size={16} />
          <span>Departments</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'categories' ? 'active' : ''}`}
          onClick={() => setActiveTab('categories')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <FolderLock size={16} />
          <span>Asset Categories</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'employees' ? 'active' : ''}`}
          onClick={() => setActiveTab('employees')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Users size={16} />
          <span>Employee Directory</span>
        </button>
      </div>

      {/* TAB A: DEPARTMENTS */}
      {activeTab === 'departments' && (
        <div className="glass-panel animate-fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem' }}>Department Hierarchy</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Configure structural divisions and assign department heads.</p>
            </div>
            <button className="btn btn-primary" onClick={() => setShowDeptModal(true)}>
              <Plus size={16} />
              <span>Create Department</span>
            </button>
          </div>

          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Dept ID</th>
                  <th>Department Name</th>
                  <th>Department Head</th>
                  <th>Parent Department</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {departments.map(dept => {
                  const headUser = users.find(u => u.id === dept.head);
                  const parentDept = departments.find(d => d.id === dept.parent);
                  return (
                    <tr key={dept.id}>
                      <td style={{ fontWeight: '600' }}>{dept.id}</td>
                      <td style={{ fontWeight: '500' }}>{dept.name}</td>
                      <td>{headUser ? headUser.name : <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>}</td>
                      <td>{parentDept ? parentDept.name : <span style={{ color: 'var(--text-muted)' }}>None (Top Level)</span>}</td>
                      <td>
                        <span className={`badge ${dept.status === 'Active' ? 'badge-available' : 'badge-disposed'}`}>
                          {dept.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '6px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                            onClick={() => handleOpenEditDept(dept)}
                          >
                            <Edit3 size={11} />
                            <span>Edit</span>
                          </button>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '6px 10px', fontSize: '11px' }}
                            onClick={() => handleToggleDeptStatus(dept.id, dept.status)}
                          >
                            {dept.status === 'Active' ? 'Deactivate' : 'Activate'}
                          </button>
                          <button 
                            className="btn btn-danger" 
                            style={{ padding: '6px 10px', fontSize: '11px' }}
                            onClick={() => handleDeleteDept(dept.id, dept.name)}
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB B: CATEGORIES */}
      {activeTab === 'categories' && (
        <div className="glass-panel animate-fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem' }}>Asset Category Manager</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Define categories with specialized fields (e.g. warranty for electronics).</p>
            </div>
            <button className="btn btn-primary" onClick={() => setShowCatModal(true)}>
              <Plus size={16} />
              <span>Add Category</span>
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {categories.map(cat => (
              <div key={cat.id} className="glass-panel" style={{ background: 'rgba(255,255,255,0.015)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <h4 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{cat.name}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{cat.id}</span>
                  </h4>
                  <div style={{ marginBottom: '1rem' }}>
                    <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: '600' }}>CUSTOM ATTRIBUTES:</span>
                    {cat.customFields && cat.customFields.length > 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {cat.customFields.map((field, i) => (
                          <span key={i} style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid var(--border-glass)',
                            fontSize: '11px',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            color: 'var(--text-primary)'
                          }}>
                            {field.label} ({field.name})
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>None defined (standard fields only)</span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border-glass)', paddingTop: '10px', marginTop: '10px' }}>
                  <button 
                    className="btn btn-secondary" 
                    style={{ flex: 1, padding: '6px', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                    onClick={() => handleOpenEditCat(cat)}
                  >
                    <Edit3 size={11} />
                    <span>Edit Specs</span>
                  </button>
                  <button 
                    className="btn btn-danger" 
                    style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onClick={() => handleDeleteCat(cat.id, cat.name)}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB C: EMPLOYEE DIRECTORY */}
      {activeTab === 'employees' && (
        <div className="glass-panel animate-fade-in">
          <div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>Employee Directory</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Promote staff members to Department Head or Asset Manager, and toggle system user access states.
            </p>
          </div>

          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Employee ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Current Role</th>
                  <th>Status</th>
                  <th>System Promotion Action</th>
                  <th>Account Status Switch</th>
                </tr>
              </thead>
              <tbody>
                {users.map(emp => (
                  <tr key={emp.id}>
                    <td style={{ fontWeight: '600' }}>{emp.id}</td>
                    <td style={{ fontWeight: '500' }}>{emp.name}</td>
                    <td>{emp.email}</td>
                    <td>{emp.department}</td>
                    <td>
                      <span style={{
                        background: emp.role === 'Admin' ? 'rgba(139, 92, 246, 0.15)' : emp.role === 'Asset Manager' ? 'rgba(59, 130, 246, 0.15)' : emp.role === 'Department Head' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255,255,255,0.05)',
                        color: emp.role === 'Admin' ? 'var(--accent-primary)' : emp.role === 'Asset Manager' ? 'var(--accent-secondary)' : emp.role === 'Department Head' ? 'var(--status-reserved)' : 'var(--text-secondary)',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: '600'
                      }}>
                        {emp.role}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${emp.status === 'Active' ? 'badge-available' : 'badge-disposed'}`}>
                        {emp.status}
                      </span>
                    </td>
                    <td>
                      <select 
                        className="form-select" 
                        style={{ width: 'auto', padding: '4px 8px', fontSize: '12px' }}
                        value={emp.role}
                        onChange={(e) => promoteEmployee(emp.id, e.target.value)}
                      >
                        <option value="Employee">Employee</option>
                        <option value="Department Head">Department Head</option>
                        <option value="Asset Manager">Asset Manager</option>
                        <option value="Admin">Admin</option>
                      </select>
                    </td>
                    <td>
                      <button
                        className={`btn ${emp.status === 'Active' ? 'btn-danger' : 'btn-primary'}`}
                        style={{ padding: '4px 10px', fontSize: '11px', background: emp.status === 'Active' ? 'rgba(239, 68, 68, 0.1)' : 'var(--status-available-bg)', color: emp.status === 'Active' ? '#ef4444' : 'var(--status-available)', border: '1px solid transparent' }}
                        onClick={() => updateUserStatus(emp.id, emp.status === 'Active' ? 'Inactive' : 'Active')}
                      >
                        {emp.status === 'Active' ? 'Deactivate' : 'Reactivate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DEPARTMENT CREATE MODAL */}
      {showDeptModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          padding: '1.5rem'
        }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '480px' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem' }}>Create Department</h3>
            <form onSubmit={handleSaveDept}>
              <div className="form-group">
                <label className="form-label">Department Name</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g. Quality Assurance" 
                  value={deptName} 
                  onChange={(e) => setDeptName(e.target.value)}
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Department Head</label>
                <select 
                  className="form-select" 
                  value={deptHead} 
                  onChange={(e) => setDeptHead(e.target.value)}
                >
                  <option value="">Unassigned</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Parent Department (Hierarchy)</label>
                <select 
                  className="form-select" 
                  value={deptParent} 
                  onChange={(e) => setDeptParent(e.target.value)}
                >
                  <option value="">None (Top Level)</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowDeptModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  <Save size={14} />
                  <span>Save Department</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DEPARTMENT EDIT MODAL */}
      {editingDeptId && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          padding: '1.5rem'
        }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '480px' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem' }}>Edit Department Details</h3>
            <form onSubmit={handleUpdateDeptSubmit}>
              <div className="form-group">
                <label className="form-label">Department Name</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={editDeptName} 
                  onChange={(e) => setEditDeptName(e.target.value)}
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Department Head</label>
                <select 
                  className="form-select" 
                  value={editDeptHead} 
                  onChange={(e) => setEditDeptHead(e.target.value)}
                >
                  <option value="">Unassigned</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Parent Department (Hierarchy)</label>
                <select 
                  className="form-select" 
                  value={editDeptParent} 
                  onChange={(e) => setEditDeptParent(e.target.value)}
                >
                  <option value="">None (Top Level)</option>
                  {departments.filter(d => d.id !== editingDeptId).map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditingDeptId(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  <Save size={14} />
                  <span>Update Department</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CATEGORY CREATE MODAL */}
      {showCatModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          padding: '1.5rem'
        }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '480px' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem' }}>Add Asset Category</h3>
            <form onSubmit={handleSaveCat}>
              <div className="form-group">
                <label className="form-label">Category Name</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g. Heavy Machinery" 
                  value={catName} 
                  onChange={(e) => setCatName(e.target.value)}
                  required 
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Custom Metadata Fields</span>
                  <button type="button" style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '11px', cursor: 'pointer', fontWeight: '600' }} onClick={() => addCustomFieldRow(false)}>
                    + Add Field
                  </button>
                </label>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '150px', overflowY: 'auto' }}>
                  {customFields.map((f, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '8px' }}>
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="Variable Key (e.g. warranty)" 
                        style={{ flex: 1 }}
                        value={f.name}
                        onChange={(e) => handleCustomFieldChange(idx, 'name', e.target.value, false)}
                      />
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="Display Label" 
                        style={{ flex: 1 }}
                        value={f.label}
                        onChange={(e) => handleCustomFieldChange(idx, 'label', e.target.value, false)}
                        readOnly
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCatModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Category</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CATEGORY EDIT MODAL */}
      {editingCatId && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          padding: '1.5rem'
        }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '480px' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem' }}>Edit Category Specifications</h3>
            <form onSubmit={handleUpdateCatSubmit}>
              <div className="form-group">
                <label className="form-label">Category Name</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={editCatName} 
                  onChange={(e) => setEditCatName(e.target.value)}
                  required 
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Custom Metadata Fields</span>
                  <button type="button" style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '11px', cursor: 'pointer', fontWeight: '600' }} onClick={() => addCustomFieldRow(true)}>
                    + Add Field
                  </button>
                </label>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '150px', overflowY: 'auto' }}>
                  {editCustomFields.map((f, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '8px' }}>
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="Variable Key (e.g. warranty)" 
                        style={{ flex: 1 }}
                        value={f.name}
                        onChange={(e) => handleCustomFieldChange(idx, 'name', e.target.value, true)}
                      />
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="Display Label" 
                        style={{ flex: 1 }}
                        value={f.label}
                        onChange={(e) => handleCustomFieldChange(idx, 'label', e.target.value, true)}
                        readOnly
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditingCatId(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  <Save size={14} />
                  <span>Update Category</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

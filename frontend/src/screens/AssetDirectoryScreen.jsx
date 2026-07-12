import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { 
  Plus, 
  Search, 
  Filter, 
  History, 
  Calendar, 
  Wrench, 
  User, 
  Eye, 
  QrCode,
  Tag,
  DollarSign,
  MapPin,
  CalendarDays,
  FileCheck2,
  FolderOpen,
  Edit3,
  Save
} from 'lucide-react';

export default function AssetDirectoryScreen({ quickAction, clearQuickAction }) {
  const { 
    assets, 
    categories, 
    allocations, 
    maintenance, 
    users, 
    currentUser, 
    registerAsset,
    updateAssetDetails
  } = useContext(AppContext);

  // States
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCondition, setFilterCondition] = useState('');
  
  const [showRegModal, setShowRegModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);

  // Edit Form States
  const [editingAssetId, setEditingAssetId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editSerial, setEditSerial] = useState('');
  const [editCost, setEditCost] = useState('');
  const [editCondition, setEditCondition] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editShared, setEditShared] = useState(false);
  const [editStatus, setEditStatus] = useState('');
  const [editCustomAttrs, setEditCustomAttrs] = useState({});

  // Registration Form States
  const [name, setName] = useState('');
  const [catId, setCatId] = useState('');
  const [serial, setSerial] = useState('');
  const [cost, setCost] = useState('');
  const [condition, setCondition] = useState('Excellent');
  const [location, setLocation] = useState('');
  const [shared, setShared] = useState(false);
  const [acqDate, setAcqDate] = useState(new Date().toISOString().split('T')[0]);
  const [customAttrs, setCustomAttrs] = useState({});

  // Quick Action listener
  useEffect(() => {
    if (quickAction === 'register') {
      setShowRegModal(true);
      if (clearQuickAction) clearQuickAction();
    }
  }, [quickAction]);

  // Update dynamic custom fields when category changes in form
  const handleCategoryChange = (e) => {
    const selectedCatId = e.target.value;
    setCatId(selectedCatId);
    
    const cat = categories.find(c => c.id === selectedCatId);
    const newAttrs = {};
    if (cat?.customFields) {
      cat.customFields.forEach(f => {
        newAttrs[f.name] = '';
      });
    }
    setCustomAttrs(newAttrs);
  };

  const handleSaveAsset = (e) => {
    e.preventDefault();
    if (!name || !catId) return;

    const assetData = {
      name,
      categoryId: catId,
      serialNumber: serial || `SN-${Math.floor(100000 + Math.random() * 900000)}`,
      cost: parseFloat(cost) || 0,
      condition,
      location,
      shared,
      acquisitionDate: acqDate,
      ...customAttrs
    };

    registerAsset(assetData);
    
    // Reset Form
    setName('');
    setCatId('');
    setSerial('');
    setCost('');
    setCondition('Excellent');
    setLocation('');
    setShared(false);
    setCustomAttrs({});
    setShowRegModal(false);
  };

  // Open Edit Handler
  const handleOpenEdit = (asset) => {
    setEditingAssetId(asset.id);
    setEditName(asset.name);
    setEditSerial(asset.serialNumber);
    setEditCost(asset.cost);
    setEditCondition(asset.condition);
    setEditLocation(asset.location || '');
    setEditShared(asset.shared);
    setEditStatus(asset.status);
    
    // Custom attrs setup
    const cat = categories.find(c => c.id === asset.categoryId);
    const attrs = {};
    if (cat?.customFields) {
      cat.customFields.forEach(f => {
        attrs[f.name] = asset[f.name] || '';
      });
    }
    setEditCustomAttrs(attrs);
  };

  // Save Edit Handler
  const handleUpdateAssetSubmit = (e) => {
    e.preventDefault();
    if (!editName.trim()) return;

    const fields = {
      name: editName,
      serialNumber: editSerial,
      cost: parseFloat(editCost) || 0,
      condition: editCondition,
      location: editLocation,
      shared: editShared,
      status: editStatus,
      ...editCustomAttrs
    };

    updateAssetDetails(editingAssetId, fields);
    
    // Sync active details if panel is open
    if (selectedAsset && selectedAsset.id === editingAssetId) {
      setSelectedAsset({ ...selectedAsset, ...fields });
    }
    
    setEditingAssetId(null);
  };

  // Filters logic
  const filteredAssets = assets.filter(a => {
    const matchesSearch = 
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.id.toLowerCase().includes(search.toLowerCase()) ||
      a.serialNumber.toLowerCase().includes(search.toLowerCase()) ||
      (a.location && a.location.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory = filterCategory ? a.categoryId === filterCategory : true;
    const matchesStatus = filterStatus ? a.status === filterStatus : true;
    const matchesCondition = filterCondition ? a.condition === filterCondition : true;

    return matchesSearch && matchesCategory && matchesStatus && matchesCondition;
  });

  // Fetch histories for detail view
  const getAssetHistory = (assetId) => {
    const assetAllocations = allocations
      .filter(al => al.assetId === assetId)
      .map(al => {
        const who = users.find(u => u.id === al.allocateToId) || { name: 'Department' };
        return {
          id: al.id,
          type: 'Allocation',
          date: al.allocationDate,
          details: `Allocated to ${who.name} (${al.type === 'employee' ? 'Employee' : 'Department'})`,
          status: al.status === 'Active' ? 'Active' : 'Completed',
          meta: al.expectedReturnDate ? `Expected Return: ${al.expectedReturnDate}` : 'No Return Date'
        };
      });

    const assetMaintenance = maintenance
      .filter(m => m.assetId === assetId)
      .map(m => ({
        id: m.id,
        type: 'Maintenance',
        date: m.dateRaised,
        details: `Issue: ${m.description}`,
        status: m.status,
        meta: `Priority: ${m.priority} ${m.technician ? `| Tech: ${m.technician}` : ''}`
      }));

    return [...assetAllocations, ...assetMaintenance].sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const isManager = (currentUser.role === 'Admin' || currentUser.role === 'Asset Manager');

  return (
    <div className="animate-fade-in" style={{ fontFamily: 'var(--font-sans)', display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Title Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>Asset DirectoryHub</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Central repository of corporate hardware, facilities, vehicles, and items.
          </p>
        </div>
        {isManager && (
          <button className="btn btn-primary" onClick={() => setShowRegModal(true)}>
            <Plus size={16} />
            <span>Register Asset</span>
          </button>
        )}
      </div>

      {/* Filters Bar */}
      <div className="glass-panel" style={{
        padding: '1.25rem',
        marginBottom: '1.5rem',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        alignItems: 'center'
      }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            className="form-control" 
            placeholder="Search Tag, Serial, Name or Location..." 
            style={{ paddingLeft: '2.5rem' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Category Filter */}
        <select 
          className="form-select" 
          style={{ width: '160px' }}
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        {/* Status Filter */}
        <select 
          className="form-select" 
          style={{ width: '160px' }}
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="Available">Available</option>
          <option value="Allocated">Allocated</option>
          <option value="Reserved">Reserved</option>
          <option value="Under Maintenance">Under Maintenance</option>
          <option value="Lost">Lost</option>
          <option value="Retired">Retired</option>
          <option value="Disposed">Disposed</option>
        </select>

        {/* Condition Filter */}
        <select 
          className="form-select" 
          style={{ width: '160px' }}
          value={filterCondition}
          onChange={(e) => setFilterCondition(e.target.value)}
        >
          <option value="">All Conditions</option>
          <option value="Excellent">Excellent</option>
          <option value="Good">Good</option>
          <option value="Fair">Fair</option>
          <option value="Poor">Poor</option>
        </select>
      </div>

      {/* Directory Table */}
      <div className="glass-panel" style={{ flex: 1, padding: 0, overflow: 'hidden' }}>
        <div className="table-container" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th>Asset Tag</th>
                <th>Asset Name</th>
                <th>Category</th>
                <th>Serial Number</th>
                <th>Condition</th>
                <th>Location</th>
                <th>Bookable</th>
                <th>Lifecycle Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    <FolderOpen size={36} style={{ marginBottom: '0.75rem', opacity: 0.5 }} />
                    <p>No matching assets found.</p>
                  </td>
                </tr>
              ) : (
                filteredAssets.map(asset => {
                  const cat = categories.find(c => c.id === asset.categoryId);
                  return (
                    <tr key={asset.id}>
                      <td style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Tag size={13} style={{ color: 'var(--accent-primary)' }} />
                          <span>{asset.id}</span>
                        </div>
                      </td>
                      <td style={{ fontWeight: '500' }}>{asset.name}</td>
                      <td>{cat ? cat.name : 'Unknown'}</td>
                      <td>{asset.serialNumber}</td>
                      <td>
                        <span style={{
                          color: asset.condition === 'Excellent' ? '#10b981' : asset.condition === 'Good' ? '#3b82f6' : asset.condition === 'Fair' ? '#f59e0b' : '#ef4444',
                          fontWeight: '500'
                        }}>
                          {asset.condition}
                        </span>
                      </td>
                      <td>{asset.location || 'N/A'}</td>
                      <td>
                        <span style={{
                          color: asset.shared ? 'var(--status-available)' : 'var(--text-muted)',
                          fontSize: '12px'
                        }}>
                          {asset.shared ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge badge-${asset.status.toLowerCase().replace(' ', '-')}`}>
                          {asset.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
                            onClick={() => setSelectedAsset(asset)}
                          >
                            <Eye size={12} />
                            <span>Details</span>
                          </button>
                          {isManager && (
                            <button 
                              className="btn btn-secondary" 
                              style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
                              onClick={() => handleOpenEdit(asset)}
                            >
                              <Edit3 size={11} />
                              <span>Edit</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* REGISTRATION MODAL */}
      {showRegModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          padding: '1.5rem'
        }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '580px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={20} style={{ color: 'var(--accent-primary)' }} />
              <span>Register New ERP Asset</span>
            </h3>
            
            <form onSubmit={handleSaveAsset}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Asset Name</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="e.g. iPad Air 5th Gen" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Asset Category</label>
                  <select 
                    className="form-select" 
                    value={catId} 
                    onChange={handleCategoryChange}
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Serial Number</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Optional (Autogenerated if empty)" 
                    value={serial} 
                    onChange={(e) => setSerial(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Acquisition Cost ($)</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    placeholder="e.g. 899" 
                    value={cost} 
                    onChange={(e) => setCost(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Initial Condition</label>
                  <select 
                    className="form-select" 
                    value={condition} 
                    onChange={(e) => setCondition(e.target.value)}
                  >
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Poor">Poor</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Physical Location</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="e.g. HQ Storage Locker 4" 
                    value={location} 
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Acquisition Date</label>
                  <input 
                    type="date" 
                    className="form-control" 
                    value={acqDate} 
                    onChange={(e) => setAcqDate(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Shared Resource / Bookable</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '40px' }}>
                    <input 
                      type="checkbox" 
                      id="shared-resource"
                      checked={shared}
                      onChange={(e) => setShared(e.target.checked)}
                      style={{ width: '18px', height: '18px', accentColor: 'var(--accent-primary)' }}
                    />
                    <label htmlFor="shared-resource" style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      Available for time-slot booking
                    </label>
                  </div>
                </div>
              </div>

              {/* DYNAMIC CATEGORY FIELDS */}
              {catId && categories.find(c => c.id === catId)?.customFields?.length > 0 && (
                <div style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--border-glass)',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  marginBottom: '1rem'
                }}>
                  <span style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase' }}>
                    Category specific fields
                  </span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    {categories.find(c => c.id === catId).customFields.map(f => (
                      <div className="form-group" key={f.name} style={{ marginBottom: 0 }}>
                        <label className="form-label">{f.label}</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          placeholder={`Enter ${f.label.toLowerCase()}`}
                          value={customAttrs[f.name] || ''}
                          onChange={(e) => setCustomAttrs({ ...customAttrs, [f.name]: e.target.value })}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowRegModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Asset</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingAssetId && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          padding: '1.5rem'
        }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '580px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Edit3 size={18} style={{ color: 'var(--accent-primary)' }} />
              <span>Modify Asset Specifications & Lifecycle</span>
            </h3>
            
            <form onSubmit={handleUpdateAssetSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Asset Name</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={editName} 
                    onChange={(e) => setEditName(e.target.value)}
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Manual Status Switch</label>
                  <select 
                    className="form-select"
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                  >
                    <option value="Available">Available</option>
                    <option value="Allocated">Allocated</option>
                    <option value="Reserved">Reserved</option>
                    <option value="Under Maintenance">Under Maintenance</option>
                    <option value="Lost">Lost</option>
                    <option value="Retired">Retired</option>
                    <option value="Disposed">Disposed</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Serial Number</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={editSerial} 
                    onChange={(e) => setEditSerial(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Acquisition Cost ($)</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    value={editCost} 
                    onChange={(e) => setEditCost(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Asset Condition</label>
                  <select 
                    className="form-select" 
                    value={editCondition} 
                    onChange={(e) => setEditCondition(e.target.value)}
                  >
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Poor">Poor</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Physical Location</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={editLocation} 
                    onChange={(e) => setEditLocation(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '40px' }}>
                  <input 
                    type="checkbox" 
                    id="edit-shared"
                    checked={editShared}
                    onChange={(e) => setEditShared(e.target.checked)}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--accent-primary)' }}
                  />
                  <label htmlFor="edit-shared" style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    Make this item a public shared/bookable resource
                  </label>
                </div>
              </div>

              {/* DYNAMIC CATEGORY ATTRIBUTES */}
              {Object.keys(editCustomAttrs).length > 0 && (
                <div style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--border-glass)',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  marginBottom: '1rem'
                }}>
                  <span style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase' }}>
                    Specifications Attributes
                  </span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    {Object.keys(editCustomAttrs).map(attrName => {
                      const displayLabel = attrName.charAt(0).toUpperCase() + attrName.slice(1);
                      return (
                        <div className="form-group" key={attrName} style={{ marginBottom: 0 }}>
                          <label className="form-label">{displayLabel}</label>
                          <input 
                            type="text" 
                            className="form-control" 
                            value={editCustomAttrs[attrName] || ''}
                            onChange={(e) => setEditCustomAttrs({ ...editCustomAttrs, [attrName]: e.target.value })}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditingAssetId(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  <Save size={14} />
                  <span>Update Details</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL SIDE DRAWER / MODAL WITH TIMELINE */}
      {selectedAsset && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end', zIndex: 1000
        }} onClick={() => setSelectedAsset(null)}>
          <div className="glass-panel animate-fade-in" style={{
            width: '100%', maxWidth: '520px', height: '100%', borderRadius: '16px 0 0 16px',
            borderRight: 'none', display: 'flex', flexDirection: 'column', padding: '2.5rem',
            overflowY: 'auto'
          }} onClick={(e) => e.stopPropagation()}>
            
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div>
                <span className={`badge badge-${selectedAsset.status.toLowerCase().replace(' ', '-')}`} style={{ marginBottom: '6px' }}>
                  {selectedAsset.status}
                </span>
                <h3 style={{ fontSize: '1.5rem' }}>{selectedAsset.name}</h3>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Tag ID: {selectedAsset.id}</span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(255,255,255,0.04)',
                  border: '1px solid var(--border-glass)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--text-secondary)', cursor: 'pointer'
                }} onClick={() => alert(`QR Code Tag for ${selectedAsset.id} generated!`)}>
                  <QrCode size={18} />
                </div>
              </div>
            </div>

            {/* Asset Metadata Grid */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px',
              padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px',
              border: '1px solid var(--border-glass)', marginBottom: '2rem', fontSize: '13px'
            }}>
              <div>
                <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>Serial Number</span>
                <span style={{ fontWeight: '500' }}>{selectedAsset.serialNumber}</span>
              </div>
              <div>
                <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>Acquisition Cost</span>
                <span style={{ fontWeight: '500', display: 'flex', alignItems: 'center', gap: '2px' }}>
                  <DollarSign size={12} />
                  {selectedAsset.cost}
                </span>
              </div>
              <div>
                <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>Condition</span>
                <span style={{ fontWeight: '500' }}>{selectedAsset.condition}</span>
              </div>
              <div>
                <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>Location</span>
                <span style={{ fontWeight: '500', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={12} />
                  {selectedAsset.location || 'N/A'}
                </span>
              </div>
              <div>
                <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>Acquisition Date</span>
                <span style={{ fontWeight: '500', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CalendarDays size={12} />
                  {selectedAsset.acquisitionDate || 'N/A'}
                </span>
              </div>
              <div>
                <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>Shared booking flag</span>
                <span style={{ fontWeight: '500' }}>{selectedAsset.shared ? 'Yes (Public Calendar)' : 'No (Direct Allocate Only)'}</span>
              </div>
            </div>

            {/* Custom attributes display */}
            {categories.find(c => c.id === selectedAsset.categoryId)?.customFields?.length > 0 && (
              <div style={{ marginBottom: '2rem' }}>
                <h4 style={{ fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>Dynamic Specifications</h4>
                <div style={{
                  display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px',
                  padding: '12px 16px', background: 'rgba(139,92,246,0.03)', borderRadius: '10px',
                  border: '1px solid rgba(139,92,246,0.1)', fontSize: '13px'
                }}>
                  {categories.find(c => c.id === selectedAsset.categoryId).customFields.map(f => (
                    <div key={f.name}>
                      <span style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '11px' }}>{f.label}</span>
                      <span style={{ fontWeight: '500' }}>{selectedAsset[f.name] || 'N/A'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Timeline History */}
            <div style={{ flex: 1 }}>
              <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <History size={16} style={{ color: 'var(--accent-primary)' }} />
                <span>Lifecycle History Log</span>
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderLeft: '2px dashed var(--border-glass)', marginLeft: '8px', paddingLeft: '20px' }}>
                {getAssetHistory(selectedAsset.id).length === 0 ? (
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>No timeline logs registered for this asset yet.</span>
                ) : (
                  getAssetHistory(selectedAsset.id).map((hist, i) => (
                    <div key={i} style={{ position: 'relative' }}>
                      <div style={{
                        position: 'absolute', left: '-27px', top: '3px', width: '12px', height: '12px', borderRadius: '50%',
                        background: hist.type === 'Allocation' ? 'var(--accent-secondary)' : '#ef4444',
                        border: '2px solid var(--bg-secondary)'
                      }} />
                      <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)' }}>{hist.date}</span>
                      <span style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginTop: '2px', color: 'var(--text-primary)' }}>{hist.details}</span>
                      <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{hist.meta}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <button className="btn btn-secondary" style={{ marginTop: '2rem', width: '100%' }} onClick={() => setSelectedAsset(null)}>
              Close Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

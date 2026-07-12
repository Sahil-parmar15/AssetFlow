import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { 
  Network, 
  Plus, 
  ArrowRightLeft, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  RotateCcw,
  Clock,
  User,
  Building
} from 'lucide-react';

export default function AssetAllocationScreen() {
  const { 
    assets, 
    users, 
    currentUser, 
    allocations, 
    transfers, 
    allocateAsset, 
    requestTransfer, 
    approveTransfer, 
    rejectTransfer, 
    returnAsset,
    departments
  } = useContext(AppContext);

  // Tabs
  const [activeTab, setActiveTab] = useState('allocations');

  // Allocation Form States
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [targetType, setTargetType] = useState('employee'); // 'employee' or 'department'
  const [targetId, setTargetId] = useState('');
  const [expectedReturn, setExpectedReturn] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [conflictHolder, setConflictHolder] = useState(null);

  // Return Asset Form States
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnAssetId, setReturnAssetId] = useState('');
  const [returnCondition, setReturnCondition] = useState('Good');
  const [returnNotes, setReturnNotes] = useState('');

  const handleAllocateSubmit = (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setConflictHolder(null);

    if (!selectedAssetId || !targetId) {
      setFormError('Please select both an asset and a recipient.');
      return;
    }

    const res = allocateAsset(selectedAssetId, targetId, targetType, expectedReturn);
    
    if (res.success) {
      setFormSuccess('Asset successfully allocated!');
      setSelectedAssetId('');
      setTargetId('');
      setExpectedReturn('');
    } else if (res.conflict) {
      setFormError(res.message);
      setConflictHolder({
        assetId: selectedAssetId,
        holderName: res.currentHolder,
        holderId: res.currentHolderId
      });
    } else {
      setFormError(res.message);
    }
  };

  const handleInitiateTransfer = () => {
    if (!conflictHolder) return;
    const res = requestTransfer(conflictHolder.assetId, currentUser.id);
    if (res.success) {
      setFormSuccess('Transfer request sent successfully to current holder!');
      setFormError('');
      setConflictHolder(null);
    } else {
      setFormError(res.message);
    }
  };

  const handleOpenReturn = (assetId) => {
    setReturnAssetId(assetId);
    setShowReturnModal(true);
  };

  const handleReturnSubmit = (e) => {
    e.preventDefault();
    const res = returnAsset(returnAssetId, returnNotes, returnCondition);
    if (res.success) {
      alert('Asset checked in successfully and marked as Available!');
      setShowReturnModal(false);
      setReturnAssetId('');
      setReturnNotes('');
    }
  };

  const activeAllocList = allocations.filter(al => al.status === 'Active').map(al => {
    const asset = assets.find(a => a.id === al.assetId);
    const recipient = al.type === 'employee' 
      ? users.find(u => u.id === al.allocateToId) 
      : departments.find(d => d.id === al.allocateToId);
    const allocator = users.find(u => u.id === al.allocatedBy);
    return { ...al, asset, recipient, allocator };
  });

  const getRecipientName = (al) => {
    return al.recipient ? al.recipient.name : 'Unknown Recipient';
  };

  return (
    <div className="animate-fade-in" style={{ fontFamily: 'var(--font-sans)' }}>
      {/* Title */}
      <div style={{ marginBottom: '2rem' }}>
        <h1>Allocations & Transfers</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Assign equipment to employees or departments, track return checklists, and request device transfers.
        </p>
      </div>

      {/* Tabs Menu */}
      <div className="tabs-container">
        <button 
          className={`tab-btn ${activeTab === 'allocations' ? 'active' : ''}`}
          onClick={() => setActiveTab('allocations')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Network size={16} />
          <span>Active Allocations & Returns</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'transfers' ? 'active' : ''}`}
          onClick={() => setActiveTab('transfers')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <ArrowRightLeft size={16} />
          <span>Transfer Request Workflow</span>
        </button>
      </div>

      {/* TAB A: ALLOCATIONS */}
      {activeTab === 'allocations' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem', alignItems: 'flex-start' }}>
          {/* Allocation Form Panel */}
          <div className="glass-panel">
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Plus size={18} style={{ color: 'var(--accent-primary)' }} />
              <span>Allocate Asset</span>
            </h3>

            {formError && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                color: '#ef4444',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                marginBottom: '1.25rem'
              }}>
                <div>{formError}</div>
                {conflictHolder && (
                  <button 
                    onClick={handleInitiateTransfer}
                    className="btn"
                    style={{
                      background: 'var(--accent-primary)',
                      color: 'white',
                      border: 'none',
                      padding: '6px 12px',
                      fontSize: '11px',
                      borderRadius: '6px',
                      marginTop: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    Send Transfer Request
                  </button>
                )}
              </div>
            )}

            {formSuccess && (
              <div style={{
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                color: '#10b981',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                marginBottom: '1.25rem'
              }}>
                {formSuccess}
              </div>
            )}

            <form onSubmit={handleAllocateSubmit}>
              {/* Select Asset */}
              <div className="form-group">
                <label className="form-label">Asset to Allocate</label>
                <select 
                  className="form-select" 
                  value={selectedAssetId}
                  onChange={(e) => setSelectedAssetId(e.target.value)}
                  required
                >
                  <option value="">Choose Asset...</option>
                  {assets.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.id}) - {a.status}
                    </option>
                  ))}
                </select>
              </div>

              {/* Recipient Type */}
              <div className="form-group">
                <label className="form-label">Allocate To Type</label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button 
                    type="button" 
                    className={`btn ${targetType === 'employee' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flex: 1, padding: '8px' }}
                    onClick={() => { setTargetType('employee'); setTargetId(''); }}
                  >
                    <User size={14} />
                    <span>Employee</span>
                  </button>
                  <button 
                    type="button" 
                    className={`btn ${targetType === 'department' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flex: 1, padding: '8px' }}
                    onClick={() => { setTargetType('department'); setTargetId(''); }}
                  >
                    <Building size={14} />
                    <span>Department</span>
                  </button>
                </div>
              </div>

              {/* Recipient Selector */}
              <div className="form-group">
                <label className="form-label">Select Recipient</label>
                <select 
                  className="form-select"
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                  required
                >
                  <option value="">Select recipient...</option>
                  {targetType === 'employee' ? (
                    users.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.department})</option>
                    ))
                  ) : (
                    departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))
                  )}
                </select>
              </div>

              {/* Expected Return Date */}
              <div className="form-group">
                <label className="form-label">Expected Return Date (Optional)</label>
                <input 
                  type="date" 
                  className="form-control" 
                  value={expectedReturn}
                  onChange={(e) => setExpectedReturn(e.target.value)}
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: '100%', padding: '10px 12px' }}
                disabled={currentUser.role === 'Employee'}
              >
                Allocate
              </button>
              {currentUser.role === 'Employee' && (
                <span style={{ display: 'block', fontSize: '11px', color: '#ef4444', textAlign: 'center', marginTop: '6px' }}>
                  Only Managers or Admins can allocate assets.
                </span>
              )}
            </form>
          </div>

          {/* Allocations Directory Panel */}
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem' }}>Active Allocations Directory</h3>
            
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Asset</th>
                    <th>Recipient</th>
                    <th>Expected Return</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {activeAllocList.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        No active asset allocations.
                      </td>
                    </tr>
                  ) : (
                    activeAllocList.map(al => {
                      const today = new Date().toISOString().split('T')[0];
                      const isOverdue = al.expectedReturnDate && al.expectedReturnDate < today;
                      return (
                        <tr key={al.id}>
                          <td>
                            <span style={{ display: 'block', fontWeight: '600' }}>{al.asset?.name || 'Unknown'}</span>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Tag ID: {al.assetId}</span>
                          </td>
                          <td>
                            <span style={{ display: 'block', fontWeight: '500' }}>{getRecipientName(al)}</span>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>Type: {al.type}</span>
                          </td>
                          <td>
                            {al.expectedReturnDate ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Clock size={12} style={{ color: isOverdue ? '#ef4444' : 'var(--text-secondary)' }} />
                                <span style={{ color: isOverdue ? '#ef4444' : 'var(--text-secondary)', fontWeight: isOverdue ? '600' : '400' }}>
                                  {al.expectedReturnDate} {isOverdue && '(OVERDUE)'}
                                </span>
                              </div>
                            ) : (
                              <span style={{ color: 'var(--text-muted)' }}>N/A</span>
                            )}
                          </td>
                          <td>
                            <span className={`badge ${isOverdue ? 'badge-maintenance' : 'badge-allocated'}`}>
                              {isOverdue ? 'Overdue' : 'Active'}
                            </span>
                          </td>
                          <td>
                            {(currentUser.role === 'Admin' || currentUser.role === 'Asset Manager') ? (
                              <button 
                                className="btn btn-secondary"
                                style={{ padding: '6px 10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                                onClick={() => handleOpenReturn(al.assetId)}
                              >
                                <RotateCcw size={12} />
                                <span>Check In</span>
                              </button>
                            ) : (
                              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Locked</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB B: TRANSFERS */}
      {activeTab === 'transfers' && (
        <div className="glass-panel animate-fade-in">
          <div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>Asset Transfer Requests</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Approval workflow: Employee A requests device held by Employee B. Asset Manager or Department Head reviews and signs off on the reallocation.
            </p>
          </div>

          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Request ID</th>
                  <th>Asset Target</th>
                  <th>Requester</th>
                  <th>Current Holder</th>
                  <th>Requested Date</th>
                  <th>Status</th>
                  <th>Approval Action</th>
                </tr>
              </thead>
              <tbody>
                {transfers.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No asset transfer requests found.
                    </td>
                  </tr>
                ) : (
                  transfers.map(tr => {
                    const asset = assets.find(a => a.id === tr.assetId);
                    const requester = users.find(u => u.id === tr.requesterId);
                    const currentHolder = users.find(u => u.id === tr.currentHolderId);
                    
                    // Approval permissions check
                    const canApprove = (currentUser.role === 'Admin' || currentUser.role === 'Asset Manager');

                    return (
                      <tr key={tr.id}>
                        <td style={{ fontWeight: '600' }}>{tr.id}</td>
                        <td>
                          <span style={{ display: 'block', fontWeight: '500' }}>{asset ? asset.name : 'Unknown Asset'}</span>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ID: {tr.assetId}</span>
                        </td>
                        <td>{requester ? requester.name : 'Unknown'}</td>
                        <td>{currentHolder ? currentHolder.name : 'Unknown'}</td>
                        <td>{tr.dateRequested}</td>
                        <td>
                          <span className={`badge ${
                            tr.status === 'Approved' ? 'badge-available' : 
                            tr.status === 'Rejected' ? 'badge-maintenance' : 'badge-reserved'
                          }`}>
                            {tr.status}
                          </span>
                        </td>
                        <td>
                          {tr.status === 'Pending' ? (
                            canApprove ? (
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button 
                                  className="btn btn-primary"
                                  style={{ padding: '6px 12px', fontSize: '11px', background: 'var(--status-available)' }}
                                  onClick={() => approveTransfer(tr.id)}
                                >
                                  <CheckCircle2 size={12} />
                                  <span>Approve</span>
                                </button>
                                <button 
                                  className="btn btn-danger"
                                  style={{ padding: '6px 12px', fontSize: '11px' }}
                                  onClick={() => rejectTransfer(tr.id)}
                                >
                                  <XCircle size={12} />
                                  <span>Decline</span>
                                </button>
                              </div>
                            ) : (
                              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Awaiting Manager Signoff</span>
                            )
                          ) : (
                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Completed</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CHECK IN (RETURN) MODAL */}
      {showReturnModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          padding: '1.5rem'
        }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '460px' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem' }}>Asset Return Check-in</h3>
            
            <form onSubmit={handleReturnSubmit}>
              <div className="form-group">
                <label className="form-label">Asset ID to Return</label>
                <input type="text" className="form-control" value={returnAssetId} readOnly />
              </div>

              <div className="form-group">
                <label className="form-label">Current Condition State</label>
                <select 
                  className="form-select" 
                  value={returnCondition}
                  onChange={(e) => setReturnCondition(e.target.value)}
                >
                  <option value="Excellent">Excellent</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                  <option value="Poor">Poor (Damaged)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Check-in Notes</label>
                <textarea 
                  className="form-textarea" 
                  rows="3" 
                  placeholder="Describe status on return (e.g. minor scratches on casing, chargers returned)"
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowReturnModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Process Return</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

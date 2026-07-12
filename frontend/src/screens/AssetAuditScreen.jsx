import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { 
  ClipboardCheck, 
  Plus, 
  Check, 
  AlertTriangle, 
  X, 
  Lock, 
  FileSpreadsheet, 
  Eye, 
  Unlock,
  AlertOctagon
} from 'lucide-react';

export default function AssetAuditScreen() {
  const { 
    audits, 
    assets, 
    users, 
    departments, 
    createAuditCycle, 
    updateAuditAsset, 
    closeAuditCycle,
    currentUser
  } = useContext(AppContext);

  // States
  const [activeCycleId, setActiveCycleId] = useState(null); // active audit workboard
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Create Form States
  const [auditName, setAuditName] = useState('');
  const [scope, setScope] = useState('IT Department'); // filter scope by department
  const [selectedAuditors, setSelectedAuditors] = useState([]);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!auditName.trim() || selectedAuditors.length === 0) return;

    createAuditCycle(auditName, scope, selectedAuditors, startDate, endDate);
    
    // Reset
    setAuditName('');
    setScope('IT Department');
    setSelectedAuditors([]);
    setShowCreateModal(false);
  };

  const handleAuditorCheckbox = (userId, checked) => {
    if (checked) {
      setSelectedAuditors([...selectedAuditors, userId]);
    } else {
      setSelectedAuditors(selectedAuditors.filter(id => id !== userId));
    }
  };

  // Find assets in the active cycle scope
  const getScopeAssets = (cycle) => {
    if (!cycle) return [];
    
    // Filter assets whose holder belongs to the scoped department, or that match location
    return assets.filter(asset => {
      // Find asset holder
      if (asset.holderId) {
        const holderUser = users.find(u => u.id === asset.holderId);
        if (holderUser && holderUser.department === cycle.scope) {
          return true;
        }
      }
      // Or if the asset category or location matches, but department hierarchy matches best
      return false;
    });
  };

  const handleAssetAuditStatus = (cycleId, assetId, auditStatus) => {
    updateAuditAsset(cycleId, assetId, auditStatus);
  };

  const handleCloseCycle = (cycleId) => {
    const confirm = window.confirm("Are you sure you want to close this audit cycle? This will lock the audit data and automatically update missing assets status to 'Lost'.");
    if (confirm) {
      closeAuditCycle(cycleId);
      setActiveCycleId(null);
    }
  };

  const activeCycle = audits.find(a => a.id === activeCycleId);
  const scopeAssets = getScopeAssets(activeCycle);

  return (
    <div className="animate-fade-in" style={{ fontFamily: 'var(--font-sans)', display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Title */}
      <div style={{ display: 'flex', justifyContext: 'space-between', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>Asset Audit Verification</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Run scheduled audit verification cycles, reconcile physical inventory, and flag missing assets.
          </p>
        </div>
        {!activeCycleId && (
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={16} />
            <span>Create Audit Cycle</span>
          </button>
        )}
      </div>

      {/* AUDIT WORKBOARD DRAWER/VIEW */}
      {activeCycleId && activeCycle ? (
        <div className="glass-panel animate-fade-in" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid var(--border-glass)',
            paddingBottom: '1rem',
            marginBottom: '1.25rem'
          }}>
            <div>
              <span className={`badge ${activeCycle.status === 'Active' ? 'badge-reserved' : 'badge-available'}`} style={{ marginBottom: '6px' }}>
                Cycle: {activeCycle.status}
              </span>
              <h3 style={{ fontSize: '1.25rem' }}>{activeCycle.name}</h3>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Scope: {activeCycle.scope} | Date Range: {activeCycle.startDate} to {activeCycle.endDate}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {activeCycle.status === 'Active' && (
                <button 
                  className="btn btn-primary" 
                  style={{ background: 'var(--status-maintenance)' }}
                  onClick={() => handleCloseCycle(activeCycle.id)}
                >
                  <Lock size={14} />
                  <span>Lock & Close Cycle</span>
                </button>
              )}
              <button className="btn btn-secondary" onClick={() => setActiveCycleId(null)}>
                Exit Workboard
              </button>
            </div>
          </div>

          {/* Verification Workspace */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', flex: 1, alignItems: 'flex-start' }}>
            
            {/* Assets list to verify */}
            <div className="glass-panel" style={{ background: 'rgba(255,255,255,0.01)', padding: 0 }}>
              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Asset</th>
                      <th>Serial</th>
                      <th>Condition</th>
                      <th>Assigned Auditor Check</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scopeAssets.length === 0 ? (
                      <tr>
                        <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                          No assets found under this department scope ({activeCycle.scope}).
                        </td>
                      </tr>
                    ) : (
                      scopeAssets.map(asset => {
                        const currentVal = activeCycle.results[asset.id] || 'Pending';
                        const isLocked = activeCycle.status === 'Completed';

                        return (
                          <tr key={asset.id}>
                            <td>
                              <span style={{ display: 'block', fontWeight: '600' }}>{asset.name}</span>
                              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Tag: {asset.id}</span>
                            </td>
                            <td>{asset.serialNumber}</td>
                            <td>{asset.condition}</td>
                            <td>
                              {isLocked ? (
                                <span className={`badge ${
                                  currentVal === 'Verified' ? 'badge-available' : 
                                  currentVal === 'Missing' ? 'badge-maintenance' : 'badge-reserved'
                                }`}>
                                  {currentVal}
                                </span>
                              ) : (
                                <div style={{ display: 'flex', gap: '6px' }}>
                                  <button
                                    onClick={() => handleAssetAuditStatus(activeCycle.id, asset.id, 'Verified')}
                                    style={{
                                      padding: '5px 10px', fontSize: '11px', borderRadius: '6px', cursor: 'pointer',
                                      background: currentVal === 'Verified' ? 'var(--status-available-bg)' : 'transparent',
                                      color: currentVal === 'Verified' ? 'var(--status-available)' : 'var(--text-secondary)',
                                      border: '1px solid',
                                      borderColor: currentVal === 'Verified' ? 'var(--status-available)' : 'var(--border-glass)'
                                    }}
                                  >
                                    Verified
                                  </button>
                                  <button
                                    onClick={() => handleAssetAuditStatus(activeCycle.id, asset.id, 'Missing')}
                                    style={{
                                      padding: '5px 10px', fontSize: '11px', borderRadius: '6px', cursor: 'pointer',
                                      background: currentVal === 'Missing' ? 'var(--status-maintenance-bg)' : 'transparent',
                                      color: currentVal === 'Missing' ? 'var(--status-maintenance)' : 'var(--text-secondary)',
                                      border: '1px solid',
                                      borderColor: currentVal === 'Missing' ? 'var(--status-maintenance)' : 'var(--border-glass)'
                                    }}
                                  >
                                    Missing
                                  </button>
                                  <button
                                    onClick={() => handleAssetAuditStatus(activeCycle.id, asset.id, 'Damaged')}
                                    style={{
                                      padding: '5px 10px', fontSize: '11px', borderRadius: '6px', cursor: 'pointer',
                                      background: currentVal === 'Damaged' ? 'var(--status-reserved-bg)' : 'transparent',
                                      color: currentVal === 'Damaged' ? 'var(--status-reserved)' : 'var(--text-secondary)',
                                      border: '1px solid',
                                      borderColor: currentVal === 'Damaged' ? 'var(--status-reserved)' : 'var(--border-glass)'
                                    }}
                                  >
                                    Damaged
                                  </button>
                                </div>
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

            {/* Discrepancy report preview */}
            <div className="glass-panel" style={{ background: 'rgba(255,255,255,0.015)' }}>
              <h4 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertOctagon size={16} style={{ color: '#ef4444' }} />
                <span>Discrepancy Report Preview</span>
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {Object.keys(activeCycle.results).filter(k => activeCycle.results[k] !== 'Verified').length === 0 ? (
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                    No discrepancies flagged yet. All checked items match specifications.
                  </span>
                ) : (
                  Object.keys(activeCycle.results).filter(k => activeCycle.results[k] !== 'Verified').map(assetId => {
                    const assetObj = assets.find(a => a.id === assetId);
                    const statusVal = activeCycle.results[assetId];
                    return (
                      <div key={assetId} style={{
                        padding: '10px 12px',
                        background: 'rgba(239, 68, 68, 0.03)',
                        border: '1px solid rgba(239, 68, 68, 0.12)',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}>
                        <span style={{ display: 'block', fontWeight: '600', color: 'var(--text-primary)' }}>
                          {assetObj ? assetObj.name : 'Asset'} ({assetId})
                        </span>
                        <span style={{ display: 'block', color: '#ef4444', marginTop: '2px', fontWeight: '500' }}>
                          Reported: {statusVal}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>
        </div>
      ) : (
        /* AUDITS INDEX LIST */
        <div className="glass-panel animate-fade-in">
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Active & Historical Audits</h3>
          
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Cycle ID</th>
                  <th>Audit Cycle Name</th>
                  <th>Department Scope</th>
                  <th>Assigned Auditors</th>
                  <th>Schedule Range</th>
                  <th>Status</th>
                  <th>Auditor Desk</th>
                </tr>
              </thead>
              <tbody>
                {audits.map(aud => {
                  const auditorNames = aud.auditors.map(id => {
                    const u = users.find(usr => usr.id === id);
                    return u ? u.name : 'Unknown';
                  }).join(', ');

                  return (
                    <tr key={aud.id}>
                      <td style={{ fontWeight: '600' }}>{aud.id}</td>
                      <td style={{ fontWeight: '500' }}>{aud.name}</td>
                      <td>{aud.scope}</td>
                      <td>{auditorNames}</td>
                      <td>{aud.startDate} to {aud.endDate}</td>
                      <td>
                        <span className={`badge ${aud.status === 'Active' ? 'badge-reserved' : 'badge-available'}`}>
                          {aud.status}
                        </span>
                      </td>
                      <td>
                        <button 
                          className="btn btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                          onClick={() => setActiveCycleId(aud.id)}
                        >
                          <Eye size={12} />
                          <span>{aud.status === 'Active' ? 'Enter Desk' : 'View Report'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE AUDIT CYCLE MODAL */}
      {showCreateModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          padding: '1.5rem'
        }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '500px' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem' }}>Create Verification Audit Cycle</h3>

            <form onSubmit={handleCreateSubmit}>
              <div className="form-group">
                <label className="form-label">Audit Cycle Name</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g. Q4 Electronics Verification" 
                  value={auditName}
                  onChange={(e) => setAuditName(e.target.value)}
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Department Scope</label>
                <select 
                  className="form-select"
                  value={scope}
                  onChange={(e) => setScope(e.target.value)}
                  required
                >
                  {departments.map(d => (
                    <option key={d.id} value={d.name}>{d.name}</option>
                  ))}
                </select>
              </div>

              {/* Auditors checkboxes */}
              <div className="form-group">
                <label className="form-label">Assign Auditor(s)</label>
                <div style={{
                  maxHeight: '120px',
                  overflowY: 'auto',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--border-glass)',
                  padding: '10px',
                  borderRadius: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}>
                  {users.filter(u => u.role === 'Asset Manager' || u.role === 'Admin').map(u => (
                    <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input 
                        type="checkbox" 
                        id={`aud-${u.id}`}
                        checked={selectedAuditors.includes(u.id)}
                        onChange={(e) => handleAuditorCheckbox(u.id, e.target.checked)}
                        style={{ accentColor: 'var(--accent-primary)' }}
                      />
                      <label htmlFor={`aud-${u.id}`} style={{ fontSize: '13px' }}>
                        {u.name} ({u.role})
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Start Date</label>
                  <input 
                    type="date" 
                    className="form-control" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">End Date</label>
                  <input 
                    type="date" 
                    className="form-control" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required 
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Launch Audit</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

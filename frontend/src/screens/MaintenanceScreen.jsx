import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { 
  Wrench, 
  Plus, 
  Play, 
  CheckCircle, 
  XOctagon, 
  UserPlus, 
  AlertTriangle,
  ClipboardList
} from 'lucide-react';

export default function MaintenanceScreen({ quickAction, clearQuickAction }) {
  const { 
    maintenance, 
    assets, 
    currentUser, 
    raiseMaintenance, 
    updateMaintenanceStatus,
    users
  } = useContext(AppContext);

  // States
  const [activeTab, setActiveTab] = useState('tickets');
  
  // New Request Form States
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [description, setDescription] = useState('');
  const [photoSimulated, setPhotoSimulated] = useState(false);
  const [formSuccess, setFormSuccess] = useState('');
  const [showRaiseModal, setShowRaiseModal] = useState(false);

  // Technician Form States
  const [assigningTicketId, setAssigningTicketId] = useState(null);
  const [technicianName, setTechnicianName] = useState('');

  // Quick Action Listener
  useEffect(() => {
    if (quickAction === 'raise') {
      setShowRaiseModal(true);
      if (clearQuickAction) clearQuickAction();
    }
  }, [quickAction]);

  const handleRaiseSubmit = (e) => {
    e.preventDefault();
    setFormSuccess('');

    if (!selectedAssetId || !description.trim()) return;

    raiseMaintenance(selectedAssetId, priority, description, photoSimulated ? 'simulated_photo_blob.jpg' : null);
    
    setFormSuccess('Maintenance ticket raised successfully!');
    setSelectedAssetId('');
    setDescription('');
    setPriority('Medium');
    setPhotoSimulated(false);
    setShowRaiseModal(false);
  };

  const handleAssignSubmit = (e) => {
    e.preventDefault();
    if (!technicianName.trim() || !assigningTicketId) return;

    updateMaintenanceStatus(assigningTicketId, 'In Progress', technicianName);
    setAssigningTicketId(null);
    setTechnicianName('');
  };

  // Get requester user details
  const ticketList = maintenance.map(t => {
    const asset = assets.find(a => a.id === t.assetId);
    const requester = users.find(u => u.id === t.raisedBy);
    return { ...t, asset, requester };
  });

  return (
    <div className="animate-fade-in" style={{ fontFamily: 'var(--font-sans)', display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Title Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>Maintenance Management</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            File asset defect tickets, route requests through approvals, assign repair technicians, and track resolution.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowRaiseModal(true)}>
          <Plus size={16} />
          <span>Raise Ticket</span>
        </button>
      </div>

      {/* Tabs Menu */}
      <div className="tabs-container">
        <button 
          className={`tab-btn ${activeTab === 'tickets' ? 'active' : ''}`}
          onClick={() => setActiveTab('tickets')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <ClipboardList size={16} />
          <span>Defect Tickets Log ({ticketList.length})</span>
        </button>
      </div>

      {/* TAB: TICKETS LOG */}
      <div className="glass-panel" style={{ flex: 1, padding: 0, overflow: 'hidden' }}>
        <div className="table-container" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th>Ticket ID</th>
                <th>Asset Target</th>
                <th>Priority</th>
                <th>Defect Description</th>
                <th>Reporter</th>
                <th>Technician</th>
                <th>Workflow Status</th>
                <th>Action Controls</th>
              </tr>
            </thead>
            <tbody>
              {ticketList.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No maintenance tickets raised.
                  </td>
                </tr>
              ) : (
                ticketList.map(ticket => {
                  const isManager = (currentUser.role === 'Admin' || currentUser.role === 'Asset Manager');
                  return (
                    <tr key={ticket.id}>
                      <td style={{ fontWeight: '600' }}>{ticket.id}</td>
                      <td>
                        <span style={{ display: 'block', fontWeight: '500' }}>{ticket.asset?.name || 'Unknown'}</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Tag: {ticket.assetId}</span>
                      </td>
                      <td>
                        <span style={{
                          color: ticket.priority === 'High' ? '#ef4444' : ticket.priority === 'Medium' ? '#f59e0b' : '#3b82f6',
                          fontWeight: '600',
                          fontSize: '12px'
                        }}>
                          {ticket.priority}
                        </span>
                      </td>
                      <td style={{ maxWidth: '280px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {ticket.description}
                        {ticket.photo && (
                          <span style={{
                            display: 'inline-block',
                            fontSize: '9px',
                            background: 'rgba(255,255,255,0.06)',
                            color: 'var(--text-secondary)',
                            marginLeft: '6px',
                            padding: '1px 4px',
                            borderRadius: '4px'
                          }}>
                            Photo Attached
                          </span>
                        )}
                      </td>
                      <td>{ticket.requester ? ticket.requester.name : 'System'}</td>
                      <td>{ticket.technician || <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>}</td>
                      <td>
                        <span className={`badge ${
                          ticket.status === 'Resolved' ? 'badge-available' : 
                          ticket.status === 'Rejected' ? 'badge-disposed' : 
                          ticket.status === 'In Progress' ? 'badge-allocated' : 'badge-reserved'
                        }`}>
                          {ticket.status}
                        </span>
                      </td>
                      <td>
                        {/* Approval workflow buttons */}
                        {ticket.status === 'Pending' && (
                          isManager ? (
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button 
                                className="btn btn-primary"
                                style={{ padding: '4px 10px', fontSize: '11px', background: 'var(--status-available)' }}
                                onClick={() => updateMaintenanceStatus(ticket.id, 'Approved')}
                              >
                                Approve
                              </button>
                              <button 
                                className="btn btn-danger"
                                style={{ padding: '4px 10px', fontSize: '11px' }}
                                onClick={() => updateMaintenanceStatus(ticket.id, 'Rejected')}
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Awaiting Approval</span>
                          )
                        )}

                        {ticket.status === 'Approved' && (
                          isManager ? (
                            <button 
                              className="btn btn-primary"
                              style={{ padding: '4px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                              onClick={() => setAssigningTicketId(ticket.id)}
                            >
                              <UserPlus size={12} />
                              <span>Assign Tech</span>
                            </button>
                          ) : (
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Awaiting Tech Assignment</span>
                          )
                        )}

                        {ticket.status === 'In Progress' && (
                          isManager ? (
                            <button 
                              className="btn btn-primary"
                              style={{ padding: '4px 10px', fontSize: '11px', background: 'var(--status-available)', display: 'flex', alignItems: 'center', gap: '4px' }}
                              onClick={() => updateMaintenanceStatus(ticket.id, 'Resolved')}
                            >
                              <CheckCircle size={12} />
                              <span>Complete</span>
                            </button>
                          ) : (
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>In Repair</span>
                          )
                        )}

                        {(ticket.status === 'Resolved' || ticket.status === 'Rejected') && (
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Closed</span>
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

      {/* DEFECT REGISTRATION MODAL */}
      {showRaiseModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          padding: '1.5rem'
        }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '480px' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Wrench size={18} style={{ color: 'var(--accent-primary)' }} />
              <span>Raise Maintenance Defect Ticket</span>
            </h3>

            <form onSubmit={handleRaiseSubmit}>
              <div className="form-group">
                <label className="form-label">Asset Target</label>
                <select 
                  className="form-select"
                  value={selectedAssetId}
                  onChange={(e) => setSelectedAssetId(e.target.value)}
                  required
                >
                  <option value="">Select asset requiring repair...</option>
                  {assets.map(a => (
                    <option key={a.id} value={a.id}>{a.name} ({a.id}) - Current Condition: {a.condition}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Priority Level</label>
                <select 
                  className="form-select"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High (Immediate Action Required)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Issue Description</label>
                <textarea 
                  className="form-textarea" 
                  rows="4" 
                  placeholder="Describe the defect, breakdown or malfunction in detail..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Attach Photo Proof</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '40px' }}>
                  <input 
                    type="checkbox" 
                    id="photo-defect"
                    checked={photoSimulated}
                    onChange={(e) => setPhotoSimulated(e.target.checked)}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--accent-primary)' }}
                  />
                  <label htmlFor="photo-defect" style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    Simulate photo attachment (defect_proof.jpg)
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowRaiseModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">File Ticket</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TECHNICIAN ASSIGNMENT MODAL */}
      {assigningTicketId && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          padding: '1.5rem'
        }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '440px' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem' }}>Assign Repair Technician</h3>
            
            <form onSubmit={handleAssignSubmit}>
              <div className="form-group">
                <label className="form-label">Technician/Vendor Name</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g. Acme Tech Repairs, Bob Miller" 
                  value={technicianName} 
                  onChange={(e) => setTechnicianName(e.target.value)}
                  required 
                  autoFocus
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setAssigningTicketId(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  <Play size={14} />
                  <span>Start Repair Work</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

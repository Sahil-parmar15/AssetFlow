import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { 
  CalendarDays, 
  Clock, 
  MapPin, 
  Plus, 
  Calendar,
  X,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Edit2,
  Building
} from 'lucide-react';

export default function ResourceBookingScreen({ quickAction, clearQuickAction }) {
  const { 
    assets, 
    bookings, 
    bookResource, 
    rescheduleBooking,
    cancelBooking, 
    users, 
    currentUser,
    departments
  } = useContext(AppContext);

  // Filter bookable assets
  const bookableResources = assets.filter(a => a.shared);

  // States
  const [selectedResourceId, setSelectedResourceId] = useState(bookableResources[0]?.id || '');
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [bookOnBehalf, setBookOnBehalf] = useState(false);
  const [behalfDeptId, setBehalfDeptId] = useState('');
  
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showBookModal, setShowBookModal] = useState(false);

  // Rescheduling states
  const [reschedulingBookingId, setReschedulingBookingId] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleStart, setRescheduleStart] = useState('');
  const [rescheduleEnd, setRescheduleEnd] = useState('');
  const [rescheduleError, setRescheduleError] = useState('');

  // Quick Action Listener
  useEffect(() => {
    if (quickAction === 'book') {
      setShowBookModal(true);
      if (clearQuickAction) clearQuickAction();
    }
  }, [quickAction]);

  const handleBookingSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!selectedResourceId) {
      setErrorMsg('Please select a resource.');
      return;
    }

    const startDateTime = `${bookingDate}T${startTime}:00`;
    const endDateTime = `${bookingDate}T${endTime}:00`;

    let deptName = null;
    if (bookOnBehalf && behalfDeptId) {
      const dObj = departments.find(d => d.id === behalfDeptId);
      deptName = dObj ? dObj.name : null;
    }

    const res = bookResource(selectedResourceId, startDateTime, endDateTime, deptName);

    if (res.success) {
      setSuccessMsg('Booking confirmed successfully!');
      setShowBookModal(false);
      // Reset
      setStartTime('09:00');
      setEndTime('10:00');
      setBookOnBehalf(false);
      setBehalfDeptId('');
    } else {
      setErrorMsg(res.message);
    }
  };

  const handleOpenReschedule = (bk) => {
    setReschedulingBookingId(bk.id);
    const [date, time] = bk.start.split('T');
    const [, endTime] = bk.end.split('T');
    setRescheduleDate(date);
    setRescheduleStart(time.substring(0, 5));
    setRescheduleEnd(endTime.substring(0, 5));
    setRescheduleError('');
  };

  const handleRescheduleSubmit = (e) => {
    e.preventDefault();
    setRescheduleError('');

    const startDateTime = `${rescheduleDate}T${rescheduleStart}:00`;
    const endDateTime = `${rescheduleDate}T${rescheduleEnd}:00`;

    const res = rescheduleBooking(reschedulingBookingId, startDateTime, endDateTime);
    if (res.success) {
      alert('Reservation rescheduled successfully!');
      setReschedulingBookingId(null);
    } else {
      setRescheduleError(res.message);
    }
  };

  // Get active resource details
  const activeResource = assets.find(a => a.id === selectedResourceId) || bookableResources[0];

  // Get bookings for selected resource
  const activeBookings = bookings
    .filter(b => b.resourceId === selectedResourceId && b.status !== 'Cancelled')
    .map(b => {
      const userObj = users.find(u => u.id === b.userId);
      return { ...b, userObj };
    })
    .sort((a, b) => new Date(a.start) - new Date(b.start));

  const formatDateTime = (isoStr) => {
    const dt = new Date(isoStr);
    const date = dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const time = dt.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });
    return { date, time };
  };

  const isDeptHeadOrHigher = currentUser.role === 'Department Head' || currentUser.role === 'Asset Manager' || currentUser.role === 'Admin';

  return (
    <div className="animate-fade-in" style={{ fontFamily: 'var(--font-sans)', display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Title Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>Shared Resource Booking</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Schedule shared workspaces, equipment, or vehicles with auto-overlap conflict prevention.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowBookModal(true)}>
          <Plus size={16} />
          <span>New Reservation</span>
        </button>
      </div>

      {/* Main Grid Selector & Schedule */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem', flex: 1, alignItems: 'flex-start' }}>
        
        {/* Resource Selector Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            SELECT SHARED RESOURCE
          </span>

          {bookableResources.map(res => (
            <button
              key={res.id}
              onClick={() => setSelectedResourceId(res.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                padding: '16px',
                background: selectedResourceId === res.id ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.12) 0%, rgba(59, 130, 246, 0.04) 100%)' : 'var(--bg-glass)',
                border: '1px solid',
                borderColor: selectedResourceId === res.id ? 'var(--accent-primary)' : 'var(--border-glass)',
                borderRadius: '12px',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s',
                fontFamily: 'var(--font-sans)'
              }}
              onMouseEnter={(e) => {
                if (selectedResourceId !== res.id) {
                  e.currentTarget.style.borderColor = 'var(--border-glass-hover)';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedResourceId !== res.id) {
                  e.currentTarget.style.borderColor = 'var(--border-glass)';
                }
              }}
            >
              <span style={{ fontWeight: '600', fontSize: '14px', display: 'block' }}>{res.name}</span>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginTop: '4px' }}>
                Tag: {res.id} | Location: {res.location || 'N/A'}
              </span>
            </button>
          ))}
        </div>

        {/* Timeline Schedule Column */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
          {activeResource ? (
            <>
              <div style={{
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                borderBottom: '1px solid var(--border-glass)',
                paddingBottom: '1rem',
                marginBottom: '1.25rem'
              }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem' }}>Schedule: {activeResource.name}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    Physical location: {activeResource.location || 'N/A'}
                  </p>
                </div>
                <span style={{ fontSize: '11px', background: 'var(--status-available-bg)', color: 'var(--status-available)', padding: '4px 10px', borderRadius: '20px', fontWeight: '600' }}>
                  Auto Overlap Checked
                </span>
              </div>

              {/* Timeline List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>RESERVATIONS CALENDAR</span>
                {activeBookings.length === 0 ? (
                  <div style={{
                    padding: '3rem 2rem',
                    color: 'var(--text-muted)',
                    textAlign: 'center',
                    fontSize: '13px'
                  }}>
                    <CalendarDays size={32} style={{ margin: '0 auto 8px auto', opacity: 0.4 }} />
                    <p>No reservations currently booked. This resource is fully open today!</p>
                  </div>
                ) : (
                  activeBookings.map(bk => {
                    const startFormatted = formatDateTime(bk.start);
                    const endFormatted = formatDateTime(bk.end);
                    const isOwnBooking = bk.userId === currentUser.id;

                    return (
                      <div key={bk.id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid var(--border-glass)',
                        borderRadius: '10px',
                        position: 'relative'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            background: bk.status === 'Completed' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(59, 130, 246, 0.1)',
                            color: bk.status === 'Completed' ? 'var(--text-secondary)' : 'var(--accent-secondary)',
                            width: '40px',
                            height: '40px',
                            borderRadius: '8px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '11px',
                            fontWeight: '600'
                          }}>
                            <span>{startFormatted.date}</span>
                          </div>
                          <div>
                            <span style={{ display: 'block', fontWeight: '600', fontSize: '13px' }}>
                              {startFormatted.time} - {endFormatted.time}
                            </span>
                            <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                              Booked by: {bk.userObj ? bk.userObj.name : 'Unknown User'} {isOwnBooking && '(You)'}
                              {bk.behalfOfDepartment && <strong style={{ color: 'var(--status-reserved)' }}> | Dept: {bk.behalfOfDepartment}</strong>}
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className={`badge ${
                            bk.status === 'Completed' ? 'badge-disposed' : 
                            bk.status === 'Upcoming' ? 'badge-reserved' : 'badge-allocated'
                          }`}>
                            {bk.status}
                          </span>
                          
                          {isOwnBooking && bk.status !== 'Completed' && (
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <button
                                onClick={() => handleOpenReschedule(bk)}
                                style={{
                                  background: 'rgba(59, 130, 246, 0.1)',
                                  border: '1px solid rgba(59, 130, 246, 0.2)',
                                  color: 'var(--accent-secondary)',
                                  width: '28px',
                                  height: '28px',
                                  borderRadius: '6px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer'
                                }}
                              >
                                <Edit2 size={12} />
                              </button>
                              <button
                                onClick={() => cancelBooking(bk.id)}
                                style={{
                                  background: 'rgba(239, 68, 68, 0.1)',
                                  border: '1px solid rgba(239, 68, 68, 0.2)',
                                  color: '#ef4444',
                                  width: '28px',
                                  height: '28px',
                                  borderRadius: '6px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
              Please add shared assets in the Asset Directory first.
            </div>
          )}
        </div>
      </div>

      {/* BOOKING CREATE MODAL */}
      {showBookModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          padding: '1.5rem'
        }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '460px' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={18} style={{ color: 'var(--accent-primary)' }} />
              <span>Create Time-slot Reservation</span>
            </h3>

            {errorMsg && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                color: '#ef4444',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertTriangle size={14} />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleBookingSubmit}>
              <div className="form-group">
                <label className="form-label">Resource Item</label>
                <select 
                  className="form-select"
                  value={selectedResourceId}
                  onChange={(e) => setSelectedResourceId(e.target.value)}
                  required
                >
                  {bookableResources.map(r => (
                    <option key={r.id} value={r.id}>{r.name} ({r.location || 'HQ'})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Reservation Date</label>
                <input 
                  type="date" 
                  className="form-control"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  required 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Start Time</label>
                  <input 
                    type="time" 
                    className="form-control"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">End Time</label>
                  <input 
                    type="time" 
                    className="form-control"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required 
                  />
                </div>
              </div>

              {/* BOOK ON BEHALF OF DEPARTMENT */}
              {isDeptHeadOrHigher && (
                <div style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--border-glass)',
                  padding: '12px',
                  borderRadius: '8px',
                  marginBottom: '1.25rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input 
                      type="checkbox"
                      id="behalf-chk"
                      checked={bookOnBehalf}
                      onChange={(e) => setBookOnBehalf(e.target.checked)}
                      style={{ width: '16px', height: '16px', accentColor: 'var(--accent-primary)' }}
                    />
                    <label htmlFor="behalf-chk" style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: '500' }}>
                      Book on behalf of Department
                    </label>
                  </div>
                  
                  {bookOnBehalf && (
                    <div className="form-group" style={{ marginTop: '10px', marginBottom: 0 }}>
                      <label className="form-label">Target Department</label>
                      <select 
                        className="form-select"
                        value={behalfDeptId}
                        onChange={(e) => setBehalfDeptId(e.target.value)}
                        required
                      >
                        <option value="">Select department...</option>
                        {departments.map(d => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowBookModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Confirm Slot</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESCHEDULE MODAL */}
      {reschedulingBookingId && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          padding: '1.5rem'
        }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '460px' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem' }}>Reschedule Reservation</h3>

            {rescheduleError && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                color: '#ef4444',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                marginBottom: '1.25rem'
              }}>
                {rescheduleError}
              </div>
            )}

            <form onSubmit={handleRescheduleSubmit}>
              <div className="form-group">
                <label className="form-label">New Reservation Date</label>
                <input 
                  type="date" 
                  className="form-control"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  required 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Start Time</label>
                  <input 
                    type="time" 
                    className="form-control"
                    value={rescheduleStart}
                    onChange={(e) => setRescheduleStart(e.target.value)}
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">End Time</label>
                  <input 
                    type="time" 
                    className="form-control"
                    value={rescheduleEnd}
                    onChange={(e) => setRescheduleEnd(e.target.value)}
                    required 
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setReschedulingBookingId(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Update Reservation</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

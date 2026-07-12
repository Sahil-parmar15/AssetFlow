import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { 
  Bell, 
  History, 
  Search, 
  User, 
  Check, 
  AlertCircle, 
  Bookmark, 
  ShieldAlert 
} from 'lucide-react';

export default function ActivityLogScreen() {
  const { notifications, logs, currentUser } = useContext(AppContext);
  const [searchQuery, setSearchQuery] = useState('');

  // Notifications for CURRENT user only
  const userNotifications = notifications.filter(n => n.userId === currentUser?.id);

  // Search filter for logs
  const filteredLogs = logs.filter(log => {
    const q = searchQuery.toLowerCase();
    return (
      log.action.toLowerCase().includes(q) ||
      log.userName.toLowerCase().includes(q) ||
      log.details.toLowerCase().includes(q)
    );
  });

  const getLogIconColor = (action) => {
    if (action.includes('Register') || action.includes('Create')) return '#10b981'; // Green
    if (action.includes('Allocate') || action.includes('Booking') || action.includes('Approve')) return '#3b82f6'; // Blue
    if (action.includes('Maintenance') || action.includes('Transfer') || action.includes('Role')) return '#f59e0b'; // Amber
    return 'var(--text-secondary)';
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'Allocation': return '#3b82f6';
      case 'Maintenance': return '#ef4444';
      case 'Booking': return '#10b981';
      case 'Transfer': return '#8b5cf6';
      case 'Promotion': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  return (
    <div className="animate-fade-in" style={{ fontFamily: 'var(--font-sans)', display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Title */}
      <div style={{ marginBottom: '2rem' }}>
        <h1>Activity Logs & Alerts</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Monitor system notifications, verify security access actions, and view structural audit logs.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1.5rem', flex: 1, alignItems: 'flex-start' }}>
        
        {/* NOTIFICATIONS PANEL (LEFT) */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid var(--border-glass)',
            paddingBottom: '1rem',
            marginBottom: '1.25rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bell size={18} style={{ color: 'var(--accent-primary)' }} />
              <h3 style={{ fontSize: '1.15rem' }}>Personal Notifications</h3>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {userNotifications.length} items logged
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '450px', overflowY: 'auto' }}>
            {userNotifications.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem', fontSize: '13px' }}>
                <Bookmark size={24} style={{ margin: '0 auto 8px auto', opacity: 0.4 }} />
                <span>Inbox clean. No new notifications.</span>
              </div>
            ) : (
              userNotifications.map(notif => (
                <div key={notif.id} style={{
                  padding: '12px 14px',
                  background: 'rgba(255, 255, 255, 0.015)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: '10px',
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'flex-start'
                }}>
                  <div style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: getNotificationColor(notif.type),
                    marginTop: '6px',
                    flexShrink: 0
                  }} />
                  <div style={{ flex: 1 }}>
                    <span style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)' }}>
                      <span>{notif.type} Alert</span>
                      <span>{notif.date}</span>
                    </span>
                    <p style={{ fontSize: '13px', color: 'var(--text-primary)', marginTop: '4px', lineHeight: '1.4' }}>
                      {notif.message}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* SYSTEM AUDIT TRAILS (RIGHT) */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid var(--border-glass)',
            paddingBottom: '1rem',
            marginBottom: '1.25rem',
            gap: '12px',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <History size={18} style={{ color: 'var(--accent-secondary)' }} />
              <h3 style={{ fontSize: '1.15rem' }}>Global Audit Logs</h3>
            </div>
            
            {/* Search */}
            <div style={{ position: 'relative', width: '220px' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                className="form-control" 
                placeholder="Search logs..." 
                style={{ paddingLeft: '2.2rem', padding: '6px 12px 6px 2.2rem', fontSize: '12px' }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '450px', overflowY: 'auto' }}>
            {filteredLogs.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem', fontSize: '13px' }}>
                No matching logs found.
              </div>
            ) : (
              filteredLogs.map(log => (
                <div key={log.id} style={{
                  padding: '12px 16px',
                  background: 'rgba(255, 255, 255, 0.01)',
                  borderBottom: '1px solid var(--border-glass)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: getLogIconColor(log.action),
                      flexShrink: 0
                    }} />
                    <div>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)' }}>
                        {log.action}
                        <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: '400' }}>
                          by {log.userName} ({log.userId})
                        </span>
                      </span>
                      <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {log.details}
                      </p>
                    </div>
                  </div>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {new Date(log.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

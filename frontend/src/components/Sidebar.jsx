import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import Logo from './Logo';
import { 
  LayoutDashboard, 
  Settings, 
  FolderTree, 
  Network, 
  CalendarDays, 
  Wrench, 
  ClipboardCheck, 
  BarChart3, 
  History, 
  LogOut,
  User,
  Bell
} from 'lucide-react';

export default function Sidebar({ activeScreen, setActiveScreen }) {
  const { currentUser, logout, notifications } = useContext(AppContext);

  if (!currentUser) return null;

  const unreadNotifications = notifications.filter(n => n.userId === currentUser.id && !n.read).length;

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['Employee', 'Department Head', 'Asset Manager', 'Admin'] },
    { id: 'org_setup', label: 'Organization Setup', icon: Settings, roles: ['Admin'] },
    { id: 'asset_directory', label: 'Asset Directory', icon: FolderTree, roles: ['Employee', 'Department Head', 'Asset Manager', 'Admin'] },
    { id: 'allocations', label: 'Allocations & Transfers', icon: Network, roles: ['Employee', 'Department Head', 'Asset Manager', 'Admin'] },
    { id: 'resource_booking', label: 'Resource Booking', icon: CalendarDays, roles: ['Employee', 'Department Head', 'Asset Manager', 'Admin'] },
    { id: 'maintenance', label: 'Maintenance', icon: Wrench, roles: ['Employee', 'Department Head', 'Asset Manager', 'Admin'] },
    { id: 'audits', label: 'Asset Audits', icon: ClipboardCheck, roles: ['Admin', 'Asset Manager'] },
    { id: 'reports', label: 'Reports & Analytics', icon: BarChart3, roles: ['Admin', 'Asset Manager'] },
    { id: 'logs', label: 'Activity Logs & Alerts', icon: History, roles: ['Employee', 'Department Head', 'Asset Manager', 'Admin'] }
  ];

  const filteredItems = menuItems.filter(item => item.roles.includes(currentUser.role));

  return (
    <div style={{
      width: '280px',
      background: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border-glass)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      flexShrink: 0,
      fontFamily: 'var(--font-sans)',
      position: 'relative'
    }}>
      {/* Brand Logo */}
      <div style={{
        padding: '24px 28px',
        borderBottom: '1px solid var(--border-glass)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <Logo size={32} />
        <div>
          <span style={{
            fontSize: '20px',
            fontWeight: '700',
            fontFamily: 'var(--font-display)',
            background: 'linear-gradient(135deg, #ffffff 0%, #a5b4fc 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.03em'
          }}>
            AssetFlow
          </span>
          <span style={{
            display: 'block',
            fontSize: '9px',
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginTop: '1px'
          }}>
            Resource ERP System
          </span>
        </div>
      </div>

      {/* Navigation Menu */}
      <div style={{
        flex: 1,
        padding: '20px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        overflowY: 'auto'
      }}>
        {filteredItems.map(item => {
          const Icon = item.icon;
          const isActive = activeScreen === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveScreen(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                border: 'none',
                borderRadius: '10px',
                background: isActive ? 'linear-gradient(90deg, rgba(139, 92, 246, 0.15) 0%, rgba(59, 130, 246, 0.05) 100%)' : 'transparent',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: isActive ? '600' : '400',
                fontSize: '14px',
                cursor: 'pointer',
                textAlign: 'left',
                borderLeft: isActive ? '3px solid var(--accent-primary)' : '3px solid transparent',
                transition: 'all 0.2s ease',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = 'var(--text-primary)';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = 'var(--text-secondary)';
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <Icon size={18} style={{ color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)', flexShrink: 0 }} />
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.id === 'logs' && unreadNotifications > 0 && (
                <span style={{
                  background: '#ef4444',
                  color: 'white',
                  fontSize: '10px',
                  fontWeight: '700',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  lineHeight: '1',
                  minWidth: '18px',
                  textAlign: 'center'
                }}>
                  {unreadNotifications}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* User Footer Profile */}
      <div style={{
        padding: '20px 24px',
        borderTop: '1px solid var(--border-glass)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        background: 'rgba(255, 255, 255, 0.01)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border-glass)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-primary)',
            fontSize: '14px',
            fontWeight: '600'
          }}>
            {currentUser.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <span style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: 'var(--text-primary)',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
              overflow: 'hidden'
            }}>
              {currentUser.name}
            </span>
            <span style={{
              display: 'block',
              fontSize: '11px',
              color: 'var(--text-secondary)',
              textTransform: 'capitalize'
            }}>
              {currentUser.role}
            </span>
          </div>
        </div>
        
        <button 
          onClick={logout}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '8px 12px',
            background: 'rgba(239, 68, 68, 0.05)',
            border: '1px solid rgba(239, 68, 68, 0.1)',
            borderRadius: '8px',
            color: '#ef4444',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '500',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)';
          }}
        >
          <LogOut size={14} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}

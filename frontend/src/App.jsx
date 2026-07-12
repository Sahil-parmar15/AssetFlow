import React, { useState, useContext } from 'react';
import { AppContext, AppProvider } from './context/AppContext';
import Sidebar from './components/Sidebar';
import Logo from './components/Logo';
import RoleSwitcher from './components/RoleSwitcher';
import LoginScreen from './screens/LoginScreen';
import DashboardScreen from './screens/DashboardScreen';
import OrgSetupScreen from './screens/OrgSetupScreen';
import AssetDirectoryScreen from './screens/AssetDirectoryScreen';
import AssetAllocationScreen from './screens/AssetAllocationScreen';
import ResourceBookingScreen from './screens/ResourceBookingScreen';
import MaintenanceScreen from './screens/MaintenanceScreen';
import AssetAuditScreen from './screens/AssetAuditScreen';
import ReportsScreen from './screens/ReportsScreen';
import ActivityLogScreen from './screens/ActivityLogScreen';
import { Bell, User, AlertCircle, BookmarkCheck } from 'lucide-react';

function AppContent() {
  const { currentUser, notifications, pushNotification } = useContext(AppContext);
  const [activeScreen, setActiveScreen] = useState('dashboard');
  const [quickAction, setQuickAction] = useState(null);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  // If not logged in, force LoginScreen
  if (!currentUser) {
    return <LoginScreen />;
  }

  // Route matching
  const renderScreen = () => {
    switch (activeScreen) {
      case 'dashboard':
        return <DashboardScreen setActiveScreen={setActiveScreen} setQuickAction={setQuickAction} />;
      case 'org_setup':
        return <OrgSetupScreen />;
      case 'asset_directory':
        return <AssetDirectoryScreen quickAction={quickAction} clearQuickAction={() => setQuickAction(null)} />;
      case 'allocations':
        return <AssetAllocationScreen />;
      case 'resource_booking':
        return <ResourceBookingScreen quickAction={quickAction} clearQuickAction={() => setQuickAction(null)} />;
      case 'maintenance':
        return <MaintenanceScreen quickAction={quickAction} clearQuickAction={() => setQuickAction(null)} />;
      case 'audits':
        return <AssetAuditScreen />;
      case 'reports':
        return <ReportsScreen />;
      case 'logs':
        return <ActivityLogScreen />;
      default:
        return <DashboardScreen setActiveScreen={setActiveScreen} setQuickAction={setQuickAction} />;
    }
  };

  const userNotifications = notifications.filter(n => n.userId === currentUser.id);
  const unreadCount = userNotifications.filter(n => !n.read).length;

  return (
    <div className="app-container">
      {/* Navigation Sidebar */}
      <Sidebar activeScreen={activeScreen} setActiveScreen={setActiveScreen} />

      {/* Main Workspace Frame */}
      <div className="main-content">
        
        {/* Top Header Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: '24px',
          marginBottom: '2rem',
          position: 'relative',
          zIndex: 100
        }}>
          {/* System Indicators */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginRight: 'auto' }}>
            <Logo size={22} />
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: '#10b981',
              boxShadow: '0 0 6px #10b981'
            }} />
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              AssetFlow Active
            </span>
          </div>

          {/* Quick Info Badge */}
          <div style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid var(--border-glass)',
            borderRadius: '20px',
            padding: '4px 12px',
            fontSize: '12px',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <User size={13} style={{ color: 'var(--accent-primary)' }} />
            <span>Active: <strong>{currentUser.name}</strong> ({currentUser.role})</span>
          </div>

          {/* Alerts Bell Dropdown */}
          <div style={{ position: 'relative' }}>
            <button 
              onClick={() => setShowNotifDropdown(!showNotifDropdown)}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border-glass)',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                position: 'relative'
              }}
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-2px',
                  right: '-2px',
                  background: '#ef4444',
                  color: 'white',
                  fontSize: '9px',
                  fontWeight: 'bold',
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 6px rgba(239, 68, 68, 0.4)'
                }}>
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifDropdown && (
              <div style={{
                position: 'absolute',
                top: '48px',
                right: '0',
                width: '320px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-glass)',
                borderRadius: '12px',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.6)',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                animation: 'fadeIn 0.2s ease forwards'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: '1px solid var(--border-glass)',
                  paddingBottom: '8px',
                  fontSize: '12px',
                  fontWeight: '600'
                }}>
                  <span>Inbox Notifications</span>
                  <button 
                    onClick={() => { pushNotification(currentUser.id, "All notifications acknowledged.", "System"); setShowNotifDropdown(false); }}
                    style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '11px', cursor: 'pointer' }}
                  >
                    Clear All
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '200px', overflowY: 'auto' }}>
                  {userNotifications.length === 0 ? (
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>
                      No alerts logged.
                    </span>
                  ) : (
                    userNotifications.slice(0, 5).map(n => (
                      <div key={n.id} style={{
                        padding: '6px 8px',
                        background: 'rgba(255,255,255,0.01)',
                        border: '1px solid var(--border-glass)',
                        borderRadius: '6px',
                        fontSize: '11px'
                      }}>
                        <span style={{ fontWeight: '600', color: 'var(--text-primary)', display: 'block' }}>{n.type} Alert</span>
                        <p style={{ color: 'var(--text-secondary)', marginTop: '2px', lineHeight: '1.3' }}>{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Screen Viewport */}
        {renderScreen()}

        {/* Developer Sandbox Role Switcher Widget */}
        <RoleSwitcher />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

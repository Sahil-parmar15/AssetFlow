import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { 
  Package, 
  UserCheck, 
  Wrench, 
  Calendar, 
  RefreshCw, 
  AlertCircle,
  PlusCircle,
  Clock,
  ChevronRight
} from 'lucide-react';

export default function DashboardScreen({ setActiveScreen, setQuickAction }) {
  const { 
    assets, 
    maintenance, 
    bookings, 
    transfers, 
    allocations, 
    users, 
    currentUser,
    kpis: backendKpis,
  } = useContext(AppContext);

  // Use backend KPIs if available, otherwise compute locally
  const availableAssetsCount = backendKpis?.assets_available ?? assets.filter(a => a.status === 'Available').length;
  const allocatedAssetsCount = backendKpis?.assets_allocated ?? assets.filter(a => a.status === 'Allocated').length;
  const maintenanceCount = backendKpis?.maintenance_today ?? maintenance.filter(m => m.status === 'Approved' || m.status === 'In Progress' || m.status === 'Pending').length;
  const activeBookingsCount = backendKpis?.active_bookings ?? bookings.filter(b => b.status === 'Upcoming' || b.status === 'Ongoing').length;
  const pendingTransfersCount = backendKpis?.pending_transfers ?? transfers.filter(t => t.status === 'Requested' || t.status === 'Pending').length;
  
  // Upcoming Returns and Overdue calculations (always from local allocations for detail)
  const todayStr = new Date().toISOString().split('T')[0];
  const activeAllocations = allocations.filter(a => a.status === 'Active' && a.expectedReturnDate);
  
  const overdueAllocations = activeAllocations.filter(al => al.expectedReturnDate < todayStr).map(al => {
    const asset = assets.find(a => a.id === al.assetId);
    const holder = users.find(u => u.id === al.allocateToId) || { name: 'Unknown' };
    return { ...al, assetName: asset ? asset.name : 'Unknown Asset', holderName: holder.name };
  });

  const upcomingAllocations = activeAllocations.filter(al => al.expectedReturnDate >= todayStr).map(al => {
    const asset = assets.find(a => a.id === al.assetId);
    const holder = users.find(u => u.id === al.allocateToId) || { name: 'Unknown' };
    return { ...al, assetName: asset ? asset.name : 'Unknown Asset', holderName: holder.name };
  });

  const kpis = [
    { label: 'Assets Available', value: availableAssetsCount, icon: Package, color: 'var(--status-available)', bg: 'var(--status-available-bg)' },
    { label: 'Assets Allocated', value: allocatedAssetsCount, icon: UserCheck, color: 'var(--status-allocated)', bg: 'var(--status-allocated-bg)' },
    { label: 'Maintenance Today', value: maintenanceCount, icon: Wrench, color: 'var(--status-maintenance)', bg: 'var(--status-maintenance-bg)' },
    { label: 'Active Bookings', value: activeBookingsCount, icon: Calendar, color: 'var(--status-reserved)', bg: 'var(--status-reserved-bg)' },
    { label: 'Pending Transfers', value: pendingTransfersCount, icon: RefreshCw, color: '#a855f7', bg: 'rgba(168, 85, 247, 0.12)' },
    { label: 'Upcoming Returns', value: backendKpis?.upcoming_returns ?? upcomingAllocations.length, icon: Clock, color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.12)' }
  ];

  const triggerQuickAction = (screenId, actionType = null) => {
    setActiveScreen(screenId);
    if (actionType && setQuickAction) {
      setQuickAction(actionType);
    }
  };

  return (
    <div className="animate-fade-in" style={{ fontFamily: 'var(--font-sans)' }}>
      {/* Title Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ marginBottom: '0.25rem' }}>Operations Snapshot</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Real-time visibility into organization assets, resource reservations, and audit schedules.
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid-cols-3" style={{ marginBottom: '2rem' }}>
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div key={idx} className="glass-panel glass-panel-hover" style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1.75rem 2rem'
            }}>
              <div>
                <span style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: '500', marginBottom: '0.5rem' }}>
                  {kpi.label}
                </span>
                <span style={{ fontSize: '2.25rem', fontWeight: '700', fontFamily: 'var(--font-display)', color: 'var(--text-primary)', lineHeight: '1' }}>
                  {kpi.value}
                </span>
              </div>
              <div style={{
                width: '54px',
                height: '54px',
                borderRadius: '12px',
                background: kpi.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: kpi.color
              }}>
                <Icon size={24} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Grid: Overdue Return and Quick Actions */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '1.5rem'
      }}>
        {/* Overdue Alerts Panel */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
            <AlertCircle size={20} style={{ color: '#ef4444' }} />
            <h3 style={{ fontSize: '1.15rem' }}>Overdue Allocations</h3>
            <span style={{
              fontSize: '11px',
              fontWeight: '700',
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#ef4444',
              padding: '2px 8px',
              borderRadius: '20px',
              marginLeft: 'auto'
            }}>
              {overdueAllocations.length} Action Needed
            </span>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', maxHeight: '320px' }}>
            {overdueAllocations.length === 0 ? (
              <div style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2rem',
                color: 'var(--text-muted)',
                textAlign: 'center',
                fontSize: '0.875rem'
              }}>
                <Package size={36} style={{ marginBottom: '0.75rem', opacity: 0.5 }} />
                <p>Excellent! No overdue asset returns recorded currently.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {overdueAllocations.map(al => (
                  <div key={al.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    background: 'rgba(239, 68, 68, 0.05)',
                    border: '1px solid rgba(239, 68, 68, 0.15)',
                    borderRadius: '10px'
                  }}>
                    <div>
                      <span style={{ display: 'block', fontWeight: '600', fontSize: '14px', color: 'var(--text-primary)' }}>
                        {al.assetName} ({al.assetId})
                      </span>
                      <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        Held by: {al.holderName} | Expected Return: <span style={{ color: '#ef4444', fontWeight: '500' }}>{al.expectedReturnDate}</span>
                      </span>
                    </div>
                    <button 
                      onClick={() => triggerQuickAction('allocations')}
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--border-glass)',
                        borderRadius: '6px',
                        color: 'var(--text-primary)',
                        padding: '6px 12px',
                        fontSize: '11px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <span>Manage</span>
                      <ChevronRight size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.15rem', marginBottom: '1.25rem' }}>Quick Actions</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
            {/* Action A: Register Asset */}
            {(currentUser.role === 'Admin' || currentUser.role === 'Asset Manager') ? (
              <button 
                onClick={() => triggerQuickAction('asset_directory', 'register')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '16px',
                  background: 'rgba(139, 92, 246, 0.05)',
                  border: '1px solid rgba(139, 92, 246, 0.15)',
                  borderRadius: '12px',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)';
                  e.currentTarget.style.transform = 'translateX(4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(139, 92, 246, 0.05)';
                  e.currentTarget.style.transform = 'none';
                }}
              >
                <PlusCircle size={20} style={{ color: 'var(--accent-primary)' }} />
                <div>
                  <span style={{ display: 'block', fontWeight: '600', fontSize: '13px' }}>Register New Asset</span>
                  <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Add devices, furniture or vehicles
                  </span>
                </div>
              </button>
            ) : (
              <div 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '16px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: '12px',
                  opacity: 0.5,
                  cursor: 'not-allowed'
                }}
              >
                <PlusCircle size={20} style={{ color: 'var(--text-muted)' }} />
                <div>
                  <span style={{ display: 'block', fontWeight: '600', fontSize: '13px' }}>Register Asset (Admin Only)</span>
                  <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Requires Asset Manager permissions
                  </span>
                </div>
              </div>
            )}

            {/* Action B: Book Resource */}
            <button 
              onClick={() => triggerQuickAction('resource_booking', 'book')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px',
                background: 'rgba(59, 130, 246, 0.05)',
                border: '1px solid rgba(59, 130, 246, 0.15)',
                borderRadius: '12px',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
                e.currentTarget.style.transform = 'translateX(4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(59, 130, 246, 0.05)';
                e.currentTarget.style.transform = 'none';
              }}
            >
              <Calendar size={20} style={{ color: 'var(--accent-secondary)' }} />
              <div>
                <span style={{ display: 'block', fontWeight: '600', fontSize: '13px' }}>Book Shared Resource</span>
                <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Reserve rooms, cars or equipment
                </span>
              </div>
            </button>

            {/* Action C: Raise Maintenance Request */}
            <button 
              onClick={() => triggerQuickAction('maintenance', 'raise')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px',
                background: 'rgba(239, 68, 68, 0.05)',
                border: '1px solid rgba(239, 68, 68, 0.15)',
                borderRadius: '12px',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                e.currentTarget.style.transform = 'translateX(4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)';
                e.currentTarget.style.transform = 'none';
              }}
            >
              <Wrench size={20} style={{ color: '#ef4444' }} />
              <div>
                <span style={{ display: 'block', fontWeight: '600', fontSize: '13px' }}>Request Repair Services</span>
                <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Report damaged items or facilities
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

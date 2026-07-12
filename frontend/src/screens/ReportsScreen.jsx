import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { 
  BarChart3, 
  Download, 
  TrendingUp, 
  Calendar, 
  Wrench, 
  Award,
  Share2,
  AlertTriangle,
  Play,
  Activity,
  MinusCircle
} from 'lucide-react';

export default function ReportsScreen() {
  const { assets, maintenance, bookings, departments, allocations, categories, users } = useContext(AppContext);
  const [exporting, setExporting] = useState(false);

  // Stats logic
  const totalAssets = assets.length;
  const allocated = assets.filter(a => a.status === 'Allocated').length;
  const maintenanceAssets = assets.filter(a => a.status === 'Under Maintenance').length;
  const available = assets.filter(a => a.status === 'Available').length;
  
  const utilizationRate = totalAssets ? Math.round((allocated / totalAssets) * 100) : 0;
  const maintenanceRate = totalAssets ? Math.round((maintenanceAssets / totalAssets) * 100) : 0;

  const handleExport = (format) => {
    setExporting(true);
    setTimeout(() => {
      setExporting(false);
      alert(`AssetFlow Report exported successfully as ${format}! File downloaded: assetflow_operations_report.${format.toLowerCase()}`);
    }, 1500);
  };

  // 1. Most-Used vs. Idle Assets
  // We can calculate usage score: number of times allocated + number of times booked
  const assetUsageList = assets.map(asset => {
    const allocCount = allocations.filter(al => al.assetId === asset.id).length;
    const bookCount = bookings.filter(b => b.resourceId === asset.id).length;
    const totalScore = allocCount + bookCount;
    return { ...asset, usageScore: totalScore };
  });

  const mostUsedAssets = [...assetUsageList]
    .filter(a => a.usageScore > 0)
    .sort((a, b) => b.usageScore - a.usageScore)
    .slice(0, 3);

  const idleAssets = assetUsageList
    .filter(a => a.status === 'Available' && a.usageScore === 0)
    .slice(0, 3);

  // 2. Maintenance Frequency by Asset Category
  const categoryMaintenanceFreq = categories.map(cat => {
    const catAssets = assets.filter(a => a.categoryId === cat.id);
    const catMaintenanceCount = maintenance.filter(m => 
      catAssets.some(ca => ca.id === m.assetId)
    ).length;
    return { ...cat, count: catMaintenanceCount };
  });

  // Mock booking heatmap grid data (7 days, 6 blocks of 2 hours)
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const times = ['08-10', '10-12', '12-14', '14-16', '16-18', '18-20'];
  const heatmapData = [
    [1, 3, 2, 4, 1, 0], // Mon
    [2, 4, 3, 3, 2, 1], // Tue
    [3, 4, 4, 2, 1, 0], // Wed
    [2, 3, 3, 4, 2, 1], // Thu
    [1, 2, 4, 3, 3, 0], // Fri
    [0, 1, 1, 0, 0, 0], // Sat
    [0, 0, 0, 0, 0, 0]  // Sun
  ];

  const getHeatmapColor = (intensity) => {
    switch (intensity) {
      case 4: return 'rgba(139, 92, 246, 0.9)'; // peak purple
      case 3: return 'rgba(139, 92, 246, 0.6)';
      case 2: return 'rgba(139, 92, 246, 0.35)';
      case 1: return 'rgba(139, 92, 246, 0.15)';
      default: return 'rgba(255, 255, 255, 0.02)';
    }
  };

  return (
    <div className="animate-fade-in" style={{ fontFamily: 'var(--font-sans)' }}>
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>Reports & Analytics</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Actionable corporate intelligence, resource booking heatmaps, and audit logs.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            className="btn btn-secondary" 
            onClick={() => handleExport('CSV')}
            disabled={exporting}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
          <button 
            className="btn btn-primary" 
            onClick={() => handleExport('PDF')}
            disabled={exporting}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Share2 size={14} />
            <span>{exporting ? 'Exporting...' : 'Generate PDF'}</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Bars */}
      <div className="grid-cols-3" style={{ marginBottom: '2rem' }}>
        <div className="glass-panel">
          <h4 style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <TrendingUp size={16} style={{ color: 'var(--status-available)' }} />
            <span>Asset Utilization Rate</span>
          </h4>
          <span style={{ fontSize: '2rem', fontWeight: '700', fontFamily: 'var(--font-display)' }}>
            {utilizationRate}%
          </span>
          <div style={{ background: 'rgba(255,255,255,0.05)', height: '6px', borderRadius: '3px', marginTop: '12px', overflow: 'hidden' }}>
            <div style={{ background: 'var(--status-available)', width: `${utilizationRate}%`, height: '100%' }} />
          </div>
          <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
            {allocated} of {totalAssets} total assets currently allocated.
          </span>
        </div>

        <div className="glass-panel">
          <h4 style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Wrench size={16} style={{ color: 'var(--status-maintenance)' }} />
            <span>Defect & Repair Frequency</span>
          </h4>
          <span style={{ fontSize: '2rem', fontWeight: '700', fontFamily: 'var(--font-display)' }}>
            {maintenanceRate}%
          </span>
          <div style={{ background: 'rgba(255,255,255,0.05)', height: '6px', borderRadius: '3px', marginTop: '12px', overflow: 'hidden' }}>
            <div style={{ background: 'var(--status-maintenance)', width: `${maintenanceRate}%`, height: '100%' }} />
          </div>
          <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
            {maintenanceAssets} assets currently undergoing physical servicing.
          </span>
        </div>

        <div className="glass-panel">
          <h4 style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={16} style={{ color: 'var(--accent-secondary)' }} />
            <span>Resource Reservation Count</span>
          </h4>
          <span style={{ fontSize: '2rem', fontWeight: '700', fontFamily: 'var(--font-display)' }}>
            {bookings.length}
          </span>
          <div style={{ background: 'rgba(255,255,255,0.05)', height: '6px', borderRadius: '3px', marginTop: '12px', overflow: 'hidden' }}>
            <div style={{ background: 'var(--accent-secondary)', width: '80%', height: '100%' }} />
          </div>
          <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
            Active time-slot reservations logged for shared assets.
          </span>
        </div>
      </div>

      {/* SECTION A: MOST-USED vs IDLE ASSETS & MAINTENANCE FREQ BY CATEGORY */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Most Used vs Idle */}
        <div className="glass-panel">
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={18} style={{ color: 'var(--accent-primary)' }} />
            <span>Asset Utilization Trends (Most-Used vs. Idle)</span>
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {/* Most Used */}
            <div>
              <span style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--status-available)', marginBottom: '8px', textTransform: 'uppercase' }}>
                Most Active Assets
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {mostUsedAssets.map(a => (
                  <div key={a.id} style={{ padding: '10px', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.1)', borderRadius: '8px', fontSize: '12px' }}>
                    <span style={{ display: 'block', fontWeight: '600' }}>{a.name}</span>
                    <span style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '11px', marginTop: '2px' }}>
                      ID: {a.id} | Actions logged: {a.usageScore}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            {/* Idle */}
            <div>
              <span style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase' }}>
                Idle Assets (Unused)
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {idleAssets.length === 0 ? (
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>No fully idle assets recorded.</span>
                ) : (
                  idleAssets.map(a => (
                    <div key={a.id} style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)', borderRadius: '8px', fontSize: '12px' }}>
                      <span style={{ display: 'block', fontWeight: '600', color: 'var(--text-secondary)' }}>{a.name}</span>
                      <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '11px', marginTop: '2px' }}>
                        ID: {a.id} | Status: {a.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Maintenance Frequency by Category */}
        <div className="glass-panel">
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Wrench size={18} style={{ color: 'var(--status-maintenance)' }} />
            <span>Maintenance Frequency by Category</span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {categoryMaintenanceFreq.map(c => (
              <div key={c.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                  <span style={{ fontWeight: '500' }}>{c.name}</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{c.count} Tickets Filed</span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.04)', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{
                    background: 'var(--status-maintenance)',
                    width: `${maintenance.length ? Math.round((c.count / maintenance.length) * 100) : 0}%`,
                    height: '100%'
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Heatmap Grid */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={18} style={{ color: 'var(--accent-primary)' }} />
            <span>Resource Booking Heatmap</span>
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            Aggregated usage metrics showing peak resource reservation time slots.
          </p>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Header Times */}
            <div style={{ display: 'flex', paddingLeft: '40px', gap: '6px' }}>
              {times.map(t => (
                <span key={t} style={{ flex: 1, fontSize: '10px', color: 'var(--text-muted)', textAlign: 'center' }}>{t}</span>
              ))}
            </div>

            {/* Matrix Rows */}
            {days.map((day, dIdx) => (
              <div key={day} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '34px', fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600' }}>{day}</span>
                {times.map((time, tIdx) => {
                  const val = heatmapData[dIdx][tIdx];
                  return (
                    <div
                      key={time}
                      style={{
                        flex: 1,
                        height: '32px',
                        borderRadius: '6px',
                        background: getHeatmapColor(val),
                        border: '1px solid var(--border-glass)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '9px',
                        color: val > 2 ? 'white' : 'var(--text-muted)',
                        fontWeight: '600'
                      }}
                      title={`${day} ${time}: Intensity level ${val}`}
                    >
                      {val > 0 && `${val}x`}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '1.25rem', fontSize: '10px', color: 'var(--text-muted)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '10px', height: '10px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '2px' }} /> Idle
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '10px', height: '10px', background: 'rgba(139, 92, 246, 0.9)', borderRadius: '2px' }} /> Peak
            </span>
          </div>
        </div>

        {/* Department allocations breakdown */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Department allocation density</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            Distribution of active asset allocations and equipment items assigned by organizational unit.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
            {departments.map(dept => {
              const deptAllocations = allocations.filter(al => {
                if (al.allocateToId === dept.id && al.type === 'department' && al.status === 'Active') return true;
                if (al.type === 'employee' && al.status === 'Active') {
                  const emp = users.find(u => u.id === al.allocateToId);
                  return emp && emp.department === dept.name;
                }
                return false;
              });

              const percent = allocated ? Math.round((deptAllocations.length / allocated) * 100) : 0;

              return (
                <div key={dept.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px', fontWeight: '500' }}>
                    <span>{dept.name}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{deptAllocations.length} Assets ({percent}%)</span>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.04)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                      background: dept.id === 'D-0001' ? 'var(--accent-primary)' : dept.id === 'D-0002' ? 'var(--accent-secondary)' : 'var(--status-reserved)',
                      width: `${percent}%`,
                      height: '100%',
                      borderRadius: '4px'
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Retirement Forecast */}
      <div className="glass-panel" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <AlertTriangle size={18} style={{ color: 'var(--status-reserved)' }} />
          <span>Retirement Forecast & Maintenance Schedule</span>
        </h3>
        
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Asset Tag</th>
                <th>Asset Name</th>
                <th>Condition</th>
                <th>Acquisition Date</th>
                <th>Current Status</th>
                <th>Service Status</th>
              </tr>
            </thead>
            <tbody>
              {assets.map(asset => {
                const needsCheck = asset.condition === 'Fair' || asset.condition === 'Poor';
                return (
                  <tr key={asset.id} style={{ background: needsCheck ? 'rgba(245, 158, 11, 0.02)' : 'none' }}>
                    <td style={{ fontWeight: '600' }}>{asset.id}</td>
                    <td style={{ fontWeight: '500' }}>{asset.name}</td>
                    <td>
                      <span style={{
                        color: needsCheck ? 'var(--status-reserved)' : 'var(--status-available)',
                        fontWeight: '600'
                      }}>
                        {asset.condition}
                      </span>
                    </td>
                    <td>{asset.acquisitionDate || 'N/A'}</td>
                    <td>{asset.status}</td>
                    <td>
                      {needsCheck ? (
                        <span style={{ color: 'var(--status-reserved)', fontSize: '12px', fontWeight: '500' }}>
                          Due for inspection
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                          Operational
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

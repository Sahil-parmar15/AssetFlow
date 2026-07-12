import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { Shield, User, Cpu, ChevronDown, Check } from 'lucide-react';

export default function RoleSwitcher() {
  const { currentUser, switchRole, users } = useContext(AppContext);
  const [isOpen, setIsOpen] = useState(false);

  if (!currentUser) return null;

  const roles = ['Employee', 'Department Head', 'Asset Manager', 'Admin'];

  // Find a mock user of each role to switch accounts entirely, or just hot-swap role.
  const handleRoleClick = (role) => {
    switchRole(role);
    setIsOpen(false);
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      zIndex: 9999,
      fontFamily: 'var(--font-sans)'
    }}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 16px',
          background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
          color: 'white',
          border: 'none',
          borderRadius: '30px',
          fontWeight: '600',
          fontSize: '13px',
          cursor: 'pointer',
          boxShadow: '0 8px 24px rgba(16, 185, 129, 0.3)',
          transition: 'all 0.2s ease'
        }}
      >
        <Cpu size={15} />
        <span>Switch Role: {currentUser.role}</span>
        <ChevronDown size={14} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          bottom: '50px',
          right: '0',
          width: '220px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-glass)',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
          padding: '8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          animation: 'fadeIn 0.2s ease forwards'
        }}>
          <div style={{
            fontSize: '11px',
            color: 'var(--text-muted)',
            padding: '6px 8px',
            borderBottom: '1px solid var(--border-glass)',
            fontWeight: '600'
          }}>
            SIMULATE ERP WORKFLOW
          </div>
          
          {roles.map(role => (
            <button
              key={role}
              onClick={() => handleRoleClick(role)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                background: currentUser.role === role ? 'rgba(255,255,255,0.06)' : 'transparent',
                border: 'none',
                borderRadius: '8px',
                color: currentUser.role === role ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontSize: '13px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (currentUser.role !== role) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (currentUser.role !== role) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Shield size={13} style={{ color: currentUser.role === role ? '#10b981' : 'var(--text-muted)' }} />
                <span>{role}</span>
              </div>
              {currentUser.role === role && <Check size={13} style={{ color: '#10b981' }} />}
            </button>
          ))}

          <div style={{
            fontSize: '10px',
            color: 'var(--text-muted)',
            padding: '6px 8px',
            borderTop: '1px solid var(--border-glass)',
            marginTop: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <User size={10} />
            <span>Simulating: {currentUser.name}</span>
          </div>
        </div>
      )}
    </div>
  );
}

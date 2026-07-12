import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import Logo from '../components/Logo';
import { Mail, Lock, User, LogIn, UserPlus } from 'lucide-react';

export default function LoginScreen() {
  const { login, signup } = useContext(AppContext);
  
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (isLogin) {
      const res = login(email, password);
      if (!res.success) {
        setError(res.message);
      }
    } else {
      if (!name) {
        setError('Name is required');
        return;
      }
      const res = signup(name, email, password);
      if (res.success) {
        setSuccessMsg('Account created as Employee! Logging you in...');
      } else {
        setError(res.message);
      }
    }
  };

  const handleQuickLogin = (quickEmail, quickPass) => {
    setError('');
    setEmail(quickEmail);
    setPassword(quickPass);
    login(quickEmail, quickPass);
  };

  const mockLogins = [
    { label: 'Admin (Alice)', email: 'admin@assetflow.com', pass: 'admin123', color: '#8b5cf6' },
    { label: 'Asset Manager (David)', email: 'manager@assetflow.com', pass: 'manager123', color: '#3b82f6' },
    { label: 'Dept Head (Sarah)', email: 'head@assetflow.com', pass: 'head123', color: '#f59e0b' },
    { label: 'Employee (Priya)', email: 'priya@assetflow.com', pass: 'priya123', color: '#10b981' }
  ];

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      position: 'relative',
      fontFamily: 'var(--font-sans)',
      overflowY: 'auto'
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '460px',
        position: 'relative',
        zIndex: 2,
        padding: '2.5rem'
      }}>
        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '24px',
            marginBottom: '1rem',
            boxShadow: '0 8px 24px rgba(139, 92, 246, 0.4)'
          }}>
            A
          </div>
          <h2 style={{ fontSize: '1.75rem', fontFamily: 'var(--font-display)', marginBottom: '0.25rem' }}>
            {isLogin ? 'Welcome Back' : 'Create ERP Account'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            {isLogin ? 'Sign in to access your AssetFlow system' : 'Sign up to register as an Employee'}
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            color: '#ef4444',
            padding: '10px 14px',
            borderRadius: '8px',
            fontSize: '13px',
            marginBottom: '1.25rem'
          }}>
            {error}
          </div>
        )}

        {successMsg && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            color: '#10b981',
            padding: '10px 14px',
            borderRadius: '8px',
            fontSize: '13px',
            marginBottom: '1.25rem'
          }}>
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="John Doe"
                  className="form-control"
                  style={{ paddingLeft: '2.75rem' }}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-muted)' }} />
              <input
                type="email"
                placeholder="yourname@assetflow.com"
                className="form-control"
                style={{ paddingLeft: '2.75rem' }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-muted)' }} />
              <input
                type="password"
                placeholder="••••••••"
                className="form-control"
                style={{ paddingLeft: '2.75rem' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {isLogin && (
            <div style={{ textAlign: 'right', marginBottom: '1.5rem' }}>
              <a href="#forgot" onClick={(e) => { e.preventDefault(); alert('In this simulation, please use the quick-login buttons below if you forgot your credentials!'); }} style={{ fontSize: '12px', color: 'var(--accent-primary)', textDecoration: 'none' }}>
                Forgot Password?
              </a>
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', marginTop: isLogin ? '0' : '10px' }}>
            {isLogin ? <LogIn size={16} /> : <UserPlus size={16} />}
            <span>{isLogin ? 'Sign In' : 'Register Account'}</span>
          </button>
        </form>

        {/* Toggle between login / register */}
        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '13px', color: 'var(--text-secondary)' }}>
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => { setIsLogin(!isLogin); setError(''); setSuccessMsg(''); }}
            style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', fontWeight: '500' }}
          >
            {isLogin ? 'Create one' : 'Sign in'}
          </button>
        </div>

        {/* Quick Demo Credentials */}
        <div style={{
          marginTop: '2.5rem',
          borderTop: '1px solid var(--border-glass)',
          paddingTop: '1.5rem'
        }}>
          <span style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', textAlign: 'center' }}>
            Quick Demo Login Accounts
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {mockLogins.map(cred => (
              <button
                key={cred.label}
                onClick={() => handleQuickLogin(cred.email, cred.pass)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: '10px',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = cred.color;
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-glass)';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                }}
              >
                <div style={{ display: 'flex', flexDir: 'column' }}>
                  <span style={{ fontWeight: '500', fontSize: '12px' }}>{cred.label}</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{cred.email}</span>
                </div>
                <span style={{
                  fontSize: '10px',
                  color: 'var(--text-muted)',
                  background: 'rgba(255,255,255,0.05)',
                  padding: '2px 6px',
                  borderRadius: '4px'
                }}>
                  {cred.pass}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

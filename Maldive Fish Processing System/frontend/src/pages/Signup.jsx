import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const customStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=DM+Sans:wght@300;400;500&display=swap');

  * { box-sizing: border-box; }

  /* ==============================
     CSS Variables for Theming
     ============================== */
  .mf-root {
    --bg-primary: #FFFFFF;
    --bg-secondary: #F8FAFE;
    --bg-tertiary: #F1F5F9;
    --bg-overlay: rgba(255,255,255,0.7);
    --bg-panel: rgba(245,248,250,0.85);
    --text-primary: #0F172A;
    --text-secondary: #334155;
    --text-muted: #64748B;
    --accent-primary: #0F6E56;
    --accent-secondary: #1EA082;
    --accent-glow: rgba(30,160,130,0.2);
    --border-light: rgba(0,0,0,0.08);
    --border-medium: rgba(0,0,0,0.12);
    --card-bg: #FFFFFF;
    --input-bg: #FFFFFF;
    --shadow-sm: 0 4px 12px rgba(0,0,0,0.04);
    --shadow-md: 0 8px 24px rgba(0,0,0,0.06);
    --gradient-hero: linear-gradient(135deg, #1EA082 0%, #5BD4B8 60%, #378ADD 100%);
  }

  .mf-root.theme-dark {
    --bg-primary: #020C18;
    --bg-secondary: #05101C;
    --bg-tertiary: #0A1524;
    --bg-overlay: rgba(2,11,24,0.95);
    --bg-panel: rgba(5,16,28,0.7);
    --text-primary: #E8F4F8;
    --text-secondary: #7BA8A0;
    --text-muted: #5BA89A;
    --accent-primary: #1EA082;
    --accent-secondary: #0C6E56;
    --accent-glow: rgba(30,160,130,0.2);
    --border-light: rgba(255,255,255,0.08);
    --border-medium: rgba(255,255,255,0.12);
    --card-bg: #05101C;
    --input-bg: rgba(255,255,255,0.04);
    --shadow-sm: 0 4px 12px rgba(0,0,0,0.2);
    --shadow-md: 0 8px 24px rgba(0,0,0,0.3);
    --gradient-hero: linear-gradient(135deg, #1EA082, #5BD4B8);
  }

  .mf-root {
    font-family: 'DM Sans', sans-serif;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background: var(--bg-primary);
    color: var(--text-primary);
    transition: background-color 0.2s ease, color 0.2s ease;
  }

  /* ── Header ── */
  .mf-header {
    background: var(--bg-overlay);
    border-bottom: 1px solid var(--border-light);
    backdrop-filter: blur(12px);
    position: sticky; top: 0; z-index: 100;
  }
  .mf-header-inner {
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 28px; height: 60px;
  }
  .mf-logo-mark {
    width: 36px; height: 36px;
    background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
    border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    font-family: 'Sora', sans-serif;
    font-weight: 700; font-size: 13px; color: #fff;
    letter-spacing: -0.5px;
    flex-shrink: 0;
  }
  .mf-brand-text h1 {
    font-family: 'Sora', sans-serif;
    font-size: 15px; font-weight: 600; margin: 0; color: var(--text-primary);
    letter-spacing: -0.3px;
  }
  .mf-brand-text p {
    font-size: 11px; color: var(--text-muted); margin: 0; font-weight: 300;
  }
  .mf-status-dot {
    width: 7px; height: 7px; border-radius: 50%;
    background: var(--accent-primary);
    box-shadow: 0 0 8px var(--accent-glow);
    animation: pulse-glow 2s ease-in-out infinite;
  }
  @keyframes pulse-glow {
    0%,100% { box-shadow: 0 0 6px var(--accent-glow); }
    50% { box-shadow: 0 0 14px var(--accent-primary); }
  }
  .mf-header-right {
    display: flex; align-items: center; gap: 20px;
  }
  .mf-header-time {
    font-size: 12px; color: var(--text-muted); letter-spacing: 0.5px;
  }
  .mf-header-actions {
    display: flex; gap: 4px;
  }
  .mf-win-btn {
    width: 28px; height: 28px; border-radius: 6px;
    border: 1px solid var(--border-light);
    background: rgba(255,255,255,0.04);
    color: var(--text-muted); cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; transition: all 0.15s;
  }
  .mf-win-btn:hover { background: var(--accent-glow); color: var(--accent-primary); }
  .mf-win-btn.close:hover { background: rgba(200,50,50,0.4); color: #FF8080; border-color: rgba(200,50,50,0.4); }

  /* Theme Toggle Button */
  .mf-theme-toggle {
    background: var(--bg-tertiary);
    border: 1px solid var(--border-light);
    border-radius: 20px;
    width: 34px;
    height: 34px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
    color: var(--text-secondary);
  }
  .mf-theme-toggle:hover {
    background: var(--accent-glow);
    color: var(--accent-primary);
    transform: scale(1.02);
  }

  /* ── Nav Bar ── */
  .mf-nav {
    background: var(--bg-secondary);
    border-bottom: 1px solid var(--border-light);
    padding: 0 28px;
    display: flex; align-items: center; justify-content: flex-end; gap: 4px;
    height: 38px;
  }
  .mf-nav-btn {
    font-size: 12px; color: var(--text-muted);
    padding: 4px 10px; border-radius: 5px;
    border: none; background: transparent; cursor: pointer;
    transition: all 0.15s; letter-spacing: 0.2px;
    display: flex; align-items: center; gap: 5px;
  }
  .mf-nav-btn:hover { background: var(--accent-glow); color: var(--accent-primary); }

  /* ── Hero Section ── */
  .mf-body {
    flex: 1; display: grid;
    grid-template-columns: 1fr 480px;
    position: relative; overflow: hidden;
  }

  .mf-hero {
    position: relative; padding: 60px 64px;
    display: flex; flex-direction: column; justify-content: center;
    overflow: hidden;
  }

  .mf-ocean-bg {
    position: absolute; inset: 0; overflow: hidden;
  }

  /* Animated gradient orbs */
  .mf-orb {
    position: absolute; border-radius: 50%;
    filter: blur(80px); opacity: 0.12;
    animation: drift 20s ease-in-out infinite;
  }
  .theme-dark .mf-orb {
    opacity: 0.12;
  }
  .theme-light .mf-orb {
    opacity: 0.08;
  }
  .mf-orb-1 { width: 500px; height: 500px; background: var(--accent-primary); top: -100px; left: -100px; animation-delay: 0s; }
  .mf-orb-2 { width: 400px; height: 400px; background: var(--accent-secondary); bottom: -80px; right: -60px; animation-delay: -7s; }
  .mf-orb-3 { width: 300px; height: 300px; background: #378ADD; top: 40%; left: 30%; animation-delay: -14s; }
  @keyframes drift {
    0%,100% { transform: translate(0,0) scale(1); }
    33% { transform: translate(40px,-30px) scale(1.05); }
    66% { transform: translate(-20px,50px) scale(0.95); }
  }

  /* Grid lines */
  .mf-grid-overlay {
    position: absolute; inset: 0;
    background-image:
      linear-gradient(var(--accent-glow) 1px, transparent 1px),
      linear-gradient(90deg, var(--accent-glow) 1px, transparent 1px);
    background-size: 48px 48px;
  }

  .mf-hero-content { position: relative; z-index: 2; }

  .mf-eyebrow {
    display: inline-flex; align-items: center; gap: 8px;
    font-size: 11px; font-weight: 500;
    color: var(--accent-primary); letter-spacing: 2px; text-transform: uppercase;
    margin-bottom: 20px;
    padding: 5px 12px;
    border: 1px solid var(--accent-glow);
    border-radius: 100px;
    background: var(--accent-glow);
  }
  .mf-eyebrow-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent-primary); }

  .mf-hero-title {
    font-family: 'Sora', sans-serif;
    font-size: clamp(28px, 3.5vw, 46px);
    font-weight: 700; line-height: 1.12;
    letter-spacing: -1.5px; color: var(--text-primary);
    margin: 0 0 18px;
  }
  .mf-hero-title span {
    background: var(--gradient-hero);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .mf-hero-sub {
    font-size: 15px; color: var(--text-secondary); line-height: 1.65;
    max-width: 480px; margin-bottom: 40px; font-weight: 300;
  }

  /* Stats row */
  .mf-stats {
    display: flex; gap: 28px; margin-bottom: 48px;
  }
  .mf-stat {
    display: flex; flex-direction: column; gap: 2px;
  }
  .mf-stat-num {
    font-family: 'Sora', sans-serif;
    font-size: 24px; font-weight: 700; color: var(--accent-primary); letter-spacing: -1px;
  }
  .mf-stat-label {
    font-size: 11px; color: var(--text-muted); letter-spacing: 0.5px;
  }
  .mf-stat-divider {
    width: 1px; background: var(--border-medium); margin: 4px 0;
  }

  /* Feature pills */
  .mf-features { display: flex; flex-wrap: wrap; gap: 10px; }
  .mf-feature-pill {
    display: flex; align-items: center; gap: 7px;
    padding: 7px 14px;
    border: 1px solid var(--border-light);
    border-radius: 8px;
    background: var(--bg-overlay);
    font-size: 12px; color: var(--text-secondary);
    transition: all 0.2s;
  }
  .mf-feature-pill:hover { border-color: var(--accent-primary); color: var(--accent-primary); background: var(--accent-glow); }

  /* ── Signup Panel ── */
  .mf-panel {
    background: var(--bg-panel);
    backdrop-filter: blur(20px);
    border-left: 1px solid var(--border-light);
    display: flex; align-items: center; justify-content: center;
    padding: 40px 44px;
  }

  .mf-form-card {
    width: 100%; max-width: 380px;
  }

  .mf-form-header { margin-bottom: 36px; }
  .mf-form-title {
    font-family: 'Sora', sans-serif;
    font-size: 26px; font-weight: 700; letter-spacing: -0.8px;
    color: var(--text-primary); margin: 0 0 8px;
  }
  .mf-form-subtitle {
    font-size: 13px; color: var(--text-muted); font-weight: 300;
  }

  /* Form elements */
  .mf-field { margin-bottom: 20px; }
  .mf-label {
    display: block; font-size: 12px; font-weight: 500;
    color: var(--text-secondary); margin-bottom: 8px;
    letter-spacing: 0.3px;
  }
  .mf-input-wrap { position: relative; }
  .mf-input {
    width: 100%; padding: 12px 14px 12px 42px;
    background: var(--input-bg);
    border: 1px solid var(--border-light);
    border-radius: 10px;
    color: var(--text-primary); font-size: 14px; font-family: inherit;
    transition: all 0.2s; outline: none;
  }
  .mf-input::placeholder { color: var(--text-muted); opacity: 0.4; }
  .mf-input:hover { border-color: var(--accent-primary); background: var(--accent-glow); }
  .mf-input:focus {
    border-color: var(--accent-primary);
    background: var(--input-bg);
    box-shadow: 0 0 0 3px var(--accent-glow);
  }
  .mf-input.error { border-color: rgba(220,80,80,0.5); }
  .mf-input-icon {
    position: absolute; left: 13px; top: 50%; transform: translateY(-50%);
    color: var(--text-muted); font-size: 16px; pointer-events: none;
    transition: color 0.2s;
  }
  .mf-input:focus ~ .mf-input-icon { color: var(--accent-primary); }

  .mf-error-text {
    font-size: 11px; color: #E24B4A; margin-top: 5px;
    display: flex; align-items: center; gap: 4px;
  }

  /* Auth error banner */
  .mf-auth-error {
    background: rgba(220,80,80,0.08);
    border: 1px solid rgba(220,80,80,0.25);
    border-radius: 8px; padding: 10px 14px;
    font-size: 13px; color: #F09595;
    margin-bottom: 20px; display: flex; align-items: center; gap: 8px;
  }

  .mf-success-message {
    background: rgba(30,160,130,0.08);
    border: 1px solid rgba(30,160,130,0.25);
    border-radius: 8px; padding: 10px 14px;
    font-size: 13px; color: var(--accent-primary);
    margin-bottom: 20px; display: flex; align-items: center; gap: 8px;
  }

  /* Submit button */
  .mf-submit {
    width: 100%; padding: 13px;
    background: linear-gradient(135deg, var(--accent-secondary), var(--accent-primary));
    border: none; border-radius: 10px;
    color: #fff; font-family: 'Sora', sans-serif;
    font-size: 14px; font-weight: 600; letter-spacing: 0.3px;
    cursor: pointer; position: relative; overflow: hidden;
    transition: all 0.2s;
  }
  .mf-submit::before {
    content: '';
    position: absolute; inset: 0;
    background: linear-gradient(135deg, var(--accent-primary), #5BD4B8);
    opacity: 0; transition: opacity 0.2s;
  }
  .mf-submit:hover::before { opacity: 1; }
  .mf-submit:active { transform: scale(0.98); }
  .mf-submit:disabled { opacity: 0.5; cursor: not-allowed; }
  .mf-submit span { position: relative; z-index: 1; display: flex; align-items: center; justify-content: center; gap: 8px; }

  .mf-spinner {
    width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3);
    border-top-color: #fff; border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* Login link */
  .mf-signin-text {
    text-align: center; font-size: 12px; color: var(--text-muted); margin-top: 22px;
  }
  .mf-signin-text a { color: var(--accent-primary); text-decoration: none; font-weight: 500; }
  .mf-signin-text a:hover { text-decoration: underline; }

  /* Divider */
  .mf-divider {
    display: flex; align-items: center; gap: 10px; margin: 24px 0;
  }
  .mf-divider-line { flex: 1; height: 1px; background: var(--border-light); }
  .mf-divider-text { font-size: 11px; color: var(--text-muted); letter-spacing: 0.5px; opacity: 0.6; }

  /* Security badge */
  .mf-security {
    display: flex; align-items: center; justify-content: center; gap: 6px;
    font-size: 11px; color: var(--text-muted); margin-top: 18px;
    opacity: 0.7;
  }

  /* ── Footer ── */
  .mf-footer {
    background: var(--bg-secondary);
    border-top: 1px solid var(--border-light);
    padding: 36px 28px 24px;
  }
  .mf-footer-grid {
    display: grid; grid-template-columns: 2fr 1fr 1fr 1fr;
    gap: 32px; margin-bottom: 28px;
  }
  .mf-footer-head { font-size: 12px; font-weight: 500; color: var(--text-secondary); margin-bottom: 14px; letter-spacing: 1px; text-transform: uppercase; }
  .mf-footer-links { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }
  .mf-footer-links li a { font-size: 13px; color: var(--text-muted); text-decoration: none; transition: color 0.15s; opacity: 0.7; }
  .mf-footer-links li a:hover { color: var(--accent-primary); opacity: 1; }
  .mf-footer-brand p { font-size: 13px; color: var(--text-muted); line-height: 1.6; margin-top: 10px; opacity: 0.8; }
  .mf-footer-contact-item { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text-muted); margin-bottom: 8px; opacity: 0.8; }
  .mf-footer-bottom {
    border-top: 1px solid var(--border-light); padding-top: 18px;
    display: flex; justify-content: space-between; align-items: center;
  }
  .mf-footer-copy { font-size: 12px; color: var(--text-muted); opacity: 0.6; }
  .mf-footer-legal { display: flex; gap: 20px; }
  .mf-footer-legal a { font-size: 12px; color: var(--text-muted); text-decoration: none; opacity: 0.6; }
  .mf-footer-legal a:hover { color: var(--accent-primary); opacity: 1; }

  @media (max-width: 900px) {
    .mf-body { grid-template-columns: 1fr; }
    .mf-hero { padding: 40px 32px; }
    .mf-panel { border-left: none; border-top: 1px solid var(--border-light); }
    .mf-footer-grid { grid-template-columns: 1fr 1fr; }
  }
`;

const Signup = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  const { register, error: authError, loading } = useAuth();
  const navigate = useNavigate();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name) {
      newErrors.name = 'Name is required';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Name must be at least 3 characters';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      await register(formData.name, formData.email, formData.password);
      setSuccessMessage('Account created successfully! Redirecting to dashboard...');
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err) {
      console.error('Signup error:', err);
    }
  };

  const features = [
    { icon: '🤖', label: 'AI Quality Assessment' },
    { icon: '📡', label: 'IoT Monitoring' },
    { icon: '🧂', label: 'Smart Salt Optimization' },
    { icon: '📊', label: 'Multi-Sensor Analysis' },
  ];

  return (
    <>
      <style>{customStyles}</style>
      <div className={`mf-root theme-${theme}`}>
        {/* ── Header ── */}
        <header className="mf-header">
          <div className="mf-header-inner">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="mf-logo-mark">MF</div>
              <div className="mf-brand-text">
                <h1>Maldive Fish Processing System</h1>
                <p>Enterprise Control Panel v2.0</p>
              </div>
            </div>
            <div className="mf-header-right">
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <div className="mf-status-dot" />
                <span style={{ fontSize: 12, color: 'var(--accent-primary)' }}>System Online</span>
              </div>
              <div className="mf-header-time">
                {time.toLocaleDateString()} &nbsp; {time.toLocaleTimeString()}
              </div>
              <button className="mf-theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
                {theme === 'dark' ? '☀️' : '🌙'}
              </button>
              <div className="mf-header-actions">
                <button className="mf-win-btn">▁</button>
                <button className="mf-win-btn">□</button>
                <button className="mf-win-btn close">✕</button>
              </div>
            </div>
          </div>
        </header>

        {/* ── Nav ── */}
        <nav className="mf-nav">
          <button className="mf-nav-btn">⚙ Settings</button>
          <button className="mf-nav-btn">🔔 Notifications</button>
          <button className="mf-nav-btn">👤 Admin</button>
        </nav>

        {/* ── Body ── */}
        <main className="mf-body">
          {/* Hero left */}
          <div className="mf-hero">
            <div className="mf-ocean-bg">
              <div className="mf-orb mf-orb-1" />
              <div className="mf-orb mf-orb-2" />
              <div className="mf-orb mf-orb-3" />
              <div className="mf-grid-overlay" />
            </div>

            <div className="mf-hero-content">
              <div className="mf-eyebrow">
                <div className="mf-eyebrow-dot" />
                AI-Powered Processing Platform
              </div>

              <h2 className="mf-hero-title">
                Join the Future of<br />
                <span>Fish Processing</span><br />
                in the Maldives
              </h2>

              <p className="mf-hero-sub">
                Create your account to access AI-based quality assessment, IoT monitoring,
                and smart salt optimization tools. Streamline your fish processing operations
                and achieve export-grade consistency.
              </p>

              <div className="mf-stats">
                <div className="mf-stat">
                  <span className="mf-stat-num">98.4%</span>
                  <span className="mf-stat-label">Quality Accuracy</span>
                </div>
                <div className="mf-stat-divider" />
                <div className="mf-stat">
                  <span className="mf-stat-num">3.2×</span>
                  <span className="mf-stat-label">Faster Inspection</span>
                </div>
                <div className="mf-stat-divider" />
                <div className="mf-stat">
                  <span className="mf-stat-num">40%</span>
                  <span className="mf-stat-label">Cost Reduction</span>
                </div>
              </div>

              <div className="mf-features">
                {features.map(f => (
                  <div key={f.label} className="mf-feature-pill">
                    <span className="mf-feature-icon">{f.icon}</span>
                    {f.label}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Signup Panel Right */}
          <div className="mf-panel">
            <div className="mf-form-card">
              <div className="mf-form-header">
                <h3 className="mf-form-title">Create account</h3>
                <p className="mf-form-subtitle">Get started with your processing dashboard</p>
              </div>

              {authError && (
                <div className="mf-auth-error">
                  <span>⚠</span> {authError}
                </div>
              )}

              {successMessage && (
                <div className="mf-success-message">
                  <span>✓</span> {successMessage}
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate>
                {/* Full Name */}
                <div className="mf-field">
                  <label className="mf-label">Full name</label>
                  <div className="mf-input-wrap">
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="John Doe"
                      className={`mf-input${errors.name ? ' error' : ''}`}
                      autoComplete="name"
                    />
                    <svg className="mf-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  {errors.name && <p className="mf-error-text">⚡ {errors.name}</p>}
                </div>

                {/* Email */}
                <div className="mf-field">
                  <label className="mf-label">Email address</label>
                  <div className="mf-input-wrap">
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      className={`mf-input${errors.email ? ' error' : ''}`}
                      autoComplete="email"
                    />
                    <svg className="mf-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                  </div>
                  {errors.email && <p className="mf-error-text">⚡ {errors.email}</p>}
                </div>

                {/* Password */}
                <div className="mf-field">
                  <label className="mf-label">Password</label>
                  <div className="mf-input-wrap">
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className={`mf-input${errors.password ? ' error' : ''}`}
                      autoComplete="new-password"
                    />
                    <svg className="mf-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </div>
                  {errors.password && <p className="mf-error-text">⚡ {errors.password}</p>}
                </div>

                {/* Submit */}
                <button type="submit" className="mf-submit" disabled={loading}>
                  <span>
                    {loading ? (
                      <>
                        <div className="mf-spinner" />
                        Creating account...
                      </>
                    ) : 'Create Account'}
                  </span>
                </button>
              </form>

              <div className="mf-divider">
                <div className="mf-divider-line" />
                <span className="mf-divider-text">OR</span>
                <div className="mf-divider-line" />
              </div>

              <p className="mf-signin-text">
                Already have an account?{' '}
                <Link to="/login">Sign in instead</Link>
              </p>

              <div className="mf-security">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                256-bit encrypted · ISO 22000 compliant
              </div>
            </div>
          </div>
        </main>

        {/* ── Footer ── */}
        <footer className="mf-footer">
          <div className="mf-footer-grid">
            <div className="mf-footer-brand">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="mf-logo-mark" style={{ width: 32, height: 32, fontSize: 11 }}>MF</div>
                <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)' }}>Maldive Fish</span>
              </div>
              <p>Leading fish processing automation system for the Maldives fishing industry — quality, consistency, and export excellence.</p>
            </div>

            <div>
              <div className="mf-footer-head">Platform</div>
              <ul className="mf-footer-links">
                {['Dashboard', 'Processing', 'Quality Control', 'Reports'].map(l => (
                  <li key={l}><a href="#">{l}</a></li>
                ))}
              </ul>
            </div>

            <div>
              <div className="mf-footer-head">Support</div>
              <ul className="mf-footer-links">
                {['Documentation', 'API Reference', 'Contact Support', 'System Status'].map(l => (
                  <li key={l}><a href="#">{l}</a></li>
                ))}
              </ul>
            </div>

            <div>
              <div className="mf-footer-head">Contact</div>
              <div className="mf-footer-contact-item">📧 support@maldivefish.com</div>
              <div className="mf-footer-contact-item">📞 +960 123-4567</div>
              <div className="mf-footer-contact-item">📍 Sri Lanka · Maldive Fish</div>
            </div>
          </div>

          <div className="mf-footer-bottom">
            <span className="mf-footer-copy">© 2026 Maldive Fish Processing System. All rights reserved.</span>
            <div className="mf-footer-legal">
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
              <a href="#">Cookie Policy</a>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default Signup;
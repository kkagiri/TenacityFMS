import React, { useState, useEffect, Fragment } from 'react';
import { Icon } from './Icon.jsx';

// ---- Brand mark: a stylized "T" inside a hex / shield, geometric -----
export function BrandMark({ size = 26, color }) {
  const c = color || 'var(--primary)';
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <defs>
        <linearGradient id="bm-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={c} stopOpacity="1" />
          <stop offset="100%" stopColor={c} stopOpacity="0.7" />
        </linearGradient>
      </defs>
      <path d="M16 1.5l12 6.5v12.5L16 30.5 4 20.5V8z" fill="url(#bm-g)" />
      <path d="M9 11h14v3.2h-5.2v9.3h-3.6v-9.3H9z" fill="#fff" fillOpacity="0.97"/>
      <circle cx="16" cy="22.4" r="0.9" fill="var(--primary-pressed)" opacity="0.9"/>
    </svg>
  );
}

export function Wordmark({ size = 16 }) {
  return (
    <span className="brand">
      <BrandMark size={size + 10} />
      <span style={{ fontSize: size, fontWeight: 600, letterSpacing: '-0.01em', display: 'inline-flex', alignItems: 'baseline', gap: 2 }}>
        Tenacy <span style={{ color: 'var(--text-2)', fontWeight: 500 }}>FMS</span>
      </span>
    </span>
  );
}

// ---- Hash router -------------------------------------------------------
export function useHashRoute() {
  const [route, setRoute] = useState(() => window.location.hash.replace(/^#\/?/, '') || 'home');
  useEffect(() => {
    const onHash = () => {
      setRoute(window.location.hash.replace(/^#\/?/, '') || 'home');
      window.scrollTo({ top: 0, behavior: 'instant' });
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  return route;
}
export function navigate(route) { window.location.hash = '#/' + route; }

function NavLink({ to, current, children }) {
  return (
    <a href={'#/' + to}
       className={current === to ? 'active' : ''}
       onClick={(e) => { e.preventDefault(); navigate(to); }}>
      {children}
    </a>
  );
}

// ---- Header ------------------------------------------------------------
export function Header({ current }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  const onSignIn = (e) => {
    e.preventDefault();
    const url = import.meta.env.VITE_APP_LOGIN_URL;
    if (url) window.location.href = url;
    else alert('Sign in → set VITE_APP_LOGIN_URL in .env.local to redirect to your authenticated app.');
  };
  return (
    <header className={'site-header' + (scrolled ? ' scrolled' : '')}>
      <div className="container">
        <a href="#/home" onClick={(e) => { e.preventDefault(); navigate('home'); }}>
          <Wordmark />
        </a>
        <nav className="nav" style={{ display: 'flex' }}>
          <NavLink to="home" current={current}>Home</NavLink>
          <NavLink to="solutions" current={current}>Solutions</NavLink>
          <NavLink to="industries" current={current}>Industries</NavLink>
          <NavLink to="pricing" current={current}>Pricing</NavLink>
          <NavLink to="about" current={current}>About</NavLink>
          <NavLink to="contact" current={current}>Contact</NavLink>
        </nav>
        <div className="row gap-2 center">
          <a href="#/login" className="btn btn-ghost btn-sm" style={{ display: 'inline-flex' }}
             onClick={onSignIn}>
            Sign in
          </a>
          <a href="#/onboarding" className="btn btn-primary btn-sm"
             onClick={(e) => { e.preventDefault(); navigate('onboarding'); }}>
            Start free trial
          </a>
        </div>
      </div>
    </header>
  );
}

// ---- Footer ------------------------------------------------------------
export function Footer() {
  const cols = [
    { title: 'Product', items: ['Solutions', 'Pricing', 'Integrations', 'Changelog', 'Status'] },
    { title: 'Industries', items: ['Logistics', 'Mining', 'Construction', 'Retail Fuel', 'Public Sector', 'Agriculture'] },
    { title: 'Company', items: ['About', 'Customers', 'Careers', 'Press', 'Contact'] },
    { title: 'Resources', items: ['Documentation', 'API reference', 'Security', 'Privacy', 'Terms'] },
  ];
  return (
    <footer className="site-footer">
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr repeat(4, 1fr)', gap: 'var(--s-8)', marginBottom: 'var(--s-9)' }}>
          <div>
            <Wordmark />
            <p className="muted" style={{ marginTop: 16, maxWidth: 280, fontSize: 14 }}>
              Real-time fleet, fuel and tank intelligence for operators who can&apos;t afford to guess.
            </p>
            <div className="row gap-2" style={{ marginTop: 20 }}>
              {['globe', 'mail', 'phone'].map(n => (
                <a key={n} href="#" className="btn btn-secondary btn-sm" style={{ width: 32, height: 32, padding: 0 }}>
                  <Icon name={n} size={14} />
                </a>
              ))}
            </div>
          </div>
          {cols.map(c => (
            <div key={c.title}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>{c.title}</div>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {c.items.map(i => (
                  <li key={i}><a href="#" style={{ fontSize: 14, color: 'var(--text-2)' }}>{i}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="divider" style={{ marginBottom: 24 }}></div>
        <div className="row between center" style={{ fontSize: 13, color: 'var(--text-3)' }}>
          <div>© 2026 Tenacy FMS. All rights reserved.</div>
          <div className="row gap-5">
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
            <a href="#">Cookies</a>
            <span className="row gap-2 center"><span className="tag-dot"></span> All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

// keep Fragment import used (silences unused-import lints if we expand later)
export { Fragment };

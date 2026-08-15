import { Link, useLocation } from 'react-router-dom';

export default function Layout({ children }) {
  const location = useLocation();

  const isBars = location.pathname === '/' || location.pathname.startsWith('/bar/');
  const isFriends = location.pathname === '/friends';
  const isProfile = location.pathname === '/profile';

  const navItemStyle = (active) => ({
    flex: 1,
    textAlign: 'center',
    textDecoration: 'none',
    padding: '12px 8px',
    borderRadius: '14px',
    fontWeight: 800,
    fontSize: '0.95rem',
    letterSpacing: '-0.01em',
    color: active ? '#07130b' : 'rgba(239,255,244,0.72)',
    background: active ? '#5BFF8A' : 'transparent',
    transition: 'background 0.15s ease, color 0.15s ease',
  });

  return (
    <div className="app-shell">
      <main className="page-shell">{children}</main>

      <nav className="bottom-nav" aria-label="Primary navigation">
        <Link to="/" style={navItemStyle(isBars)}>Bars</Link>
        <Link to="/friends" style={navItemStyle(isFriends)}>Friends</Link>
        <Link to="/profile" style={navItemStyle(isProfile)}>Profile</Link>
      </nav>
    </div>
  );
}

import { Link, useLocation } from 'react-router-dom';
import { BarsIcon, FriendsIcon, ProfileIcon } from './AppIcons';

export default function Layout({ children }) {
  const location = useLocation();

  const isBars = location.pathname === '/' || location.pathname.startsWith('/bar/');
  const isFriends = location.pathname === '/friends';
  const isProfile = location.pathname === '/profile';

  const navItems = [
    { to: '/', label: 'Bars', active: isBars, Icon: BarsIcon },
    { to: '/friends', label: 'Friends', active: isFriends, Icon: FriendsIcon },
    { to: '/profile', label: 'Profile', active: isProfile, Icon: ProfileIcon },
  ];

  return (
    <div className="app-shell">
      <main className="page-shell">{children}</main>

      <nav className="bottom-nav" aria-label="Primary Navigation">
        {navItems.map(({ to, label, active, Icon }) => (
          <Link key={to} to={to} className={`bottom-nav-item ${active ? 'bottom-nav-item-active' : ''}`}>
            <Icon size={19} />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}

import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children }) {
  const { profile, logOut } = useAuth();
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link to="/" className="brand-lockup">
          <img src="/logo-mark.svg" alt="Here" className="brand-mark" />
          <div>
            <div className="brand-name">Here</div>
            <div className="brand-tag">MSU Nightlife Tracker</div>
          </div>
        </Link>

        <div className="topbar-right">
          {profile?.username ? <span className="user-pill">@{profile.username}</span> : null}
          {!isHome ? <Link className="ghost-button" to="/">Back home</Link> : null}
          <button className="ghost-button" onClick={logOut}>Log out</button>
        </div>
      </header>

      <motion.main
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className="page-shell"
      >
        {children}
      </motion.main>
    </div>
  );
}

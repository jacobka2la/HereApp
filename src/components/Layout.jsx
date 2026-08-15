import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Layout({ children }) {
  const location = useLocation();

  const isBars =
    location.pathname === '/' || location.pathname.startsWith('/bar/');

  const isFriends = location.pathname === '/friends';
  const isProfile = location.pathname === '/profile';

  return (
    <div
      className="app-shell"
      style={{
        paddingTop: 'calc(env(safe-area-inset-top) + 70px)',
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 96px)',
      }}
    >
      <motion.main
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className="page-shell"
      >
        {children}
      </motion.main>

      <nav
        style={{
          position: 'fixed',
          left: '50%',
          bottom: 'max(18px, calc(env(safe-area-inset-bottom) + 12px))',
          transform: 'translateX(-50%)',
          width: 'min(94vw, 460px)',
          display: 'flex',
          justifyContent: 'space-between',
          gap: '10px',
          padding: '12px',
          borderRadius: '24px',
          background: 'rgba(7, 18, 10, 0.94)',
          border: '1px solid rgba(120, 255, 170, 0.14)',
          boxShadow: '0 18px 45px rgba(0, 0, 0, 0.35)',
          backdropFilter: 'blur(16px)',
          zIndex: 1000,
        }}
      >
        <Link
          to="/"
          style={{
            flex: 1,
            textAlign: 'center',
            textDecoration: 'none',
            padding: '14px 10px',
            borderRadius: '18px',
            fontWeight: 800,
            fontSize: '1rem',
            color: isBars ? '#03150a' : '#e9fff0',
            background: isBars ? '#53f07c' : 'transparent',
            border: isBars ? 'none' : '1px solid rgba(120, 255, 170, 0.14)',
            transition: 'all 0.18s ease',
          }}
        >
          Bars
        </Link>

        <Link
          to="/friends"
          style={{
            flex: 1,
            textAlign: 'center',
            textDecoration: 'none',
            padding: '14px 10px',
            borderRadius: '18px',
            fontWeight: 800,
            fontSize: '1rem',
            color: isFriends ? '#03150a' : '#e9fff0',
            background: isFriends ? '#53f07c' : 'transparent',
            border: isFriends ? 'none' : '1px solid rgba(120, 255, 170, 0.14)',
            transition: 'all 0.18s ease',
          }}
        >
          Friends
        </Link>

        <Link
          to="/profile"
          style={{
            flex: 1,
            textAlign: 'center',
            textDecoration: 'none',
            padding: '14px 10px',
            borderRadius: '18px',
            fontWeight: 800,
            fontSize: '1rem',
            color: isProfile ? '#03150a' : '#e9fff0',
            background: isProfile ? '#53f07c' : 'transparent',
            border: isProfile ? 'none' : '1px solid rgba(120, 255, 170, 0.14)',
            transition: 'all 0.18s ease',
          }}
        >
          Profile
        </Link>
      </nav>
    </div>
  );
}
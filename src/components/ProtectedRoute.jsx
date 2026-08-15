import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { isAuthed, authLoading } = useAuth();
  const location = useLocation();

  if (authLoading) {
    return (
      <div className="app-loading-shell" aria-label="Loading Here">
        <img src="/logo-full.png" alt="Here" className="app-loading-logo" />
        <div className="loading-skeleton loading-skeleton-hero" />
        <div className="loading-skeleton-row">
          <div className="loading-skeleton" />
          <div className="loading-skeleton" />
        </div>
        <div className="loading-skeleton loading-skeleton-card" />
      </div>
    );
  }

  if (!isAuthed) {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  }

  return children;
}

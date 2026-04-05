import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { isAuthed, authLoading } = useAuth();
  const location = useLocation();

  if (authLoading) {
    return <div className="screen-center">Loading Here...</div>;
  }

  if (!isAuthed) {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  }

  return children;
}

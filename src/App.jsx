import { useEffect } from 'react';
import { useLocation, Navigate, Route, Routes } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import FriendsPage from './pages/FriendsPage';
import HomeTabPage from './pages/HomeTabPage';
import BarDetailPage from './pages/BarDetailPage';
import LegalPage from './pages/LegalPage';
import AvatarPickerPage from './pages/AvatarPickerPage';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function AvatarRequired({ children }) {
  const { profile, authLoading } = useAuth();
  if (authLoading) return null;
  if (!profile?.avatarId) return <Navigate to="/pick-avatar" replace />;
  return children;
}

export default function App() {
  return (
    <>
      <ScrollToTop />

      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/terms" element={<LegalPage />} />
        <Route path="/privacy" element={<LegalPage />} />
        <Route path="/community-rules" element={<LegalPage />} />
        <Route path="/support" element={<LegalPage />} />
        <Route path="/pick-avatar" element={<ProtectedRoute><AvatarPickerPage /></ProtectedRoute>} />

        <Route path="/" element={<ProtectedRoute><AvatarRequired><HomePage /></AvatarRequired></ProtectedRoute>} />
        <Route path="/friends" element={<ProtectedRoute><AvatarRequired><FriendsPage /></AvatarRequired></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><AvatarRequired><HomeTabPage /></AvatarRequired></ProtectedRoute>} />
        <Route path="/bar/:barId" element={<ProtectedRoute><AvatarRequired><BarDetailPage /></AvatarRequired></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { avatars } from '../lib/avatars';
import { useAuth } from '../context/AuthContext';
import '../avatar-picker.css';

const AVATAR_PENDING_KEY = 'here_pending_avatar_choice';

export default function AvatarConfirmPage() {
  const navigate = useNavigate();
  const { firebaseUser, profile, authLoading, setAvatarOnce } = useAuth();
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState('');
  const selected = sessionStorage.getItem(AVATAR_PENDING_KEY) || '';
  const selectedAvatar = avatars.find((avatar) => avatar.id === selected) || null;

  if (authLoading) return null;
  if (!firebaseUser) return <Navigate to="/auth" replace />;
  if (profile?.avatarId) {
    sessionStorage.removeItem(AVATAR_PENDING_KEY);
    return <Navigate to="/" replace />;
  }
  if (!selectedAvatar) return <Navigate to="/pick-avatar" replace />;

  const changeAvatar = () => {
    if (isConfirming) return;
    navigate('/pick-avatar');
  };

  const confirmAvatar = async () => {
    if (isConfirming) return;

    setIsConfirming(true);
    setConfirmError('');

    try {
      await setAvatarOnce(selected);
      sessionStorage.removeItem(AVATAR_PENDING_KEY);
      navigate('/', { replace: true });
    } catch (error) {
      // If the avatar was already saved, treat that as success instead of
      // leaving the user stuck on the confirmation screen.
      if (error?.message === 'AVATAR_ALREADY_SET') {
        sessionStorage.removeItem(AVATAR_PENDING_KEY);
        navigate('/', { replace: true });
        return;
      }

      setConfirmError('Couldn’t save your avatar. Please try again.');
      setIsConfirming(false);
    }
  };

  return (
    <main className="avatar-picker-shell avatar-confirm-screen">
      <div className="avatar-final-card">
        <img src={selectedAvatar.image} alt="" className="avatar-final-preview" />
        <div className="avatar-final-copy">
          <h1>Are You Sure?</h1>
          <p>You Won’t Be Able To Change Your Avatar After This.</p>
          {confirmError ? <p role="alert">{confirmError}</p> : null}
        </div>
        <div className="avatar-final-actions">
          <button
            type="button"
            className="ghost-button avatar-change-button"
            onClick={changeAvatar}
            disabled={isConfirming}
          >
            Change Avatar
          </button>
          <button
            type="button"
            className="primary-button avatar-final-confirm"
            onClick={confirmAvatar}
            disabled={isConfirming}
          >
            {isConfirming ? 'Confirming…' : 'Confirm'}
          </button>
        </div>
      </div>
    </main>
  );
}

import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { avatars } from '../lib/avatars';
import { useAuth } from '../context/AuthContext';
import '../avatar-picker.css';

const AVATAR_PENDING_KEY = 'here_pending_avatar_choice';

export default function AvatarPickerPage() {
  const navigate = useNavigate();
  const { firebaseUser, profile, authLoading } = useAuth();
  const [selected, setSelected] = useState(sessionStorage.getItem(AVATAR_PENDING_KEY) || '');

  if (authLoading) return null;
  if (!firebaseUser) return <Navigate to="/auth" replace />;
  if (profile?.avatarId) {
    sessionStorage.removeItem(AVATAR_PENDING_KEY);
    return <Navigate to="/" replace />;
  }

  const selectAvatar = (avatarId) => {
    setSelected(avatarId);
    sessionStorage.setItem(AVATAR_PENDING_KEY, avatarId);
  };

  const reviewAvatar = () => {
    if (!selected) return;
    sessionStorage.setItem(AVATAR_PENDING_KEY, selected);
    navigate('/confirm-avatar');
  };

  return (
    <main className="avatar-picker-shell">
      <div className="avatar-picker-inner">
        <div className="avatar-picker-heading">
          <h1>Pick Your Avatar</h1>
          <p>Choose One Below. Nothing Is Saved Until You Confirm It.</p>
        </div>

        <div className="avatar-grid">
          {avatars.map((avatar) => {
            const isSelected = selected === avatar.id;
            return (
              <button
                key={avatar.id}
                className={`avatar-option ${isSelected ? 'avatar-option-selected' : ''}`}
                onClick={() => selectAvatar(avatar.id)}
                type="button"
                aria-label={avatar.alt}
                aria-pressed={isSelected}
              >
                <img className="avatar-art" src={avatar.image} alt="" />
                <div className="avatar-choice-footer">
                  <span className="avatar-select-dot" />
                  <span className="avatar-select-label">{isSelected ? 'Selected' : 'Select'}</span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="avatar-confirm-dock">
          <div className="avatar-confirm-copy">
            <strong>{selected ? 'Avatar Selected' : 'Choose An Avatar'}</strong>
            <span>{selected ? 'Tap Confirm Avatar To Review Your Choice.' : 'Pick One Above First.'}</span>
          </div>
          <button
            className="primary-button avatar-continue"
            type="button"
            disabled={!selected}
            onClick={reviewAvatar}
          >
            Confirm Avatar
          </button>
        </div>
      </div>
    </main>
  );
}

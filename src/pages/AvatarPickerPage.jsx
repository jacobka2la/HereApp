import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { avatars } from '../lib/avatars';
import { useAuth } from '../context/AuthContext';
import '../avatar-picker.css';

const AVATAR_SIGNUP_FLAG = 'here_needs_avatar_after_signup';

export default function AvatarPickerPage() {
  const navigate = useNavigate();
  const { firebaseUser, profile, authLoading, setAvatarOnce } = useAuth();
  const [selected, setSelected] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (authLoading) return null;
  if (!firebaseUser) return <Navigate to="/auth" replace />;
  if (profile?.avatarId) {
    sessionStorage.removeItem(AVATAR_SIGNUP_FLAG);
    return <Navigate to="/" replace />;
  }
  if (sessionStorage.getItem(AVATAR_SIGNUP_FLAG) !== '1') return <Navigate to="/" replace />;

  const selectedAvatar = avatars.find((avatar) => avatar.id === selected) || null;

  const selectAvatar = (avatarId) => {
    if (saving) return;
    setSelected(avatarId);
    setShowConfirm(false);
    setError('');
  };

  const openConfirm = () => {
    if (!selected || saving) return;
    setShowConfirm(true);
    setError('');
  };

  const confirmAvatar = async () => {
    if (!selected || saving) return;

    setSaving(true);
    setError('');

    try {
      await setAvatarOnce(selected);
      sessionStorage.removeItem(AVATAR_SIGNUP_FLAG);
      navigate('/', { replace: true });
    } catch (err) {
      if (err?.message === 'AVATAR_ALREADY_SET') {
        sessionStorage.removeItem(AVATAR_SIGNUP_FLAG);
        navigate('/', { replace: true });
        return;
      }
      setShowConfirm(false);
      setError('Could Not Save Your Avatar. Try Again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="avatar-picker-shell">
      <div className="avatar-picker-inner">
        <div className="avatar-picker-heading">
          <h1>Pick Your Avatar</h1>
          <p>Choose One Below. You’ll Get One Last Chance To Confirm Before It’s Saved.</p>
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

        {error ? <div className="error-banner">{error}</div> : null}

        <div className="avatar-confirm-dock">
          <div className="avatar-confirm-copy">
            <strong>{selected ? 'Avatar Selected' : 'Choose An Avatar'}</strong>
            <span>{selected ? 'Ready? Tap Confirm Avatar.' : 'Pick One Above First.'}</span>
          </div>
          <button
            className="primary-button avatar-continue"
            type="button"
            disabled={!selected || saving}
            onClick={openConfirm}
          >
            Confirm Avatar
          </button>
        </div>
      </div>

      {showConfirm && selectedAvatar ? (
        <div className="avatar-confirm-overlay" role="presentation">
          <div className="avatar-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="avatar-confirm-title">
            <img src={selectedAvatar.image} alt="" className="avatar-confirm-preview" />
            <div className="avatar-confirm-modal-copy">
              <h2 id="avatar-confirm-title">Are You Sure?</h2>
              <p>You Won’t Be Able To Change Your Avatar After This.</p>
            </div>
            <div className="avatar-confirm-actions">
              <button
                type="button"
                className="ghost-button avatar-change-button"
                disabled={saving}
                onClick={() => setShowConfirm(false)}
              >
                Change Avatar
              </button>
              <button
                type="button"
                className="primary-button avatar-final-confirm"
                disabled={saving}
                onClick={confirmAvatar}
              >
                {saving ? 'Saving…' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

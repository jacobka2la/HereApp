import { Navigate, useNavigate, useState } from 'react-router-dom';
import { avatars } from '../lib/avatars';
import { useAuth } from '../context/AuthContext';
import '../avatar-picker.css';

export default function AvatarPickerPage() {
  const navigate = useNavigate();
  const { firebaseUser, profile, authLoading, setAvatarOnce } = useAuth();
  const [selected, setSelected] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (authLoading) return null;
  if (!firebaseUser) return <Navigate to="/auth" replace />;
  if (profile?.avatarId) return <Navigate to="/" replace />;

  const continueWithAvatar = async () => {
    if (!selected || saving) return;

    setSaving(true);
    setError('');

    try {
      await setAvatarOnce(selected);
      navigate('/', { replace: true });
    } catch (err) {
      if (err?.message === 'AVATAR_ALREADY_SET') {
        navigate('/', { replace: true });
        return;
      }
      setError('Could not save your avatar. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="avatar-picker-shell">
      <div className="avatar-picker-inner">
        <div className="avatar-picker-heading">
          <h1>Pick Your Avatar</h1>
          <p>Choose one. Once you pick it, it’s yours for good.</p>
        </div>

        <div className="avatar-grid">
          {avatars.map((avatar) => (
            <button
              key={avatar.id}
              className={`avatar-option ${selected === avatar.id ? 'avatar-option-selected' : ''}`}
              onClick={() => setSelected(avatar.id)}
              type="button"
              aria-label={avatar.alt}
              aria-pressed={selected === avatar.id}
            >
              <img className="avatar-art" src={avatar.image} alt="" />
              <span className="avatar-select-dot" />
            </button>
          ))}
        </div>

        {error ? <div className="error-banner">{error}</div> : null}

        <button
          className="primary-button avatar-continue"
          type="button"
          disabled={!selected || saving}
          onClick={continueWithAvatar}
        >
          {saving ? 'Saving…' : 'Continue →'}
        </button>
      </div>
    </main>
  );
}

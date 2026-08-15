import { Navigate, useState } from 'react';
import { avatars } from '../lib/avatars';
import { useAuth } from '../context/AuthContext';

function AvatarArt({ avatar }) {
  const isLongHair = avatar.id === 'avatar-3' || avatar.id === 'avatar-4';
  return (
    <svg viewBox="0 0 240 300" className="avatar-art" aria-hidden="true">
      <rect width="240" height="300" rx="28" fill="#0c120e" />
      {isLongHair ? <ellipse cx="120" cy="125" rx="72" ry="92" fill={avatar.hair} /> : <ellipse cx="120" cy="102" rx="62" ry="58" fill={avatar.hair} />}
      <circle cx="120" cy="120" r="55" fill={avatar.skin} />
      {!isLongHair ? <path d="M66 102 Q86 44 133 52 Q177 58 178 99 Q151 76 119 77 Q88 77 66 102" fill={avatar.hair} /> : null}
      <circle cx="99" cy="118" r="5" fill="#161616" /><circle cx="141" cy="118" r="5" fill="#161616" />
      <path d="M103 145 Q120 158 138 145" stroke="#fff" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M61 245 Q73 190 120 186 Q168 190 180 245 L180 300 L60 300 Z" fill="#111" />
      <path d="M165 221 Q185 202 202 218" stroke={avatar.skin} strokeWidth="18" fill="none" strokeLinecap="round" />
      {avatar.drinkType === 'wine' ? <><path d="M190 185 h24 l-4 32 q-8 14-16 0z" fill={avatar.drink} stroke="#ddd" strokeWidth="2"/><path d="M202 217 v25" stroke="#ddd" strokeWidth="3"/><path d="M192 242 h20" stroke="#ddd" strokeWidth="3"/></> : avatar.drinkType === 'rocks' ? <rect x="184" y="185" width="30" height="40" rx="5" fill={avatar.drink} stroke="#ddd" strokeWidth="2"/> : <><rect x="185" y="182" width="30" height="44" rx="5" fill={avatar.drink} stroke="#ddd" strokeWidth="2"/>{avatar.drinkType === 'straw' ? <path d="M208 183 l8 -22" stroke="#5BFF8A" strokeWidth="4"/> : null}</>}
    </svg>
  );
}

export default function AvatarPickerPage() {
  const { firebaseUser, profile, authLoading, setAvatarOnce } = useAuth();
  const [selected, setSelected] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (authLoading) return null;
  if (!firebaseUser) return <Navigate to="/auth" replace />;
  if (profile?.avatarId) return <Navigate to="/" replace />;

  const continueWithAvatar = async () => {
    if (!selected || saving) return;
    setSaving(true); setError('');
    try { await setAvatarOnce(selected); }
    catch (err) { setError(err.message === 'AVATAR_ALREADY_SET' ? 'Your avatar has already been locked in.' : 'Could not save your avatar. Try again.'); }
    finally { setSaving(false); }
  };

  return (
    <main className="avatar-picker-shell">
      <div className="avatar-picker-inner">
        <div className="avatar-picker-heading"><h1>Pick Your Avatar</h1><p>Choose one. Once you pick it, it’s yours for good.</p></div>
        <div className="avatar-grid">
          {avatars.map((avatar) => <button key={avatar.id} className={`avatar-option ${selected === avatar.id ? 'avatar-option-selected' : ''}`} onClick={() => setSelected(avatar.id)} type="button"><AvatarArt avatar={avatar} /><span className="avatar-select-dot" /></button>)}
        </div>
        {error ? <div className="error-banner">{error}</div> : null}
        <button className="primary-button avatar-continue" type="button" disabled={!selected || saving} onClick={continueWithAvatar}>{saving ? 'Saving…' : 'Continue →'}</button>
      </div>
    </main>
  );
}

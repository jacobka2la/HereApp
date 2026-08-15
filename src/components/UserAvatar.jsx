import { getAvatarById } from '../lib/avatars';

const sizeMap = {
  sm: 34,
  md: 42,
  lg: 56,
  xl: 72,
};

export default function UserAvatar({ username = '', avatarId = '', size = 'md' }) {
  const avatar = avatarId ? getAvatarById(avatarId) : null;
  const clean = String(username || '?').replace(/^@/, '').trim();
  const initial = (clean[0] || '?').toUpperCase();
  const pixels = sizeMap[size] || sizeMap.md;
  const commonStyle = {
    width: `${pixels}px`,
    height: `${pixels}px`,
    minWidth: `${pixels}px`,
    borderRadius: size === 'xl' ? '20px' : '50%',
    overflow: 'hidden',
  };

  if (avatar?.image) {
    return (
      <span className={`user-avatar user-avatar-${size} user-avatar-image-wrap`} style={commonStyle} aria-hidden="true">
        <img
          src={avatar.image}
          alt=""
          className="user-avatar-image"
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', display: 'block' }}
        />
      </span>
    );
  }

  return (
    <span className={`user-avatar user-avatar-${size}`} style={{ ...commonStyle, display: 'inline-grid', placeItems: 'center' }} aria-hidden="true">
      {initial}
    </span>
  );
}

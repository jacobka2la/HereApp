import { getAvatarById } from '../lib/avatars';

export default function UserAvatar({ username = '', avatarId = '', size = 'md' }) {
  const avatar = avatarId ? getAvatarById(avatarId) : null;
  const clean = String(username || '?').replace(/^@/, '').trim();
  const initial = (clean[0] || '?').toUpperCase();

  if (avatar?.image) {
    return (
      <span className={`user-avatar user-avatar-${size} user-avatar-image-wrap`} aria-hidden="true">
        <img src={avatar.image} alt="" className="user-avatar-image" />
      </span>
    );
  }

  return (
    <span className={`user-avatar user-avatar-${size}`} aria-hidden="true">
      {initial}
    </span>
  );
}

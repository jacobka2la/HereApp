export default function UserAvatar({ username = '', size = 'md' }) {
  const clean = String(username || '?').replace(/^@/, '').trim();
  const initial = (clean[0] || '?').toUpperCase();

  return (
    <span className={`user-avatar user-avatar-${size}`} aria-hidden="true">
      {initial}
    </span>
  );
}

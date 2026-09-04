import { useEffect, useState } from 'react';
import { reactionOptions } from '../lib/bars';
import { formatRelativeTime } from '../lib/day';
import { getPublicProfilesByUids } from '../lib/firebaseHelpers';
import UserAvatar from './UserAvatar';

export default function CommentItem({ comment, reactionCounts, activeReaction, onReact }) {
  const [profileAvatarId, setProfileAvatarId] = useState('');

  useEffect(() => {
    let cancelled = false;

    if (!comment?.uid || comment?.avatarId) {
      setProfileAvatarId('');
      return () => { cancelled = true; };
    }

    getPublicProfilesByUids([comment.uid])
      .then((profiles) => {
        if (!cancelled) setProfileAvatarId(profiles?.[comment.uid]?.avatarId || '');
      })
      .catch(() => {
        if (!cancelled) setProfileAvatarId('');
      });

    return () => { cancelled = true; };
  }, [comment?.uid, comment?.avatarId]);

  const avatarId = comment.avatarId || profileAvatarId;

  return (
    <article className="comment-card">
      <div className="comment-topline">
        <div className="comment-author">
          <UserAvatar username={comment.username} avatarId={avatarId} size="sm" />
          <strong className="comment-username">@{comment.username}</strong>
        </div>
        <span className="comment-time">{formatRelativeTime(comment.createdAtMillis)}</span>
      </div>

      <p className="comment-text">{comment.text}</p>

      <div className="reaction-row">
        {reactionOptions.map((emoji) => (
          <button
            key={emoji}
            type="button"
            className={`reaction-chip ${activeReaction === emoji ? 'reaction-chip-active' : ''}`}
            onClick={() => onReact(comment.id, emoji)}
          >
            {emoji} {reactionCounts[emoji] ?? 0}
          </button>
        ))}
      </div>
    </article>
  );
}

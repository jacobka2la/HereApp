import { reactionOptions } from '../lib/bars';
import { formatRelativeTime } from '../lib/day';

export default function CommentItem({ comment, reactionCounts, activeReaction, onReact }) {
  return (
    <article className="comment-card">
      <div className="comment-topline">
        <strong>@{comment.username}</strong>
        <span>{formatRelativeTime(comment.createdAtMillis)}</span>
      </div>
      <p>{comment.text}</p>
      <div className="reaction-row">
        {reactionOptions.map((emoji) => (
          <button
            key={emoji}
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

import { reactionOptions } from '../lib/bars';
import { formatRelativeTime } from '../lib/day';

export default function CommentItem({ comment, reactionCounts, activeReaction, onReact }) {
  return (
    <article className="comment-card">
      <div
        className="comment-topline"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '10px',
          flexWrap: 'wrap',
          marginBottom: '8px',
        }}
      >
        <strong
          style={{
            fontSize: '0.98rem',
            fontWeight: 800,
            color: '#f4fff7',
          }}
        >
          @{comment.username}
        </strong>

        <span
          style={{
            fontSize: '0.82rem',
            color: 'rgba(235,255,240,0.62)',
            fontWeight: 600,
          }}
        >
          {formatRelativeTime(comment.createdAtMillis)}
        </span>
      </div>

      <p
        style={{
          margin: 0,
          marginBottom: '12px',
          lineHeight: 1.55,
          color: 'rgba(245,255,248,0.92)',
          wordBreak: 'break-word',
        }}
      >
        {comment.text}
      </p>

      <div
        className="reaction-row"
        style={{
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap',
        }}
      >
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
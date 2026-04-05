import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import Layout from '../components/Layout';
import CommentItem from '../components/CommentItem';
import { useAuth } from '../context/AuthContext';
import { coverRanges, getBarMeta, vibeOptions } from '../lib/bars';
import { buildBarStats } from '../lib/scoring';
import {
  addComment,
  subscribeToTodayCollection,
  toggleReaction,
  updateCover,
  updateVibe,
  upsertCheckIn,
} from '../lib/firebaseHelpers';

const vibeCooldownMs = 5 * 60 * 1000;
const coverCooldownMs = 10 * 60 * 1000;
const commentCooldownMs = 60 * 1000;

export default function BarDetailPage() {
  const { barId } = useParams();
  const { firebaseUser, profile } = useAuth();
  const bar = getBarMeta(barId);
  const [checkins, setCheckins] = useState([]);
  const [vibes, setVibes] = useState([]);
  const [coverReports, setCoverReports] = useState([]);
  const [comments, setComments] = useState([]);
  const [reactions, setReactions] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    const unsubscribers = [
      subscribeToTodayCollection('checkins', setCheckins),
      subscribeToTodayCollection('vibes', setVibes),
      subscribeToTodayCollection('coverReports', setCoverReports),
      subscribeToTodayCollection('comments', setComments),
      subscribeToTodayCollection('commentReactions', setReactions),
    ];

    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, []);

  const stats = useMemo(() => buildBarStats(barId, checkins, vibes, coverReports, comments, reactions), [barId, checkins, vibes, coverReports, comments, reactions]);

  const myVibe = vibes.find((item) => item.uid === firebaseUser.uid && item.barId === barId)?.vibe;
const myCover = coverReports.find((item) => item.uid === firebaseUser.uid && item.barId === barId)?.range;
const myCheckin = checkins.find((item) => item.uid === firebaseUser.uid && item.active);
const isCheckedIntoThisBar = myCheckin?.barId === barId && myCheckin?.active;
  const myCommentReactions = Object.fromEntries(
    reactions.filter((item) => item.uid === firebaseUser.uid).map((item) => [item.commentId, item.emoji])
  );

  const handleCheckIn = async () => {
    await upsertCheckIn({ uid: firebaseUser.uid, username: profile.username, barId });
    setFeedback(`Checked into ${bar.name}.`);
  };

  const handleVibe = async (value) => {
  if (!isCheckedIntoThisBar) {
    setFeedback('Check in first before updating the vibe.');
    return;
  }

  const lastVote = vibes.find((item) => item.uid === firebaseUser.uid && item.barId === barId);
  if (lastVote && Date.now() - lastVote.createdAtMillis < vibeCooldownMs) {
    setFeedback('Wait a few minutes before changing the vibe again.');
    return;
  }

  await updateVibe({ uid: firebaseUser.uid, username: profile.username, barId, vibe: value });
  setFeedback('Vibe updated.');
};

  const handleCover = async (range) => {
  if (!isCheckedIntoThisBar) {
    setFeedback('Check in first before reporting cover.');
    return;
  }

  const lastCover = coverReports.find((item) => item.uid === firebaseUser.uid && item.barId === barId);
  if (lastCover && Date.now() - lastCover.createdAtMillis < coverCooldownMs) {
    setFeedback('Wait a little before updating cover again.');
    return;
  }

  await updateCover({ uid: firebaseUser.uid, username: profile.username, barId, range });
  setFeedback('Cover updated.');
};

  const handleComment = async (event) => {
  event.preventDefault();

  if (!isCheckedIntoThisBar) {
    setFeedback('Check in first before posting a comment.');
    return;
  }

  if (!commentText.trim()) return;

  const latestMine = [...comments]
    .filter((item) => item.uid === firebaseUser.uid && item.barId === barId)
    .sort((a, b) => b.createdAtMillis - a.createdAtMillis)[0];

  if (latestMine && Date.now() - latestMine.createdAtMillis < commentCooldownMs) {
    setFeedback('Slow down a sec before posting another comment.');
    return;
  }

  await addComment({
    uid: firebaseUser.uid,
    username: profile.username,
    barId,
    text: commentText.trim().slice(0, 180),
  });

  setCommentText('');
  setFeedback('Comment posted.');
};

  const handleReaction = async (commentId, emoji) => {
    await toggleReaction({ uid: firebaseUser.uid, username: profile.username, commentId, emoji });
  };

  if (!bar) {
    return (
      <Layout>
        <div className="empty-state">That bar wasn't found.</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="detail-grid">
        <div className="detail-primary">
          <div className="detail-card detail-hero">
            <span className="hero-kicker">{bar.neighborhood}</span>
            <h1>{bar.name}</h1>
            <p className="detail-vibe">{stats.currentVibeLabel}</p>

            <div className="hero-stats hero-stats-tight">
              <div>
                <span className="label">Checked in</span>
                <strong>{stats.count}</strong>
              </div>
              <div>
                <span className="label">Cover</span>
                <strong>{stats.coverSummary ? `${stats.coverSummary.label} · ${stats.coverSummary.count} reports` : 'No reports yet'}</strong>
              </div>
              <div>
                <span className="label">Your status</span>
                <strong>{myCheckin?.barId === barId ? 'You are here' : 'Not checked in'}</strong>
              </div>
            </div>

            <div className="action-stack">
              <button className="primary-button" onClick={handleCheckIn}>I’m here</button>
            </div>

            {feedback ? <div className="info-banner">{feedback}</div> : null}
          </div>

          <div className="detail-card">
            <div className="section-headline small-gap">
              <div>
                <h2>Update the vibe</h2>
                <p>One vibe per user at a time. New vote replaces your old one.</p>
              </div>
            </div>

            {!isCheckedIntoThisBar ? (
  <p className="bar-lock-note">Check in first to update the vibe.</p>
) : null}
            <div className="chip-grid">
              {vibeOptions.map((option) => (
                <button
  key={option.value}
  className={`select-chip ${myVibe === option.value ? 'select-chip-active' : ''}`}
  onClick={() => handleVibe(option.value)}
  disabled={!isCheckedIntoThisBar}
>
  {option.label}
</button>
              ))}
            </div>
          </div>

          <div className="detail-card">
            <div className="section-headline small-gap">
              <div>
                <h2>Report cover</h2>
                <p>Pick the closest range. The app shows the most reported one.</p>
              </div>
            </div>
            <div className="chip-grid">
              {coverRanges.map((range) => (
                <button
  key={range}
  className={`select-chip ${myCover === range ? 'select-chip-active' : ''}`}
  onClick={() => handleCover(range)}
  disabled={!isCheckedIntoThisBar}
>
  {range}
</button>
              ))}
            </div>
          </div>

          <div className="detail-card">
            <div className="section-headline small-gap">
              <div>
                <h2>Crowd trend</h2>
                <p>Quick view of check-in activity over the last hour.</p>
              </div>
            </div>
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={stats.trendSeries}>
                  <defs>
                    <linearGradient id="crowdFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#5BFF8A" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="#5BFF8A" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="label" tick={{ fill: '#A8B6AE' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#A8B6AE' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: '#0E1511', border: '1px solid #213128', borderRadius: 14 }} />
                  <Area type="monotone" dataKey="crowd" stroke="#5BFF8A" fill="url(#crowdFill)" strokeWidth={2.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <aside className="detail-sidebar">
          <div className="detail-card">
            <div className="section-headline small-gap">
              <div>
                <h2>Comments</h2>
                <p>Username only. Everything resets at 4AM Eastern.</p>
              </div>
            </div>

            <form className="comment-form" onSubmit={handleComment}>
              <textarea
                value={commentText}
                onChange={(event) => setCommentText(event.target.value)}
                placeholder="Line's moving fast, DJ is solid, cover jumped..."
                maxLength={180}
              />
              <button className="primary-button" type="submit" disabled={!isCheckedIntoThisBar}>
  Post comment
</button>
            </form>

            <div className="comment-stack">
              {stats.comments.length ? (
                stats.comments.map((comment) => {
                  const reactionCounts = Object.fromEntries(['🔥', '👀', '🍻'].map((emoji) => [emoji, 0]));
                  stats.reactions
                    .filter((item) => item.commentId === comment.id)
                    .forEach((item) => {
                      reactionCounts[item.emoji] = (reactionCounts[item.emoji] ?? 0) + 1;
                    });

                  return (
                    <CommentItem
                      key={comment.id}
                      comment={comment}
                      reactionCounts={reactionCounts}
                      activeReaction={myCommentReactions[comment.id]}
                      onReact={handleReaction}
                    />
                  );
                })
              ) : (
                <div className="empty-state">No comments yet. Be the first one.</div>
              )}
            </div>
          </div>
        </aside>
      </section>
        </Layout>
  );
}
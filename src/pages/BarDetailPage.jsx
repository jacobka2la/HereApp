import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import Layout from '../components/Layout';
import CommentItem from '../components/CommentItem';
import { useAuth } from '../context/AuthContext';
import { coverRanges, getBarMeta, vibeOptions } from '../lib/bars';
import { buildBarStats } from '../lib/scoring';
import {
  addComment,
  blockUser,
  deleteCommentById,
  leaveBar,
  reportComment,
  subscribeToHiddenCommentsForUser,
  subscribeToTodayCollection,
  toggleReaction,
  updateCover,
  updateLineLength,
  updateVibe,
  upsertCheckIn,
} from '../lib/firebaseHelpers';

const vibeCooldownMs = 5 * 60 * 1000;
const coverCooldownMs = 10 * 60 * 1000;
const lineCooldownMs = 5 * 60 * 1000;
const commentCooldownMs = 60 * 1000;

const lineOptions = ['No line', 'Short line', 'Long line'];

const bannedWords = [
  'fuck',
  'shit',
  'bitch',
  'asshole',
  'slut',
  'whore',
  'nigga',
  'nigger',
  'fag',
  'retard',
  'kill yourself',
  'rape',
];

function containsBannedWords(text) {
  const lower = text.toLowerCase();
  return bannedWords.some((word) => lower.includes(word));
}

function summarizeLineReports(reports) {
  if (!reports.length) return null;

  const counts = reports.reduce((acc, item) => {
    acc[item.lineLength] = (acc[item.lineLength] || 0) + 1;
    return acc;
  }, {});

  const winner = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];

  return winner
    ? {
        label: winner[0],
        count: winner[1],
      }
    : null;
}

function formatDuration(ms) {
  const totalSeconds = Math.max(1, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function parseLegacyLockError(error) {
  const raw = error?.message || '';

  let match = raw.match(/^LEAVE_LOCK_([^_]+)_(\d+)$/);
  if (match) {
    const [, currentBarId, remainingMsRaw] = match;
    const remainingMs = Number(remainingMsRaw);
    const currentBarName = getBarMeta(currentBarId)?.name || currentBarId;

    return {
      type: 'leave',
      currentBarId,
      currentBarName,
      remainingMs,
      remainingLabel: formatDuration(remainingMs),
    };
  }

  match = raw.match(/^CHECKIN_LOCK_SAME_BAR_([^_]+)_(\d+)$/);
  if (match) {
    const [, currentBarId, remainingMsRaw] = match;
    const remainingMs = Number(remainingMsRaw);
    const currentBarName = getBarMeta(currentBarId)?.name || currentBarId;

    return {
      type: 'same_bar',
      currentBarId,
      currentBarName,
      remainingMs,
      remainingLabel: formatDuration(remainingMs),
    };
  }

  match = raw.match(/^CHECKIN_LOCK_ACTIVE_([^_]+)_(\d+)$/);
  if (match) {
    const [, currentBarId, remainingMsRaw] = match;
    const remainingMs = Number(remainingMsRaw);
    const currentBarName = getBarMeta(currentBarId)?.name || currentBarId;

    return {
      type: 'different_bar',
      currentBarId,
      currentBarName,
      remainingMs,
      remainingLabel: formatDuration(remainingMs),
    };
  }

  return null;
}

function getCheckInErrorMessage(error, targetBarId) {
  if (error?.code === 'CHECKIN_LOCK_DIFFERENT_BAR') {
    return `You're still checked into ${error.currentBarName}. You can switch to ${error.targetBarName} in ${error.remainingLabel} minutes.`;
  }

  if (error?.code === 'CHECKIN_LOCK_SAME_BAR') {
    return `You're already checked into ${error.currentBarName}. You can leave in ${error.remainingLabel} minutes.`;
  }

  const legacy = parseLegacyLockError(error);
  if (legacy?.type === 'different_bar') {
    const targetBarName = getBarMeta(targetBarId)?.name || targetBarId;
    return `You're still checked into ${legacy.currentBarName}. You can switch to ${targetBarName} in ${legacy.remainingLabel} minutes.`;
  }

  if (legacy?.type === 'same_bar') {
    return `You're already checked into ${legacy.currentBarName}. You can leave in ${legacy.remainingLabel} minutes.`;
  }

  return error?.message || 'Could not check into the bar right now.';
}

function getLeaveErrorMessage(error) {
  if (error?.code === 'LEAVE_LOCK') {
    return `You're still checked into ${error.currentBarName}. You can leave in ${error.remainingLabel} minutes.`;
  }

  const legacy = parseLegacyLockError(error);
  if (legacy?.type === 'leave') {
    return `You're still checked into ${legacy.currentBarName}. You can leave in ${legacy.remainingLabel} minutes.`;
  }

  return error?.message || 'Could not leave the bar. Try again.';
}

export default function BarDetailPage() {
  const { barId } = useParams();
  const { firebaseUser, profile } = useAuth();
  const bar = getBarMeta(barId);
  const checkInFlightRef = useRef(false);

  const [checkins, setCheckins] = useState([]);
  const [vibes, setVibes] = useState([]);
  const [coverReports, setCoverReports] = useState([]);
  const [lineReports, setLineReports] = useState([]);
  const [comments, setComments] = useState([]);
  const [reactions, setReactions] = useState([]);
  const [hiddenComments, setHiddenComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [feedback, setFeedback] = useState('');
  const [checkingIn, setCheckingIn] = useState(false);

  useEffect(() => {
    const unsubscribers = [
      subscribeToTodayCollection('checkins', setCheckins),
      subscribeToTodayCollection('vibes', setVibes),
      subscribeToTodayCollection('coverReports', setCoverReports),
      subscribeToTodayCollection('lineReports', setLineReports),
      subscribeToTodayCollection('comments', setComments),
      subscribeToTodayCollection('commentReactions', setReactions),
    ];

    if (firebaseUser?.uid) {
      const unsubHidden = subscribeToHiddenCommentsForUser(
        firebaseUser.uid,
        setHiddenComments
      );
      unsubscribers.push(unsubHidden);
    } else {
      setHiddenComments([]);
    }

    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, [firebaseUser?.uid]);

  const stats = useMemo(() => {
    const baseStats = buildBarStats(
      barId,
      checkins,
      vibes,
      coverReports,
      comments,
      reactions
    );

    const relevantLineReports = lineReports.filter((item) => item.barId === barId);

    return {
      ...baseStats,
      lineSummary: summarizeLineReports(relevantLineReports),
    };
  }, [barId, checkins, vibes, coverReports, lineReports, comments, reactions]);

  const myVibe = vibes.find((item) => item.uid === firebaseUser?.uid && item.barId === barId)?.vibe;
  const myCover = coverReports.find((item) => item.uid === firebaseUser?.uid && item.barId === barId)?.range;
  const myLine = lineReports.find((item) => item.uid === firebaseUser?.uid && item.barId === barId)?.lineLength;
  const myCheckin = checkins.find((item) => item.uid === firebaseUser?.uid && item.active);
  const isCheckedIntoThisBar = myCheckin?.barId === barId && myCheckin?.active;

  const myCommentReactions = Object.fromEntries(
    reactions
      .filter((item) => item.uid === firebaseUser?.uid)
      .map((item) => [item.commentId, item.emoji])
  );

  const visibleComments = useMemo(() => {
    if (!firebaseUser?.uid) return stats.comments;

    const blockedUsers = profile?.blockedUsers || [];
    const hiddenSet = new Set(hiddenComments.map((item) => item.commentId));

    return stats.comments
      .map((comment) => {
        if (comment.hidden === true) return null;
        if (blockedUsers.includes(comment.uid)) return null;

        if (hiddenSet.has(comment.id)) {
          return {
            ...comment,
            text: 'This Comment Has Been Reported',
            isHiddenForUser: true,
          };
        }

        return comment;
      })
      .filter(Boolean);
  }, [stats.comments, firebaseUser?.uid, profile?.blockedUsers, hiddenComments]);

  const handleCheckIn = async () => {
    if (checkInFlightRef.current || checkingIn || isCheckedIntoThisBar) return;

    checkInFlightRef.current = true;
    setCheckingIn(true);

    try {
      await upsertCheckIn({
        uid: firebaseUser.uid,
        username: profile?.displayUsername || profile?.username,
        barId,
      });
      setFeedback(`You're now checked into ${bar.name}.`);
    } catch (error) {
      setFeedback(getCheckInErrorMessage(error, barId));
    } finally {
      checkInFlightRef.current = false;
      setCheckingIn(false);
    }
  };

  const handleLeaveBar = async () => {
    try {
      await leaveBar(firebaseUser.uid);
      setFeedback(`You left ${bar.name}.`);
    } catch (err) {
      setFeedback(getLeaveErrorMessage(err));
    }
  };

  const handleVibe = async (value) => {
    if (!isCheckedIntoThisBar) {
      if (myCheckin?.barId) {
        const currentBarName = getBarMeta(myCheckin.barId)?.name || myCheckin.barId;
        setFeedback(
          `You're checked into ${currentBarName}. Go to that bar's page if you want to update its vibe.`
        );
      } else {
        setFeedback('Check into this bar first, then you can update the vibe.');
      }
      return;
    }

    const lastVote = vibes.find((item) => item.uid === firebaseUser.uid && item.barId === barId);
    if (lastVote && Date.now() - lastVote.createdAtMillis < vibeCooldownMs) {
      const remainingMs = vibeCooldownMs - (Date.now() - lastVote.createdAtMillis);
      setFeedback(
        `You just updated the vibe for ${bar.name}. You can change it again in ${formatDuration(remainingMs)}.`
      );
      return;
    }

    await updateVibe({
      uid: firebaseUser.uid,
      username: profile?.displayUsername || profile?.username,
      barId,
      vibe: value,
    });

    setFeedback(`You updated the vibe for ${bar.name}.`);
  };

  const handleCover = async (range) => {
    if (!isCheckedIntoThisBar) {
      if (myCheckin?.barId) {
        const currentBarName = getBarMeta(myCheckin.barId)?.name || myCheckin.barId;
        setFeedback(
          `You're checked into ${currentBarName}. Go to that bar's page if you want to update its cover.`
        );
      } else {
        setFeedback('Check into this bar first, then you can report cover.');
      }
      return;
    }

    const lastCover = coverReports.find((item) => item.uid === firebaseUser.uid && item.barId === barId);
    if (lastCover && Date.now() - lastCover.createdAtMillis < coverCooldownMs) {
      const remainingMs = coverCooldownMs - (Date.now() - lastCover.createdAtMillis);
      setFeedback(
        `You already reported cover for ${bar.name}. You can update it again in ${formatDuration(remainingMs)}.`
      );
      return;
    }

    await updateCover({
      uid: firebaseUser.uid,
      username: profile?.displayUsername || profile?.username,
      barId,
      range,
    });

    setFeedback(`You updated the cover for ${bar.name}.`);
  };

  const handleLineLength = async (value) => {
    if (!isCheckedIntoThisBar) {
      if (myCheckin?.barId) {
        const currentBarName = getBarMeta(myCheckin.barId)?.name || myCheckin.barId;
        setFeedback(
          `You're checked into ${currentBarName}. Go to that bar's page if you want to update its line.`
        );
      } else {
        setFeedback('Check into this bar first, then you can report the line length.');
      }
      return;
    }

    const lastLine = lineReports.find((item) => item.uid === firebaseUser.uid && item.barId === barId);
    if (lastLine && Date.now() - lastLine.createdAtMillis < lineCooldownMs) {
      const remainingMs = lineCooldownMs - (Date.now() - lastLine.createdAtMillis);
      setFeedback(
        `You already reported the line for ${bar.name}. You can update it again in ${formatDuration(remainingMs)}.`
      );
      return;
    }

    await updateLineLength({
      uid: firebaseUser.uid,
      username: profile?.displayUsername || profile?.username,
      barId,
      lineLength: value,
    });

    setFeedback(`You updated the line length for ${bar.name}.`);
  };

  const handleComment = async (event) => {
    event.preventDefault();

    if (!isCheckedIntoThisBar) {
      if (myCheckin?.barId) {
        const currentBarName = getBarMeta(myCheckin.barId)?.name || myCheckin.barId;
        setFeedback(
          `You're checked into ${currentBarName}. Go to that bar's page if you want to comment there.`
        );
      } else {
        setFeedback('Check into this bar first, then you can post a comment.');
      }
      return;
    }

    const cleanText = commentText.trim();
    if (!cleanText) return;

    if (containsBannedWords(cleanText)) {
      setFeedback('Please keep comments respectful.');
      return;
    }

    const latestMine = [...comments]
      .filter((item) => item.uid === firebaseUser.uid && item.barId === barId)
      .sort((a, b) => b.createdAtMillis - a.createdAtMillis)[0];

    if (latestMine && Date.now() - latestMine.createdAtMillis < commentCooldownMs) {
      const remainingMs = commentCooldownMs - (Date.now() - latestMine.createdAtMillis);
      setFeedback(
        `You just commented at ${bar.name}. You can post again in ${formatDuration(remainingMs)}.`
      );
      return;
    }

    await addComment({
      uid: firebaseUser.uid,
      username: profile?.displayUsername || profile?.username,
      barId,
      text: cleanText.slice(0, 180),
    });

    setCommentText('');
    setFeedback(`Your comment was posted for ${bar.name}.`);
  };

  const handleReaction = async (commentId, emoji) => {
    await toggleReaction({
      uid: firebaseUser.uid,
      username: profile?.displayUsername || profile?.username,
      commentId,
      emoji,
    });
  };

  const handleReportComment = async (comment) => {
    if (comment.isHiddenForUser) return;

    try {
      await reportComment({
        reporterUid: firebaseUser.uid,
        reporterUsername: profile?.displayUsername || profile?.username || '',
        commentId: comment.id,
        commentOwnerUid: comment.uid || '',
        commentOwnerUsername: comment.username || '',
        commentText: comment.text || '',
        barId,
        barName: bar?.name || '',
      });

      setFeedback('Comment reported.');
    } catch (error) {
      setFeedback('Could not report comment right now.');
    }
  };

  const handleDeleteComment = async (comment) => {
    const confirmed = window.confirm('Delete this comment?');
    if (!confirmed) return;

    try {
      await deleteCommentById(comment.id);
      setFeedback('Comment deleted.');
    } catch (error) {
      setFeedback('Could not delete comment right now.');
    }
  };

  const handleBlockUser = async (comment) => {
    if (!comment?.uid) {
      setFeedback('Could not block this user.');
      return;
    }

    if (comment.uid === firebaseUser.uid) {
      setFeedback('You cannot block yourself.');
      return;
    }

    try {
      const existingBlocked = profile?.blockedUsers || [];

      if (existingBlocked.includes(comment.uid)) {
        setFeedback('User already blocked.');
        return;
      }

      await blockUser({
        blockerUid: firebaseUser.uid,
        blockedUid: comment.uid,
      });

      setFeedback('User blocked.');
    } catch (error) {
      setFeedback('Could not block user right now.');
    }
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
      <div className="bar-detail-page">
        <Link to="/" className="bar-back-button" aria-label="Back to bars">
          ← Back To Bars
        </Link>

        <section className="detail-grid">
          <div className="detail-primary">
            <div className="detail-card detail-hero">
              <span className="hero-kicker">{bar.neighborhood}</span>
              <h1>{bar.name}</h1>
              <p className="detail-vibe">{stats.currentVibeLabel}</p>

              <div className="hero-stats hero-stats-tight">
                <div><span className="label">Checked In</span><strong>{stats.count}</strong></div>
                <div><span className="label">Cover</span><strong>{stats.coverSummary ? `${stats.coverSummary.label} · ${stats.coverSummary.count} Reports` : 'No Reports Yet'}</strong></div>
                <div><span className="label">Line</span><strong>{stats.lineSummary ? `${stats.lineSummary.label} · ${stats.lineSummary.count} Reports` : 'No Reports Yet'}</strong></div>
                <div><span className="label">Your Status</span><strong>{myCheckin?.barId === barId ? 'You Are Here' : 'Not Checked In'}</strong></div>
              </div>

              <div className="action-stack">
                {isCheckedIntoThisBar ? (
                  <button className="primary-button" onClick={handleLeaveBar}>Leave Bar</button>
                ) : (
                  <button className="primary-button" onClick={handleCheckIn} disabled={checkingIn}>
                    {checkingIn ? 'Checking In…' : 'I’m Here'}
                  </button>
                )}
              </div>

              {feedback ? <div className="info-banner">{feedback}</div> : null}
            </div>

            <div className="detail-card">
              <div className="section-headline small-gap"><div><h2>Update The Vibe</h2><p>One vibe per user at a time. New vote replaces your old one.</p></div></div>
              {!isCheckedIntoThisBar ? <p className="bar-lock-note">{myCheckin?.barId ? `You're currently checked into ${getBarMeta(myCheckin.barId)?.name || myCheckin.barId}.` : 'Check into this bar first to update the vibe.'}</p> : null}
              <div className="chip-grid">{vibeOptions.map((option) => <button key={option.value} className={`select-chip ${myVibe === option.value ? 'select-chip-active' : ''}`} onClick={() => handleVibe(option.value)} disabled={!isCheckedIntoThisBar}>{option.label}</button>)}</div>
            </div>

            <div className="detail-card">
              <div className="section-headline small-gap"><div><h2>Report Cover</h2><p>Pick the closest range. The app shows the most reported one.</p></div></div>
              {!isCheckedIntoThisBar ? <p className="bar-lock-note">{myCheckin?.barId ? `You're currently checked into ${getBarMeta(myCheckin.barId)?.name || myCheckin.barId}.` : 'Check into this bar first to report cover.'}</p> : null}
              <div className="chip-grid">{coverRanges.map((range) => <button key={range} className={`select-chip ${myCover === range ? 'select-chip-active' : ''}`} onClick={() => handleCover(range)} disabled={!isCheckedIntoThisBar}>{range}</button>)}</div>
            </div>

            <div className="detail-card">
              <div className="section-headline small-gap"><div><h2>Report Line Length</h2><p>This is the useful stuff people actually care about before they pull up.</p></div></div>
              {!isCheckedIntoThisBar ? <p className="bar-lock-note">{myCheckin?.barId ? `You're currently checked into ${getBarMeta(myCheckin.barId)?.name || myCheckin.barId}.` : 'Check into this bar first to report the line.'}</p> : null}
              <div className="chip-grid">{lineOptions.map((option) => <button key={option} className={`select-chip ${myLine === option ? 'select-chip-active' : ''}`} onClick={() => handleLineLength(option)} disabled={!isCheckedIntoThisBar}>{option}</button>)}</div>
            </div>

            <div className="detail-card">
              <div className="section-headline small-gap"><div><h2>Crowd Trend</h2><p>Quick view of check-in activity over the last hour.</p></div></div>
              <div className="chart-wrap"><ResponsiveContainer width="100%" height={240}><AreaChart data={stats.trendSeries}><defs><linearGradient id="crowdFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#5BFF8A" stopOpacity={0.45} /><stop offset="100%" stopColor="#5BFF8A" stopOpacity={0} /></linearGradient></defs><XAxis dataKey="label" tick={{ fill: '#A8B6AE' }} axisLine={false} tickLine={false} /><YAxis tick={{ fill: '#A8B6AE' }} axisLine={false} tickLine={false} allowDecimals={false} /><Tooltip contentStyle={{ background: '#0E1511', border: '1px solid #213128', borderRadius: 14 }} /><Area type="monotone" dataKey="crowd" stroke="#5BFF8A" fill="url(#crowdFill)" strokeWidth={2.5} /></AreaChart></ResponsiveContainer></div>
            </div>
          </div>

          <aside className="detail-sidebar">
            <div className="detail-card">
              <div className="section-headline small-gap"><div><h2>Comments</h2><p>Username only. Everything resets at 4AM Eastern. Tap “Report” on any comment that breaks community rules.</p></div></div>
              <form className="comment-form" onSubmit={handleComment}><textarea value={commentText} onChange={(event) => setCommentText(event.target.value)} placeholder="Line's moving fast, DJ is solid, cover jumped..." maxLength={180} /><button className="primary-button" type="submit" disabled={!isCheckedIntoThisBar}>Post Comment</button></form>
              <div className="comment-stack">
                {visibleComments.length ? visibleComments.map((comment) => {
                  const reactionCounts = Object.fromEntries(['🔥', '👀', '🍻'].map((emoji) => [emoji, 0]));
                  stats.reactions.filter((item) => item.commentId === comment.id).forEach((item) => { reactionCounts[item.emoji] = (reactionCounts[item.emoji] ?? 0) + 1; });
                  const isOwnComment = comment.uid === firebaseUser?.uid;
                  const isHiddenForUser = comment.isHiddenForUser === true;
                  return <div key={comment.id} style={{ marginBottom: '14px' }}><CommentItem comment={comment} reactionCounts={reactionCounts} activeReaction={myCommentReactions[comment.id]} onReact={isHiddenForUser ? () => {} : handleReaction} /><div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}><button type="button" className="ghost-button" onClick={() => handleReportComment(comment)} disabled={isHiddenForUser}>Report</button>{!isOwnComment && !isHiddenForUser ? <button type="button" className="ghost-button" onClick={() => handleBlockUser(comment)}>Block User</button> : null}{isOwnComment && !isHiddenForUser ? <button type="button" className="ghost-button" onClick={() => handleDeleteComment(comment)}>Delete</button> : null}</div></div>;
                }) : <div className="empty-state">No Comments Yet. Be The First One.</div>}
              </div>
            </div>
          </aside>
        </section>
      </div>
    </Layout>
  );
}

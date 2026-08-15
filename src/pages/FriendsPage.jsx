import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { msuBars } from '../lib/bars';
import {
  dismissInvite,
  findUserByUsername,
  respondToFriendRequest,
  sendFriendRequest,
  sendInvite,
  subscribeToFriendRequestsForUser,
  subscribeToFriendsForUser,
  subscribeToInvitesForUser,
  subscribeToTodayCollection,
} from '../lib/firebaseHelpers';

const INVITE_COOLDOWN_MS = 5 * 60 * 1000;

function timeAgo(millis) {
  if (!millis) return 'just now';

  const diff = Date.now() - millis;
  const minutes = Math.max(1, Math.floor(diff / 60000));

  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  return 'earlier';
}

export default function FriendsPage() {
  const { firebaseUser, profile } = useAuth();

  const [checkins, setCheckins] = useState([]);
  const [invites, setInvites] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [friends, setFriends] = useState([]);
  const [friendUsernameInput, setFriendUsernameInput] = useState('');
  const [socialFeedback, setSocialFeedback] = useState('');
  const [inviteCooldowns, setInviteCooldowns] = useState({});
  const [, forceTick] = useState(0);

  useEffect(() => {
    const unsubscribe = subscribeToTodayCollection('checkins', setCheckins);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!firebaseUser?.uid) {
      setInvites([]);
      return;
    }

    const unsubscribe = subscribeToInvitesForUser(firebaseUser.uid, setInvites);
    return () => unsubscribe();
  }, [firebaseUser?.uid]);

  useEffect(() => {
    if (!firebaseUser?.uid) {
      setFriendRequests([]);
      return;
    }

    const unsubscribe = subscribeToFriendRequestsForUser(firebaseUser.uid, setFriendRequests);
    return () => unsubscribe();
  }, [firebaseUser?.uid]);

  useEffect(() => {
    if (!firebaseUser?.uid) {
      setFriends([]);
      return;
    }

    const unsubscribe = subscribeToFriendsForUser(firebaseUser.uid, setFriends);
    return () => unsubscribe();
  }, [firebaseUser?.uid]);

  useEffect(() => {
    const interval = setInterval(() => {
      forceTick((value) => value + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const myActiveCheckin = useMemo(() => {
    if (!firebaseUser?.uid) return null;
    return checkins.find((item) => item.uid === firebaseUser.uid && item.active) || null;
  }, [checkins, firebaseUser?.uid]);

  const activeBarMeta = useMemo(() => {
    if (!myActiveCheckin?.barId) return null;
    return msuBars.find((bar) => bar.id === myActiveCheckin.barId) || null;
  }, [myActiveCheckin]);

  const displayFriends = useMemo(() => {
    if (!firebaseUser?.uid) return [];

    return friends.map((friendship) => {
      const isUserA = friendship.userAUid === firebaseUser.uid;

      return {
        id: friendship.id,
        uid: isUserA ? friendship.userBUid : friendship.userAUid,
        username: isUserA
          ? friendship.userBUUsername || friendship.userBUsername
          : friendship.userAUsername,
      };
    });
  }, [friends, firebaseUser?.uid]);

  const friendsOutNow = useMemo(() => {
    const friendUidSet = new Set(displayFriends.map((friend) => friend.uid));

    return checkins
      .filter((item) => item.active && friendUidSet.has(item.uid))
      .map((item) => {
        const friend = displayFriends.find((entry) => entry.uid === item.uid);
        const barMeta = msuBars.find((bar) => bar.id === item.barId);

        return {
          ...item,
          friend,
          barName: barMeta?.name || item.barId,
        };
      })
      .sort((a, b) => b.checkedInAtMillis - a.checkedInAtMillis);
  }, [checkins, displayFriends]);

  const getCooldownRemaining = (friendUid) => {
    const lastSentAt = inviteCooldowns[friendUid];
    if (!lastSentAt) return 0;

    const remaining = INVITE_COOLDOWN_MS - (Date.now() - lastSentAt);
    return remaining > 0 ? remaining : 0;
  };

  const formatCooldown = (ms) => {
    const totalSeconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  };

  const handleDismissInvite = async (inviteId) => {
    try {
      await dismissInvite(inviteId);
    } catch (error) {
      console.error('Dismiss invite error:', error);
      setSocialFeedback('Could not dismiss invite.');
    }
  };

  const handleSendFriendRequest = async () => {
    const clean = friendUsernameInput.trim();

    if (!clean) {
      setSocialFeedback('Enter a username first.');
      return;
    }

    try {
      const user = await findUserByUsername(clean);

      if (!user) {
        setSocialFeedback('User not found.');
        return;
      }

      if (user.uid === firebaseUser.uid) {
        setSocialFeedback('You cannot add yourself.');
        return;
      }

      await sendFriendRequest({
        fromUid: firebaseUser.uid,
        fromUsername: profile?.displayUsername || profile?.username,
        toUid: user.uid,
        toUsername: user.username,
      });

      setFriendUsernameInput('');
      setSocialFeedback('Friend request sent.');
    } catch (error) {
      console.error('Friend request error:', error);

      if (error?.message === 'ALREADY_FRIENDS') {
        setSocialFeedback('You are already friends.');
      } else {
        setSocialFeedback('Could not send friend request.');
      }
    }
  };

  const handleRespondToFriendRequest = async (requestItem, status) => {
    try {
      await respondToFriendRequest({
        requestId: requestItem.id,
        fromUid: requestItem.fromUid,
        fromUsername: requestItem.fromUsername,
        toUid: requestItem.toUid,
        toUsername: profile?.displayUsername || profile?.username,
        status,
      });

      setSocialFeedback(status === 'accepted' ? 'Friend added.' : 'Request declined.');
    } catch (error) {
      console.error('Respond request error:', error);
      setSocialFeedback('Could not update friend request.');
    }
  };

  const handleInviteFriendToBar = async (friend) => {
    const cooldownRemaining = getCooldownRemaining(friend.uid);

    if (cooldownRemaining > 0) {
      setSocialFeedback(`Wait ${formatCooldown(cooldownRemaining)} before inviting again.`);
      return;
    }

    if (!myActiveCheckin?.barId || !activeBarMeta) {
      setSocialFeedback('Check into a bar first to invite friends.');
      return;
    }

    try {
      await sendInvite({
        fromUid: firebaseUser.uid,
        fromUsername: profile?.displayUsername || profile?.username,
        toUid: friend.uid,
        toUsername: friend.username,
        barId: activeBarMeta.id,
        barName: activeBarMeta.name,
        message: `Come to ${activeBarMeta.name}, it's packed!`,
      });

      setInviteCooldowns((prev) => ({
        ...prev,
        [friend.uid]: Date.now(),
      }));

      setSocialFeedback(`Invite sent to @${friend.username}.`);
    } catch (error) {
      console.error('Invite friend error:', error);

      if (error?.message === 'COOLDOWN') {
        setInviteCooldowns((prev) => ({
          ...prev,
          [friend.uid]: Date.now(),
        }));
        setSocialFeedback('Wait a few minutes before inviting again.');
      } else {
        setSocialFeedback('Could not send invite.');
      }
    }
  };

  return (
    <Layout>
      <section className="home-stack">
        <div style={{ marginBottom: '12px' }}>
          <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 900 }}>
            Friends
          </h1>
          <p style={{ marginTop: '8px', color: 'rgba(235,255,240,0.72)' }}>
            Add friends, see who’s out, and invite people to your bar.
          </p>
        </div>

        {socialFeedback ? (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '16px',
              background: 'rgba(83, 240, 124, 0.12)',
              border: '1px solid rgba(83, 240, 124, 0.14)',
              color: '#dfffe8',
              fontWeight: 700,
            }}
          >
            {socialFeedback}
          </div>
        ) : null}

        <div
          style={{
            background: 'rgba(5, 15, 8, 0.92)',
            border: '1px solid rgba(120, 255, 170, 0.16)',
            borderRadius: '28px',
            padding: '22px',
            boxShadow: '0 18px 45px rgba(0, 0, 0, 0.22)',
            display: 'grid',
            gap: '12px',
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900 }}>
              Who’s out right now
            </h2>
            <p
              style={{
                marginTop: '8px',
                color: 'rgba(235,255,240,0.72)',
                fontSize: '0.96rem',
              }}
            >
              This should be one of the most useful screens in the whole app.
            </p>
          </div>

          {friendsOutNow.length ? (
            <div style={{ display: 'grid', gap: '10px' }}>
              {friendsOutNow.map((item) => (
                <div
                  key={`${item.uid}_${item.barId}_${item.checkedInAtMillis}`}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '14px 16px',
                    borderRadius: '18px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(120, 255, 170, 0.1)',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 800 }}>
                      @{item.friend?.username || 'friend'} is at {item.barName}
                    </div>
                    <div
                      style={{
                        color: 'rgba(235,255,240,0.7)',
                        fontSize: '0.9rem',
                        marginTop: '4px',
                      }}
                    >
                      Checked in {timeAgo(item.checkedInAtMillis)}
                    </div>
                  </div>

                  <Link
                    to={`/bar/${item.barId}`}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '14px',
                      textDecoration: 'none',
                      background: 'rgba(255,255,255,0.08)',
                      color: '#f4fff7',
                      fontWeight: 800,
                    }}
                  >
                    View
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div
              style={{
                padding: '14px 16px',
                borderRadius: '18px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(120, 255, 170, 0.1)',
                color: 'rgba(235,255,240,0.72)',
              }}
            >
              None of your friends are checked in right now.
            </div>
          )}
        </div>

        {invites.length > 0 ? (
          <div
            style={{
              background: 'rgba(5, 15, 8, 0.92)',
              border: '1px solid rgba(120, 255, 170, 0.16)',
              borderRadius: '28px',
              padding: '22px',
              boxShadow: '0 18px 45px rgba(0, 0, 0, 0.22)',
              display: 'grid',
              gap: '12px',
            }}
          >
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900 }}>
                Bar invites
              </h2>
              <p
                style={{
                  marginTop: '8px',
                  color: 'rgba(235,255,240,0.72)',
                  fontSize: '0.96rem',
                }}
              >
                Friends pulling you out tonight.
              </p>
            </div>

            <div style={{ display: 'grid', gap: '10px' }}>
              {invites.map((invite) => (
                <div
                  key={invite.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '14px 16px',
                    borderRadius: '18px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(120, 255, 170, 0.1)',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 800 }}>
                      @{invite.fromUsername || 'friend'} invited you to {invite.barName}
                    </div>
                    <div
                      style={{
                        color: 'rgba(235,255,240,0.7)',
                        fontSize: '0.9rem',
                        marginTop: '4px',
                      }}
                    >
                      {invite.message || `Come to ${invite.barName}, it's packed!`}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <Link
                      to={`/bar/${invite.barId}`}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '14px',
                        textDecoration: 'none',
                        background: 'rgba(255,255,255,0.08)',
                        color: '#f4fff7',
                        fontWeight: 800,
                      }}
                    >
                      View
                    </Link>

                    <button
                      type="button"
                      onClick={() => handleDismissInvite(invite.id)}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '14px',
                        border: 'none',
                        background: '#53f07c',
                        color: '#03150a',
                        fontWeight: 900,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Got it
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div
          style={{
            background: 'rgba(5, 15, 8, 0.88)',
            border: '1px solid rgba(120, 255, 170, 0.12)',
            borderRadius: '28px',
            padding: '22px',
            boxShadow: '0 18px 45px rgba(0, 0, 0, 0.22)',
            display: 'grid',
            gap: '18px',
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900 }}>
              Add friends
            </h2>
            <p
              style={{
                marginTop: '8px',
                color: 'rgba(235,255,240,0.72)',
                fontSize: '0.96rem',
              }}
            >
              Search by username and build your circle.
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              gap: '10px',
              flexWrap: 'wrap',
            }}
          >
            <input
              value={friendUsernameInput}
              onChange={(event) => setFriendUsernameInput(event.target.value)}
              placeholder="Enter exact username"
              style={{
                flex: 1,
                minWidth: '220px',
                padding: '12px 14px',
                borderRadius: '14px',
                border: '1px solid rgba(120,255,170,0.15)',
                background: 'rgba(255,255,255,0.04)',
                color: 'white',
              }}
            />

            <button className="primary-button" onClick={handleSendFriendRequest}>
              Send request
            </button>
          </div>
        </div>

        {friendRequests.length > 0 ? (
          <div
            style={{
              background: 'rgba(5, 15, 8, 0.88)',
              border: '1px solid rgba(120, 255, 170, 0.12)',
              borderRadius: '28px',
              padding: '22px',
              boxShadow: '0 18px 45px rgba(0, 0, 0, 0.22)',
              display: 'grid',
              gap: '14px',
            }}
          >
            <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900 }}>
              Incoming requests
            </h2>

            <div style={{ display: 'grid', gap: '10px' }}>
              {friendRequests.map((requestItem) => (
                <div
                  key={requestItem.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '14px 16px',
                    borderRadius: '18px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(120, 255, 170, 0.1)',
                  }}
                >
                  <div style={{ fontWeight: 800 }}>@{requestItem.fromUsername}</div>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      className="primary-button"
                      onClick={() => handleRespondToFriendRequest(requestItem, 'accepted')}
                    >
                      Accept
                    </button>

                    <button
                      className="ghost-button"
                      onClick={() => handleRespondToFriendRequest(requestItem, 'declined')}
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div
          style={{
            background: 'rgba(5, 15, 8, 0.88)',
            border: '1px solid rgba(120, 255, 170, 0.12)',
            borderRadius: '28px',
            padding: '22px',
            boxShadow: '0 18px 45px rgba(0, 0, 0, 0.22)',
            display: 'grid',
            gap: '14px',
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900 }}>
              Your friends
            </h2>
            <p
              style={{
                marginTop: '8px',
                color: 'rgba(235,255,240,0.72)',
                fontSize: '0.95rem',
              }}
            >
              {activeBarMeta
                ? `You’re checked into ${activeBarMeta.name}. Invite your people.`
                : 'Check into a bar to invite your friends out.'}
            </p>
          </div>

          {displayFriends.length ? (
            <div style={{ display: 'grid', gap: '10px' }}>
              {displayFriends.map((friend) => {
                const cooldownRemaining = getCooldownRemaining(friend.uid);
                const inviteDisabled = cooldownRemaining > 0 || !activeBarMeta;

                return (
                  <div
                    key={friend.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '14px 16px',
                      borderRadius: '18px',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(120, 255, 170, 0.1)',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 800 }}>@{friend.username}</div>
                      <div style={{ color: 'rgba(235,255,240,0.66)', fontSize: '0.86rem' }}>
                        {activeBarMeta
                          ? `You can invite them to ${activeBarMeta.name}`
                          : 'Check into a bar to invite them'}
                      </div>
                    </div>

                    <button
                      className="primary-button"
                      onClick={() => handleInviteFriendToBar(friend)}
                      disabled={inviteDisabled}
                      style={{
                        opacity: inviteDisabled ? 0.5 : 1,
                        cursor: inviteDisabled ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {cooldownRemaining > 0
                        ? `Wait ${formatCooldown(cooldownRemaining)}`
                        : 'Invite to bar'}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div
              style={{
                padding: '14px 16px',
                borderRadius: '18px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(120, 255, 170, 0.1)',
                color: 'rgba(235,255,240,0.72)',
              }}
            >
              No friends added yet.
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
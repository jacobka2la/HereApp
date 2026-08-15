import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { msuBars } from '../lib/bars';
import { getAvatarById } from '../lib/avatars';
import {
  dismissInvite,
  findUserByUsername,
  getPublicProfilesByUids,
  respondToFriendRequest,
  sendFriendRequest,
  sendInvite,
  subscribeToFriendRequestsForUser,
  subscribeToFriendsForUser,
  subscribeToInvitesForUser,
  subscribeToTodayCollection,
} from '../lib/firebaseHelpers';

const INVITE_COOLDOWN_MS = 5 * 60 * 1000;

const panelStyle = {
  background: 'rgba(5, 15, 8, 0.92)',
  border: '1px solid rgba(120,255,170,0.13)',
  borderRadius: 26,
  padding: 18,
  display: 'grid',
  gap: 14,
};

const rowStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  padding: '12px 13px',
  borderRadius: 18,
  background: 'rgba(255,255,255,0.025)',
  border: '1px solid rgba(120,255,170,0.09)',
};

function timeAgo(millis) {
  if (!millis) return 'just now';
  const minutes = Math.max(1, Math.floor((Date.now() - millis) / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return hours < 24 ? `${hours}h ago` : 'earlier';
}

function FriendAvatar({ avatarId, username, size = 54 }) {
  const avatar = getAvatarById(avatarId);
  if (avatar) {
    return (
      <img
        src={avatar.image}
        alt=""
        style={{
          width: size,
          height: size,
          borderRadius: 16,
          objectFit: 'cover',
          flexShrink: 0,
          border: '1px solid rgba(83,240,124,.22)',
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 16,
        display: 'grid',
        placeItems: 'center',
        flexShrink: 0,
        background: 'rgba(83,240,124,.10)',
        border: '1px solid rgba(83,240,124,.20)',
        fontWeight: 900,
      }}
    >
      {(username || '?').charAt(0).toUpperCase()}
    </div>
  );
}

function StatusDot({ active }) {
  return (
    <span
      aria-hidden="true"
      style={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: active ? '#53f07c' : 'rgba(235,255,240,.42)',
        flexShrink: 0,
      }}
    />
  );
}

export default function FriendsPage() {
  const { firebaseUser, profile } = useAuth();
  const [checkins, setCheckins] = useState([]);
  const [invites, setInvites] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [friends, setFriends] = useState([]);
  const [friendProfiles, setFriendProfiles] = useState({});
  const [requestProfiles, setRequestProfiles] = useState({});
  const [friendUsernameInput, setFriendUsernameInput] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [searching, setSearching] = useState(false);
  const [socialFeedback, setSocialFeedback] = useState('');
  const [inviteCooldowns, setInviteCooldowns] = useState({});
  const [activeTab, setActiveTab] = useState('friends');
  const [, forceTick] = useState(0);

  useEffect(() => subscribeToTodayCollection('checkins', setCheckins), []);
  useEffect(() => (firebaseUser?.uid ? subscribeToInvitesForUser(firebaseUser.uid, setInvites) : undefined), [firebaseUser?.uid]);
  useEffect(() => (firebaseUser?.uid ? subscribeToFriendRequestsForUser(firebaseUser.uid, setFriendRequests) : undefined), [firebaseUser?.uid]);
  useEffect(() => (firebaseUser?.uid ? subscribeToFriendsForUser(firebaseUser.uid, setFriends) : undefined), [firebaseUser?.uid]);
  useEffect(() => {
    const interval = setInterval(() => forceTick((value) => value + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!firebaseUser?.uid || !friends.length) {
      setFriendProfiles({});
      return;
    }
    const uids = friends
      .map((friendship) => (friendship.userAUid === firebaseUser.uid ? friendship.userBUid : friendship.userAUid))
      .filter(Boolean);
    let cancelled = false;
    getPublicProfilesByUids(uids)
      .then((profiles) => { if (!cancelled) setFriendProfiles(profiles); })
      .catch(() => { if (!cancelled) setFriendProfiles({}); });
    return () => { cancelled = true; };
  }, [friends, firebaseUser?.uid]);

  useEffect(() => {
    const uids = friendRequests.map((requestItem) => requestItem.fromUid).filter(Boolean);
    if (!uids.length) {
      setRequestProfiles({});
      return;
    }
    let cancelled = false;
    getPublicProfilesByUids(uids)
      .then((profiles) => { if (!cancelled) setRequestProfiles(profiles); })
      .catch(() => { if (!cancelled) setRequestProfiles({}); });
    return () => { cancelled = true; };
  }, [friendRequests]);

  const myActiveCheckin = useMemo(
    () => checkins.find((item) => item.uid === firebaseUser?.uid && item.active) || null,
    [checkins, firebaseUser?.uid],
  );

  const activeBarMeta = useMemo(
    () => msuBars.find((bar) => bar.id === myActiveCheckin?.barId) || null,
    [myActiveCheckin],
  );

  const displayFriends = useMemo(() => {
    if (!firebaseUser?.uid) return [];
    return friends.map((friendship) => {
      const isUserA = friendship.userAUid === firebaseUser.uid;
      const uid = isUserA ? friendship.userBUid : friendship.userAUid;
      const publicProfile = friendProfiles[uid];
      const activeCheckin = checkins.find((item) => item.uid === uid && item.active) || null;
      const bar = activeCheckin ? msuBars.find((item) => item.id === activeCheckin.barId) : null;
      return {
        id: friendship.id,
        uid,
        username: publicProfile?.displayUsername || publicProfile?.username || (isUserA ? friendship.userBUUsername || friendship.userBUsername : friendship.userAUsername),
        avatarId: publicProfile?.avatarId || '',
        activeCheckin,
        barName: bar?.name || '',
      };
    });
  }, [friends, firebaseUser?.uid, friendProfiles, checkins]);

  const friendsOutNow = useMemo(
    () => displayFriends.filter((friend) => friend.activeCheckin).sort((a, b) => (b.activeCheckin?.checkedInAtMillis || 0) - (a.activeCheckin?.checkedInAtMillis || 0)),
    [displayFriends],
  );

  const getCooldownRemaining = (uid) => Math.max(0, INVITE_COOLDOWN_MS - (Date.now() - (inviteCooldowns[uid] || 0)));
  const formatCooldown = (ms) => `${Math.floor(Math.ceil(ms / 1000) / 60)}:${String(Math.ceil(ms / 1000) % 60).padStart(2, '0')}`;

  const handleSearch = async () => {
    const clean = friendUsernameInput.trim();
    if (!clean) {
      setSearchResult(null);
      setSocialFeedback('Enter a username first.');
      return;
    }
    setSearching(true);
    setSocialFeedback('');
    try {
      const user = await findUserByUsername(clean);
      if (!user) {
        setSearchResult(null);
        setSocialFeedback('User not found.');
        return;
      }
      if (user.uid === firebaseUser.uid) {
        setSearchResult(null);
        setSocialFeedback('That’s you.');
        return;
      }
      setSearchResult(user);
    } catch {
      setSearchResult(null);
      setSocialFeedback('Could not search right now.');
    } finally {
      setSearching(false);
    }
  };

  const handleSendFriendRequest = async (user = searchResult) => {
    if (!user) return handleSearch();
    try {
      await sendFriendRequest({
        fromUid: firebaseUser.uid,
        fromUsername: profile?.displayUsername || profile?.username,
        toUid: user.uid,
        toUsername: user.username,
      });
      setSocialFeedback(`Friend Request Sent To @${user.displayUsername || user.username}.`);
      setSearchResult(null);
      setFriendUsernameInput('');
    } catch (error) {
      if (error?.message === 'ALREADY_FRIENDS') setSocialFeedback('You’re Already Friends.');
      else if (error?.message === 'REQUEST_ALREADY_SENT') setSocialFeedback('Friend Request Already Sent.');
      else setSocialFeedback('Could Not Send Friend Request.');
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
      setSocialFeedback(status === 'accepted' ? 'Friend Added.' : 'Request Declined.');
    } catch {
      setSocialFeedback('Could Not Update Friend Request.');
    }
  };

  const handleInviteFriendToBar = async (friend) => {
    const remaining = getCooldownRemaining(friend.uid);
    if (remaining > 0) return setSocialFeedback(`Wait ${formatCooldown(remaining)} Before Inviting Again.`);
    if (!activeBarMeta) return setSocialFeedback('Check Into A Bar First To Invite Friends.');
    try {
      await sendInvite({
        fromUid: firebaseUser.uid,
        fromUsername: profile?.displayUsername || profile?.username,
        toUid: friend.uid,
        toUsername: friend.username,
        barId: activeBarMeta.id,
        barName: activeBarMeta.name,
        message: `Come To ${activeBarMeta.name}.`,
      });
      setInviteCooldowns((prev) => ({ ...prev, [friend.uid]: Date.now() }));
      setSocialFeedback(`Invite Sent To @${friend.username}.`);
    } catch {
      setSocialFeedback('Wait A Few Minutes Before Inviting Again.');
    }
  };

  return (
    <Layout>
      <section className="home-stack" style={{ gap: 18 }}>
        <header style={{ display: 'grid', gap: 14 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '2.15rem', fontWeight: 950 }}>Friends</h1>
            <p style={{ margin: '7px 0 0', color: 'rgba(235,255,240,.66)' }}>See Who’s Out And Pull Your Friends Into The Night.</p>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px', minHeight: 54, borderRadius: 17, border: '1px solid rgba(235,255,240,.15)', background: 'rgba(255,255,255,.025)' }}>
              <span style={{ opacity: .58, fontSize: '1.15rem' }}>⌕</span>
              <input
                value={friendUsernameInput}
                onChange={(event) => {
                  setFriendUsernameInput(event.target.value);
                  setSearchResult(null);
                  setSocialFeedback('');
                }}
                onKeyDown={(event) => { if (event.key === 'Enter') handleSearch(); }}
                placeholder="Search Users By @Username"
                autoCapitalize="none"
                autoCorrect="off"
                style={{ flex: 1, minWidth: 0, border: 0, outline: 0, background: 'transparent', color: 'white', fontSize: '.98rem' }}
              />
            </div>
            <button className="primary-button" type="button" onClick={handleSearch} style={{ width: 58, minWidth: 58, padding: 0, borderRadius: 17, fontSize: '1.35rem' }} aria-label="Search users">
              {searching ? '…' : '+'}
            </button>
          </div>
        </header>

        {searchResult ? (
          <div style={panelStyle}>
            <div style={rowStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 13, minWidth: 0 }}>
                <FriendAvatar avatarId={searchResult.avatarId} username={searchResult.displayUsername || searchResult.username} size={64} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 900, fontSize: '1.05rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>@{searchResult.displayUsername || searchResult.username}</div>
                  <div style={{ marginTop: 5, color: 'rgba(235,255,240,.58)', fontSize: '.9rem' }}>Here User</div>
                </div>
              </div>
              <button className="primary-button" type="button" onClick={() => handleSendFriendRequest(searchResult)} style={{ whiteSpace: 'nowrap', paddingInline: 16 }}>Add Friend</button>
            </div>
          </div>
        ) : null}

        {socialFeedback ? (
          <div style={{ padding: '13px 15px', borderRadius: 16, background: 'rgba(83,240,124,.10)', border: '1px solid rgba(83,240,124,.14)', color: '#dfffe8', fontWeight: 800, textAlign: 'center' }}>
            {socialFeedback}
          </div>
        ) : null}

        {invites.length > 0 ? (
          <div style={panelStyle}>
            <h2 style={{ margin: 0, fontSize: '1.05rem' }}>Bar Invites</h2>
            {invites.map((invite) => (
              <div key={invite.id} style={rowStyle}>
                <div style={{ minWidth: 0 }}>
                  <strong>@{invite.fromUsername || 'friend'}</strong>
                  <div style={{ marginTop: 4, color: '#53f07c', fontSize: '.9rem' }}>Invited You To {invite.barName}</div>
                </div>
                <div style={{ display: 'flex', gap: 7 }}>
                  <Link to={`/bar/${invite.barId}`} className="ghost-button" style={{ textDecoration: 'none' }}>View</Link>
                  <button className="primary-button" onClick={() => dismissInvite(invite.id)}>Got It</button>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderRadius: 17, overflow: 'hidden', border: '1px solid rgba(235,255,240,.12)', background: 'rgba(255,255,255,.02)' }}>
          <button
            type="button"
            onClick={() => setActiveTab('friends')}
            style={{ border: 0, padding: '13px 10px', background: activeTab === 'friends' ? 'rgba(83,240,124,.12)' : 'transparent', color: activeTab === 'friends' ? '#53f07c' : 'rgba(235,255,240,.62)', fontWeight: 900, fontSize: '.94rem', boxShadow: activeTab === 'friends' ? 'inset 0 0 0 1px rgba(83,240,124,.45)' : 'none' }}
          >
            Your Friends&nbsp;&nbsp;{displayFriends.length}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('requests')}
            style={{ border: 0, padding: '13px 10px', background: activeTab === 'requests' ? 'rgba(83,240,124,.12)' : 'transparent', color: activeTab === 'requests' ? '#53f07c' : 'rgba(235,255,240,.62)', fontWeight: 900, fontSize: '.94rem', boxShadow: activeTab === 'requests' ? 'inset 0 0 0 1px rgba(83,240,124,.45)' : 'none' }}
          >
            Requests&nbsp;&nbsp;{friendRequests.length}
          </button>
        </div>

        {activeTab === 'friends' ? (
          <div style={panelStyle}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.18rem' }}>Your Friends</h2>
              <p style={{ margin: '6px 0 0', color: 'rgba(235,255,240,.60)', fontSize: '.9rem' }}>
                {activeBarMeta ? `You’re At ${activeBarMeta.name}. Send An Invite.` : 'Check Into A Bar To Invite Friends.'}
              </p>
            </div>

            {displayFriends.length ? displayFriends.map((friend) => {
              const remaining = getCooldownRemaining(friend.uid);
              const disabled = remaining > 0 || !activeBarMeta;
              return (
                <div key={friend.id} style={rowStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                    <FriendAvatar avatarId={friend.avatarId} username={friend.username} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 900, overflow: 'hidden', textOverflow: 'ellipsis' }}>@{friend.username}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 5, color: friend.activeCheckin ? '#53f07c' : 'rgba(235,255,240,.50)', fontSize: '.86rem' }}>
                        <StatusDot active={Boolean(friend.activeCheckin)} />
                        {friend.activeCheckin ? `At ${friend.barName}` : 'Not Out Right Now'}
                      </div>
                    </div>
                  </div>

                  <button
                    className="ghost-button"
                    disabled={disabled}
                    onClick={() => handleInviteFriendToBar(friend)}
                    style={{
                      opacity: disabled ? .45 : 1,
                      borderColor: disabled ? 'rgba(235,255,240,.12)' : 'rgba(83,240,124,.35)',
                      color: disabled ? 'rgba(235,255,240,.58)' : '#53f07c',
                      maxWidth: 150,
                      whiteSpace: 'normal',
                      lineHeight: 1.2,
                      padding: '10px 12px',
                    }}
                  >
                    {remaining > 0 ? `Wait ${formatCooldown(remaining)}` : activeBarMeta ? `Invite @${friend.username} To ${activeBarMeta.name}` : 'Check In To Invite'}
                  </button>
                </div>
              );
            }) : (
              <div style={{ ...rowStyle, justifyContent: 'center', color: 'rgba(235,255,240,.60)' }}>No Friends Added Yet.</div>
            )}
          </div>
        ) : (
          <div style={panelStyle}>
            <h2 style={{ margin: 0, fontSize: '1.18rem' }}>Friend Requests</h2>
            {friendRequests.length ? friendRequests.map((requestItem) => {
              const senderProfile = requestProfiles[requestItem.fromUid];
              const senderUsername = senderProfile?.displayUsername || senderProfile?.username || requestItem.fromUsername;
              return (
                <div key={requestItem.id} style={rowStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                    <FriendAvatar avatarId={senderProfile?.avatarId} username={senderUsername} />
                    <strong style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>@{senderUsername}</strong>
                  </div>
                  <div style={{ display: 'flex', gap: 7 }}>
                    <button className="primary-button" onClick={() => handleRespondToFriendRequest(requestItem, 'accepted')}>Accept</button>
                    <button className="ghost-button" onClick={() => handleRespondToFriendRequest(requestItem, 'declined')}>Decline</button>
                  </div>
                </div>
              );
            }) : (
              <div style={{ ...rowStyle, justifyContent: 'center', color: 'rgba(235,255,240,.60)' }}>No New Requests.</div>
            )}
          </div>
        )}

        <div style={panelStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
            <h2 style={{ margin: 0, fontSize: '1.18rem' }}>Who’s Out Right Now</h2>
            <span style={{ color: '#53f07c', fontWeight: 800, fontSize: '.86rem' }}>{friendsOutNow.length} Out</span>
          </div>

          {friendsOutNow.length ? friendsOutNow.map((friend) => (
            <div key={friend.id} style={rowStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                <FriendAvatar avatarId={friend.avatarId} username={friend.username} size={48} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontWeight: 900 }}>
                    @{friend.username}<StatusDot active />
                  </div>
                  <div style={{ marginTop: 4, color: 'rgba(235,255,240,.60)', fontSize: '.87rem' }}>At {friend.barName} · {timeAgo(friend.activeCheckin?.checkedInAtMillis)}</div>
                </div>
              </div>
              <Link to={`/bar/${friend.activeCheckin?.barId}`} className="ghost-button" style={{ textDecoration: 'none' }}>View</Link>
            </div>
          )) : (
            <div style={{ ...rowStyle, justifyContent: 'center', color: 'rgba(235,255,240,.60)' }}>None Of Your Friends Are Out Right Now.</div>
          )}
        </div>
      </section>
    </Layout>
  );
}

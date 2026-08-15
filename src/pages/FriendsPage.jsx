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
const cardStyle = { background: 'rgba(5, 15, 8, 0.9)', border: '1px solid rgba(120,255,170,0.13)', borderRadius: '28px', padding: '22px', display: 'grid', gap: '14px' };
const rowStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', padding: '14px 16px', borderRadius: '18px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(120,255,170,0.1)' };

function timeAgo(millis) {
  if (!millis) return 'just now';
  const minutes = Math.max(1, Math.floor((Date.now() - millis) / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return hours < 24 ? `${hours}h ago` : 'earlier';
}

function FriendAvatar({ avatarId, username, size = 48 }) {
  const avatar = getAvatarById(avatarId);
  if (avatar) {
    return <img src={avatar.image} alt="" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid rgba(83,240,124,.28)' }} />;
  }
  return <div style={{ width: size, height: size, borderRadius: '50%', display: 'grid', placeItems: 'center', flexShrink: 0, background: 'rgba(83,240,124,.12)', border: '1px solid rgba(83,240,124,.22)', fontWeight: 900 }}>{(username || '?').charAt(0).toUpperCase()}</div>;
}

export default function FriendsPage() {
  const { firebaseUser, profile } = useAuth();
  const [checkins, setCheckins] = useState([]);
  const [invites, setInvites] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [friends, setFriends] = useState([]);
  const [friendProfiles, setFriendProfiles] = useState({});
  const [friendUsernameInput, setFriendUsernameInput] = useState('');
  const [socialFeedback, setSocialFeedback] = useState('');
  const [inviteCooldowns, setInviteCooldowns] = useState({});
  const [, forceTick] = useState(0);

  useEffect(() => subscribeToTodayCollection('checkins', setCheckins), []);
  useEffect(() => firebaseUser?.uid ? subscribeToInvitesForUser(firebaseUser.uid, setInvites) : undefined, [firebaseUser?.uid]);
  useEffect(() => firebaseUser?.uid ? subscribeToFriendRequestsForUser(firebaseUser.uid, setFriendRequests) : undefined, [firebaseUser?.uid]);
  useEffect(() => firebaseUser?.uid ? subscribeToFriendsForUser(firebaseUser.uid, setFriends) : undefined, [firebaseUser?.uid]);
  useEffect(() => { const interval = setInterval(() => forceTick((v) => v + 1), 1000); return () => clearInterval(interval); }, []);

  useEffect(() => {
    if (!firebaseUser?.uid || !friends.length) { setFriendProfiles({}); return; }
    const uids = friends.map((friendship) => friendship.userAUid === firebaseUser.uid ? friendship.userBUid : friendship.userAUid).filter(Boolean);
    let cancelled = false;
    getPublicProfilesByUids(uids).then((profiles) => { if (!cancelled) setFriendProfiles(profiles); }).catch(() => { if (!cancelled) setFriendProfiles({}); });
    return () => { cancelled = true; };
  }, [friends, firebaseUser?.uid]);

  const myActiveCheckin = useMemo(() => checkins.find((item) => item.uid === firebaseUser?.uid && item.active) || null, [checkins, firebaseUser?.uid]);
  const activeBarMeta = useMemo(() => msuBars.find((bar) => bar.id === myActiveCheckin?.barId) || null, [myActiveCheckin]);

  const displayFriends = useMemo(() => {
    if (!firebaseUser?.uid) return [];
    return friends.map((friendship) => {
      const isUserA = friendship.userAUid === firebaseUser.uid;
      const uid = isUserA ? friendship.userBUid : friendship.userAUid;
      const publicProfile = friendProfiles[uid];
      return {
        id: friendship.id,
        uid,
        username: publicProfile?.displayUsername || publicProfile?.username || (isUserA ? friendship.userBUUsername || friendship.userBUsername : friendship.userAUsername),
        avatarId: publicProfile?.avatarId || '',
      };
    });
  }, [friends, firebaseUser?.uid, friendProfiles]);

  const friendsOutNow = useMemo(() => {
    const friendUidSet = new Set(displayFriends.map((friend) => friend.uid));
    return checkins.filter((item) => item.active && friendUidSet.has(item.uid)).map((item) => ({ ...item, friend: displayFriends.find((friend) => friend.uid === item.uid), barName: msuBars.find((bar) => bar.id === item.barId)?.name || item.barId })).sort((a, b) => b.checkedInAtMillis - a.checkedInAtMillis);
  }, [checkins, displayFriends]);

  const getCooldownRemaining = (uid) => Math.max(0, INVITE_COOLDOWN_MS - (Date.now() - (inviteCooldowns[uid] || 0)));
  const formatCooldown = (ms) => `${Math.floor(Math.ceil(ms / 1000) / 60)}:${String(Math.ceil(ms / 1000) % 60).padStart(2, '0')}`;

  const handleSendFriendRequest = async () => {
    const clean = friendUsernameInput.trim();
    if (!clean) return setSocialFeedback('Enter a username first.');
    try {
      const user = await findUserByUsername(clean);
      if (!user) return setSocialFeedback('User not found.');
      if (user.uid === firebaseUser.uid) return setSocialFeedback('You cannot add yourself.');
      await sendFriendRequest({ fromUid: firebaseUser.uid, fromUsername: profile?.displayUsername || profile?.username, toUid: user.uid, toUsername: user.username });
      setFriendUsernameInput('');
      setSocialFeedback('Friend request sent.');
    } catch (error) {
      setSocialFeedback(error?.message === 'ALREADY_FRIENDS' ? 'You are already friends.' : 'Could not send friend request.');
    }
  };

  const handleRespondToFriendRequest = async (requestItem, status) => {
    try {
      await respondToFriendRequest({ requestId: requestItem.id, fromUid: requestItem.fromUid, fromUsername: requestItem.fromUsername, toUid: requestItem.toUid, toUsername: profile?.displayUsername || profile?.username, status });
      setSocialFeedback(status === 'accepted' ? 'Friend added.' : 'Request declined.');
    } catch { setSocialFeedback('Could not update friend request.'); }
  };

  const handleInviteFriendToBar = async (friend) => {
    const remaining = getCooldownRemaining(friend.uid);
    if (remaining > 0) return setSocialFeedback(`Wait ${formatCooldown(remaining)} before inviting again.`);
    if (!activeBarMeta) return setSocialFeedback('Check into a bar first to invite friends.');
    try {
      await sendInvite({ fromUid: firebaseUser.uid, fromUsername: profile?.displayUsername || profile?.username, toUid: friend.uid, toUsername: friend.username, barId: activeBarMeta.id, barName: activeBarMeta.name, message: `Come to ${activeBarMeta.name}, it's packed!` });
      setInviteCooldowns((prev) => ({ ...prev, [friend.uid]: Date.now() }));
      setSocialFeedback(`Invite sent to @${friend.username}.`);
    } catch { setSocialFeedback('Wait a few minutes before inviting again.'); }
  };

  return (
    <Layout>
      <section className="home-stack">
        <div style={{ marginBottom: 12 }}><h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 900 }}>Friends</h1><p style={{ marginTop: 8, color: 'rgba(235,255,240,.72)' }}>Add Friends, See Who’s Out, And Invite People To Your Bar.</p></div>
        {socialFeedback && <div style={{ padding: '12px 14px', borderRadius: 16, background: 'rgba(83,240,124,.12)', color: '#dfffe8', fontWeight: 700 }}>{socialFeedback}</div>}

        <div style={cardStyle}>
          <div><h2 style={{ margin: 0 }}>Who’s Out Right Now</h2><p style={{ color: 'rgba(235,255,240,.72)' }}>See Which Friends Are Already Out.</p></div>
          {friendsOutNow.length ? friendsOutNow.map((item) => <div key={`${item.uid}_${item.barId}`} style={rowStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><FriendAvatar avatarId={item.friend?.avatarId} username={item.friend?.username} /><div><div style={{ fontWeight: 800 }}>@{item.friend?.username || 'friend'} is at {item.barName}</div><div style={{ opacity: .7, fontSize: '.9rem', marginTop: 4 }}>Checked in {timeAgo(item.checkedInAtMillis)}</div></div></div>
            <Link to={`/bar/${item.barId}`} className="ghost-button" style={{ textDecoration: 'none' }}>View</Link>
          </div>) : <div style={rowStyle}>None Of Your Friends Are Checked In Right Now.</div>}
        </div>

        {invites.length > 0 && <div style={cardStyle}><h2 style={{ margin: 0 }}>Bar Invites</h2>{invites.map((invite) => <div key={invite.id} style={rowStyle}><div><strong>@{invite.fromUsername || 'friend'} invited you to {invite.barName}</strong><div style={{ opacity: .7, marginTop: 4 }}>{invite.message}</div></div><div style={{ display: 'flex', gap: 8 }}><Link to={`/bar/${invite.barId}`} className="ghost-button" style={{ textDecoration: 'none' }}>View</Link><button className="primary-button" onClick={() => dismissInvite(invite.id)}>Got It</button></div></div>)}</div>}

        <div style={cardStyle}>
          <div><h2 style={{ margin: 0 }}>Add Friends</h2><p style={{ color: 'rgba(235,255,240,.72)' }}>Search By Username And Build Your Circle.</p></div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}><input value={friendUsernameInput} onChange={(e) => setFriendUsernameInput(e.target.value)} placeholder="Enter exact username" style={{ flex: 1, minWidth: 220, padding: '12px 14px', borderRadius: 14, border: '1px solid rgba(120,255,170,.15)', background: 'rgba(255,255,255,.04)', color: 'white' }} /><button className="primary-button" onClick={handleSendFriendRequest}>Send Request</button></div>
        </div>

        {friendRequests.length > 0 && <div style={cardStyle}><h2 style={{ margin: 0 }}>Incoming Requests</h2>{friendRequests.map((requestItem) => <div key={requestItem.id} style={rowStyle}><strong>@{requestItem.fromUsername}</strong><div style={{ display: 'flex', gap: 8 }}><button className="primary-button" onClick={() => handleRespondToFriendRequest(requestItem, 'accepted')}>Accept</button><button className="ghost-button" onClick={() => handleRespondToFriendRequest(requestItem, 'declined')}>Decline</button></div></div>)}</div>}

        <div style={cardStyle}>
          <div><h2 style={{ margin: 0 }}>Your Friends</h2><p style={{ color: 'rgba(235,255,240,.72)' }}>{activeBarMeta ? `You’re Checked Into ${activeBarMeta.name}. Invite Your People.` : 'Check Into A Bar To Invite Your Friends Out.'}</p></div>
          {displayFriends.length ? displayFriends.map((friend) => {
            const remaining = getCooldownRemaining(friend.uid);
            const disabled = remaining > 0 || !activeBarMeta;
            return <div key={friend.id} style={rowStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}><FriendAvatar avatarId={friend.avatarId} username={friend.username} size={52} /><div style={{ fontWeight: 850, overflow: 'hidden', textOverflow: 'ellipsis' }}>@{friend.username}</div></div>
              <button className="primary-button" disabled={disabled} onClick={() => handleInviteFriendToBar(friend)} style={{ opacity: disabled ? .5 : 1, whiteSpace: 'nowrap', fontSize: '.82rem', paddingInline: 12 }}>{remaining > 0 ? `Wait ${formatCooldown(remaining)}` : activeBarMeta ? `Invite @${friend.username} To ${activeBarMeta.name}` : 'Check In To Invite'}</button>
            </div>;
          }) : <div style={rowStyle}>No Friends Added Yet.</div>}
        </div>
      </section>
    </Layout>
  );
}
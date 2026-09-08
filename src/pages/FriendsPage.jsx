import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { getAvatarById } from '../lib/avatars';
import { demoFriends } from '../lib/screenshotDemo';

const panelStyle = {
  background: 'rgba(5, 15, 8, 0.94)',
  border: '1px solid rgba(235,255,240,.10)',
  borderRadius: 24,
  padding: 16,
  display: 'grid',
  gap: 12,
  boxShadow: '0 18px 45px rgba(0,0,0,.18)',
};

const rowStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  padding: '12px 13px',
  borderRadius: 18,
  background: 'rgba(255,255,255,.025)',
  border: '1px solid rgba(235,255,240,.08)',
};

function FriendAvatar({ avatarId, username, size = 58 }) {
  const avatar = getAvatarById(avatarId);
  if (avatar) return <img src={avatar.image} alt="" style={{ width: size, height: size, borderRadius: 16, objectFit: 'cover', objectPosition: 'center top', flexShrink: 0, border: '1px solid rgba(83,240,124,.20)' }} />;
  return <div style={{ width: size, height: size, borderRadius: 16, display: 'grid', placeItems: 'center', background: 'rgba(83,240,124,.10)', fontWeight: 900 }}>{(username || '?').charAt(0).toUpperCase()}</div>;
}

function StatusDot({ active = false }) {
  return <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: '50%', background: active ? '#53f07c' : 'rgba(235,255,240,.42)', flexShrink: 0 }} />;
}

function timeAgo(millis) {
  const minutes = Math.max(1, Math.floor((Date.now() - millis) / 60000));
  return `${minutes}m ago`;
}

export default function FriendsPage() {
  const friendsOutNow = demoFriends.filter((friend) => friend.activeCheckin);

  return (
    <Layout>
      <section className="home-stack" style={{ gap: 18 }}>
        <header style={{ display: 'grid', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'end', justifyContent: 'space-between', gap: 12 }}>
            <div><h1 style={{ margin: 0, fontSize: '2.2rem', fontWeight: 950 }}>Friends</h1><p style={{ margin: '6px 0 0', color: 'rgba(235,255,240,.58)' }}>See Who’s Out Before You Pick A Spot.</p></div>
            <div style={{ padding: '8px 12px', borderRadius: 999, background: 'rgba(83,240,124,.12)', border: '1px solid rgba(83,240,124,.18)', color: '#78ffaa', fontWeight: 900 }}>{friendsOutNow.length} Out Now</div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px', minHeight: 54, borderRadius: 17, border: '1px solid rgba(235,255,240,.15)', background: 'rgba(255,255,255,.025)' }}>
              <span style={{ opacity: .58, fontSize: '1.15rem' }}>⌕</span><span style={{ color: 'rgba(235,255,240,.48)' }}>Search Users By @Username</span>
            </div>
            <button className="primary-button" type="button" style={{ width: 58, minWidth: 58, padding: 0, borderRadius: 17, fontSize: '1.35rem' }}>＋</button>
          </div>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderRadius: 17, overflow: 'hidden', border: '1px solid rgba(235,255,240,.12)', background: 'rgba(255,255,255,.02)' }}>
          <button type="button" style={{ border: 0, padding: '13px 10px', background: 'rgba(83,240,124,.12)', color: '#53f07c', fontWeight: 900, fontSize: '.94rem', boxShadow: 'inset 0 0 0 1px rgba(83,240,124,.45)' }}>Your Friends&nbsp;&nbsp;{demoFriends.length}</button>
          <button type="button" style={{ border: 0, padding: '13px 10px', background: 'transparent', color: 'rgba(235,255,240,.62)', fontWeight: 900, fontSize: '.94rem' }}>Requests&nbsp;&nbsp;3</button>
        </div>

        <div style={panelStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}><h2 style={{ margin: 0, fontSize: '1.18rem' }}>Who’s Out Right Now</h2><span style={{ color: '#53f07c', fontWeight: 900, fontSize: '.88rem' }}>{friendsOutNow.length} Friends Live</span></div>
          {friendsOutNow.map((friend) => (
            <div key={friend.id} style={rowStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                <FriendAvatar avatarId={friend.avatarId} username={friend.username} size={52} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontWeight: 950 }}>@{friend.username}<StatusDot active /></div>
                  <div style={{ marginTop: 4, color: '#78ffaa', fontSize: '.88rem', fontWeight: 700 }}>At {friend.barName} · {timeAgo(friend.activeCheckin.checkedInAtMillis)}</div>
                </div>
              </div>
              <Link to={`/bar/${friend.activeCheckin.barId}`} className="ghost-button" style={{ textDecoration: 'none' }}>View</Link>
            </div>
          ))}
        </div>

        <div style={panelStyle}>
          <h2 style={{ margin: 0, fontSize: '1.18rem' }}>Your Friends</h2>
          {demoFriends.map((friend) => (
            <div key={`all-${friend.id}`} style={rowStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                <FriendAvatar avatarId={friend.avatarId} username={friend.username} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 950 }}>@{friend.username}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 5, color: friend.activeCheckin ? '#53f07c' : 'rgba(235,255,240,.50)', fontSize: '.86rem' }}><StatusDot active={Boolean(friend.activeCheckin)} />{friend.activeCheckin ? `At ${friend.barName}` : 'Not Out Right Now'}</div>
                </div>
              </div>
              <button className="ghost-button" type="button" style={{ borderColor: friend.activeCheckin ? 'rgba(83,240,124,.35)' : 'rgba(235,255,240,.12)', color: friend.activeCheckin ? '#53f07c' : 'rgba(235,255,240,.58)' }}>{friend.activeCheckin ? 'Invite' : 'Message'}</button>
            </div>
          ))}
        </div>

        <div style={{ ...panelStyle, background: 'linear-gradient(180deg, rgba(12,34,18,.95), rgba(5,15,8,.95))' }}>
          <div style={{ color: '#78ffaa', fontWeight: 950, letterSpacing: '.02em' }}>TONIGHT</div>
          <div style={{ fontSize: '1.55rem', fontWeight: 950 }}>{friendsOutNow.length} Of Your Friends Are Already Out</div>
          <div style={{ color: 'rgba(235,255,240,.62)', lineHeight: 1.5 }}>Harper’s and Rick’s are leading your friend group right now.</div>
        </div>
      </section>
    </Layout>
  );
}

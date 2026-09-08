import Layout from '../components/Layout';
import UserAvatar from '../components/UserAvatar';
import { useAuth } from '../context/AuthContext';
import { demoStats } from '../lib/screenshotDemo';

const cardStyle = { background: 'rgba(5, 15, 8, 0.88)', border: '1px solid rgba(120, 255, 170, 0.12)', borderRadius: '28px', padding: '22px', boxShadow: '0 18px 45px rgba(0, 0, 0, 0.22)' };
const statStyle = { padding: '16px', borderRadius: '20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(120, 255, 170, 0.1)' };

export default function HomeTabPage() {
  const { profile } = useAuth();
  const displayName = profile?.displayUsername || profile?.username || 'ka2la2';
  const avatarId = profile?.avatarId || 'avatar-1';
  const formatVisitTime = (millis) => {
    const date = new Date(millis);
    if (date.toDateString() === new Date().toDateString()) return `Today At ${date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <Layout>
      <section className="home-stack">
        <div style={{ ...cardStyle, padding: '24px' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <UserAvatar username={displayName} avatarId={avatarId} size="xl" />
            <div>
              <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 900 }}>Profile</h1>
              <p style={{ margin: '6px 0 0', color: 'rgba(235,255,240,0.72)' }}>Your Account, Nights Out, Badges, And App Info</p>
              <div style={{ marginTop: 12, fontWeight: 900, color: '#78ffaa' }}>@{displayName}</div>
            </div>
          </div>
        </div>

        <div style={{ ...cardStyle, display: 'grid', gap: '18px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900 }}>Personal Stats</h2>
            <p style={{ marginTop: '8px', color: 'rgba(235,255,240,0.72)', fontSize: '0.98rem' }}>Your Lifetime Bar History And Nightlife Stats.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px' }}>
            <div style={statStyle}><div>Total Check-Ins</div><div style={{ fontSize: '1.9rem', fontWeight: 950 }}>{demoStats.totalVisits}</div></div>
            <div style={statStyle}><div>Unique Bars</div><div style={{ fontSize: '1.9rem', fontWeight: 950 }}>{demoStats.uniqueBars}</div></div>
            <div style={statStyle}><div>Current Streak</div><div style={{ fontSize: '1.9rem', fontWeight: 950 }}>{demoStats.currentStreak} 🔥</div></div>
            <div style={statStyle}><div>Top Spot</div><div style={{ fontWeight: 950, fontSize: '1.08rem' }}>{demoStats.topSpot}</div></div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Nights Out</h2>
            <div style={{ display: 'grid', gap: '10px' }}>
              <div style={statStyle}><strong style={{ fontSize: '1.6rem' }}>{demoStats.nightsThisWeek}</strong><div>Nights This Week</div></div>
              <div style={statStyle}><strong style={{ fontSize: '1.6rem' }}>{demoStats.nightsThisMonth}</strong><div>Nights This Month</div></div>
            </div>
          </div>
          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Badges</h2>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {demoStats.badges.map((badge) => <span key={badge} style={{ padding: '9px 11px', borderRadius: '999px', background: 'rgba(83, 240, 124, 0.12)', border: '1px solid rgba(83, 240, 124, 0.18)', fontWeight: 800, fontSize: '.84rem' }}>{badge}</span>)}
            </div>
          </div>
        </div>

        <div style={{ ...cardStyle, display: 'grid', gap: '14px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.18rem', fontWeight: 900 }}>Your Bar History</h2>
            <p style={{ marginBottom: 0, color: 'rgba(235,255,240,0.65)' }}>Every Bar You’ve Checked Into, In One Place.</p>
          </div>
          <div style={{ display: 'grid', gap: '10px' }}>
            {demoStats.barHistory.map((entry) => (
              <div key={entry.barId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', ...statStyle, padding: '14px 16px' }}>
                <div><div style={{ fontWeight: 900 }}>{entry.name}</div><div style={{ opacity: .62, fontSize: '.88rem' }}>{entry.neighborhood}</div></div>
                <div style={{ textAlign: 'right' }}><div style={{ fontWeight: 950 }}>{entry.visits} Visits</div><div style={{ opacity: .62, fontSize: '.86rem' }}>{formatVisitTime(entry.lastVisitedAt)}</div></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}

import { useEffect, useMemo, useState } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { msuBars } from '../lib/bars';
import { subscribeToUserBarStats } from '../lib/firebaseHelpers';

function getDayStamp(millis) {
  const date = new Date(millis);
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

export default function HomeTabPage() {
  const { firebaseUser, profile, logOut, deleteAccount } = useAuth();
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [userBarStats, setUserBarStats] = useState([]);

  useEffect(() => {
    if (!firebaseUser?.uid) {
      setUserBarStats([]);
      return;
    }

    const unsubscribe = subscribeToUserBarStats(firebaseUser.uid, setUserBarStats);
    return () => unsubscribe();
  }, [firebaseUser?.uid]);

  const barHistory = useMemo(() => {
    return [...userBarStats]
      .map((entry) => {
        const barMeta = msuBars.find((bar) => bar.id === entry.barId);

        return {
          ...entry,
          name: barMeta?.name || entry.barId,
          neighborhood: barMeta?.neighborhood || 'East Lansing',
          visits: entry.visitCount || 0,
          lastVisitedAt: entry.lastVisitAtMillis || 0,
        };
      })
      .sort((a, b) => {
        if ((b.visits || 0) !== (a.visits || 0)) {
          return (b.visits || 0) - (a.visits || 0);
        }
        return (b.lastVisitedAt || 0) - (a.lastVisitedAt || 0);
      });
  }, [userBarStats]);

  const totalVisits = useMemo(() => {
    return userBarStats.reduce((sum, entry) => sum + (entry.visitCount || 0), 0);
  }, [userBarStats]);

  const uniqueBars = useMemo(() => {
    return userBarStats.length;
  }, [userBarStats]);

  const topSpot = useMemo(() => {
    return barHistory[0]?.name || 'No visits yet';
  }, [barHistory]);

  const uniqueVisitDays = useMemo(() => {
    const stamps = userBarStats
      .map((entry) => entry.lastVisitAtMillis)
      .filter(Boolean)
      .map(getDayStamp);

    return [...new Set(stamps)].sort((a, b) => new Date(b) - new Date(a));
  }, [userBarStats]);

  const currentStreak = useMemo(() => {
    if (!uniqueVisitDays.length) return 0;

    const daySet = new Set(uniqueVisitDays);
    let streak = 0;
    const cursor = new Date();
    cursor.setHours(0, 0, 0, 0);

    while (daySet.has(getDayStamp(cursor.getTime()))) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }

    return streak;
  }, [uniqueVisitDays]);

  const now = new Date();

  const nightsThisWeek = useMemo(() => {
    const weekAgo = new Date();
    weekAgo.setDate(now.getDate() - 7);

    return uniqueVisitDays.filter((stamp) => new Date(stamp) >= weekAgo).length;
  }, [uniqueVisitDays, now]);

  const nightsThisMonth = useMemo(() => {
    return uniqueVisitDays.filter((stamp) => {
      const date = new Date(stamp);
      return (
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
      );
    }).length;
  }, [uniqueVisitDays, now]);

  const badges = useMemo(() => {
    const list = [];

    if (uniqueBars >= 1) list.push('First night out');
    if (uniqueBars >= 3) list.push('Bar hopper');
    if (totalVisits >= 10) list.push('Regular');
    if (currentStreak >= 3) list.push('Three-night streak');
    if (uniqueBars >= msuBars.length) list.push('Visited every bar');

    return list;
  }, [uniqueBars, totalVisits, currentStreak]);

  const formatVisitTime = (millis) => {
    if (!millis) return 'Recently';

    const date = new Date(millis);
    const sameDay = date.toDateString() === new Date().toDateString();

    if (sameDay) {
      return `Today at ${date.toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
      })}`;
    }

    return date.toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
    });
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to permanently delete your account? This cannot be undone.'
    );

    if (!confirmed) return;

    setDeleting(true);
    setDeleteError('');

    try {
      await deleteAccount();
    } catch (error) {
      console.error('Delete account error full:', error);
      console.error('Delete account error code:', error?.code);
      console.error('Delete account error message:', error?.message);

      if (error?.code === 'auth/requires-recent-login') {
        setDeleteError(
          'For security, log out and log back in first, then try deleting your account again.'
        );
      } else {
        setDeleteError('Could not delete account right now. Please try again.');
      }
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Layout>
      <section className="home-stack">
        <div
          style={{
            background: 'rgba(5, 15, 8, 0.88)',
            border: '1px solid rgba(120, 255, 170, 0.12)',
            borderRadius: '28px',
            padding: '24px',
            boxShadow: '0 18px 45px rgba(0, 0, 0, 0.22)',
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: '16px',
              alignItems: 'center',
              marginBottom: '18px',
            }}
          >
            <img
              src="/logo-mark.png"
              alt="Here"
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '18px',
                objectFit: 'cover',
              }}
            />

            <div>
              <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 900 }}>
                Profile
              </h1>
              <p style={{ margin: '6px 0 0', color: 'rgba(235,255,240,0.72)' }}>
                Your account, nights out, badges, and app info
              </p>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gap: '12px',
            }}
          >
            <div
              style={{
                padding: '16px 18px',
                borderRadius: '20px',
                border: '1px solid rgba(120, 255, 170, 0.12)',
                background: 'rgba(255,255,255,0.02)',
                fontWeight: 700,
                fontSize: '1.05rem',
              }}
            >
              @{profile?.displayUsername || profile?.username || 'user'}
            </div>

            <button className="ghost-button" onClick={logOut}>
              Log out
            </button>
          </div>
        </div>

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
            <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900 }}>
              Personal stats
            </h2>
            <p
              style={{
                marginTop: '8px',
                color: 'rgba(235,255,240,0.72)',
                fontSize: '0.98rem',
              }}
            >
              Your lifetime bar history without showing basically the same section twice.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: '12px',
            }}
          >
            <div
              style={{
                padding: '16px',
                borderRadius: '20px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(120, 255, 170, 0.1)',
              }}
            >
              <div
                style={{
                  color: 'rgba(235,255,240,0.64)',
                  fontSize: '0.85rem',
                  marginBottom: '6px',
                }}
              >
                Total check-ins
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900 }}>{totalVisits}</div>
            </div>

            <div
              style={{
                padding: '16px',
                borderRadius: '20px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(120, 255, 170, 0.1)',
              }}
            >
              <div
                style={{
                  color: 'rgba(235,255,240,0.64)',
                  fontSize: '0.85rem',
                  marginBottom: '6px',
                }}
              >
                Unique bars
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900 }}>{uniqueBars}</div>
            </div>

            <div
              style={{
                padding: '16px',
                borderRadius: '20px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(120, 255, 170, 0.1)',
              }}
            >
              <div
                style={{
                  color: 'rgba(235,255,240,0.64)',
                  fontSize: '0.85rem',
                  marginBottom: '6px',
                }}
              >
                Current streak
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900 }}>{currentStreak}</div>
            </div>

            <div
              style={{
                padding: '16px',
                borderRadius: '20px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(120, 255, 170, 0.1)',
              }}
            >
              <div
                style={{
                  color: 'rgba(235,255,240,0.64)',
                  fontSize: '0.85rem',
                  marginBottom: '6px',
                }}
              >
                Top spot
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 900 }}>
                {topSpot}
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '14px',
          }}
        >
          <div
            style={{
              background: 'rgba(5, 15, 8, 0.88)',
              border: '1px solid rgba(120, 255, 170, 0.12)',
              borderRadius: '28px',
              padding: '22px',
              boxShadow: '0 18px 45px rgba(0, 0, 0, 0.22)',
            }}
          >
            <h2 style={{ marginTop: 0 }}>Nights out</h2>
            <div style={{ display: 'grid', gap: '10px' }}>
              <div
                style={{
                  padding: '14px 16px',
                  borderRadius: '18px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(120,255,170,0.1)',
                }}
              >
                <strong>{nightsThisWeek}</strong>
                <div style={{ color: 'rgba(235,255,240,0.68)', marginTop: '4px' }}>
                  nights this week
                </div>
              </div>

              <div
                style={{
                  padding: '14px 16px',
                  borderRadius: '18px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(120,255,170,0.1)',
                }}
              >
                <strong>{nightsThisMonth}</strong>
                <div style={{ color: 'rgba(235,255,240,0.68)', marginTop: '4px' }}>
                  nights this month
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              background: 'rgba(5, 15, 8, 0.88)',
              border: '1px solid rgba(120, 255, 170, 0.12)',
              borderRadius: '28px',
              padding: '22px',
              boxShadow: '0 18px 45px rgba(0, 0, 0, 0.22)',
            }}
          >
            <h2 style={{ marginTop: 0 }}>Badges</h2>

            {badges.length ? (
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {badges.map((badge) => (
                  <span
                    key={badge}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '999px',
                      background: 'rgba(83, 240, 124, 0.12)',
                      border: '1px solid rgba(83, 240, 124, 0.18)',
                      fontWeight: 800,
                    }}
                  >
                    {badge}
                  </span>
                ))}
              </div>
            ) : (
              <div
                style={{
                  color: 'rgba(235,255,240,0.72)',
                }}
              >
                No badges yet. Go out more and start stacking them.
              </div>
            )}
          </div>
        </div>

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
              Your bar history
            </h2>
            <p
              style={{
                marginTop: '8px',
                color: 'rgba(235,255,240,0.72)',
                fontSize: '0.95rem',
              }}
            >
              One clean section instead of repeating the same info in two different boxes.
            </p>
          </div>

          {barHistory.length ? (
            <div style={{ display: 'grid', gap: '10px' }}>
              {barHistory.map((entry) => (
                <div
                  key={entry.barId}
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
                    <div style={{ fontWeight: 800 }}>{entry.name}</div>
                    <div style={{ color: 'rgba(235,255,240,0.64)', fontSize: '0.86rem' }}>
                      {entry.neighborhood}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 900 }}>{entry.visits} visits</div>
                    <div style={{ color: 'rgba(235,255,240,0.64)', fontSize: '0.82rem' }}>
                      {formatVisitTime(entry.lastVisitedAt)}
                    </div>
                  </div>
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
              No bar history yet. Check into a bar to start building your stats.
            </div>
          )}
        </div>

        <div
          style={{
            background: 'rgba(5, 15, 8, 0.88)',
            border: '1px solid rgba(120, 255, 170, 0.12)',
            borderRadius: '28px',
            padding: '24px',
            boxShadow: '0 18px 45px rgba(0, 0, 0, 0.22)',
          }}
        >
          <h2 style={{ marginTop: 0 }}>How it works</h2>
          <p style={{ color: 'rgba(235,255,240,0.75)', lineHeight: 1.6 }}>
            Here shows real-time crowd signals around campus using check-ins, vibe
            updates, cover reports, line updates, invites, and comments from users.
            Use it to see what bars are active, where your friends are, and what the
            situation looks like before you pull up.
          </p>
        </div>

        <div
          style={{
            background: 'rgba(5, 15, 8, 0.88)',
            border: '1px solid rgba(120, 255, 170, 0.12)',
            borderRadius: '28px',
            padding: '24px',
            boxShadow: '0 18px 45px rgba(0, 0, 0, 0.22)',
          }}
        >
          <h2 style={{ marginTop: 0 }}>Community rules</h2>
          <p style={{ color: 'rgba(235,255,240,0.75)', lineHeight: 1.6 }}>
            No harassment, hate speech, threats, targeted abuse, or illegal activity.
            Keep updates honest, don’t spam fake reports, and don’t use the app to put
            real people at risk.
          </p>
        </div>

        <div
          style={{
            background: 'rgba(5, 15, 8, 0.88)',
            border: '1px solid rgba(120, 255, 170, 0.12)',
            borderRadius: '28px',
            padding: '24px',
            boxShadow: '0 18px 45px rgba(0, 0, 0, 0.22)',
          }}
        >
          <h2 style={{ marginTop: 0 }}>Support</h2>
          <p style={{ color: 'rgba(235,255,240,0.75)', lineHeight: 1.6 }}>
            Need help or want to report a safety issue? Contact support at:
          </p>
          <p style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: 0 }}>
            here-msu@outlook.com
          </p>
        </div>

        <div
          style={{
            background: 'rgba(25, 7, 7, 0.88)',
            border: '1px solid rgba(255, 120, 120, 0.16)',
            borderRadius: '28px',
            padding: '24px',
            boxShadow: '0 18px 45px rgba(0, 0, 0, 0.22)',
          }}
        >
          <h2 style={{ marginTop: 0 }}>Delete account</h2>
          <p style={{ color: 'rgba(255,235,235,0.76)', lineHeight: 1.6 }}>
            You can permanently delete your account and remove your access to the app here.
          </p>

          {deleteError ? (
            <div
              style={{
                marginBottom: '12px',
                padding: '12px 14px',
                borderRadius: '14px',
                background: 'rgba(255, 90, 90, 0.12)',
                border: '1px solid rgba(255, 120, 120, 0.16)',
                color: '#ffd2d2',
                fontWeight: 600,
              }}
            >
              {deleteError}
            </div>
          ) : null}

          <button
            onClick={handleDeleteAccount}
            disabled={deleting}
            style={{
              width: '100%',
              padding: '16px 18px',
              borderRadius: '18px',
              border: 'none',
              background: deleting ? '#744' : '#ff5c5c',
              color: '#fff',
              fontWeight: 900,
              fontSize: '1rem',
              cursor: deleting ? 'not-allowed' : 'pointer',
            }}
          >
            {deleting ? 'Deleting account...' : 'Delete account permanently'}
          </button>
        </div>
      </section>
    </Layout>
  );
}
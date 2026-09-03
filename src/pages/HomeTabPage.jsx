import { useEffect, useMemo, useState } from 'react';
import Layout from '../components/Layout';
import UserAvatar from '../components/UserAvatar';
import { useAuth } from '../context/AuthContext';
import { msuBars } from '../lib/bars';
import { getCurrentDayKey } from '../lib/day';
import { subscribeToUserBarStats, subscribeToUserCheckins } from '../lib/firebaseHelpers';

const cardStyle = { background: 'rgba(5, 15, 8, 0.88)', border: '1px solid rgba(120, 255, 170, 0.12)', borderRadius: '28px', padding: '22px', boxShadow: '0 18px 45px rgba(0, 0, 0, 0.22)' };
const statStyle = { padding: '16px', borderRadius: '20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(120, 255, 170, 0.1)' };

function dayKeyToDate(dayKey) {
  return new Date(`${dayKey}T00:00:00Z`);
}

function previousDayKey(dayKey) {
  const date = dayKeyToDate(dayKey);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

export default function HomeTabPage() {
  const { firebaseUser, profile, logOut, deleteAccount } = useAuth();
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [userBarStats, setUserBarStats] = useState([]);
  const [userCheckins, setUserCheckins] = useState([]);

  useEffect(() => {
    if (!firebaseUser?.uid) {
      setUserBarStats([]);
      setUserCheckins([]);
      return;
    }
    const unsubscribeBarStats = subscribeToUserBarStats(firebaseUser.uid, setUserBarStats);
    const unsubscribeCheckins = subscribeToUserCheckins(firebaseUser.uid, setUserCheckins);
    return () => {
      unsubscribeBarStats();
      unsubscribeCheckins();
    };
  }, [firebaseUser?.uid]);

  const barHistory = useMemo(() => [...userBarStats].map((entry) => {
    const barMeta = msuBars.find((bar) => bar.id === entry.barId);
    return { ...entry, name: barMeta?.name || entry.barId, neighborhood: barMeta?.neighborhood || 'East Lansing', visits: entry.visitCount || 0, lastVisitedAt: entry.lastVisitAtMillis || 0 };
  }).sort((a, b) => (b.visits || 0) - (a.visits || 0) || (b.lastVisitedAt || 0) - (a.lastVisitedAt || 0)), [userBarStats]);

  const totalVisits = useMemo(() => userBarStats.reduce((sum, entry) => sum + (entry.visitCount || 0), 0), [userBarStats]);
  const uniqueBars = userBarStats.length;
  const topSpot = barHistory[0]?.name || 'No Visits Yet';
  const uniqueVisitDays = useMemo(() => [...new Set(userCheckins.map((entry) => entry.dayKey || (entry.checkedInAtMillis ? getCurrentDayKey(new Date(entry.checkedInAtMillis)) : '')).filter(Boolean))].sort().reverse(), [userCheckins]);
  const currentStreak = useMemo(() => {
    if (!uniqueVisitDays.length) return 0;
    const daySet = new Set(uniqueVisitDays);
    let cursor = getCurrentDayKey();
    let streak = 0;
    while (daySet.has(cursor)) {
      streak += 1;
      cursor = previousDayKey(cursor);
    }
    return streak;
  }, [uniqueVisitDays]);
  const currentDayKey = getCurrentDayKey();
  const currentDayDate = dayKeyToDate(currentDayKey);
  const nightsThisWeek = useMemo(() => {
    const weekAgo = new Date(currentDayDate);
    weekAgo.setUTCDate(weekAgo.getUTCDate() - 6);
    return uniqueVisitDays.filter((stamp) => dayKeyToDate(stamp) >= weekAgo && dayKeyToDate(stamp) <= currentDayDate).length;
  }, [uniqueVisitDays, currentDayKey]);
  const nightsThisMonth = useMemo(() => uniqueVisitDays.filter((stamp) => {
    const date = dayKeyToDate(stamp);
    return date.getUTCMonth() === currentDayDate.getUTCMonth() && date.getUTCFullYear() === currentDayDate.getUTCFullYear();
  }).length, [uniqueVisitDays, currentDayKey]);
  const badges = useMemo(() => { const list=[]; if(uniqueBars>=1)list.push('First Night Out'); if(uniqueBars>=3)list.push('Bar Hopper'); if(totalVisits>=10)list.push('Regular'); if(currentStreak>=3)list.push('Three-Night Streak'); if(uniqueBars>=msuBars.length)list.push('Visited Every Bar'); return list; }, [uniqueBars,totalVisits,currentStreak]);
  const formatVisitTime = (millis) => { if(!millis)return 'Recently'; const date=new Date(millis); if(date.toDateString()===new Date().toDateString()) return `Today At ${date.toLocaleTimeString([], {hour:'numeric',minute:'2-digit'})}`; return date.toLocaleDateString([], {month:'short',day:'numeric'}); };
  const handleDeleteAccount = async () => { const confirmed=window.confirm('Are you sure you want to permanently delete your account? This cannot be undone.'); if(!confirmed)return; setDeleting(true); setDeleteError(''); try{await deleteAccount();}catch(error){setDeleteError(error?.code==='auth/requires-recent-login'?'For security, log out and log back in first, then try deleting your account again.':'Could not delete account right now. Please try again.');}finally{setDeleting(false);} };

  return <Layout><section className="home-stack">
    <div style={{...cardStyle,padding:'24px'}}><div style={{display:'flex',gap:'16px',alignItems:'center',marginBottom:'18px'}}><UserAvatar username={profile?.displayUsername||profile?.username||'user'} avatarId={profile?.avatarId||''} size="xl"/><div><h1 style={{margin:0,fontSize:'2rem',fontWeight:900}}>Profile</h1><p style={{margin:'6px 0 0',color:'rgba(235,255,240,0.72)'}}>Your Account, Nights Out, Badges, And App Info</p></div></div><div style={{display:'grid',gap:'12px'}}><div style={{padding:'16px 18px',borderRadius:'20px',border:'1px solid rgba(120, 255, 170, 0.12)',background:'rgba(255,255,255,0.02)',fontWeight:700,fontSize:'1.05rem'}}>@{profile?.displayUsername||profile?.username||'user'}</div><button className="ghost-button" onClick={logOut}>Log Out</button></div></div>
    <div style={{...cardStyle,display:'grid',gap:'18px'}}><div><h2 style={{margin:0,fontSize:'1.4rem',fontWeight:900}}>Personal Stats</h2><p style={{marginTop:'8px',color:'rgba(235,255,240,0.72)',fontSize:'0.98rem'}}>Your Lifetime Bar History And Nightlife Stats.</p></div><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(130px, 1fr))',gap:'12px'}}><div style={statStyle}><div>Total Check-Ins</div><div style={{fontSize:'1.6rem',fontWeight:900}}>{totalVisits}</div></div><div style={statStyle}><div>Unique Bars</div><div style={{fontSize:'1.6rem',fontWeight:900}}>{uniqueBars}</div></div><div style={statStyle}><div>Current Streak</div><div style={{fontSize:'1.6rem',fontWeight:900}}>{currentStreak}</div></div><div style={statStyle}><div>Top Spot</div><div style={{fontWeight:900}}>{topSpot}</div></div></div></div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))',gap:'14px'}}><div style={cardStyle}><h2 style={{marginTop:0}}>Nights Out</h2><div style={{display:'grid',gap:'10px'}}><div style={statStyle}><strong>{nightsThisWeek}</strong><div>Nights This Week</div></div><div style={statStyle}><strong>{nightsThisMonth}</strong><div>Nights This Month</div></div></div></div><div style={cardStyle}><h2 style={{marginTop:0}}>Badges</h2>{badges.length?<div style={{display:'flex',gap:'10px',flexWrap:'wrap'}}>{badges.map((badge)=><span key={badge} style={{padding:'10px 14px',borderRadius:'999px',background:'rgba(83, 240, 124, 0.12)',border:'1px solid rgba(83, 240, 124, 0.18)',fontWeight:800}}>{badge}</span>)}</div>:<div>No Badges Yet. Go Out More And Start Stacking Them.</div>}</div></div>
    <div style={{...cardStyle,display:'grid',gap:'14px'}}><div><h2 style={{margin:0,fontSize:'1.15rem',fontWeight:900}}>Your Bar History</h2><p>Every Bar You’ve Checked Into, In One Place.</p></div>{barHistory.length?<div style={{display:'grid',gap:'10px'}}>{barHistory.map((entry)=><div key={entry.barId} style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:'12px',...statStyle,padding:'14px 16px'}}><div><div style={{fontWeight:800}}>{entry.name}</div><div>{entry.neighborhood}</div></div><div style={{textAlign:'right'}}><div style={{fontWeight:900}}>{entry.visits} Visits</div><div>{formatVisitTime(entry.lastVisitedAt)}</div></div></div>)}</div>:<div style={statStyle}>No Bar History Yet. Check Into A Bar To Start Building Your Stats.</div>}</div>
    <div style={{...cardStyle,padding:'24px'}}><h2 style={{marginTop:0}}>How It Works</h2><p>Here Shows Real-Time Crowd Signals Around Campus Using Check-Ins, Vibe Updates, Cover Reports, Line Updates, Invites, And Comments From Users.</p></div>
    <div style={{...cardStyle,padding:'24px'}}><h2 style={{marginTop:0}}>Community Rules</h2><p>No Harassment, Hate Speech, Threats, Targeted Abuse, Or Illegal Activity. Keep Updates Honest And Don’t Spam Fake Reports.</p></div>
    <div style={{...cardStyle,padding:'24px'}}><h2 style={{marginTop:0}}>Support</h2><p style={{color:'rgba(235,255,240,0.75)',lineHeight:1.6,marginBottom:'14px'}}>Need help with Here?</p><a href="https://here-support.vercel.app/" target="_blank" rel="noopener noreferrer" style={{display:'inline-flex',alignItems:'center',justifyContent:'center',minHeight:'48px',padding:'0 18px',borderRadius:'16px',background:'rgba(83, 240, 124, 0.12)',border:'1px solid rgba(83, 240, 124, 0.2)',color:'#78ffaa',fontWeight:900,textDecoration:'none'}}>Click Here For Help</a></div>
    <div style={{background:'rgba(25, 7, 7, 0.88)',border:'1px solid rgba(255, 120, 120, 0.16)',borderRadius:'28px',padding:'24px'}}><h2 style={{marginTop:0}}>Delete Account</h2><p>You Can Permanently Delete Your Account And Remove Your Access To The App Here.</p>{deleteError?<div>{deleteError}</div>:null}<button onClick={handleDeleteAccount} disabled={deleting} style={{width:'100%',padding:'16px 18px',borderRadius:'18px',border:'none',background:deleting?'#744':'#ff5c5c',color:'#fff',fontWeight:900,fontSize:'1rem'}}>{deleting?'Deleting Account...':'Delete Account Permanently'}</button></div>
  </section></Layout>;
}

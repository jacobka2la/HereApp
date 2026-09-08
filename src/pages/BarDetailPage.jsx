import { Link, useParams } from 'react-router-dom';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import Layout from '../components/Layout';
import CommentItem from '../components/CommentItem';
import { getBarMeta } from '../lib/bars';
import { getDemoBarData } from '../lib/screenshotDemo';

export default function BarDetailPage() {
  const { barId } = useParams();
  const bar = getBarMeta(barId);
  const demo = getDemoBarData(barId);

  if (!bar) return <Layout><div className="empty-state">That bar wasn't found.</div></Layout>;

  return (
    <Layout>
      <div className="bar-detail-page">
        <Link to="/" className="bar-back-button" aria-label="Back to bars">← Back To Bars</Link>
        <section className="detail-grid">
          <div className="detail-primary">
            <div className="detail-card detail-hero">
              {bar.image ? <div className="detail-hero-image-wrap"><img className="detail-hero-image" src={bar.image} alt={`${bar.name} bar`} /><div className="detail-hero-image-shade" /></div> : null}
              <div className="detail-hero-content">
                <span className="hero-kicker">{bar.neighborhood}</span>
                <h1>{bar.name}</h1>
                <p className="detail-vibe">{demo.vibe}</p>
                <div className="hero-stats hero-stats-tight detail-stat-grid">
                  <div><span className="label">Checked In</span><strong>{demo.count}</strong></div>
                  <div><span className="label">Cover</span><strong>{demo.cover} · {demo.coverReports} Reports</strong></div>
                  <div><span className="label">Line</span><strong>{demo.line} · {demo.lineReports} Reports</strong></div>
                  <div><span className="label">Your Status</span><strong>Not Checked In</strong></div>
                </div>
                <div className="action-stack detail-checkin-actions"><button className="primary-button detail-checkin-button" type="button">I’m Here</button></div>
                <p className="detail-checkin-note">Check in when you arrive so the live crowd count stays accurate.</p>
              </div>
            </div>

            <div className="detail-card detail-section-card">
              <div className="section-headline small-gap"><div><h2>Live Snapshot</h2><p>What people are reporting right now.</p></div></div>
              <div className="hero-stats hero-stats-tight detail-stat-grid">
                <div><span className="label">Crowd</span><strong>{demo.count} Here</strong></div>
                <div><span className="label">Vibe</span><strong>{demo.vibe}</strong></div>
                <div><span className="label">Most Reported Cover</span><strong>{demo.cover}</strong></div>
                <div><span className="label">Most Reported Line</span><strong>{demo.line}</strong></div>
              </div>
            </div>

            <div className="detail-card detail-section-card">
              <div className="section-headline small-gap"><div><h2>Crowd Trend</h2><p>Quick view of check-in activity over the last hour.</p></div></div>
              <div className="chart-wrap"><ResponsiveContainer width="100%" height={240}><AreaChart data={demo.trendSeries}><defs><linearGradient id="crowdFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#5BFF8A" stopOpacity={0.45} /><stop offset="100%" stopColor="#5BFF8A" stopOpacity={0} /></linearGradient></defs><XAxis dataKey="label" tick={{ fill: '#A8B6AE' }} axisLine={false} tickLine={false} /><YAxis tick={{ fill: '#A8B6AE' }} axisLine={false} tickLine={false} allowDecimals={false} /><Tooltip contentStyle={{ background: '#0E1511', border: '1px solid #213128', borderRadius: 14 }} /><Area type="monotone" dataKey="crowd" stroke="#5BFF8A" fill="url(#crowdFill)" strokeWidth={2.5} /></AreaChart></ResponsiveContainer></div>
            </div>
          </div>

          <aside className="detail-sidebar">
            <div className="detail-card detail-section-card">
              <div className="section-headline small-gap"><div><h2>Comments</h2><p>Live updates from people at {bar.name}.</p></div></div>
              <form className="comment-form" onSubmit={(event) => event.preventDefault()}><textarea placeholder="Line's moving fast, DJ is solid, cover jumped..." maxLength={180} /><button className="primary-button" type="button">Post Comment</button></form>
              <div className="comment-stack">
                {demo.comments.map((comment) => (
                  <div key={comment.id} style={{ marginBottom: '14px' }}>
                    <CommentItem comment={comment} reactionCounts={comment.reactions} activeReaction={null} onReact={() => {}} />
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </section>
      </div>
    </Layout>
  );
}

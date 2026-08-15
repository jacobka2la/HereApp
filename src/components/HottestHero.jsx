import { Link } from 'react-router-dom';

export default function HottestHero({ bar, stats }) {
  if (!bar || !stats || stats.count === 0) {
    return (
      <section className="hero-card hero-card-empty">
        <span className="hero-kicker">Hottest Bar Right Now</span>
        <h1>No Activity Right Now</h1>
        <p>Nobody’s Checked In Yet. Be The First One Out.</p>
      </section>
    );
  }

  return (
    <section className="hero-card">
      <div className="hero-copy">
        <span className="hero-kicker">Hottest Bar Right Now</span>
        <h1>{bar.name}</h1>
        <p>Live Activity Based On Check-Ins, Vibe Updates, Line Reports, And Reactions Tonight.</p>
      </div>

      <div className="hero-stats">
        <div>
          <span className="label">Current Vibe</span>
          <strong>{stats.currentVibeLabel}</strong>
        </div>
        <div>
          <span className="label">Here Now</span>
          <strong>{stats.count}</strong>
        </div>
        <div>
          <span className="label">Cover</span>
          <strong>{stats.coverSummary ? stats.coverSummary.label : 'No Reports Yet'}</strong>
        </div>
        <div>
          <span className="label">Line</span>
          <strong>{stats.lineSummary ? stats.lineSummary.label : 'No Reports Yet'}</strong>
        </div>
      </div>

      <Link className="primary-button hero-button" to={`/bar/${bar.id}`}>
        View Live Details
      </Link>
    </section>
  );
}

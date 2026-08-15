import { Link } from 'react-router-dom';

export default function HottestHero({ bar, stats }) {
  if (!bar || !stats || stats.count === 0) {
    return (
      <section className="hero-card">
        <div>
          <span className="hero-kicker">🔥 Hottest Bar Right Now 🔥</span>
          <h1>No activity right now</h1>
          <p>
            Nobody’s checked in yet. Be the first one out 👀
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="hero-card">
      <div>
        <span className="hero-kicker">🔥 Hottest Bar Right Now 🔥</span>
        <h1>{bar.name}</h1>
        <p>
          Live score is based on check-ins, fresh vibe updates, line reports, and comment reactions happening tonight.
        </p>
      </div>

      <div className="hero-stats">
        <div>
          <span className="label">Current vibe</span>
          <strong>{stats.currentVibeLabel}</strong>
        </div>
        <div>
          <span className="label">Here now</span>
          <strong>{stats.count}</strong>
        </div>
        <div>
          <span className="label">Cover</span>
          <strong>{stats.coverSummary ? stats.coverSummary.label : 'No reports yet'}</strong>
        </div>
        <div>
          <span className="label">Line</span>
          <strong>{stats.lineSummary ? stats.lineSummary.label : 'No reports yet'}</strong>
        </div>
      </div>

      <Link className="primary-button" to={`/bar/${bar.id}`}>
        Open bar details
      </Link>
    </section>
  );
}
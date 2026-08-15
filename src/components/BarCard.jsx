import { Link } from 'react-router-dom';

export default function BarCard({ bar, stats, isHottest }) {
  return (
    <Link to={`/bar/${bar.id}`} className={`bar-card ${isHottest ? 'bar-card-hot' : ''}`}>
      {bar.image ? (
        <div className="bar-card-photo-wrap">
          <img className="bar-card-photo" src={bar.image} alt={`${bar.name} bar`} loading="lazy" />
          <div className="bar-card-photo-shade" />
          <div className="bar-card-photo-title">
            <h3>{bar.name}</h3>
            <p>{bar.neighborhood}</p>
          </div>
          {isHottest ? <span className="status-pill hottest-pill bar-card-photo-pill">Hottest</span> : null}
        </div>
      ) : (
        <div className="bar-card-topline">
          <div>
            <h3>{bar.name}</h3>
            <p>{bar.neighborhood}</p>
          </div>
          {isHottest ? <span className="status-pill hottest-pill">Hottest</span> : null}
        </div>
      )}

      <div className="bar-card-grid">
        <div>
          <span className="label">Vibe</span>
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
    </Link>
  );
}

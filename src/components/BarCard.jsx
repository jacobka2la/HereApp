import { Link } from 'react-router-dom';

export default function BarCard({ bar, stats, isHottest, isCurrentBar = false }) {
  return (
    <Link to={`/bar/${bar.id}`} className={`bar-card ${isHottest ? 'bar-card-hot' : ''} ${isCurrentBar ? 'bar-card-current' : ''}`}>
      {bar.image ? (
        <div className="bar-card-photo-wrap">
          <img className="bar-card-photo" src={bar.image} alt={`${bar.name} bar`} loading="lazy" />
          <div className="bar-card-photo-shade" />
          <div className="bar-card-photo-title">
            <h3>{bar.name}</h3>
            <p>{bar.neighborhood}</p>
          </div>

          {isCurrentBar ? (
            <span
              className="status-pill current-bar-pill"
              style={{
                position: 'absolute',
                top: '12px',
                left: '12px',
                zIndex: 4,
                whiteSpace: 'nowrap',
                padding: '8px 11px',
                borderRadius: '10px',
                background: 'rgba(7, 25, 13, 0.94)',
                border: '1px solid rgba(91,255,138,.5)',
                color: '#7dff9f',
                fontSize: '.78rem',
                fontWeight: 900,
              }}
            >
              ✓ You’re Here
            </span>
          ) : null}

          {isHottest ? (
            <span
              className="status-pill hottest-pill"
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                zIndex: 4,
                whiteSpace: 'nowrap',
              }}
            >
              Hottest
            </span>
          ) : null}
        </div>
      ) : (
        <div className="bar-card-topline">
          <div>
            <h3>{bar.name}</h3>
            <p>{bar.neighborhood}</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {isCurrentBar ? <span className="status-pill current-bar-pill">✓ You’re Here</span> : null}
            {isHottest ? <span className="status-pill hottest-pill">Hottest</span> : null}
          </div>
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

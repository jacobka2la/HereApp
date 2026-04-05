import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function BarCard({ bar, stats, isHottest }) {
  return (
    <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.16 }}>
      <Link to={`/bar/${bar.id}`} className={`bar-card ${isHottest ? 'bar-card-hot' : ''}`}>
        <div className="bar-card-topline">
          <div>
            <h3>{bar.name}</h3>
            <p>{bar.neighborhood}</p>
          </div>
          {isHottest ? <span className="status-pill hottest-pill">Hottest</span> : null}
        </div>

        <div className="bar-card-grid">
          <div>
            <span className="label">Vibe</span>
            <strong>{stats.currentVibeLabel}</strong>
          </div>
          <div>
            <span className="label">Here now</span>
            <strong>{stats.count}</strong>
          </div>
          <div>
            <span className="label">Cover</span>
            <strong>{stats.coverSummary ? `${stats.coverSummary.label}` : 'No reports yet'}</strong>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

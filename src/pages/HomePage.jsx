import { useEffect, useMemo, useState } from 'react';
import Layout from '../components/Layout';
import SearchBar from '../components/SearchBar';
import HottestHero from '../components/HottestHero';
import BarCard from '../components/BarCard';
import { msuBars } from '../lib/bars';
import { buildBarStats } from '../lib/scoring';
import { subscribeToTodayCollection } from '../lib/firebaseHelpers';

function summarizeLineReportsForBar(barId, lineReports) {
  const relevant = lineReports.filter((item) => item.barId === barId);

  if (!relevant.length) return null;

  const counts = relevant.reduce((acc, item) => {
    acc[item.lineLength] = (acc[item.lineLength] || 0) + 1;
    return acc;
  }, {});

  const winner = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];

  return winner
    ? {
        label: winner[0],
        count: winner[1],
      }
    : null;
}

export default function HomePage() {
  const [search, setSearch] = useState('');
  const [checkins, setCheckins] = useState([]);
  const [vibes, setVibes] = useState([]);
  const [coverReports, setCoverReports] = useState([]);
  const [comments, setComments] = useState([]);
  const [reactions, setReactions] = useState([]);
  const [lineReports, setLineReports] = useState([]);

  useEffect(() => {
    const unsubscribers = [
      subscribeToTodayCollection('checkins', setCheckins),
      subscribeToTodayCollection('vibes', setVibes),
      subscribeToTodayCollection('coverReports', setCoverReports),
      subscribeToTodayCollection('comments', setComments),
      subscribeToTodayCollection('commentReactions', setReactions),
      subscribeToTodayCollection('lineReports', setLineReports),
    ];

    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, []);

  const statsByBar = useMemo(() => {
    return Object.fromEntries(
      msuBars.map((bar) => {
        const baseStats = buildBarStats(
          bar.id,
          checkins,
          vibes,
          coverReports,
          comments,
          reactions
        );

        return [
          bar.id,
          {
            ...baseStats,
            lineSummary: summarizeLineReportsForBar(bar.id, lineReports),
          },
        ];
      })
    );
  }, [checkins, vibes, coverReports, comments, reactions, lineReports]);

  const hottestBar = useMemo(() => {
    return [...msuBars].sort(
      (a, b) => statsByBar[b.id].hottestScore - statsByBar[a.id].hottestScore
    )[0];
  }, [statsByBar]);

  const filteredBars = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return msuBars.filter((bar) => !needle || bar.name.toLowerCase().includes(needle));
  }, [search]);

  return (
    <Layout>
      <section className="home-stack">
        <div style={{ marginBottom: '12px' }}>
          <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 900 }}>
            Tonight at MSU
          </h1>
          <p style={{ marginTop: '8px', color: 'rgba(235,255,240,0.72)' }}>
            Live bar traffic, line reports, crowd signals, and check-ins.
          </p>
        </div>

        <HottestHero
          bar={hottestBar}
          stats={hottestBar ? statsByBar[hottestBar.id] : null}
        />

        <div className="section-headline">
          <div>
            <h2>All bars</h2>
            <p>Search for a spot and open live details.</p>
          </div>
          <SearchBar value={search} onChange={setSearch} />
        </div>

        <div className="bar-list">
          {filteredBars.map((bar) => (
            <BarCard
              key={bar.id}
              bar={bar}
              stats={statsByBar[bar.id]}
              isHottest={hottestBar?.id === bar.id}
            />
          ))}
        </div>
      </section>
    </Layout>
  );
}
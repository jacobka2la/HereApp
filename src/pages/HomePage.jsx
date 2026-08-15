import { useEffect, useMemo, useState } from 'react';
import Layout from '../components/Layout';
import SearchBar from '../components/SearchBar';
import HottestHero from '../components/HottestHero';
import BarCard from '../components/BarCard';
import { useAuth } from '../context/AuthContext';
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
  return winner ? { label: winner[0], count: winner[1] } : null;
}

export default function HomePage() {
  const { firebaseUser } = useAuth();
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

  const statsByBar = useMemo(() => Object.fromEntries(
    msuBars.map((bar) => {
      const baseStats = buildBarStats(
        bar.id,
        checkins,
        vibes,
        coverReports,
        comments,
        reactions
      );
      return [bar.id, {
        ...baseStats,
        lineSummary: summarizeLineReportsForBar(bar.id, lineReports),
      }];
    })
  ), [checkins, vibes, coverReports, comments, reactions, lineReports]);

  const currentBarId = useMemo(() => {
    return checkins.find((item) => item.uid === firebaseUser?.uid && item.active)?.barId || '';
  }, [checkins, firebaseUser?.uid]);

  const hottestBar = useMemo(() => {
    const activeBars = msuBars.filter((bar) => (statsByBar[bar.id]?.count || 0) > 0);
    if (!activeBars.length) return null;

    return [...activeBars].sort(
      (a, b) => statsByBar[b.id].hottestScore - statsByBar[a.id].hottestScore
    )[0];
  }, [statsByBar]);

  const filteredBars = useMemo(() => {
    const needle = search.trim().toLowerCase();

    return msuBars
      .filter((bar) => !needle || bar.name.toLowerCase().includes(needle))
      .sort((a, b) => {
        if (a.id === currentBarId && b.id !== currentBarId) return -1;
        if (b.id === currentBarId && a.id !== currentBarId) return 1;

        const aStats = statsByBar[a.id] || {};
        const bStats = statsByBar[b.id] || {};
        const aCount = aStats.count || 0;
        const bCount = bStats.count || 0;

        if (bCount !== aCount) return bCount - aCount;

        const aScore = aStats.hottestScore || 0;
        const bScore = bStats.hottestScore || 0;
        if (bScore !== aScore) return bScore - aScore;

        return a.name.localeCompare(b.name);
      });
  }, [search, currentBarId, statsByBar]);

  return (
    <Layout>
      <section className="home-stack">
        <header className="home-intro">
          <span className="eyebrow">East Lansing Tonight</span>
          <h1>Tonight At MSU</h1>
          <p>Live Bar Traffic, Line Reports, Crowd Signals, And Check-Ins.</p>
        </header>

        <HottestHero
          bar={hottestBar}
          stats={hottestBar ? statsByBar[hottestBar.id] : null}
        />

        <section className="bars-section">
          <div className="section-headline section-headline-centered">
            <div>
              <h2>All Bars</h2>
              <p>Most Active Right Now.</p>
            </div>
          </div>

          <SearchBar value={search} onChange={setSearch} />

          <div className="bar-list">
            {filteredBars.map((bar) => (
              <BarCard
                key={bar.id}
                bar={bar}
                stats={statsByBar[bar.id]}
                isHottest={Boolean(hottestBar && hottestBar.id === bar.id)}
                isCurrentBar={currentBarId === bar.id}
              />
            ))}
          </div>
        </section>
      </section>
    </Layout>
  );
}

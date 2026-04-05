import { useEffect, useMemo, useState } from 'react';
import Layout from '../components/Layout';
import SearchBar from '../components/SearchBar';
import HottestHero from '../components/HottestHero';
import BarCard from '../components/BarCard';
import { msuBars } from '../lib/bars';
import { buildBarStats } from '../lib/scoring';
import { seedBarsIfNeeded, subscribeToTodayCollection } from '../lib/firebaseHelpers';

export default function HomePage() {
  const [search, setSearch] = useState('');
  const [checkins, setCheckins] = useState([]);
  const [vibes, setVibes] = useState([]);
  const [coverReports, setCoverReports] = useState([]);
  const [comments, setComments] = useState([]);
  const [reactions, setReactions] = useState([]);

  useEffect(() => {
    seedBarsIfNeeded();

    const unsubscribers = [
      subscribeToTodayCollection('checkins', setCheckins),
      subscribeToTodayCollection('vibes', setVibes),
      subscribeToTodayCollection('coverReports', setCoverReports),
      subscribeToTodayCollection('comments', setComments),
      subscribeToTodayCollection('commentReactions', setReactions),
    ];

    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, []);

  const statsByBar = useMemo(() => {
    return Object.fromEntries(
      msuBars.map((bar) => [
        bar.id,
        buildBarStats(bar.id, checkins, vibes, coverReports, comments, reactions),
      ])
    );
  }, [checkins, vibes, coverReports, comments, reactions]);

  const hottestBar = useMemo(() => {
    return [...msuBars].sort((a, b) => statsByBar[b.id].hottestScore - statsByBar[a.id].hottestScore)[0];
  }, [statsByBar]);

  const filteredBars = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return msuBars.filter((bar) => !needle || bar.name.toLowerCase().includes(needle));
  }, [search]);

  return (
    <Layout>
      <section className="home-stack">
        <HottestHero bar={hottestBar} stats={hottestBar ? statsByBar[hottestBar.id] : null} />

        <div className="section-headline">
          <div>
            <h2>Tonight at MSU</h2>
            <p>Real-time crowd signals, cover ranges, comments, and anonymous check-ins.</p>
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

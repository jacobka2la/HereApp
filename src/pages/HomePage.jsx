import { useMemo, useState } from 'react';
import Layout from '../components/Layout';
import SearchBar from '../components/SearchBar';
import HottestHero from '../components/HottestHero';
import BarCard from '../components/BarCard';
import { msuBars } from '../lib/bars';
import { getDemoBarData } from '../lib/screenshotDemo';

export default function HomePage() {
  const [search, setSearch] = useState('');

  const statsByBar = useMemo(() => Object.fromEntries(
    msuBars.map((bar) => {
      const demo = getDemoBarData(bar.id);
      return [bar.id, {
        count: demo.count,
        currentVibeLabel: demo.vibe,
        coverSummary: { label: demo.cover, count: demo.coverReports },
        lineSummary: { label: demo.line, count: demo.lineReports },
        hottestScore: demo.count,
        trendSeries: demo.trendSeries,
        comments: demo.comments,
        reactions: [],
      }];
    })
  ), []);

  const hottestBar = useMemo(() => [...msuBars].sort(
    (a, b) => (statsByBar[b.id]?.count || 0) - (statsByBar[a.id]?.count || 0)
  )[0] || null, [statsByBar]);

  const filteredBars = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return msuBars
      .filter((bar) => !needle || bar.name.toLowerCase().includes(needle))
      .sort((a, b) => (statsByBar[b.id]?.count || 0) - (statsByBar[a.id]?.count || 0));
  }, [search, statsByBar]);

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
                isCurrentBar={false}
              />
            ))}
          </div>
        </section>
      </section>
    </Layout>
  );
}

import { coverRanges, vibeOptions } from './bars';

const vibeMap = Object.fromEntries(vibeOptions.map((item) => [item.value, item]));

export function buildBarStats(barId, allCheckins, allVibes, allCoverReports, allComments, allReactions) {
  const checkins = allCheckins.filter((item) => item.barId === barId && item.active);
  const vibes = allVibes.filter((item) => item.barId === barId);
  const coverReports = allCoverReports.filter((item) => item.barId === barId);
  const comments = allComments.filter((item) => item.barId === barId);
  const commentIds = new Set(comments.map((item) => item.id));
  const reactions = allReactions.filter((item) => commentIds.has(item.commentId));

  const vibeBuckets = { dead: 0, chill: 0, busy: 0, packed: 0 };
  let weightedVibeScore = 0;
  let totalVibeWeight = 0;

  vibes.forEach((vote) => {
    vibeBuckets[vote.vibe] += 1;
    const ageMinutes = Math.max(0, (Date.now() - vote.createdAtMillis) / 60000);
    const weight = Math.max(0.35, 1.7 - ageMinutes / 30);
    weightedVibeScore += (vibeMap[vote.vibe]?.points ?? 0) * weight;
    totalVibeWeight += weight;
  });

  const averageVibe = totalVibeWeight ? weightedVibeScore / totalVibeWeight : 0;
  let currentVibe = 'dead';
  if (averageVibe >= 2.4) currentVibe = 'packed';
  else if (averageVibe >= 1.45) currentVibe = 'busy';
  else if (averageVibe >= 0.6) currentVibe = 'chill';

  const coverCounts = Object.fromEntries(coverRanges.map((range) => [range, 0]));
  coverReports.forEach((report) => {
    coverCounts[report.range] += 1;
  });

  const coverSummaryEntry = Object.entries(coverCounts).sort((a, b) => b[1] - a[1])[0];
  const coverSummary = coverSummaryEntry?.[1]
    ? { label: coverSummaryEntry[0], count: coverSummaryEntry[1] }
    : null;

  const hottestScore =
    checkins.length * 3 +
    reactions.length * 1.6 +
    comments.length * 0.9 +
    vibeBuckets.packed * 2.2 +
    vibeBuckets.busy * 1.2 +
    vibeBuckets.chill * 0.4;

  const trendSeries = Array.from({ length: 6 }, (_, slot) => {
    const windowEnd = Date.now() - slot * 10 * 60 * 1000;
    const windowStart = windowEnd - 10 * 60 * 1000;
    const count = checkins.filter((item) => item.checkedInAtMillis >= windowStart && item.checkedInAtMillis < windowEnd).length;
    return {
      label: `${50 - slot * 10}m`,
      crowd: count,
    };
  }).reverse();

  return {
    barId,
    count: checkins.length,
    vibeBuckets,
    currentVibe,
    currentVibeLabel: vibeMap[currentVibe]?.label ?? 'Dead 😴',
    coverSummary,
    hottestScore,
    comments,
    reactions,
    trendSeries,
  };
}

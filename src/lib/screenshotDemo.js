export const SCREENSHOT_DEMO = true;

export const demoFriends = [
  { id: 'demo-1', uid: 'demo-1', username: 'maddie2', avatarId: 'avatar-2', activeCheckin: { barId: 'harpers', checkedInAtMillis: Date.now() - 6 * 60 * 1000, active: true }, barName: "Harper's" },
  { id: 'demo-2', uid: 'demo-2', username: 'ryan17', avatarId: 'avatar-3', activeCheckin: { barId: 'ricks', checkedInAtMillis: Date.now() - 11 * 60 * 1000, active: true }, barName: "Rick's" },
  { id: 'demo-3', uid: 'demo-3', username: 'sophia8', avatarId: 'avatar-4', activeCheckin: { barId: 'dublin', checkedInAtMillis: Date.now() - 18 * 60 * 1000, active: true }, barName: 'Dublin Square' },
  { id: 'demo-4', uid: 'demo-4', username: 'jake24', avatarId: 'avatar-1', activeCheckin: null, barName: '' },
  { id: 'demo-5', uid: 'demo-5', username: 'liv9', avatarId: 'avatar-2', activeCheckin: { barId: 'landshark', checkedInAtMillis: Date.now() - 3 * 60 * 1000, active: true }, barName: 'Landshark' },
  { id: 'demo-6', uid: 'demo-6', username: 'noah31', avatarId: 'avatar-3', activeCheckin: null, barName: '' },
  { id: 'demo-7', uid: 'demo-7', username: 'ava12', avatarId: 'avatar-4', activeCheckin: { barId: 'tin-can', checkedInAtMillis: Date.now() - 27 * 60 * 1000, active: true }, barName: 'Tin Can' },
  { id: 'demo-8', uid: 'demo-8', username: 'cole6', avatarId: 'avatar-1', activeCheckin: { barId: 'crunchys', checkedInAtMillis: Date.now() - 14 * 60 * 1000, active: true }, barName: "Crunchy's" },
];

export const demoRequests = [
  { id: 'req-1', uid: 'req-1', username: 'emily4', avatarId: 'avatar-4' },
  { id: 'req-2', uid: 'req-2', username: 'mason22', avatarId: 'avatar-3' },
  { id: 'req-3', uid: 'req-3', username: 'grace7', avatarId: 'avatar-2' },
];

export const demoStats = {
  totalVisits: 47,
  uniqueBars: 8,
  currentStreak: 6,
  nightsThisWeek: 4,
  nightsThisMonth: 11,
  topSpot: "Harper's",
  badges: ['First Night Out', 'Bar Hopper', 'Regular', 'Three-Night Streak'],
  barHistory: [
    { barId: 'harpers', name: "Harper's", neighborhood: 'East Lansing', visits: 12, lastVisitedAt: Date.now() - 45 * 60 * 1000 },
    { barId: 'ricks', name: "Rick's", neighborhood: 'East Lansing', visits: 9, lastVisitedAt: Date.now() - 2 * 24 * 60 * 60 * 1000 },
    { barId: 'landshark', name: 'Landshark', neighborhood: 'East Lansing', visits: 7, lastVisitedAt: Date.now() - 4 * 24 * 60 * 60 * 1000 },
    { barId: 'dublin', name: 'Dublin Square', neighborhood: 'East Lansing', visits: 6, lastVisitedAt: Date.now() - 6 * 24 * 60 * 60 * 1000 },
    { barId: 'tin-can', name: 'Tin Can', neighborhood: 'East Lansing', visits: 5, lastVisitedAt: Date.now() - 9 * 24 * 60 * 60 * 1000 },
    { barId: 'crunchys', name: "Crunchy's", neighborhood: 'East Lansing', visits: 4, lastVisitedAt: Date.now() - 13 * 24 * 60 * 60 * 1000 },
    { barId: 'fieldhouse', name: 'FieldHouse', neighborhood: 'East Lansing', visits: 2, lastVisitedAt: Date.now() - 18 * 24 * 60 * 60 * 1000 },
    { barId: 'louhas', name: 'Lou & Harry’s', neighborhood: 'East Lansing', visits: 2, lastVisitedAt: Date.now() - 23 * 24 * 60 * 60 * 1000 },
  ],
};

const baseComments = [
  { username: 'maddie2', avatarId: 'avatar-2', text: 'Line moved way faster than it looked. Inside is packed.', minutesAgo: 4, reactions: { '🔥': 12, '👀': 4, '🍻': 8 } },
  { username: 'ryan17', avatarId: 'avatar-3', text: 'DJ is actually cooking tonight.', minutesAgo: 8, reactions: { '🔥': 17, '👀': 2, '🍻': 11 } },
  { username: 'sophia8', avatarId: 'avatar-4', text: 'Cover was $10 when we got here.', minutesAgo: 13, reactions: { '🔥': 5, '👀': 9, '🍻': 3 } },
  { username: 'cole6', avatarId: 'avatar-1', text: 'Main floor is full but the back has room.', minutesAgo: 19, reactions: { '🔥': 4, '👀': 6, '🍻': 7 } },
];

const barOverrides = {
  harpers: { count: 84, vibe: 'Packed & Loud', cover: '$10', coverReports: 19, line: 'Long line', lineReports: 16, trend: [28, 35, 47, 58, 66, 77, 84] },
  ricks: { count: 72, vibe: 'Packed & Loud', cover: '$10–15', coverReports: 15, line: 'Long line', lineReports: 13, trend: [21, 29, 38, 49, 57, 65, 72] },
  dublin: { count: 51, vibe: 'Busy', cover: '$5–10', coverReports: 11, line: 'Short line', lineReports: 9, trend: [18, 22, 28, 34, 41, 47, 51] },
  landshark: { count: 63, vibe: 'Busy', cover: '$5', coverReports: 14, line: 'Short line', lineReports: 12, trend: [25, 31, 37, 44, 50, 58, 63] },
  'tin-can': { count: 39, vibe: 'Good Crowd', cover: 'No cover', coverReports: 8, line: 'No line', lineReports: 7, trend: [14, 18, 22, 28, 31, 35, 39] },
  crunchys: { count: 46, vibe: 'Good Crowd', cover: '$5', coverReports: 9, line: 'Short line', lineReports: 8, trend: [12, 19, 23, 29, 34, 40, 46] },
  fieldhouse: { count: 34, vibe: 'Chill', cover: 'No cover', coverReports: 6, line: 'No line', lineReports: 5, trend: [9, 13, 17, 21, 26, 30, 34] },
  louhas: { count: 29, vibe: 'Chill', cover: 'No cover', coverReports: 5, line: 'No line', lineReports: 4, trend: [8, 10, 14, 18, 22, 25, 29] },
};

export function getDemoBarData(barId) {
  const data = barOverrides[barId] || { count: 42, vibe: 'Busy', cover: '$5–10', coverReports: 8, line: 'Short line', lineReports: 7, trend: [12, 17, 21, 27, 31, 36, 42] };
  const labels = ['60m', '50m', '40m', '30m', '20m', '10m', 'Now'];
  const comments = baseComments.map((comment, index) => ({
    id: `${barId}-comment-${index + 1}`,
    uid: `${barId}-demo-user-${index + 1}`,
    username: comment.username,
    avatarId: comment.avatarId,
    text: comment.text,
    createdAtMillis: Date.now() - comment.minutesAgo * 60 * 1000,
    reactions: comment.reactions,
  }));
  return {
    ...data,
    trendSeries: data.trend.map((crowd, index) => ({ label: labels[index], crowd })),
    comments,
  };
}

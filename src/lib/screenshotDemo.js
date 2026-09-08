export const SCREENSHOT_DEMO = true;

export const demoFriends = [
  { id: 'demo-1', uid: 'demo-1', username: 'maddie2', avatarId: 'avatar-2', activeCheckin: { barId: 'harpers', checkedInAtMillis: Date.now() - 6 * 60 * 1000, active: true }, barName: "Harper's" },
  { id: 'demo-2', uid: 'demo-2', username: 'ryan17', avatarId: 'avatar-3', activeCheckin: { barId: 'ricks', checkedInAtMillis: Date.now() - 11 * 60 * 1000, active: true }, barName: "Rick's" },
  { id: 'demo-3', uid: 'demo-3', username: 'sophia8', avatarId: 'avatar-4', activeCheckin: { barId: 'dublin-square', checkedInAtMillis: Date.now() - 18 * 60 * 1000, active: true }, barName: 'Dublin Square' },
  { id: 'demo-4', uid: 'demo-4', username: 'jake24', avatarId: 'avatar-1', activeCheckin: null, barName: '' },
  { id: 'demo-5', uid: 'demo-5', username: 'liv9', avatarId: 'avatar-2', activeCheckin: { barId: 'landshark', checkedInAtMillis: Date.now() - 3 * 60 * 1000, active: true }, barName: 'LandShark' },
  { id: 'demo-6', uid: 'demo-6', username: 'noah31', avatarId: 'avatar-3', activeCheckin: { barId: 'lou-and-harrys', checkedInAtMillis: Date.now() - 21 * 60 * 1000, active: true }, barName: "Lou and Harry's" },
  { id: 'demo-7', uid: 'demo-7', username: 'ava12', avatarId: 'avatar-4', activeCheckin: null, barName: '' },
  { id: 'demo-8', uid: 'demo-8', username: 'cole6', avatarId: 'avatar-1', activeCheckin: null, barName: '' },
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
    { barId: 'landshark', name: 'LandShark', neighborhood: 'East Lansing', visits: 7, lastVisitedAt: Date.now() - 4 * 24 * 60 * 60 * 1000 },
    { barId: 'dublin-square', name: 'Dublin Square', neighborhood: 'East Lansing', visits: 6, lastVisitedAt: Date.now() - 6 * 24 * 60 * 60 * 1000 },
    { barId: 'lou-and-harrys', name: "Lou and Harry's", neighborhood: 'East Lansing', visits: 5, lastVisitedAt: Date.now() - 9 * 24 * 60 * 60 * 1000 },
    { barId: 'fieldhouse', name: 'FieldHouse', neighborhood: 'East Lansing', visits: 4, lastVisitedAt: Date.now() - 13 * 24 * 60 * 60 * 1000 },
    { barId: 'mash', name: 'Mash', neighborhood: 'East Lansing', visits: 2, lastVisitedAt: Date.now() - 18 * 24 * 60 * 60 * 1000 },
    { barId: 'the-riv', name: 'The Riv', neighborhood: 'East Lansing', visits: 2, lastVisitedAt: Date.now() - 23 * 24 * 60 * 60 * 1000 },
  ],
};

const featuredComments = {
  harpers: [
    { username: 'maddie2', avatarId: 'avatar-2', text: 'Line is long but moving pretty quick.', minutesAgo: 3, reactions: { '🔥': 18, '👀': 7, '🍻': 12 } },
    { username: 'ryan17', avatarId: 'avatar-3', text: 'Main floor is absolutely packed rn.', minutesAgo: 7, reactions: { '🔥': 24, '👀': 9, '🍻': 16 } },
    { username: 'sophia8', avatarId: 'avatar-4', text: 'Cover was $11 when we walked in.', minutesAgo: 11, reactions: { '🔥': 7, '👀': 14, '🍻': 5 } },
    { username: 'cole6', avatarId: 'avatar-1', text: 'DJ is actually unreal tonight.', minutesAgo: 17, reactions: { '🔥': 22, '👀': 3, '🍻': 15 } },
  ],
  ricks: [
    { username: 'ryan17', avatarId: 'avatar-3', text: 'Upstairs is slammed. Downstairs has a little room.', minutesAgo: 4, reactions: { '🔥': 20, '👀': 8, '🍻': 13 } },
    { username: 'maddie2', avatarId: 'avatar-2', text: 'Line wrapped past the entrance but moving.', minutesAgo: 9, reactions: { '🔥': 11, '👀': 16, '🍻': 6 } },
    { username: 'liv9', avatarId: 'avatar-2', text: 'Cover is $10 right now.', minutesAgo: 14, reactions: { '🔥': 4, '👀': 12, '🍻': 3 } },
    { username: 'jake24', avatarId: 'avatar-1', text: 'Music is way better than last weekend.', minutesAgo: 19, reactions: { '🔥': 15, '👀': 2, '🍻': 10 } },
  ],
  landshark: [
    { username: 'liv9', avatarId: 'avatar-2', text: 'Busy but you can still move around.', minutesAgo: 2, reactions: { '🔥': 14, '👀': 4, '🍻': 12 } },
    { username: 'ava12', avatarId: 'avatar-4', text: 'Short line right now.', minutesAgo: 6, reactions: { '🔥': 8, '👀': 10, '🍻': 5 } },
    { username: 'cole6', avatarId: 'avatar-1', text: 'No issues getting drinks at the bar.', minutesAgo: 12, reactions: { '🔥': 9, '👀': 3, '🍻': 14 } },
    { username: 'sophia8', avatarId: 'avatar-4', text: 'Crowd picked up fast in the last 20 mins.', minutesAgo: 18, reactions: { '🔥': 13, '👀': 7, '🍻': 8 } },
  ],
  'dublin-square': [
    { username: 'sophia8', avatarId: 'avatar-4', text: 'Good crowd but not shoulder to shoulder.', minutesAgo: 5, reactions: { '🔥': 10, '👀': 4, '🍻': 11 } },
    { username: 'mason22', avatarId: 'avatar-3', text: 'Line is short right now.', minutesAgo: 8, reactions: { '🔥': 6, '👀': 9, '🍻': 4 } },
    { username: 'grace7', avatarId: 'avatar-2', text: 'Cover was $6 for us.', minutesAgo: 13, reactions: { '🔥': 3, '👀': 11, '🍻': 5 } },
    { username: 'ryan17', avatarId: 'avatar-3', text: 'DJ has this place moving tonight.', minutesAgo: 20, reactions: { '🔥': 16, '👀': 2, '🍻': 12 } },
  ],
  'lou-and-harrys': [
    { username: 'noah31', avatarId: 'avatar-3', text: 'Pretty chill right now but filling up.', minutesAgo: 4, reactions: { '🔥': 7, '👀': 6, '🍻': 9 } },
    { username: 'maddie2', avatarId: 'avatar-2', text: 'No line when we came in.', minutesAgo: 9, reactions: { '🔥': 5, '👀': 8, '🍻': 6 } },
    { username: 'cole6', avatarId: 'avatar-1', text: 'No cover at the moment.', minutesAgo: 14, reactions: { '🔥': 2, '👀': 10, '🍻': 5 } },
    { username: 'liv9', avatarId: 'avatar-2', text: 'Good spot if you want something less packed.', minutesAgo: 21, reactions: { '🔥': 8, '👀': 4, '🍻': 10 } },
  ],
};

const barOverrides = {
  harpers: { count: 84, vibe: 'Packed 🔥', cover: '$11–15', coverReports: 19, line: 'Long line', lineReports: 16, trend: [28, 35, 47, 58, 66, 77, 84] },
  ricks: { count: 72, vibe: 'Packed 🔥', cover: '$6–10', coverReports: 15, line: 'Long line', lineReports: 13, trend: [21, 29, 38, 49, 57, 65, 72] },
  landshark: { count: 63, vibe: 'Busy 👀', cover: '$1–5', coverReports: 14, line: 'Short line', lineReports: 12, trend: [25, 31, 37, 44, 50, 58, 63] },
  'dublin-square': { count: 51, vibe: 'Busy 👀', cover: '$6–10', coverReports: 11, line: 'Short line', lineReports: 9, trend: [18, 22, 28, 34, 41, 47, 51] },
  'lou-and-harrys': { count: 36, vibe: 'Chill 🙂', cover: 'Free', coverReports: 8, line: 'No line', lineReports: 7, trend: [12, 16, 20, 24, 28, 32, 36] },
};

export function getDemoBarData(barId) {
  const data = barOverrides[barId] || { count: 42, vibe: 'Busy 👀', cover: '$6–10', coverReports: 8, line: 'Short line', lineReports: 7, trend: [12, 17, 21, 27, 31, 36, 42] };
  const labels = ['60m', '50m', '40m', '30m', '20m', '10m', 'Now'];
  const sourceComments = featuredComments[barId] || featuredComments.harpers;
  const comments = sourceComments.map((comment, index) => ({
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

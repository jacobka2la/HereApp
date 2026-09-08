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

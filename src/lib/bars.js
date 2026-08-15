export const vibeOptions = [
  { value: 'dead', label: 'Dead 😴', points: 0 },
  { value: 'chill', label: 'Chill 🙂', points: 1 },
  { value: 'busy', label: 'Busy 👀', points: 2 },
  { value: 'packed', label: 'Packed 🔥', points: 3 },
];

export const coverRanges = ['Free', '$1–5', '$6–10', '$11–15', '$16–20', '$21+'];

export const reactionOptions = ['🔥', '👀', '🍻'];

export const msuBars = [
  { id: 'ricks', name: "Rick's", neighborhood: 'East Lansing', image: '/bar-images/ricks.jpeg' },
  { id: 'the-riv', name: 'The Riv', neighborhood: 'East Lansing', image: '/bar-images/the-riv.jpg' },
  { id: 'harpers', name: "Harper's", neighborhood: 'East Lansing', image: '/bar-images/harpers.jpeg' },
  { id: 'fieldhouse', name: 'FieldHouse', neighborhood: 'East Lansing', image: '/bar-images/fieldhouse.webp' },
  { id: 'lou-and-harrys', name: "Lou and Harry's", neighborhood: 'East Lansing', image: '/bar-images/lou-and-harrys.jpeg' },
  { id: 'mash', name: 'Mash', neighborhood: 'East Lansing', image: '/bar-images/mash.webp' },
  { id: 'landshark', name: 'LandShark', neighborhood: 'East Lansing', image: '/bar-images/landshark.jpeg' },
  { id: 'pt-omalley', name: "P.T. O'Malley's", neighborhood: 'East Lansing', image: '/bar-images/pt-omalleys.jpeg' },
  { id: 'dublin-square', name: 'Dublin Square', neighborhood: 'East Lansing', image: '/bar-images/dublin-square.webp' },
  { id: 'grewal-hall', name: 'Grewal Hall', neighborhood: 'East Lansing', image: '/bar-images/grewal-hall.webp' },
  { id: 'the-green-door', name: 'The Green Door', neighborhood: 'East Lansing', image: '/bar-images/the-green-door.jpeg' },
];

export function getBarMeta(barId) {
  return msuBars.find((bar) => bar.id === barId);
}

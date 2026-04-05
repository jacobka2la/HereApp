export const vibeOptions = [
  { value: 'dead', label: 'Dead 😴', points: 0 },
  { value: 'chill', label: 'Chill 🙂', points: 1 },
  { value: 'busy', label: 'Busy 👀', points: 2 },
  { value: 'packed', label: 'Packed 🔥', points: 3 },
];

export const coverRanges = ['Free', '$1–5', '$6–10', '$11–15', '$16–20', '$21+'];

export const reactionOptions = ['🔥', '👀', '🍻'];

export const msuBars = [
  { id: 'ricks', name: "Rick's", neighborhood: 'East Lansing' },
  { id: 'the-riv', name: 'The Riv', neighborhood: 'East Lansing' },
  { id: 'harpers', name: "Harper's", neighborhood: 'East Lansing' },
  { id: 'fieldhouse', name: 'FieldHouse', neighborhood: 'East Lansing' },
  { id: 'lou-and-harrys', name: "Lou and Harry's", neighborhood: 'East Lansing' },
  { id: 'mash', name: 'Mash', neighborhood: 'East Lansing' },
  { id: 'landshark', name: 'LandShark', neighborhood: 'East Lansing' },
  { id: 'pt-omalley', name: "P.T. O'Malley's", neighborhood: 'East Lansing' },
  { id: 'dublin-square', name: 'Dublin Square', neighborhood: 'East Lansing' },
  { id: 'grewal-hall', name: 'Grewal Hall', neighborhood: 'East Lansing' },
  { id: 'pizza-house', name: 'Pizza House', neighborhood: 'East Lansing' },
  { id: 'the-green-door', name: 'The Green Door', neighborhood: 'East Lansing' },
];

export function getBarMeta(barId) {
  return msuBars.find((bar) => bar.id === barId);
}

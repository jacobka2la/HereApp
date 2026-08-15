export const avatars = [
  { id: 'avatar-1', skin: '#f1b07f', hair: '#7a3b16', drink: '#e53935', drinkType: 'cup' },
  { id: 'avatar-2', skin: '#7a4327', hair: '#17110f', drink: '#a76324', drinkType: 'rocks' },
  { id: 'avatar-3', skin: '#efb17f', hair: '#e0ad61', drink: '#ead68c', drinkType: 'wine' },
  { id: 'avatar-4', skin: '#8b4b2d', hair: '#161012', drink: '#f36f8d', drinkType: 'straw' },
];

export function getAvatarById(id) {
  return avatars.find((avatar) => avatar.id === id) || avatars[0];
}

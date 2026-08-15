export const avatars = [
  { id: 'avatar-1', image: '/avatars/avatar-1.jpg', alt: 'Avatar option 1' },
  { id: 'avatar-2', image: '/avatars/avatar-2.jpg', alt: 'Avatar option 2' },
  { id: 'avatar-3', image: '/avatars/avatar-3.jpg', alt: 'Avatar option 3' },
  { id: 'avatar-4', image: '/avatars/avatar-4.jpg', alt: 'Avatar option 4' },
];

export function getAvatarById(id) {
  return avatars.find((avatar) => avatar.id === id) || null;
}

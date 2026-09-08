export const avatars = [
  { id: 'avatar-1', image: '/avatars/avatar-1.jpg', alt: 'Avatar option 1' },
  { id: 'avatar-2', image: '/avatars/avatar-2.jpg', alt: 'Avatar option 2' },
  { id: 'avatar-3', image: '/avatars/avatar-3.jpg', alt: 'Avatar option 3' },
  { id: 'avatar-4', image: '/avatars/avatar-4.jpg', alt: 'Avatar option 4' },
  { id: 'avatar-5', image: '/avatars/avatar-5.jpg', alt: 'Avatar option 5' },
  { id: 'avatar-6', image: '/avatars/avatar-6.jpg', alt: 'Avatar option 6' },
  { id: 'avatar-7', image: '/avatars/avatar-7.jpg', alt: 'Avatar option 7' },
  { id: 'avatar-8', image: '/avatars/avatar-8.jpg', alt: 'Avatar option 8' },
  { id: 'avatar-9', image: '/avatars/avatar-9.jpg', alt: 'Avatar option 9' },
  { id: 'avatar-10', image: '/avatars/avatar-10.jpg', alt: 'Avatar option 10' },
  { id: 'avatar-11', image: '/avatars/avatar-11.jpg', alt: 'Avatar option 11' },
  { id: 'avatar-12', image: '/avatars/avatar-12.jpg', alt: 'Avatar option 12' },
];

export function getAvatarById(id) {
  return avatars.find((avatar) => avatar.id === id) || null;
}

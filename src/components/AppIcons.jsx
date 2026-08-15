function IconBase({ children, size = 20, className = '' }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function BarsIcon(props) {
  return <IconBase {...props}><path d="M4 20V10"/><path d="M10 20V4"/><path d="M16 20v-7"/><path d="M22 20H2"/></IconBase>;
}

export function FriendsIcon(props) {
  return <IconBase {...props}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></IconBase>;
}

export function ProfileIcon(props) {
  return <IconBase {...props}><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></IconBase>;
}

export function SearchIcon(props) {
  return <IconBase {...props}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/></IconBase>;
}

export function ArrowLeftIcon(props) {
  return <IconBase {...props}><path d="m15 18-6-6 6-6"/></IconBase>;
}

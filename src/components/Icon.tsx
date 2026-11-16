import type { ReactNode } from 'react'

export type IconName =
  | 'home' | 'score' | 'pots' | 'nights' | 'stats' | 'arsenal' | 'patterns' | 'profile'
  | 'signin' | 'close' | 'back' | 'check' | 'target' | 'sync'

// Line icons on a 24x24 grid. They take their colour from the text colour.
const SHAPES: Record<IconName, ReactNode> = {
  home: <><path d="M3 11.5 12 4l9 7.5" /><path d="M5.5 10v10h13V10" /></>,
  // six pins racked in a triangle
  score: <>
    <circle cx="12" cy="19" r="1.9" /><circle cx="8.5" cy="13" r="1.9" /><circle cx="15.5" cy="13" r="1.9" />
    <circle cx="5" cy="7" r="1.9" /><circle cx="12" cy="7" r="1.9" /><circle cx="19" cy="7" r="1.9" />
  </>,
  // a bingo board
  pots: <><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M4 9.33h16M4 14.67h16M9.33 4v16M14.67 4v16" /></>,
  nights: <><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M4 10h16M8 3v4M16 3v4" /></>,
  stats: <path d="M5 20V11M12 20V4M19 20v-6" />,
  // a ball with three holes
  arsenal: <>
    <circle cx="12" cy="12" r="9" />
    <circle cx="10" cy="8" r="0.9" /><circle cx="14" cy="8.6" r="0.9" /><circle cx="11.2" cy="12" r="0.9" />
  </>,
  // an oil drop
  patterns: <path d="M12 3c3 4 6 7.2 6 11a6 6 0 0 1-12 0c0-3.8 3-7 6-11z" />,
  profile: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" /></>,
  signin: <><path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" /><path d="M10 16l4-4-4-4M14 12H4" /></>,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  back: <path d="M15 5l-7 7 7 7" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  target: <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3" /></>,
  // two arrows chasing each other
  sync: <><path d="M20 12a8 8 0 0 0-14-5.3L4 9" /><path d="M4 4v5h5" /><path d="M4 12a8 8 0 0 0 14 5.3l2-2.3" /><path d="M20 20v-5h-5" /></>,
}

export function Icon({ name, className = 'h-5 w-5' }: { name: IconName; className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
    >
      {SHAPES[name]}
    </svg>
  )
}

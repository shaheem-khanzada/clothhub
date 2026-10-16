import type { ReactNode } from 'react';

/*
 * The app's icon set (apps/mobile/assets/icons), as inline SVG on a 24×24 grid.
 * Outline icons are stroked with currentColor; "fill" icons are solid.
 */

const outlineIcons = {
  chevronLeft: <path d="M15 5l-7 7 7 7" />,
  chevronRight: <path d="M9 5l7 7-7 7" />,
  close: (
    <>
      <path d="M6.5 6.5l11 11" />
      <path d="M17.5 6.5l-11 11" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M20 20l-4.2-4.2" />
    </>
  ),
  sort: (
    <>
      <path d="M7 4v16" />
      <path d="M3.5 7.5L7 4l3.5 3.5" />
      <path d="M17 20V4" />
      <path d="M13.5 16.5L17 20l3.5-3.5" />
    </>
  ),
  filter: (
    <>
      <path d="M4 7h10" />
      <path d="M18 7h2" />
      <circle cx="16" cy="7" r="2" />
      <path d="M4 17h2" />
      <path d="M10 17h10" />
      <circle cx="8" cy="17" r="2" />
    </>
  ),
  heart: <path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20z" />,
  swipeUp: (
    <>
      <path d="M12 20V5" />
      <path d="M6.5 10.5L12 5l5.5 5.5" />
    </>
  ),
  swipeHorizontal: (
    <>
      <path d="M3.5 12h17" />
      <path d="M7.5 8l-4 4 4 4" />
      <path d="M16.5 8l4 4-4 4" />
    </>
  ),
  details: (
    <>
      <rect x="4" y="12" width="16" height="8" rx="2" />
      <path d="M12 9V3.5" />
      <path d="M9 6.5l3-3 3 3" />
    </>
  ),
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  arrowRight: (
    <>
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </>
  ),
} satisfies Record<string, ReactNode>;

const fillIcons = {
  heartFill: (
    <path d="M12 21.2c-.3 0-.6-.1-.9-.3C8.2 18.9 2 14.5 2 9.1 2 6 4.4 3.6 7.4 3.6c1.9 0 3.6 1 4.6 2.5 1-1.5 2.7-2.5 4.6-2.5 3 0 5.4 2.4 5.4 5.5 0 5.4-6.2 9.8-9.1 11.8-.3.2-.6.3-.9.3z" />
  ),
  shareFill: (
    <>
      <path d="M7 9h3v5a2 2 0 0 0 4 0V9h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2z" />
      <path d="M12 2.4l4.3 4.3-1.4 1.4L13 6.2V14h-2V6.2L9.1 8.1 7.7 6.7z" />
    </>
  ),
  openFill: (
    <path
      fillRule="evenodd"
      d="M6.5 3h11A3.5 3.5 0 0 1 21 6.5v11a3.5 3.5 0 0 1-3.5 3.5h-11A3.5 3.5 0 0 1 3 17.5v-11A3.5 3.5 0 0 1 6.5 3zM10 7.5v2h3.1l-5.3 5.3 1.4 1.4 5.3-5.3V14h2V7.5z"
    />
  ),
  // Horizontal, like the reel's SF Symbol "ellipsis".
  ellipsis: (
    <>
      <circle cx="5.5" cy="12" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="18.5" cy="12" r="1.6" />
    </>
  ),
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof outlineIcons | keyof typeof fillIcons;

type IconProps = {
  name: IconName;
  size?: number;
  /** Outline icons only. */
  strokeWidth?: number;
  className?: string;
};

/** Decorative: icons sit next to text or inside a labelled control. */
export function Icon({ name, size = 24, strokeWidth = 1.8, className }: IconProps) {
  const isFill = name in fillIcons;

  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      {...(isFill
        ? { fill: 'currentColor' }
        : {
            fill: 'none',
            stroke: 'currentColor',
            strokeWidth,
            strokeLinecap: 'round' as const,
            strokeLinejoin: 'round' as const,
          })}
    >
      {isFill
        ? fillIcons[name as keyof typeof fillIcons]
        : outlineIcons[name as keyof typeof outlineIcons]}
    </svg>
  );
}

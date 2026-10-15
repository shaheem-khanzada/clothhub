/*
 * The ClothHub mark: a clothes hanger whose hook is a "C".
 *
 * The one description of the mark. The app draws it from here (BrandMark,
 * the launch animation), and `scripts/brand-assets.ts` renders the app
 * icon, Android icons and the native splash image from the same numbers,
 * so the launch screen and the first animated frame are pixel-identical.
 *
 * Coordinates are in the mark's own box, MARK_WIDTH × MARK_HEIGHT, measured
 * to the outside of the stroke. Each shoulder is its own path starting at
 * the neck, so light can run outwards along both.
 */

export const MARK_WIDTH = 640;
export const MARK_HEIGHT = 418;

export const STROKE_WIDTH = 56;

/** Where the hook rests on the shoulders. */
const NECK = { x: 320, y: 212 };
/** The hook's circle, sitting on the neck. */
const HOOK_RADIUS = 92;
const HOOK_CENTER = { x: NECK.x, y: NECK.y - HOOK_RADIUS };
/** The hook's open end, in degrees clockwise from 3 o'clock. */
const HOOK_END_DEGREES = -40;
/** Shoulder tips, relative to the neck. */
const TIP = { dx: 292, dy: 178 };

const hookEnd = {
  x: HOOK_CENTER.x + HOOK_RADIUS * Math.cos((HOOK_END_DEGREES * Math.PI) / 180),
  y: HOOK_CENTER.y + HOOK_RADIUS * Math.sin((HOOK_END_DEGREES * Math.PI) / 180),
};

const round = (value: number) => Math.round(value * 100) / 100;

/** From the hook's open end, over the top and round to the neck (a "C"). */
export const HOOK_PATH =
  `M${round(hookEnd.x)},${round(hookEnd.y)} ` +
  `A${HOOK_RADIUS},${HOOK_RADIUS} 0 1,0 ${NECK.x},${NECK.y}`;

type Point = { x: number; y: number };
type Cubic = [Point, Point, Point, Point];

/** Neck → shoulder tip; `side` is -1 for left, 1 for right. */
function shoulder(side: -1 | 1): Cubic {
  return [
    NECK,
    { x: NECK.x + side * 80, y: NECK.y + 26 },
    { x: NECK.x + side * (TIP.dx - 100), y: NECK.y + TIP.dy - 82 },
    { x: NECK.x + side * TIP.dx, y: NECK.y + TIP.dy },
  ];
}

const cubicPath = ([a, b, c, d]: Cubic) =>
  `M${a.x},${a.y} C${b.x},${b.y} ${c.x},${c.y} ${d.x},${d.y}`;

const LEFT_SHOULDER = shoulder(-1);
const RIGHT_SHOULDER = shoulder(1);

export const LEFT_SHOULDER_PATH = cubicPath(LEFT_SHOULDER);
export const RIGHT_SHOULDER_PATH = cubicPath(RIGHT_SHOULDER);

/** The point a hanger swings from: the top inside of the hook, where the rail would be. */
export const SWING_PIVOT = { x: HOOK_CENTER.x, y: HOOK_CENTER.y - HOOK_RADIUS };

function cubicLength([a, b, c, d]: Cubic, steps = 64): number {
  let length = 0;
  let previous = a;

  for (let i = 1; i <= steps; i += 1) {
    const t = i / steps;
    const u = 1 - t;
    const point = {
      x: u * u * u * a.x + 3 * u * u * t * b.x + 3 * u * t * t * c.x + t * t * t * d.x,
      y: u * u * u * a.y + 3 * u * u * t * b.y + 3 * u * t * t * c.y + t * t * t * d.y,
    };
    length += Math.hypot(point.x - previous.x, point.y - previous.y);
    previous = point;
  }

  return length;
}

/** Path lengths, for light that travels along the mark (dash offsets). */
export const HOOK_LENGTH = HOOK_RADIUS * (((360 - (90 - HOOK_END_DEGREES)) * Math.PI) / 180);
export const SHOULDER_LENGTH = cubicLength(LEFT_SHOULDER);

/** Champagne → rose gold: silk under warm light. Runs across the whole mark. */
export const SILK_STOPS = [
  { offset: 0, color: '#FFF6EA' },
  { offset: 0.42, color: '#EEC9AE' },
  { offset: 0.78, color: '#D99A88' },
  { offset: 1, color: '#B9706F' },
] as const;

/** The gradient's line, in mark coordinates: top-left of the hook to the right shoulder tip. */
export const SILK_LINE = { x1: 108, y1: -8, x2: 588, y2: 522 };

/** The light that runs along the hanger in the launch animation. */
export const GLINT_COLOR = '#FFFFFF';

/** The warm glow under the mark. */
export const GLOW_COLOR = '#E39A86';

/** The glow as a soft ellipse behind the mark (launch screen), fading out with no visible edge. */
export const HALO = { cx: MARK_WIDTH / 2, cy: MARK_HEIGHT * 0.56, rx: MARK_WIDTH * 0.66, ry: MARK_HEIGHT * 0.78 };
export const HALO_STOPS = [
  { offset: 0, opacity: 0.3 },
  { offset: 0.45, opacity: 0.16 },
  { offset: 0.75, opacity: 0.05 },
  { offset: 1, opacity: 0 },
] as const;

/** The page the mark sits on — the app's `ink` background. */
export const BRAND_INK = '#0B0B0C';

/**
 * The square the launch screen shows, in mark coordinates: the mark at 72%
 * of the width, centred, with room for its glow. The native splash image is
 * rendered from this box and LaunchSplash draws the same box, so the hand-
 * over from the native screen to the animated one is invisible.
 */
const SPLASH_SIZE = MARK_WIDTH / 0.72;

export const SPLASH_BOX = {
  x: -(SPLASH_SIZE - MARK_WIDTH) / 2,
  y: -(SPLASH_SIZE - MARK_HEIGHT) / 2,
  size: SPLASH_SIZE,
} as const;

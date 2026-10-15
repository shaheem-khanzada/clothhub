/**
 * Renders the app's brand images from the mark's geometry
 * (src/components/brand/logoGeometry.ts):
 *
 *   assets/images/icon.png                       iOS app icon (1024, opaque)
 *   assets/images/adaptive-icon.png              Android adaptive icon, foreground
 *   assets/images/adaptive-icon-background.png   Android adaptive icon, background
 *   assets/images/adaptive-icon-monochrome.png   Android 13+ themed icon
 *   assets/images/splash-icon.png                native launch screen (matches LaunchSplash's first frame)
 *   assets/brand/mark.svg, icon.svg              vector sources, e.g. for Icon Composer
 *
 *   npm run brand:assets -w @clothhub/mobile
 *
 * Change the mark in logoGeometry.ts, then re-run this; never edit the PNGs by hand.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import sharp from 'sharp';

import {
  BRAND_INK,
  GLOW_COLOR,
  HALO,
  HALO_STOPS,
  HOOK_PATH,
  LEFT_SHOULDER_PATH,
  MARK_HEIGHT,
  MARK_WIDTH,
  RIGHT_SHOULDER_PATH,
  SILK_LINE,
  SILK_STOPS,
  SPLASH_BOX,
  STROKE_WIDTH,
} from '../src/components/brand/logoGeometry';

const root = join(__dirname, '..');
const images = join(root, 'assets/images');
const brand = join(root, 'assets/brand');

const SIZE = 1024;
/** The hook makes the mark top-heavy; centred a little low, it looks centred. */
const OPTICAL_CENTER = SIZE / 2 + 16;
const PATHS = [HOOK_PATH, LEFT_SHOULDER_PATH, RIGHT_SHOULDER_PATH];

const silkGradient = `
  <linearGradient id="silk" gradientUnits="userSpaceOnUse"
    x1="${SILK_LINE.x1}" y1="${SILK_LINE.y1}" x2="${SILK_LINE.x2}" y2="${SILK_LINE.y2}">
    ${SILK_STOPS.map((stop) => `<stop offset="${stop.offset}" stop-color="${stop.color}"/>`).join('')}
  </linearGradient>`;

const strokes = (stroke: string, extra = '') =>
  `<g fill="none" stroke="${stroke}" stroke-width="${STROKE_WIDTH}" stroke-linecap="round" stroke-linejoin="round" ${extra}>
    ${PATHS.map((d) => `<path d="${d}"/>`).join('')}
  </g>`;

/** The mark at `width` px wide, centred on (cx, cy) of the canvas. */
function placed(content: string, width: number, cx = SIZE / 2, cy = SIZE / 2) {
  const scale = width / MARK_WIDTH;
  const x = cx - (MARK_WIDTH * scale) / 2;
  const y = cy - (MARK_HEIGHT * scale) / 2;

  return `<g transform="translate(${x} ${y}) scale(${scale})">${content}</g>`;
}

/** The mark with a soft blurred glow beneath it — for icons, where filters are free. */
const glowingMark = `
  ${strokes(GLOW_COLOR, `stroke-opacity="0.38" filter="url(#glow)"`)}
  ${strokes('url(#silk)')}`;

const glowFilter = `<filter id="glow" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="30"/></filter>`;

const background = `
  <radialGradient id="bg" cx="50%" cy="42%" r="78%">
    <stop offset="0" stop-color="#26211F"/><stop offset="0.5" stop-color="#141213"/><stop offset="1" stop-color="${BRAND_INK}"/>
  </radialGradient>`;

const svg = (body: string, defs: string, width = SIZE, height = SIZE, viewBox = `0 0 ${width} ${height}`) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${viewBox}"><defs>${defs}</defs>${body}</svg>`;

const files: { path: string; svg: string; flatten?: boolean }[] = [
  {
    path: join(images, 'icon.png'),
    // About 58% of the tile: the size Apple's own glyph icons sit at.
    svg: svg(`<rect width="${SIZE}" height="${SIZE}" fill="url(#bg)"/>${placed(glowingMark, 600, SIZE / 2, OPTICAL_CENTER)}`, background + silkGradient + glowFilter),
    flatten: true,
  },
  {
    path: join(images, 'adaptive-icon.png'),
    // Inside the 66% safe circle every launcher mask keeps.
    svg: svg(placed(glowingMark, 500, SIZE / 2, OPTICAL_CENTER), silkGradient + glowFilter),
  },
  {
    path: join(images, 'adaptive-icon-background.png'),
    svg: svg(`<rect width="${SIZE}" height="${SIZE}" fill="url(#bg)"/>`, background),
    flatten: true,
  },
  {
    path: join(images, 'adaptive-icon-monochrome.png'),
    svg: svg(placed(strokes('#FFFFFF'), 500, SIZE / 2, OPTICAL_CENTER), ''),
  },
  {
    path: join(images, 'splash-icon.png'),
    // The exact square BrandMark draws (SPLASH_BOX), so the native launch
    // screen hands over to the animated one without a visible change.
    svg: svg(splashBody(), splashDefs(), SIZE, SIZE, `${SPLASH_BOX.x} ${SPLASH_BOX.y} ${SPLASH_BOX.size} ${SPLASH_BOX.size}`),
  },
];

/** Same layers as the BrandMark component: a radial glow, then the silk strokes. */
function splashBody() {
  return `<ellipse cx="${HALO.cx}" cy="${HALO.cy}" rx="${HALO.rx}" ry="${HALO.ry}" fill="url(#halo)"/>${strokes('url(#silk)')}`;
}

function splashDefs() {
  return `${silkGradient}
    <radialGradient id="halo" cx="50%" cy="50%" r="50%">
      ${HALO_STOPS.map((stop) => `<stop offset="${stop.offset}" stop-color="${GLOW_COLOR}" stop-opacity="${stop.opacity}"/>`).join('')}
    </radialGradient>`;
}

async function main() {
  mkdirSync(brand, { recursive: true });

  for (const file of files) {
    let image = sharp(Buffer.from(file.svg));
    // App Store icons must have no alpha channel at all.
    if (file.flatten) image = image.flatten({ background: BRAND_INK }).removeAlpha();
    await image.png({ compressionLevel: 9 }).toFile(file.path);
    console.log('wrote', file.path.replace(`${root}/`, ''));
  }

  writeFileSync(join(brand, 'mark.svg'), svg(strokes('url(#silk)'), silkGradient, MARK_WIDTH, MARK_HEIGHT));
  writeFileSync(join(brand, 'icon.svg'), files[0]!.svg);
  console.log('wrote assets/brand/mark.svg, assets/brand/icon.svg');
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});

import Svg, { Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Stop } from 'react-native-svg';

import {
  GLOW_COLOR,
  HALO,
  HALO_STOPS,
  HOOK_PATH,
  LEFT_SHOULDER_PATH,
  RIGHT_SHOULDER_PATH,
  SILK_LINE,
  SILK_STOPS,
  SPLASH_BOX,
  STROKE_WIDTH,
} from './logoGeometry';

export const MARK_PATHS = [HOOK_PATH, LEFT_SHOULDER_PATH, RIGHT_SHOULDER_PATH] as const;

/** The square every brand drawing uses: the mark centred with room for its glow. */
export const BRAND_VIEWBOX = `${SPLASH_BOX.x} ${SPLASH_BOX.y} ${SPLASH_BOX.size} ${SPLASH_BOX.size}`;

type BrandMarkProps = {
  /** Width and height in points. */
  size: number;
  /** The warm glow behind the hanger. */
  glow?: boolean;
};

/**
 * The ClothHub hanger in its silk gradient — the same drawing as the app
 * icon and the native launch screen (see logoGeometry.ts).
 */
export function BrandMark({ size, glow = true }: BrandMarkProps) {
  return (
    <Svg width={size} height={size} viewBox={BRAND_VIEWBOX}>
      <Defs>
        <LinearGradient
          id="silk"
          gradientUnits="userSpaceOnUse"
          x1={SILK_LINE.x1}
          y1={SILK_LINE.y1}
          x2={SILK_LINE.x2}
          y2={SILK_LINE.y2}
        >
          {SILK_STOPS.map((stop) => (
            <Stop key={stop.offset} offset={stop.offset} stopColor={stop.color} />
          ))}
        </LinearGradient>

        <RadialGradient id="halo" cx="50%" cy="50%" r="50%">
          {HALO_STOPS.map((stop) => (
            <Stop key={stop.offset} offset={stop.offset} stopColor={GLOW_COLOR} stopOpacity={stop.opacity} />
          ))}
        </RadialGradient>
      </Defs>

      {glow ? <Ellipse cx={HALO.cx} cy={HALO.cy} rx={HALO.rx} ry={HALO.ry} fill="url(#halo)" /> : null}

      <G fill="none" stroke="url(#silk)" strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round">
        {MARK_PATHS.map((d) => (
          <Path key={d} d={d} />
        ))}
      </G>
    </Svg>
  );
}

import appConfig from '../../../app.json';
import { LAUNCH_MARK_SIZE } from './LaunchSplash';
import { HOOK_LENGTH, MARK_HEIGHT, MARK_WIDTH, SHOULDER_LENGTH, SPLASH_BOX, SWING_PIVOT } from './logoGeometry';

describe('the mark', () => {
  it('measures its paths for the light that runs along them', () => {
    // The hook is 230° of a 92-unit circle; each shoulder a little longer than its straight span.
    expect(HOOK_LENGTH).toBeCloseTo(92 * ((230 * Math.PI) / 180), 5);
    expect(SHOULDER_LENGTH).toBeGreaterThan(Math.hypot(292, 178));
    expect(SHOULDER_LENGTH).toBeLessThan(Math.hypot(292, 178) * 1.1);
  });

  it('fits the launch square with room for its glow', () => {
    expect(SPLASH_BOX.x).toBeLessThan(0);
    expect(SPLASH_BOX.y).toBeLessThan(0);
    expect(SPLASH_BOX.x + SPLASH_BOX.size).toBeGreaterThan(MARK_WIDTH);
    expect(SPLASH_BOX.y + SPLASH_BOX.size).toBeGreaterThan(MARK_HEIGHT);
  });

  it('swings from the top of the hook', () => {
    expect(SWING_PIVOT).toEqual({ x: MARK_WIDTH / 2, y: 28 });
  });
});

describe('the launch screen hand-over', () => {
  it('draws the mark at the size the native launch screen shows it', () => {
    const plugins: unknown[] = appConfig.expo.plugins;
    const splash = plugins.find((plugin) => Array.isArray(plugin) && plugin[0] === 'expo-splash-screen') as
      | [string, { imageWidth: number }]
      | undefined;

    expect(splash?.[1].imageWidth).toBe(LAUNCH_MARK_SIZE);
  });
});

import { HapticSupport, Presets, Settings } from 'react-native-pulsar';

/**
 * Every buzz in the app, named after what happened rather than what it feels
 * like — the same vocabulary NaqaD uses, so the texture of any one event can be
 * retuned here without touching a screen.
 *
 * Nothing here throws and nothing is awaited. Haptics are decoration: a phone
 * with no motor or a module that failed to load must cost the caller nothing.
 */

// Compared against `undefined` rather than tested for truth: `NO_SUPPORT` is 0.
let supportLevel: HapticSupport | undefined;

function getSupportLevel(): HapticSupport {
  if (supportLevel === undefined) {
    try {
      supportLevel = Settings.getHapticsSupportLevel();
    } catch (error) {
      console.warn('[feedback] could not read the haptics support level', error);

      supportLevel = HapticSupport.NO_SUPPORT;
    }
  }

  return supportLevel;
}

function play(preset: () => void): void {
  if (getSupportLevel() === HapticSupport.NO_SUPPORT) {
    return;
  }

  try {
    preset();
  } catch (error) {
    console.warn('[feedback] a haptic could not be played', error);
  }
}

export const feedback = {
  /** A button did something. The default for anything tappable. */
  tap: () => play(Presets.System.impactLight),

  /** A row, chip or sheet option was chosen. */
  select: () => play(Presets.System.selection),

  /** A toggle or segment moved. */
  toggle: () => play(Presets.System.impactRigid),

  /** The reel snapped to the next or previous product. */
  page: () => play(Presets.System.selection),

  /** A product was hearted — a firmer, rounder tap than a plain button. */
  like: () => play(Presets.System.impactMedium),

  /** A heart was taken back. */
  unlike: () => play(Presets.System.impactSoft),

  /** Something the user tried is not available yet. */
  unavailable: () => play(Presets.System.notificationWarning),
};

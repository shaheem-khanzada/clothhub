import { act, fireEvent, render, screen } from '@testing-library/react-native';
import * as SplashScreen from 'expo-splash-screen';

import { LAUNCH_TIMELINE, LaunchSplash, REDUCED_TIMELINE } from './LaunchSplash';

jest.mock('expo-splash-screen', () => ({
  hide: jest.fn(),
  preventAutoHideAsync: jest.fn(() => Promise.resolve()),
  setOptions: jest.fn(),
}));

// The device's Reduce Motion setting, as Reanimated reports it.
let mockReducedMotion = false;
jest.mock('react-native-reanimated', () => {
  const actual = jest.requireActual('react-native-reanimated');

  return { __esModule: true, ...actual, default: actual.default, useReducedMotion: () => mockReducedMotion };
});

const LAYOUT = { nativeEvent: { layout: { x: 0, y: 0, width: 393, height: 852 } } };

async function takeOver() {
  await act(async () => {
    fireEvent(screen.getByTestId('launch-splash'), 'layout', LAYOUT);
  });
}

async function advance(ms: number) {
  await act(async () => {
    jest.advanceTimersByTime(ms);
  });
}

describe('LaunchSplash', () => {
  beforeEach(() => {
    mockReducedMotion = false;
    jest.useFakeTimers();
    jest.mocked(SplashScreen.hide).mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('takes over from the native launch screen once it is drawn', async () => {
    await render(<LaunchSplash onFinish={jest.fn()} />);

    expect(SplashScreen.hide).not.toHaveBeenCalled();

    await takeOver();

    expect(SplashScreen.hide).toHaveBeenCalledTimes(1);
  });

  it('writes the name in after the hanger has swung', async () => {
    await render(<LaunchSplash onFinish={jest.fn()} />);
    await takeOver();

    expect(screen.queryByText('C')).not.toBeOnTheScreen();

    await advance(LAUNCH_TIMELINE.wordmark);

    expect(screen.getByText('C')).toBeOnTheScreen();
    expect(screen.getAllByText('h')).toHaveLength(1);
  });

  it('hands over to the app when it has played', async () => {
    const onFinish = jest.fn();
    await render(<LaunchSplash onFinish={onFinish} />);
    await takeOver();

    await advance(LAUNCH_TIMELINE.exit + LAUNCH_TIMELINE.exitDuration - 1);
    expect(onFinish).not.toHaveBeenCalled();

    await advance(1);
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it('skips to the app on a tap', async () => {
    const onFinish = jest.fn();
    await render(<LaunchSplash onFinish={onFinish} />);
    await takeOver();

    await act(async () => {
      fireEvent.press(screen.getByLabelText('ClothHub. Tap to skip.'));
    });
    await advance(LAUNCH_TIMELINE.exitDuration);

    expect(onFinish).toHaveBeenCalledTimes(1);

    // The scheduled exit does not run a second time.
    await advance(LAUNCH_TIMELINE.exit);
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it('keeps it short and still with Reduce Motion', async () => {
    mockReducedMotion = true;
    const onFinish = jest.fn();
    await render(<LaunchSplash onFinish={onFinish} />);
    await takeOver();

    expect(screen.getByText('C')).toBeOnTheScreen();

    await advance(REDUCED_TIMELINE.exit + REDUCED_TIMELINE.exitDuration);
    expect(onFinish).toHaveBeenCalledTimes(1);
  });
});

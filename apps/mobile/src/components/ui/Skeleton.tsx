import { LinearGradient } from 'expo-linear-gradient';

import {
  createContext,
  Fragment,
  type PropsWithChildren,
  type ReactNode,
  useContext,
  useState,
} from 'react';

import {
  type LayoutChangeEvent,
  type StyleProp,
  StyleSheet,
  type ViewProps,
  type ViewStyle,
} from 'react-native';

import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '@/hooks/useTheme';

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

const DEFAULT_DURATION = 1_200;

export type SkeletonProps = ViewProps;

export function Skeleton({
  style,
  onLayout,
  ...props
}: SkeletonProps) {
  const [width, setWidth] = useState(0);
  const progress = useSharedValue(0);
  const reducedMotion = useReducedMotion();
  const theme = useTheme();

  const handleLayout = (event: LayoutChangeEvent) => {
    const nextWidth = event.nativeEvent.layout.width;

    setWidth(nextWidth);
    onLayout?.(event);

    if (reducedMotion || nextWidth === 0) {
      return;
    }

    progress.value = 0;

    progress.value = withRepeat(
      withTiming(1, {
        duration: DEFAULT_DURATION,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      false,
    );
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: -width + progress.value * width * 2,
      },
    ],
  }));

  return (
    <Animated.View
      {...props}
      onLayout={handleLayout}
      style={[styles.skeleton, { backgroundColor: theme.skeleton }, style]}
    >
      {!reducedMotion && width > 0 ? (
        <AnimatedLinearGradient
          pointerEvents="none"
          colors={[
            'transparent',
            'rgba(255, 255, 255, 0.06)',
            'transparent',
          ]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={[
            styles.highlight,
            {
              width,
            },
            animatedStyle,
          ]}
        />
      ) : null}
    </Animated.View>
  );
}


type SkeletonContextValue = {
  loading: boolean;
};

const SkeletonContext =
  createContext<SkeletonContextValue | null>(null);

export type SkeletonGroupProps = PropsWithChildren<{
  loading?: boolean;
}>;

export function SkeletonGroup({
  loading = false,
  children,
}: SkeletonGroupProps) {
  return (
    <SkeletonContext.Provider value={{ loading }}>
      {children}
    </SkeletonContext.Provider>
  );
}

export type SkeletonContentProps = PropsWithChildren<{
  loading?: boolean;
  fallback?: ReactNode;
  style?: StyleProp<ViewStyle>;
}>;

export function SkeletonContent({
  loading: loadingProp,
  fallback,
  style,
  children,
}: SkeletonContentProps) {
  const context = useContext(SkeletonContext);

  const loading =
    loadingProp ?? context?.loading ?? false;

  if (!loading) {
    return children;
  }

  if (fallback) {
    return fallback;
  }

  return <Skeleton style={style} />;
}

export type SkeletonListProps = PropsWithChildren<{
  count?: number;
  separator?: ReactNode;
}>;

export function SkeletonList({
  count = 8,
  separator,
  children,
}: SkeletonListProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <Fragment key={index}>
          {children}

          {index < count - 1 ? separator : null}
        </Fragment>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    overflow: 'hidden',
    borderRadius: 6,
  },

  highlight: {
    ...StyleSheet.absoluteFill,
  },
});
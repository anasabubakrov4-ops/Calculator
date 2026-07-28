import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export type ButtonVariant = 'number' | 'operator' | 'function' | 'equals';

interface CalcButtonProps {
  label: string;
  variant: ButtonVariant;
  onPress: () => void;
  onLongPress?: () => void;
  size?: number;
  wide?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function CalcButton({
  label,
  variant,
  onPress,
  onLongPress,
  size = 72,
  wide = false,
}: CalcButtonProps) {
  const scale = useSharedValue(1);
  const glow = useSharedValue(0);
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (active) {
      const t = setTimeout(() => setActive(false), 280);
      return () => clearTimeout(t);
    }
  }, [active]);

  const handlePressIn = () => {
    scale.value = withSpring(0.9, { damping: 14, stiffness: 320 });
    glow.value = withTiming(1, { duration: 160, easing: Easing.out(Easing.ease) });
    setActive(true);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 12, stiffness: 220 });
    glow.value = withTiming(0, { duration: 240, easing: Easing.inOut(Easing.ease) });
  };

  const handlePress = () => {
    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glow.value, [0, 1], [0.25, 0.9]),
    transform: [{ scale: interpolate(glow.value, [0, 1], [0.85, 1.12]) }],
  }));

  const colors = VARIANT_COLORS[variant];

  const baseStyle: ViewStyle = {
    width: wide ? size * 2.3 : size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: colors.fill,
    borderColor: colors.border,
  };

  return (
    <View style={[styles.wrapper, { width: wide ? size * 2.3 : size, height: size }]}>
      <Animated.View pointerEvents="none" style={[styles.glow, { borderRadius: size / 2 }, glowStyle]}>
        <View style={[styles.glowInner, { backgroundColor: colors.glow, borderRadius: size / 2 }]} />
      </Animated.View>

      <AnimatedPressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        onLongPress={onLongPress}
        style={[styles.button, baseStyle, animatedStyle]}
      >
        <View style={[styles.glass, { borderRadius: size / 2 }]} pointerEvents="none" />
        <Text
          style={[
            styles.label,
            {
              color: colors.text,
              fontSize: variant === 'function' ? size * 0.3 : size * 0.36,
              fontFamily: colors.font,
            },
          ]}
        >
          {label}
        </Text>
        {active && <View style={[styles.ripple, { borderRadius: size / 2 }]} pointerEvents="none" />}
      </AnimatedPressable>
    </View>
  );
}

const VARIANT_COLORS: Record<
  ButtonVariant,
  { fill: string; border: string; glow: string; text: string; font: string }
> = {
  number: {
    fill: 'rgba(22, 22, 30, 0.85)',
    border: 'rgba(120, 120, 160, 0.18)',
    glow: '#4F6CFF',
    text: '#FFFFFF',
    font: 'Outfit-SemiBold',
  },
  operator: {
    fill: 'rgba(30, 28, 60, 0.7)',
    border: 'rgba(120, 110, 255, 0.4)',
    glow: '#7A5CFF',
    text: '#B4A7FF',
    font: 'Outfit-SemiBold',
  },
  function: {
    fill: 'rgba(20, 20, 26, 0.7)',
    border: 'rgba(120, 120, 140, 0.25)',
    glow: '#5A5A6A',
    text: '#9A9AB0',
    font: 'Outfit-Medium',
  },
  equals: {
    fill: 'rgba(45, 40, 110, 0.9)',
    border: 'rgba(140, 120, 255, 0.6)',
    glow: '#8E7BFF',
    text: '#FFFFFF',
    font: 'Outfit-Bold',
  },
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: '125%',
    height: '125%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowInner: {
    width: '100%',
    height: '100%',
    shadowColor: '#7A5CFF',
    shadowOpacity: 0.55,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    overflow: 'hidden',
  },
  glass: {
    position: 'absolute',
    top: 1,
    left: 1,
    right: 1,
    height: '46%',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  label: {
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  ripple: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
});

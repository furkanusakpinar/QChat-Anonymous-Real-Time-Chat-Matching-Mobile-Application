import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, Dimensions } from 'react-native';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const BUBBLES = [
  { size: 100, x: 0.1, y: 0.15, delay: 0 },
  { size: 60, x: 0.8, y: 0.25, delay: 500 },
  { size: 140, x: 0.6, y: 0.7, delay: 1000 },
  { size: 80, x: 0.2, y: 0.8, delay: 1500 },
  { size: 50, x: 0.9, y: 0.6, delay: 2000 },
  { size: 70, x: 0.4, y: 0.1, delay: 2500 },
];

const Bubble = ({ size, x, y, delay }) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(translateY, {
            toValue: -30,
            duration: 3000 + Math.random() * 2000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: 0,
            duration: 3000 + Math.random() * 2000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.bubble,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          left: x * SCREEN_W - size / 2,
          top: y * SCREEN_H - size / 2,
          opacity,
          transform: [{ translateY }],
        },
      ]}
    />
  );
};

export const BackgroundBubbles = () => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    {BUBBLES.map((b, i) => (
      <Bubble key={i} {...b} />
    ))}
  </View>
);

const styles = StyleSheet.create({
  bubble: {
    position: 'absolute',
    backgroundColor: 'rgba(108, 108, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(108, 108, 255, 0.08)',
  },
});

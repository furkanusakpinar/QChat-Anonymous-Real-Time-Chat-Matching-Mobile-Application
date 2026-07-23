import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const Toast = ({ visible, message, type = 'error', onHide }) => {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.delay(2500),
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start(() => onHide && onHide());
    }
  }, [visible]);

  if (!visible) return null;

  const config = {
    error: { bg: 'rgba(248, 113, 113, 0.9)', icon: 'alert-circle' },
    success: { bg: 'rgba(74, 222, 128, 0.9)', icon: 'checkmark-circle' },
    warning: { bg: 'rgba(251, 191, 36, 0.9)', icon: 'time' },
  };
  const c = config[type] || config.error;

  return (
    <Animated.View style={[styles.container, { opacity, backgroundColor: c.bg }]}>
      <Ionicons name={c.icon} size={18} color="#FFF" />
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    zIndex: 9999,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  text: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#FFF',
  },
});

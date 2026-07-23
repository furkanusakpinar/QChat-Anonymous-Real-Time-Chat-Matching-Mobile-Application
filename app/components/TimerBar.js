import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { formatTimer } from '../utils/helpers';
import { CHAT_CONFIG, useStore } from '../redux/useStore';

export const TimerBar = ({ elapsedSeconds }) => {
  const strings = useStore((s) => s.strings);
  const maxSeconds = CHAT_CONFIG.MAX_CHAT_SECONDS;
  const minRequired = CHAT_CONFIG.MIN_REQUIRED_SECONDS;

  const isSkipUnlocked = elapsedSeconds >= minRequired;
  const remainingTotal = Math.max(0, maxSeconds - elapsedSeconds);
  const remainingMinLock = Math.max(0, minRequired - elapsedSeconds);

  const totalProgress = Math.min(1, elapsedSeconds / maxSeconds);

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.statusRow}>
          <Ionicons
            name={isSkipUnlocked ? 'lock-open' : 'lock-closed'}
            size={13}
            color={isSkipUnlocked ? colors.accent : colors.warning}
          />
          <Text style={[styles.statusText, { color: isSkipUnlocked ? colors.accent : colors.warning }]}>
            {isSkipUnlocked
              ? strings.chat_timer_skip_active
              : strings.chat_timer_skip_locked({ time: formatTimer(remainingMinLock) })}
          </Text>
        </View>

        <View style={styles.timerBox}>
          <Text style={styles.timerText}>{formatTimer(remainingTotal)}</Text>
        </View>
      </View>

      <View style={styles.track}>
        <View style={[styles.marker, { left: `${(minRequired / maxSeconds) * 100}%` }]} />
        <View
          style={[
            styles.fill,
            {
              width: `${totalProgress * 100}%`,
              backgroundColor: isSkipUnlocked ? colors.primary : colors.primaryDark,
            },
          ]}
        />
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.metaText}>0:00</Text>
        <Text style={[styles.metaText, { color: colors.warning }]}>2:00</Text>
        <Text style={styles.metaText}>5:00</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  timerBox: {
    backgroundColor: colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  timerText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    fontFamily: 'monospace',
  },
  track: {
    height: 4,
    backgroundColor: colors.surface,
    borderRadius: 2,
    position: 'relative',
    marginVertical: 4,
  },
  fill: {
    height: '100%',
    borderRadius: 2,
  },
  marker: {
    position: 'absolute',
    top: -2,
    bottom: -2,
    width: 2,
    backgroundColor: colors.warning,
    zIndex: 2,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaText: {
    fontSize: 9,
    color: colors.textMuted,
  },
});

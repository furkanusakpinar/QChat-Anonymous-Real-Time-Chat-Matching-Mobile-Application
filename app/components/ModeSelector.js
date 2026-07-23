import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useStore } from '../redux/useStore';

export const ModeSelector = ({ selectedMode, onSelectMode, userFlag }) => {
  const strings = useStore((s) => s.strings);
  const modes = [
    {
      id: 'international',
      title: strings.welcome_feature_intl_title,
      badge: strings.chat_mode_intl,
      desc: strings.welcome_feature_intl_desc,
      icon: 'globe-outline',
    },
    {
      id: 'local',
      title: strings.welcome_feature_local_title,
      badge: strings.mode_local_badge(userFlag || 'TR'),
      desc: strings.welcome_feature_local_desc,
      icon: 'people-outline',
    },
  ];

  return (
    <View style={styles.container}>
      {modes.map((mode) => {
        const active = selectedMode === mode.id;
        return (
          <TouchableOpacity
            key={mode.id}
            activeOpacity={0.85}
            style={[styles.card, active && styles.activeCard]}
            onPress={() => onSelectMode(mode.id)}
          >
            <View style={[styles.iconBox, active && styles.activeIconBox]}>
              <Ionicons name={mode.icon} size={22} color={active ? colors.primary : colors.textMuted} />
            </View>
            <View style={styles.cardBody}>
              <View style={styles.cardTop}>
                <Text style={[styles.cardTitle, active && styles.activeText]}>{mode.title}</Text>
                <View style={[styles.badge, active && styles.activeBadge]}>
                  <Text style={[styles.badgeText, active && styles.activeBadgeText]}>{mode.badge}</Text>
                </View>
              </View>
              <Text style={styles.cardDesc}>{mode.desc}</Text>
            </View>
            <View style={[styles.radio, active && styles.activeRadio]}>
              {active && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 14,
  },
  activeCard: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(108, 108, 255, 0.06)',
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIconBox: {
    backgroundColor: 'rgba(108, 108, 255, 0.12)',
  },
  cardBody: {
    flex: 1,
    gap: 3,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  activeText: {
    color: colors.primary,
  },
  badge: {
    backgroundColor: colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  activeBadge: {
    backgroundColor: 'rgba(108, 108, 255, 0.15)',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textMuted,
  },
  activeBadgeText: {
    color: colors.primary,
  },
  cardDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeRadio: {
    borderColor: colors.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
});

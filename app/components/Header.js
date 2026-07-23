import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useStore } from '../redux/useStore';

export const Header = ({ title, showBack, onBack, rightElement }) => {
  const insets = useSafeAreaInsets();
  const strings = useStore((s) => s.strings);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <View style={styles.inner}>
        <View style={styles.left}>
          {showBack && (
            <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
              <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          )}
          <Image source={require("../../assets/QChat.png")} style={styles.logo} />
          <View>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{strings.header_subtitle}</Text>
          </View>
        </View>
        {rightElement ? <View>{rightElement}</View> : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
    paddingBottom: 12,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 50,
    height: 50,
    tintColor: '#FFF',
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.5)',
  }
});

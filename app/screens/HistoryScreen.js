import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BackgroundBubbles } from '../components/BackgroundBubbles';
import { Header } from '../components/Header';
import { getCountryByCode, getCountryName } from '../utils/countries';
import { useStore } from '../redux/useStore';
import { useTranslation } from '../utils/i18n';
import { colors } from '../theme/colors';
import { getRecentSessions } from '../utils/firebase';

export const HistoryScreen = ({ navigation }) => {
  const user = useStore((state) => state.user);
  const history = useStore((state) => state.history);
  const setHistory = useStore((state) => state.setHistory);
  const language = useStore((s) => s.language);
  const { t } = useTranslation();
  const [items, setItems] = useState(history);

  useEffect(() => {
    (async () => {
      const sessions = await getRecentSessions(user.uid, 50);
      if (sessions.length > 0) {
        setHistory(sessions);
        setItems(sessions);
      } else {
        setItems(history);
      }
    })();
  }, []);

  return (
    <SafeAreaView key={language} style={styles.container} edges={['left', 'right', 'bottom']}>
      <BackgroundBubbles />
      <Header title={t('history.title')} showBack onBack={() => navigation.goBack()} />

      {items.length === 0 ? (
        <View style={styles.emptyView}>
          <Ionicons name="chatbubble-ellipses-outline" size={44} color={colors.textMuted} />
          <Text style={styles.emptyText}>{t('history.empty')}</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const country = getCountryByCode(item.partnerCountry);
            return (
              <View style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={styles.partnerRow}>
                    <Text style={styles.flag}>{country.flag}</Text>
                    <View>
                      <Text style={styles.nickname}>{item.partnerNickname}</Text>
                      <Text style={styles.countryName}>{getCountryName(country, language)}</Text>
                    </View>
                  </View>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {item.mode === 'international' ? t('history.global') : t('history.local')}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardMeta}>
                  <View style={styles.metaItem}>
                    <Ionicons name="time-outline" size={13} color={colors.textMuted} />
                    <Text style={styles.metaText}>{t('history.duration', { duration: item.durationSeconds ? Math.floor(item.durationSeconds / 60) : '?' })}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="chatbubble-outline" size={13} color={colors.textMuted} />
                    <Text style={styles.metaText}>{t('history.messages', { count: item.messageCount || 0 })}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="lock-closed" size={11} color={colors.accent} />
                    <Text style={[styles.metaText, { color: colors.accent }]}>AES-256</Text>
                  </View>
                </View>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    padding: 20,
    gap: 10,
  },
  emptyView: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  card: {
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 14,
    padding: 14,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  partnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  flag: { fontSize: 24 },
  nickname: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  countryName: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  badge: {
    backgroundColor: colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
    paddingTop: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
});

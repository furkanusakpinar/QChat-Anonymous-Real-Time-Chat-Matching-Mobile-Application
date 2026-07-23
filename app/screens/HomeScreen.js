import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BackgroundBubbles } from '../components/BackgroundBubbles';
import { Header } from '../components/Header';
import { ModeSelector } from '../components/ModeSelector';
import { getCountryByCode, getCountryName } from '../utils/countries';
import { useStore } from '../redux/useStore';
import { useTranslation } from '../utils/i18n';
import { colors } from '../theme/colors';
import { initPresence, stopPresence, subscribeStatus, unsubscribeStatus } from '../utils/presence';
import { checkReputation } from '../utils/chat';
import { getRecentSessions } from '../utils/firebase';
import { useFocusEffect } from '@react-navigation/native';

const StatCard = ({ icon, label, value, color }) => (
  <View style={styles.statCard}>
    <Ionicons name={icon} size={16} color={color || colors.primary} />
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

export const HomeScreen = ({ navigation }) => {
  const user = useStore((state) => state.user);
  const language = useStore((s) => s.language);
  const selectedMode = useStore((state) => state.selectedMode);
  const setSelectedMode = useStore((state) => state.setSelectedMode);
  const history = useStore((state) => state.history);
  const setHistory = useStore((state) => state.setHistory);
  const [isOnline, setIsOnline] = useState(true);
  const [rep, setRep] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const { t } = useTranslation();

  const userCountry = getCountryByCode(user.country);

  const HistoryItem = ({ item }) => {
    const country = getCountryByCode(item.partnerCountry);
    const isIntl = item.mode === 'international';
    return (
      <View style={styles.historyItem}>
        <View style={styles.historyLeft}>
          <Text style={styles.historyFlag}>{country.flag}</Text>
          <View>
            <Text style={styles.historyName}>{item.partnerNickname}</Text>
            <View style={styles.historyMetaRow}>
              <Text style={styles.historyMeta}>
                {item.durationSeconds ? Math.floor(item.durationSeconds / 60) : '?'} {t('home.stat_minutes')}
              </Text>
              <View style={[styles.modeBadge, isIntl && styles.modeBadgeIntl]}>
                <Text style={styles.modeBadgeText}>{isIntl ? t('matchmaking_value_intl') : t('matchmaking_value_local')}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  };

  useEffect(() => {
    initPresence(user.uid);
    subscribeStatus(user.uid, setIsOnline);
    return () => {
      stopPresence();
      unsubscribeStatus(user.uid);
    };
  }, [user.uid]);

  useEffect(() => {
    (async () => {
      const data = await checkReputation(user.uid);
      setRep(data);
    })();
  }, []);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const sessions = await getRecentSessions(user.uid);
        setHistory(sessions);
      })();
    }, [user.uid])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const [sessions, repData] = await Promise.all([
      getRecentSessions(user.uid),
      checkReputation(user.uid),
    ]);
    setHistory(sessions);
    if (repData) setRep(repData);
    setRefreshing(false);
  }, [user.uid]);

  const totalChats = history.length;
  const totalMinutes = history.reduce((sum, h) => sum + (h.durationSeconds ? Math.floor(h.durationSeconds / 60) : 0), 0);
  const recentItems = history.slice(0, 5);

  return (
    <SafeAreaView key={language} style={styles.container} edges={['left', 'right', 'bottom']}>
      <BackgroundBubbles />
      <Header
        title={t('nav.home_title')}
        rightElement={
          <TouchableOpacity
            style={styles.profileBtn}
            onPress={() => navigation.navigate('Profile')}
            activeOpacity={0.8}
          >
            <Text style={styles.profileFlag}>{userCountry.flag}</Text>
            <View style={styles.onlineDot} />
          </TouchableOpacity>
        }
      />

      <View style={styles.body}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} progressBackgroundColor={colors.surface} colors={[colors.primary]} />}
        >
          <View style={styles.heroSection}>
            <Text style={styles.greeting}>{t('home.greeting')}</Text>
            <Text style={styles.userNickname}>{user.nickname}</Text>
            <View style={styles.statusRow}>
              <Text style={styles.statusCountry}>{userCountry.flag} {getCountryName(userCountry, language)}</Text>
              <Text style={styles.statusDivider}>|</Text>
              <View style={[styles.statusDot, isOnline && styles.statusOnline]} />
              <Text style={styles.statusText}>{isOnline ? t('common.online') : t('common.offline')}</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <StatCard icon="chatbubbles-outline" label={t('home.stat_chats')} value={totalChats} color="#6C6CFF" />
            <StatCard icon="time-outline" label={t('home.stat_minutes')} value={totalMinutes} color="#FBBF24" />
            <StatCard icon="shield-checkmark-outline" label={t('home.stat_reputation')} value={rep ? rep.reputation : 100} color="#4ADE80" />
          </View>

          <View style={styles.recentSection}>
            <Text style={styles.sectionLabel}>{t('home.recent_title')}</Text>
            {recentItems.length > 0 ? (
              recentItems.map((item) => (
                <HistoryItem key={item.id} item={item} />
              ))
            ) : (
              <View style={styles.emptyRecent}>
                <Ionicons name="chatbubble-ellipses-outline" size={20} color={colors.textMuted} />
                <Text style={styles.emptyRecentText}>{t('home.recent_empty')}</Text>
              </View>
            )}
          </View>

          <View style={styles.modeSection}>
            <Text style={styles.sectionLabel}>{t('home.mode_title')}</Text>
            <ModeSelector selectedMode={selectedMode} onSelectMode={setSelectedMode} userFlag={userCountry.flag} />
          </View>
        </ScrollView>

        <View style={styles.bottomSection}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Matchmaking')}
            activeOpacity={0.9}
            style={styles.matchBtn}
          >
            <LinearGradient
              colors={['#6C6CFF', '#5555DD']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.matchGradient}
            >
              <View style={styles.matchBtnContent}>
                <Ionicons name="sparkles" size={20} color="#FFF" />
                <Text style={styles.matchBtnText}>{t('home.match_btn')}</Text>
              </View>
              <View style={styles.matchBtnTag}>
                <Text style={styles.matchBtnTagText}>{t('home.match_badge')}</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  profileBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.surface, borderRadius: 20, borderWidth: 1,
    borderColor: colors.cardBorder, paddingHorizontal: 10, paddingVertical: 6,
  },
  profileFlag: { fontSize: 18 },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accent },
  body: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  heroSection: { marginBottom: 16 },
  greeting: { fontSize: 15, color: colors.textSecondary, fontWeight: '500' },
  userNickname: {
    fontSize: 26, fontWeight: '800', color: colors.textPrimary,
    letterSpacing: -0.3, marginTop: 1,
  },
  statusRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.textMuted },
  statusOnline: { backgroundColor: colors.accent },
  statusText: { fontSize: 12, color: colors.textSecondary, fontWeight: '500' },
  statusDivider: { fontSize: 12, color: colors.textMuted },
  statusCountry: { fontSize: 12, color: colors.textSecondary },

  statsRow: {
    flexDirection: 'row', gap: 8, marginBottom: 16,
  },
  statCard: {
    flex: 1, backgroundColor: colors.cardBg, borderWidth: 1,
    borderColor: colors.cardBorder, borderRadius: 12,
    padding: 10, alignItems: 'center', gap: 3,
  },
  statValue: { fontSize: 18, fontWeight: '800', color: colors.textPrimary },
  statLabel: { fontSize: 10, color: colors.textSecondary, fontWeight: '500' },

  recentSection: { marginBottom: 12 },
  recentHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 6,
  },


  emptyRecent: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginBottom: 12, paddingVertical: 8,
  },
  emptyRecentText: { fontSize: 13, color: colors.textMuted },

  historyItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.cardBg, borderWidth: 1, borderColor: colors.cardBorder,
    borderRadius: 12, padding: 11, marginBottom: 5,
  },
  historyLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  historyFlag: { fontSize: 20 },
  historyName: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  historyMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 1 },
  historyMeta: { fontSize: 11, color: colors.textSecondary },
  modeBadge: {
    backgroundColor: colors.surface, paddingHorizontal: 6, paddingVertical: 1,
    borderRadius: 4, borderWidth: 1, borderColor: colors.cardBorder,
  },
  modeBadgeIntl: { borderColor: 'rgba(108,108,255,0.3)', backgroundColor: 'rgba(108,108,255,0.08)' },
  modeBadgeText: { fontSize: 9, fontWeight: '600', color: colors.textMuted },

  scrollContent: { paddingTop: 16 },
  modeSection: { marginBottom: 24 },
  sectionLabel: {
    fontSize: 12, fontWeight: '600', color: colors.textMuted,
    marginBottom: 8, letterSpacing: 0.8, textTransform: 'uppercase',
  },

  bottomSection: {
    paddingTop: 8,
    paddingBottom: 12,
  },
  matchBtn: { borderRadius: 14, overflow: 'hidden' },
  matchGradient: {
    height: 54, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 20,
  },
  matchBtnContent: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  matchBtnText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  matchBtnTag: {
    backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 8,
    paddingVertical: 4, borderRadius: 6,
  },
  matchBtnTagText: { fontSize: 10, fontWeight: '700', color: '#FFF', letterSpacing: 0.5 },
});

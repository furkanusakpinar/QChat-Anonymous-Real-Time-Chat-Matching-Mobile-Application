import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BackgroundBubbles } from '../components/BackgroundBubbles';
import { colors } from '../theme/colors';
import { getTotalOnlineCount } from '../utils/firebase';
import { LANGUAGES, useTranslation } from '../utils/i18n';
import { useStore } from '../redux/useStore';
import { saveLanguageToCache } from '../utils/cache';

const Step = ({ icon, label, sub }) => (
  <View style={styles.step}>
    <View style={styles.stepIconBox}>
      <Ionicons name={icon} size={22} color={colors.primary} />
    </View>
    <Text style={styles.stepLabel}>{label}</Text>
    <Text style={styles.stepSub}>{sub}</Text>
  </View>
);

const FeatureRow = ({ icon, title, desc }) => (
  <View style={styles.featureRow}>
    <View style={styles.featureIconBox}>
      <Ionicons name={icon} size={20} color={colors.primary} />
    </View>
    <View style={styles.featureTextBlock}>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDesc}>{desc}</Text>
    </View>
  </View>
);

export const WelcomeScreen = ({ navigation }) => {
  const [onlineCount, setOnlineCount] = useState(0);
  const language = useStore((s) => s.language);
  const setLanguage = useStore((s) => s.setLanguage);
  const { t } = useTranslation();

  useEffect(() => {
    (async () => {
      const count = await getTotalOnlineCount();
      setOnlineCount(count);
    })();
    const interval = setInterval(async () => {
      const count = await getTotalOnlineCount();
      setOnlineCount(count);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const toggleLang = () => {
    const next = language === 'tr' ? 'en' : 'tr';
    setLanguage(next);
    saveLanguageToCache(next);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']} key={language}>
      <BackgroundBubbles />
      <View style={styles.content}>
        <View style={styles.topSection}>
          <View style={styles.headerRow}>
            <View style={styles.logoRow}>
              <LinearGradient
                colors={['#6C6CFF', '#5555DD']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.logoBadge}
              >
                <Image
                  source={require('../../assets/QChat.png')}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </LinearGradient>
              <View>
                <Text style={styles.appName}>{t('welcome.app_name')}</Text>
                <Text style={styles.tagline}>{t('welcome.tagline')}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.langToggle} onPress={toggleLang}>
              <Ionicons name="language-outline" size={16} color={colors.textMuted} />
              <Text style={styles.langToggleText}>{language === 'tr' ? 'EN' : 'TR'}</Text>
            </TouchableOpacity>
          </View>
          {onlineCount > 0 && (
            <View style={styles.onlineBar}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>{t('common.online_count', { count: onlineCount })}</Text>
            </View>
          )}
        </View>

        <View style={styles.featureCard}>
          <FeatureRow
            icon="globe-outline"
            title={t('welcome.feature_intl_title')}
            desc={t('welcome.feature_intl_desc')}
          />
          <View style={styles.divider} />
          <FeatureRow
            icon="location-outline"
            title={t('welcome.feature_local_title')}
            desc={t('welcome.feature_local_desc')}
          />
          <View style={styles.divider} />
          <FeatureRow
            icon="shield-outline"
            title={t('welcome.feature_enc_title')}
            desc={t('welcome.feature_enc_desc')}
          />
          <View style={styles.divider} />
          <FeatureRow
            icon="time-outline"
            title={t('welcome.feature_timer_title')}
            desc={t('welcome.feature_timer_desc')}
          />
        </View>

        <View style={styles.stepsRow}>
          <Step icon="search-outline" label={t('welcome.step1_title')} sub={t('welcome.step1_desc')} />
          <View style={styles.stepLine} />
          <Step icon="chatbubbles-outline" label={t('welcome.step2_title')} sub={t('welcome.step2_desc')} />
          <View style={styles.stepLine} />
          <Step icon="checkmark-done-outline" label={t('welcome.step3_title')} sub={t('welcome.step3_desc')} />
        </View>

        <View style={styles.ctaSection}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Register')}
            activeOpacity={0.9}
            style={styles.primaryBtn}
          >
            <LinearGradient
              colors={['#6C6CFF', '#5555DD']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryGradient}
            >
              <Text style={styles.primaryBtnText}>{t('welcome.btn_register')}</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.9}
            style={styles.secondaryBtn}
          >
            <Text style={styles.secondaryBtnText}>{t('welcome.btn_login')}</Text>
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
    justifyContent: 'space-between',
  },
  topSection: {
    paddingTop: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  onlineBar: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: 'rgba(74, 222, 128, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.15)',
    marginTop: 12,
  },
  onlineDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.accent,
  },
  onlineText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.accent,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 50,
    height: 50,
    tintColor: '#FFF',
    top: -2
  },
  appName: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  featureCard: {
    backgroundColor: colors.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 14,
  },
  featureIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(108, 108, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTextBlock: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 12.5,
    color: colors.textSecondary,
    lineHeight: 17,
  },
  divider: {
    height: 1,
    backgroundColor: colors.cardBorder,
  },
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0,
    paddingHorizontal: 8,
  },
  step: {
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  stepIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(108, 108, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  stepSub: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  stepLine: {
    width: 24,
    height: 1,
    backgroundColor: colors.textMuted,
    marginTop: -18,
  },
  ctaSection: {
    gap: 12,
  },
  primaryBtn: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  primaryGradient: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  secondaryBtn: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  secondaryBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  langToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  langToggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
});

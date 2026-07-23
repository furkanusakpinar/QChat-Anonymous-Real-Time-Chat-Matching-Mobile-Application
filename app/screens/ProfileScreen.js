import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BackgroundBubbles } from '../components/BackgroundBubbles';
import { Header } from '../components/Header';
import { Button } from '../components/Button';
import { CountryModal } from '../components/CountryModal';
import { FirebaseSetupModal } from '../components/FirebaseSetupModal';
import { CustomAlert } from '../components/CustomAlert';
import { getCountryByCode, getCountryName } from '../utils/countries';
import { useStore } from '../redux/useStore';
import { colors } from '../theme/colors';
import { clearUserCache, saveUserToCache } from '../utils/cache';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db, deleteUserAccount } from '../utils/firebase';
import { checkReputation } from '../utils/chat';
import { saveLanguageToCache } from '../utils/cache';

const SettingRow = ({ icon, label, value, onPress }) => (
  <TouchableOpacity style={styles.settingRow} onPress={onPress} activeOpacity={onPress ? 0.7 : 1}>
    <View style={styles.settingLeft}>
      <Ionicons name={icon} size={18} color={colors.textMuted} />
      <Text style={styles.settingLabel}>{label}</Text>
    </View>
    <View style={styles.settingRight}>
      {value && <Text style={styles.settingValue}>{value}</Text>}
      {onPress && <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />}
    </View>
  </TouchableOpacity>
);

const Divider = () => <View style={styles.divider} />;

export const ProfileScreen = ({ navigation }) => {
  const user = useStore((state) => state.user);
  const setUser = useStore((state) => state.setUser);
  const language = useStore((s) => s.language);
  const setLanguage = useStore((s) => s.setLanguage);
  const strings = useStore((s) => s.strings);
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [showFirebaseSetup, setShowFirebaseSetup] = useState(false);
  const [rep, setRep] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [alert, setAlert] = useState({ visible: false, title: '', message: '', buttons: [], icon: undefined });

  const showAlert = (title, message, buttons, icon) => {
    setAlert({ visible: true, title, message, buttons, icon });
  };

  const closeAlert = () => setAlert(a => ({ ...a, visible: false }));

  const country = getCountryByCode(user.country);

  const fetchRep = useCallback(async () => {
    const data = await checkReputation(user.uid);
    setRep(data);
  }, [user.uid]);

  useEffect(() => {
    fetchRep();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchRep();
    setRefreshing(false);
  }, [fetchRep]);

  const toggleLang = () => {
    const next = language === 'tr' ? 'en' : 'tr';
    setLanguage(next);
    saveLanguageToCache(next);
  };

  const renderLangToggle = () => (
    <TouchableOpacity style={styles.langToggle} onPress={toggleLang}>
      <Ionicons name="language-outline" size={16} color={colors.textMuted} />
      <Text style={styles.langToggleText}>{language === 'tr' ? 'EN' : 'TR'}</Text>
    </TouchableOpacity>
  );

  const handleDeleteAccount = async () => {
    await deleteUserAccount(user.uid);
    clearUserCache();
    setUser({ isLoggedIn: false });
    navigation.reset({
      index: 0,
      routes: [{ name: 'Welcome' }],
    });
  };

  const handleLogout = () => {
    clearUserCache();
    setUser({ isLoggedIn: false });
    navigation.reset({
      index: 0,
      routes: [{ name: 'Welcome' }],
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <BackgroundBubbles />
      <Header title={strings.profile_title} showBack onBack={() => navigation.goBack()} rightElement={renderLangToggle()} />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} progressBackgroundColor={colors.surface} colors={[colors.primary]} />}
      >
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarFlag}>{country.flag}</Text>
          </View>
          <Text style={styles.nickname}>{user.nickname}</Text>
          <Text style={styles.countryText}>{getCountryName(country, language)} ({country.code})</Text>
          <View style={styles.ageBadge}>
            <Ionicons name="checkmark-circle" size={14} color={colors.accent} />
            <Text style={styles.ageText}>{strings.profile_age_verified({ age: user.age || 20 })}</Text>
          </View>
        </View>

        {rep && (
          <View style={styles.repCard}>
            <View style={styles.repHeader}>
              <Ionicons name="shield-checkmark" size={18} color={rep.reputation >= 70 ? colors.accent : colors.danger} />
              <Text style={styles.repTitle}>{strings.profile_rep_title}</Text>
            </View>
            <View style={styles.repBody}>
              <Text style={[styles.repScore, { color: rep.reputation >= 70 ? colors.accent : colors.danger }]}>
                {rep.reputation}
              </Text>
              <View style={styles.repDetails}>
                <Text style={styles.repLabel}>{strings.profile_rep_leaves({ left: rep.leavesLeft })}</Text>
                <Text style={styles.repLabel}>{strings.profile_rep_status} <Text style={[styles.repValue, { color: rep.blocked ? colors.danger : colors.accent }]}>
                  {rep.blocked ? strings.profile_rep_blocked : strings.profile_rep_active}
                </Text></Text>
              </View>
            </View>
          </View>
        )}

        <Text style={styles.sectionLabel}>{strings.profile_section_account}</Text>

        <View style={styles.settingsGroup}>
          <SettingRow
            icon="globe-outline"
            label={strings.profile_country_change}
            value={getCountryName(country, language)}
            onPress={() => setShowCountryModal(true)}
          />
          <Divider />
          <SettingRow
            icon="calendar-outline"
            label={strings.profile_age_info}
            value={strings.profile_age_value({ age: user.age || 20 })}
          />
          <Divider />
          <SettingRow
            icon="shield-outline"
            label={strings.profile_security}
            value={strings.profile_security_val}
          />
          <Divider />
          <SettingRow
            icon="trash-outline"
            label="Hesap Silme"
            onPress={() => {
              showAlert(
                'Hesabi Sil',
                'Hesabiniz ve tum verileriniz kalici olarak silinecek. Devam etmek istediginize emin misiniz?',
                [
                  { text: 'Vazgec', style: 'cancel', onPress: closeAlert },
                  { text: 'Sil', style: 'destructive', onPress: () => { closeAlert(); handleDeleteAccount(); } },
                ],
                'trash'
              );
            }}
          />
        </View>

        <Button
          title={strings.profile_logout}
          onPress={handleLogout}
          variant="danger"
          style={{ marginTop: 24 }}
        />
      </ScrollView>

      <CountryModal
        visible={showCountryModal}
        onClose={() => setShowCountryModal(false)}
        onSelect={async (code) => {
          const updated = { ...user, country: code };
          setUser(updated);
          saveUserToCache(updated);
          try {
            await setDoc(doc(db, 'users', user.uid), { country: code }, { merge: true });
          } catch {}
        }}
      />

      <FirebaseSetupModal
        visible={showFirebaseSetup}
        onClose={() => setShowFirebaseSetup(false)}
      />

      <CustomAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        buttons={alert.buttons}
        icon={alert.icon}
        onClose={closeAlert}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarFlag: { fontSize: 32 },
  nickname: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  countryText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  ageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.2)',
    marginTop: 12,
  },
  ageText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.accent,
  },
  repCard: {
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    gap: 10,
  },
  repHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  repTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  repBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  repScore: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -1,
  },
  repDetails: {
    gap: 4,
  },
  repLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  repValue: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: 10,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  settingsGroup: {
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 14,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 50,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  settingValue: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.cardBorder,
    marginHorizontal: 16,
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

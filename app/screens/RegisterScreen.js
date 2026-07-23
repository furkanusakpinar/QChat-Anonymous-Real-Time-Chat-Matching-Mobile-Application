import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Input } from '../components/Input';
import { CountryModal } from '../components/CountryModal';
import { getCountryByCode, getCountryName } from '../utils/countries';
import { generateRandomNickname } from '../utils/helpers';
import { useStore } from '../redux/useStore';
import { useTranslation } from '../utils/i18n';
import { colors } from '../theme/colors';
import { saveUserToFirestore, checkEmailExists, checkNicknameExists, hashPassword } from '../utils/firebase';
import { saveUserToCache } from '../utils/cache';
import { Toast } from '../components/Toast';

export const RegisterScreen = ({ navigation }) => {
  const setUser = useStore((state) => state.setUser);
  const language = useStore((s) => s.language);
  const { t } = useTranslation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState(generateRandomNickname());
  const [age, setAge] = useState('');
  const [countryCode, setCountryCode] = useState('TR');
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const selectedCountry = getCountryByCode(countryCode);

  const handleRegister = async () => {
    setErrorMessage('');
    if (!email.trim() || !password.trim() || !nickname.trim() || !age.trim()) {
      setErrorMessage(t('register.validation_fill_all'));
      return;
    }
    const parsedAge = parseInt(age, 10);
    if (isNaN(parsedAge) || parsedAge < 16) {
      setErrorMessage(t('register.validation_age'));
      return;
    }

    setLoading(true);

    const emailExists = await checkEmailExists(email.trim());
    if (emailExists) {
      setErrorMessage(t('register.error_email_taken'));
      setToastMsg(t('register.error_email_taken'));
      setLoading(false);
      return;
    }

    const nickExists = await checkNicknameExists(nickname.trim());
    if (nickExists) {
      setErrorMessage(t('register.error_nickname_taken'));
      setToastMsg(t('register.error_nickname_taken'));
      setLoading(false);
      return;
    }

    const userPayload = {
      uid: 'user_' + Date.now().toString().substring(5),
      email: email.trim(),
      nickname: nickname.trim() || generateRandomNickname(),
      passwordHash: hashPassword(password),
      country: countryCode,
      age: parsedAge,
      isLoggedIn: true,
      createdAt: new Date().toISOString(),
    };

    try {
      await saveUserToFirestore(userPayload);
    } catch (e) {
      console.warn("Firestore save user warning:", e);
    }

    setUser(userPayload);
    saveUserToCache(userPayload);
    setLoading(false);
  };

  return (
    <View style={styles.overlay}>
      <TouchableWithoutFeedback onPress={() => navigation.goBack()}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        style={styles.sheetWrapper}
      >
        <Pressable style={styles.sheetContainer} key={language}>
          <View style={styles.handleBar} />

          <View style={styles.headerRow}>
            <View>
              <Text style={styles.title}>{t('register.title')}</Text>
              <Text style={styles.subtitle}>{t('register.subtitle')}</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()} activeOpacity={0.75}>
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {errorMessage ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={16} color={colors.danger} />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={styles.countryPicker}
            onPress={() => setShowCountryModal(true)}
            activeOpacity={0.8}
          >
            <View style={styles.countryLeft}>
              <Text style={styles.countryFlag}>{selectedCountry.flag}</Text>
              <Text style={styles.countryName}>{getCountryName(selectedCountry, language)}</Text>
            </View>
            <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
          </TouchableOpacity>

          <View style={styles.nicknameRow}>
            <View style={styles.flexOne}>
              <Input
                label={t('register.nickname_label')}
                value={nickname}
                onChangeText={setNickname}
                placeholder={t('register.nickname_placeholder')}
                icon={<Ionicons name="person-outline" size={16} color={colors.textMuted} />}
              />
            </View>
            <TouchableOpacity
              style={styles.shuffleBtn}
              onPress={() => setNickname(generateRandomNickname())}
              activeOpacity={0.75}
            >
              <Ionicons name="shuffle" size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.inlineRow}>
            <View style={{ width: 100 }}>
              <Input
                label={t('register.age_label')}
                value={age}
                onChangeText={setAge}
                placeholder={t('register.age_placeholder')}
                keyboardType="number-pad"
                maxLength={3}
                icon={<Ionicons name="calendar-outline" size={16} color={colors.textMuted} />}
              />
            </View>
            <View style={styles.flexOne}>
              <Input
                label={t('register.email_label')}
                value={email}
                onChangeText={setEmail}
                placeholder={t('register.email_placeholder')}
                keyboardType="email-address"
                autoCapitalize="none"
                icon={<Ionicons name="mail-outline" size={16} color={colors.textMuted} />}
              />
            </View>
          </View>

          <Input
            label={t('register.password_label')}
            value={password}
            onChangeText={setPassword}
            placeholder={t('register.password_placeholder')}
            secureTextEntry={!showPw}
            icon={<Ionicons name="lock-closed-outline" size={16} color={colors.textMuted} />}
            rightIcon={
              <TouchableOpacity onPress={() => setShowPw(!showPw)}>
                <Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={16} color={colors.textMuted} />
              </TouchableOpacity>
            }
          />

          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#6C6CFF', '#5555DD']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradient}
            >
              <Text style={styles.submitText}>{loading ? t('register.button_loading') : t('register.button_idle')}</Text>
              {!loading && <Ionicons name="arrow-forward" size={18} color="#FFF" />}
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>{t('register.has_account')}</Text>
            <TouchableOpacity onPress={() => navigation.replace('Login')}>
              <Text style={styles.linkText}>{t('register.login_link')}</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </KeyboardAvoidingView>

      <CountryModal
        visible={showCountryModal}
        onClose={() => setShowCountryModal(false)}
        onSelect={(code) => setCountryCode(code)}
      />

      <Toast
        visible={!!toastMsg}
        message={toastMsg}
        type="error"
        onHide={() => setToastMsg('')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheetWrapper: {
    width: '100%',
  },
  sheetContainer: {
    backgroundColor: colors.bgSecondary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.textMuted,
    alignSelf: 'center',
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(248, 113, 113, 0.1)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginBottom: 10,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    color: colors.danger,
    fontWeight: '600',
  },
  countryPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
    marginBottom: 8,
  },
  countryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  countryFlag: {
    fontSize: 20,
  },
  countryName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  nicknameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  flexOne: {
    flex: 1,
  },
  shuffleBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  inlineRow: {
    flexDirection: 'row',
    gap: 8,
  },
  submitBtn: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 6,
    marginBottom: 12,
  },
  submitBtnDisabled: {
    opacity: 0.55,
  },
  gradient: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  linkText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
});

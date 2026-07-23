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
import { useStore } from '../redux/useStore';
import { colors } from '../theme/colors';
import { getUserFromFirestore, hashPassword } from '../utils/firebase';
import { saveUserToCache } from '../utils/cache';
import { Toast } from '../components/Toast';
import { useTranslation } from '../utils/i18n';

export const LoginScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const setUser = useStore((state) => state.setUser);
  const language = useStore((s) => s.language);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) return;
    setLoading(true);

    let firestoreUser = null;
    try {
      firestoreUser = await getUserFromFirestore(email.trim());
    } catch (e) {
      console.warn("Firestore fetch user warning:", e);
    }

    if (!firestoreUser) {
      setToastMsg(t('login.error_not_found'));
    } else if (firestoreUser.passwordHash !== hashPassword(password)) {
      setToastMsg(t('login.error_mismatch'));
    } else {
      const userData = { ...firestoreUser, isLoggedIn: true };
      setUser(userData);
      saveUserToCache(userData);
    }

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
        <Pressable style={styles.sheetContainer}>
          <View style={styles.handleBar} />

          <View style={styles.headerRow}>
            <View>
              <Text style={styles.title}>{t('login.title')}</Text>
              <Text style={styles.subtitle}>{t('login.subtitle')}</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()} activeOpacity={0.75}>
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <Input
              label={t('login.email_label')}
              value={email}
              onChangeText={setEmail}
              placeholder={t('login.email_placeholder')}
              keyboardType="email-address"
              autoCapitalize="none"
              icon={<Ionicons name="mail-outline" size={18} color={colors.textMuted} />}
            />
            <Input
              label={t('login.password_label')}
              value={password}
              onChangeText={setPassword}
              placeholder={t('login.password_placeholder')}
              secureTextEntry={!showPw}
              icon={<Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} />}
              rightIcon={
                <TouchableOpacity onPress={() => setShowPw(!showPw)}>
                  <Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.textMuted} />
                </TouchableOpacity>
              }
            />
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, (!email.trim() || !password.trim() || loading) && styles.submitBtnDisabled]}
            onPress={handleLogin}
            disabled={!email.trim() || !password.trim() || loading}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#6C6CFF', '#5555DD']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradient}
            >
              <Text style={styles.submitText}>{loading ? t('login.button_loading') : t('login.button_idle')}</Text>
              {!loading && <Ionicons name="arrow-forward" size={18} color="#FFF" />}
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>{t('login.no_account')}</Text>
            <TouchableOpacity onPress={() => navigation.replace('Register')}>
              <Text style={styles.linkText}>{t('login.register_link')}</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </KeyboardAvoidingView>

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
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
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
    marginBottom: 16,
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
  formGroup: {
    gap: 4,
    marginBottom: 14,
  },
  submitBtn: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 14,
  },
  submitBtnDisabled: {
    opacity: 0.5,
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

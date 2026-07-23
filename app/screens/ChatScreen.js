import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BackgroundBubbles } from '../components/BackgroundBubbles';
import { LinearGradient } from 'expo-linear-gradient';
import { MessageBubble } from '../components/MessageBubble';
import { TimerBar } from '../components/TimerBar';
import { Toast } from '../components/Toast';
import { CustomAlert } from '../components/CustomAlert';
import { getCountryByCode, getCountryName } from '../utils/countries';
import { useStore, CHAT_CONFIG } from '../redux/useStore';
import { useTranslation } from '../utils/i18n';
import { colors } from '../theme/colors';
import { formatTimer } from '../utils/helpers';
import { subscribeMessages, sendMessage, endMatch, subscribeMatchStatus, updateReputationAfterLeave, updateReputationAfterComplete } from '../utils/chat';
import { submitReport } from '../utils/firebase';

export const ChatScreen = ({ navigation }) => {
  const activeSession = useStore((state) => state.activeSession);
  const addMessageToSession = useStore((state) => state.addMessageToSession);
  const endActiveSession = useStore((state) => state.endActiveSession);
  const user = useStore((state) => state.user);
  const language = useStore((s) => s.language);
  const { t } = useTranslation();

  const [input, setInput] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [sessionEndedModal, setSessionEndedModal] = useState(false);
  const [firestoreMessages, setFirestoreMessages] = useState([]);
  const [toastMsg, setToastMsg] = useState('');
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDetail, setReportDetail] = useState('');
  const [reportOther, setReportOther] = useState(false);
  const [alert, setAlert] = useState({ visible: false, title: '', message: '', buttons: [], icon: undefined });

  const showAlert = (title, message, buttons, icon) => {
    setAlert({ visible: true, title, message, buttons, icon });
  };

  const closeAlert = () => setAlert(a => ({ ...a, visible: false }));

  const reportOptions = [
    { key: 'spam', label: 'Spam' },
    { key: 'harassment', label: 'Taciz / Rahatsizlik' },
    { key: 'fake', label: 'Saglik Hesap' },
    { key: 'underage', label: '16 Yas Alti' },
    { key: 'other', label: 'Diger' },
  ];

  const handleSendReport = async () => {
    if (!reportReason) return;
    submitReport(user.uid, activeSession.partnerUid, activeSession.matchId, reportReason, reportDetail);
    setShowReport(false);
    setReportReason('');
    setReportDetail('');
    setReportOther(false);
    showAlert('Tesekkurler', 'Şikayetiniz admin ekibimize iletilmiştir.', [{ text: 'Tamam', onPress: closeAlert }], 'checkmark-circle');
  };

  const partnerCountry = getCountryByCode(activeSession?.partnerCountry || 'US');
  const isInternational = activeSession?.mode === 'international';
  const isSkipUnlocked = elapsedSeconds >= CHAT_CONFIG.MIN_REQUIRED_SECONDS;
  const remainingLockSeconds = Math.max(0, CHAT_CONFIG.MIN_REQUIRED_SECONDS - elapsedSeconds);

  const flatListRef = useRef(null);
  const userEndedRef = useRef(false);

  useEffect(() => {
    if (!activeSession) return;
    let warned4 = false;

    const timer = setInterval(() => {
      setElapsedSeconds((prev) => {
        const next = prev + 1;
        if (next === 240 && !warned4) {
          warned4 = true;
          setToastMsg(t('chat.warning_1min'));
        }
        if (next >= CHAT_CONFIG.MAX_CHAT_SECONDS) {
          clearInterval(timer);
          updateReputationAfterComplete(user.uid);
          setSessionEndedModal(true);
          return CHAT_CONFIG.MAX_CHAT_SECONDS;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeSession]);

  useEffect(() => {
    if (!activeSession?.matchId) return;
    const unsub = subscribeMessages(activeSession.matchId, (messages) => {
      setFirestoreMessages(messages);
    });
    return () => unsub();
  }, [activeSession?.matchId]);

  useEffect(() => {
    if (!activeSession?.matchId) return;
    const unsub = subscribeMatchStatus(activeSession.matchId, (match) => {
      if (!match.active && match.endedBy !== user.uid && !userEndedRef.current) {
        showAlert(t('chat.ended_title'), t('chat.ended_desc'), [
          { text: 'Tamam', onPress: () => { closeAlert(); endActiveSession(true); navigation.replace('Home'); } }
        ], 'information-circle');
      }
    });
    return () => unsub();
  }, [activeSession?.matchId]);

  const handleSend = () => {
    if (!input.trim() || !activeSession) return;
    sendMessage(activeSession.matchId, user.uid, input.trim());
    setInput('');
  };

  const handleSkipToNextPerson = () => {
    if (!isSkipUnlocked) {
      showAlert(t('chat.skip_locked'), '', [{ text: 'Tamam', onPress: closeAlert }], 'lock-closed');
      return;
    }

    showAlert(
      t('chat.skip_confirm_title'),
      t('chat.skip_confirm_desc'),
      [
        { text: t('common.continue'), style: 'cancel', onPress: closeAlert },
        {
          text: t('common.skip'),
          style: 'destructive',
          onPress: () => {
            closeAlert();
            userEndedRef.current = true;
            updateReputationAfterLeave(user.uid, elapsedSeconds);
            endMatch(activeSession.matchId, user.uid);
            endActiveSession(true);
            navigation.replace('Matchmaking');
          },
        },
      ],
      'arrow-forward-circle'
    );
  };

  const handleLeaveSession = () => {
    showAlert(
      t('chat.leave_title'),
      t('chat.leave_desc'),
      [
        { text: t('common.cancel_alt'), style: 'cancel', onPress: closeAlert },
        {
          text: t('common.leave'),
          style: 'destructive',
          onPress: () => {
            closeAlert();
            userEndedRef.current = true;
            updateReputationAfterLeave(user.uid, elapsedSeconds);
            endMatch(activeSession.matchId, user.uid);
            endActiveSession(false);
            navigation.navigate('Home');
          },
        },
      ]
    );
  };

  const handleFinishSessionModal = () => {
    setSessionEndedModal(false);
    userEndedRef.current = true;
    endMatch(activeSession.matchId, user.uid);
    endActiveSession(false);
    navigation.navigate('Home');
  };

  if (!activeSession) {
    return (
      <SafeAreaView style={styles.container} key={language}>
        <View style={styles.emptyContainer}>
          <Text style={{ color: colors.textSecondary }}>{t('chat.no_active')}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Main')}>
            <Text style={{ color: colors.primary, marginTop: 10, fontWeight: '600' }}>{t('common.home')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']} key={language}>
      <BackgroundBubbles />
      <View style={styles.header}>
        <TouchableOpacity style={styles.leaveBtn} onPress={handleLeaveSession} activeOpacity={0.8}>
          <Ionicons name="close" size={20} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.partnerInfo}>
          <View style={styles.flagBadge}>
            <Text style={styles.partnerFlag}>{partnerCountry.flag}</Text>
          </View>
          <View>
            <Text style={styles.partnerName} numberOfLines={1} ellipsizeMode="tail">{activeSession.partnerNickname}</Text>
            <Text style={styles.partnerMeta}>
              {t('chat.partner_meta', { country: getCountryName(partnerCountry, language), mode: t(isInternational ? 'chat.mode_intl' : 'chat.mode_local') })}
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.reportBtn} onPress={() => setShowReport(true)} activeOpacity={0.7}>
            <Ionicons name="flag-outline" size={18} color={colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleSkipToNextPerson}
            style={[styles.skipBtn, isSkipUnlocked ? styles.skipActive : styles.skipLocked]}
          >
            <Ionicons
              name={isSkipUnlocked ? 'play-skip-forward' : 'lock-closed'}
              size={13}
              color={isSkipUnlocked ? '#FFF' : colors.textMuted}
            />
            <Text style={[styles.skipBtnText, { color: isSkipUnlocked ? '#FFF' : colors.textMuted }]}>
              {isSkipUnlocked ? t('common.skip') : t('chat.timer_skip_locked', { time: formatTimer(remainingLockSeconds) })}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <TimerBar elapsedSeconds={elapsedSeconds} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
      >
        <FlatList
          ref={flatListRef}
          data={firestoreMessages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MessageBubble message={item} isMe={item.senderId === user.uid} />
          )}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        <View style={styles.inputContainer}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder={t(isInternational ? 'chat.placeholder_intl' : 'chat.placeholder_local')}
            placeholderTextColor={colors.textMuted}
            style={styles.textInput}
            multiline
          />

          <TouchableOpacity
            style={[styles.sendBtn, !input.trim() && { opacity: 0.5 }]}
            onPress={handleSend}
            disabled={!input.trim()}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#6C6CFF', '#5555DD']}
              style={styles.sendGradient}
            >
              <Ionicons name="send" size={16} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <Modal visible={showReport} transparent animationType="slide" onRequestClose={() => setShowReport(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}>
          <View style={styles.reportOverlay}>
            <TouchableOpacity style={styles.reportBackdrop} onPress={() => { setShowReport(false); setReportOther(false); setReportReason(''); setReportDetail(''); }} />
            <View style={styles.reportSheet}>
              <View style={styles.reportHandle} />
              <Text style={styles.reportTitle}>Kullaniciyi Sikayet Et</Text>
              <Text style={styles.reportSub}>Sikayet sebebini secin</Text>
              {reportOptions.map((opt) => (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.reportOption, reportReason === opt.key && styles.reportOptionActive]}
                  onPress={() => {
                    setReportReason(opt.key);
                    setReportOther(opt.key === 'other');
                    if (opt.key !== 'other') {
                      handleSendReport();
                    }
                  }}
                >
                  <Text style={[styles.reportOptionText, reportReason === opt.key && styles.reportOptionTextActive]}>
                    {opt.label === 'Diger' && reportOther ? 'Diger (Aciklama yazin)' : opt.label}
                  </Text>
                  {reportReason === opt.key && <Ionicons name="checkmark" size={18} color={colors.primary} />}
                </TouchableOpacity>
              ))}
              {reportOther && (
                <View style={styles.reportDetailArea}>
                  <TextInput
                    style={styles.reportInput}
                    placeholder="Aciklamanizi yazin..."
                    placeholderTextColor={colors.textMuted}
                    value={reportDetail}
                    onChangeText={setReportDetail}
                    multiline
                    autoFocus
                  />
                  <TouchableOpacity style={styles.reportSubmitBtn} onPress={handleSendReport}>
                    <Text style={styles.reportSubmitText}>Gonder</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <CustomAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        buttons={alert.buttons}
        icon={alert.icon}
        onClose={closeAlert}
      />

      <Modal visible={sessionEndedModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.endedCard}>
            <View style={styles.endedIconCircle}>
              <Ionicons name="checkmark-circle" size={44} color={colors.accent} />
            </View>
            <Text style={styles.endedTitle}>{t('chat.timeout_title')}</Text>
            <Text style={styles.endedSub}>{t('chat.timeout_desc')}</Text>
            <TouchableOpacity style={styles.endedBtn} onPress={handleFinishSessionModal}>
              <Text style={styles.endedBtnText}>{t('common.home')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Toast visible={!!toastMsg} message={toastMsg} type="warning" onHide={() => setToastMsg('')} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  leaveBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  partnerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 10,
  },
  flagBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  partnerFlag: { fontSize: 20 },
  partnerName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    maxWidth: 120,
  },
  partnerMeta: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  skipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  skipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  skipLocked: {
    backgroundColor: colors.surface,
    borderColor: colors.cardBorder,
  },
  skipBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  listContent: {
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
  },
  textInput: {
    flex: 1,
    backgroundColor: colors.inputBg,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: colors.textPrimary,
    maxHeight: 100,
    fontSize: 14,
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginLeft: 10,
    overflow: 'hidden',
  },
  sendGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  endedCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.cardBg,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  endedIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(74, 222, 128, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  endedTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  endedSub: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
    lineHeight: 19,
  },
  endedBtn: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  endedBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reportBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  reportBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  reportSheet: {
    backgroundColor: colors.cardBg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderBottomWidth: 0,
  },
  reportHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.textMuted,
    alignSelf: 'center',
    marginBottom: 20,
    opacity: 0.3,
  },
  reportTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  reportSub: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  reportOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 6,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  reportOptionActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(108,108,255,0.08)',
  },
  reportOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  reportOptionTextActive: {
    color: colors.primary,
  },
  reportDetailArea: {
    marginTop: 12,
  },
  reportInput: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    color: colors.textPrimary,
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    fontSize: 14,
  },
  reportSubmitBtn: {
    marginTop: 12,
    height: 46,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportSubmitText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
  },
});

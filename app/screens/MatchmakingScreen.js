import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Modal, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BackgroundBubbles } from '../components/BackgroundBubbles';
import { Button } from '../components/Button';
import { getCountryByCode } from '../utils/countries';
import { useStore } from '../redux/useStore';
import { useTranslation } from '../utils/i18n';
import { colors } from '../theme/colors';
import { getOnlineUsers, db } from '../utils/firebase';
import { doc, getDoc } from 'firebase/firestore';
import {
  joinQueue, leaveQueue, tryMatchFromQueue, createMatch,
  subscribeIncomingMatch, checkReputation, tryRematch,
  respondToRematch, subscribeRematchProposal,
  subscribeRematchResponse, cleanupRematch,
} from '../utils/chat';

const REMATCH_TIMEOUT = 30000;

export const MatchmakingScreen = ({ navigation }) => {
  const user = useStore((state) => state.user);
  const selectedMode = useStore((state) => state.selectedMode);
  const setActiveSession = useStore((state) => state.setActiveSession);
  const language = useStore((s) => s.language);
  const { t } = useTranslation();

  const [statusText, setStatusText] = useState(t('matchmaking.connecting'));
  const [onlineCount, setOnlineCount] = useState(0);
  const [blocked, setBlocked] = useState(false);
  const [rematchPartner, setRematchPartner] = useState(null);
  const [showRematchModal, setShowRematchModal] = useState(false);
  const [waitingRematch, setWaitingRematch] = useState(false);

  const spinAnim = useRef(new Animated.Value(0)).current;
  const hasMatched = useRef(false);
  const scanIntervalRef = useRef(null);
  const rematchRequestId = useRef(null);
  const rematchTimeoutRef = useRef(null);
  const rematchUnsubRef = useRef(null);

  const confirmRematch = async () => {
    if (!rematchRequestId.current) return;
    await respondToRematch(rematchRequestId.current, user.uid, true);
    setShowRematchModal(false);
    setWaitingRematch(true);
    setStatusText(t('matchmaking.waiting_rematch'));
  };

  const rejectRematch = async () => {
    if (!rematchRequestId.current) return;
    await respondToRematch(rematchRequestId.current, user.uid, false);
    await cleanupRematch(rematchRequestId.current);
    rematchRequestId.current = null;
    setShowRematchModal(false);
    setRematchPartner(null);
    setWaitingRematch(false);
    setStatusText(t('matchmaking.scanning'));
  };

  const handleRematchBothAccepted = async (partner) => {
    if (hasMatched.current) return;
    await cleanupRematch(rematchRequestId.current);
    await leaveQueue(user.uid);

    const partnerObj = { uid: partner.uid, nickname: partner.nickname, country: partner.country };
    if (user.uid < partner.uid) {
      hasMatched.current = true;
      setStatusText(t('matchmaking.generating_key'));
      const m = await createMatch(user, partnerObj, selectedMode);
      const session = {
        id: m.matchId, matchId: m.matchId,
        partnerNickname: partner.nickname, partnerCountry: partner.country, partnerUid: partner.uid,
        mode: selectedMode, startTime: Date.now(), sessionKey: m.sessionKey,
        messages: [{ id: 'msg_init', senderId: 'system', text: t(selectedMode === 'international' ? 'matchmaking.mandatory_intl' : 'matchmaking.mandatory_local'), timestamp: Date.now(), hash: '000000' }],
      };
      setActiveSession(session);
      navigation.replace('Chat');
    }
  };

  useEffect(() => {
    const spin = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1, duration: 2000, easing: Easing.linear, useNativeDriver: true,
      })
    );
    spin.start();

    const init = async () => {
      const rep = await checkReputation(user.uid);
      if (rep.blocked || rep.leavesLeft <= 0) {
        setBlocked(true);
        if (rep.blocked) {
          setStatusText(t('matchmaking.blocked_reputation', { rep: rep.reputation }));
        } else {
          setStatusText(t('matchmaking.blocked_leaves'));
        }
        setOnlineCount(0);
        return;
      }

      await joinQueue(user, selectedMode);
      const users = await getOnlineUsers(selectedMode, user);
      setOnlineCount(users.length);

      setStatusText(
        t(selectedMode === 'international' ? 'matchmaking.scanning_intl' : 'matchmaking.scanning_local')
      );

      const scan = async () => {
        if (hasMatched.current || rematchRequestId.current) return;
        try {
          let partner = await tryMatchFromQueue(user, selectedMode);
          if (!partner) {
            partner = await tryRematch(user, selectedMode);
          }
          if (partner && !hasMatched.current) {
            if (partner.isRematch) {
              rematchRequestId.current = partner.requestId;
              setRematchPartner(partner);
              setShowRematchModal(true);
              setStatusText(t('matchmaking.rematch_found'));

              rematchUnsubRef.current = subscribeRematchResponse(partner.requestId, async (data) => {
                if (!data) return;
                const myField = data.initiator === user.uid ? 'initiatorStatus' : 'targetStatus';
                const otherField = data.initiator === user.uid ? 'targetStatus' : 'initiatorStatus';

                if (data[otherField] === 'rejected') {
                  rematchRequestId.current = null;
                  setShowRematchModal(false);
                  setRematchPartner(null);
                  setWaitingRematch(false);
                  await cleanupRematch(partner.requestId);
                  setStatusText(t('matchmaking.rematch_rejected'));
                  return;
                }

                if (data[myField] === 'accepted' && data[otherField] === 'accepted') {
                  if (rematchUnsubRef.current) rematchUnsubRef.current();
                  handleRematchBothAccepted(partner);
                }
              });

              rematchTimeoutRef.current = setTimeout(async () => {
                if (hasMatched.current) return;
                rematchRequestId.current = null;
                setShowRematchModal(false);
                setRematchPartner(null);
                setWaitingRematch(false);
                await cleanupRematch(partner.requestId);
                setStatusText(t('matchmaking.rematch_timeout'));
              }, REMATCH_TIMEOUT);
            } else {
              hasMatched.current = true;
              setStatusText(t('matchmaking.generating_key'));
              const m = await createMatch(user, partner, selectedMode);
              await leaveQueue(user.uid);
              const session = {
                id: m.matchId, matchId: m.matchId,
                partnerNickname: partner.nickname, partnerCountry: partner.country, partnerUid: partner.uid,
                mode: selectedMode, startTime: Date.now(), sessionKey: m.sessionKey,
                messages: [{ id: 'msg_init', senderId: 'system', text: t(selectedMode === 'international' ? 'matchmaking.mandatory_intl' : 'matchmaking.mandatory_local'), timestamp: Date.now(), hash: '000000' }],
              };
              setActiveSession(session);
              navigation.replace('Chat');
            }
          }
        } catch (e) {
          console.warn('scan error', e);
        }
      };

      setTimeout(scan, 1500);
      const interval = setInterval(scan, 5000);
      scanIntervalRef.current = interval;
    };
    init();

    const unsubIncoming = subscribeIncomingMatch(user.uid, (match) => {
      if (hasMatched.current) return;
      hasMatched.current = true;
      leaveQueue(user.uid);
      const session = {
        id: match.matchId, matchId: match.matchId,
        partnerNickname: match.partner.nickname, partnerCountry: match.partner.country, partnerUid: match.partner.uid,
        mode: match.mode, startTime: Date.now(), sessionKey: match.sessionKey,
        messages: [{ id: 'msg_init', senderId: 'system', text: t(match.mode === 'international' ? 'matchmaking.mandatory_intl' : 'matchmaking.mandatory_local'), timestamp: Date.now(), hash: '000000' }],
      };
      setActiveSession(session);
      navigation.replace('Chat');
    });

    const unsubProposal = subscribeRematchProposal(user.uid, async (proposal) => {
      if (hasMatched.current) return;
      const partnerQueueRef = await getDoc(doc(db, 'matchmakingQueue', proposal.initiator));
      const pNick = partnerQueueRef.exists() ? partnerQueueRef.data().nickname : '...';
      const pCountry = partnerQueueRef.exists() ? partnerQueueRef.data().country : '...';
      setRematchPartner({ uid: proposal.initiator, requestId: proposal.requestId, isRematch: true, nickname: pNick, country: pCountry });
      rematchRequestId.current = proposal.requestId;
      setShowRematchModal(true);
      setStatusText(t('matchmaking.incoming_rematch'));

      rematchUnsubRef.current = subscribeRematchResponse(proposal.requestId, async (data) => {
        if (!data) return;
        const myField = data.initiator === user.uid ? 'initiatorStatus' : 'targetStatus';
        const otherField = data.initiator === user.uid ? 'targetStatus' : 'initiatorStatus';

        if (data[otherField] === 'rejected') {
          rematchRequestId.current = null;
          setShowRematchModal(false);
          setRematchPartner(null);
          setWaitingRematch(false);
          await cleanupRematch(proposal.requestId);
          setStatusText(t('matchmaking.rematch_cancelled'));
          return;
        }

        if (data[myField] === 'accepted' && data[otherField] === 'accepted') {
          if (rematchUnsubRef.current) rematchUnsubRef.current();
          handleRematchBothAccepted({ uid: proposal.initiator, nickname: pNick, country: pCountry });
        }
      });

      rematchTimeoutRef.current = setTimeout(async () => {
        if (hasMatched.current) return;
        rematchRequestId.current = null;
        setShowRematchModal(false);
        setRematchPartner(null);
        setWaitingRematch(false);
        await cleanupRematch(proposal.requestId);
        setStatusText(t('matchmaking.rematch_timeout'));
      }, REMATCH_TIMEOUT);
    });

    return () => {
      spin.stop();
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
      if (rematchTimeoutRef.current) clearTimeout(rematchTimeoutRef.current);
      if (rematchUnsubRef.current) rematchUnsubRef.current();
      unsubIncoming();
      unsubProposal();
      leaveQueue(user.uid);
    };
  }, []);

  const userCountry = getCountryByCode(user.country);
  const spinDeg = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']} key={language}>
      <BackgroundBubbles />
      <View style={styles.content}>
        <View style={styles.topSection}>
          <Text style={styles.title}>{t('nav.matchmaking')}</Text>
          <Text style={styles.statusText}>{statusText}</Text>
        </View>

        {!blocked && (
          <>
            <View style={styles.centerSection}>
              <View style={styles.spinnerContainer}>
                <Animated.View style={[styles.spinnerRing, { transform: [{ rotate: spinDeg }] }]} />
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarFlag}>{userCountry.flag}</Text>
                </View>
              </View>

              {onlineCount > 0 && (
                <View style={styles.onlineBar}>
                  <View style={styles.onlineDot} />
                  <Text style={styles.onlineText}>{t('common.online_count', { count: onlineCount })}</Text>
                </View>
              )}
            </View>

            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t('matchmaking.label_mode')}</Text>
                <Text style={styles.infoValue}>
                  {t(selectedMode === 'international' ? 'matchmaking.value_intl' : 'matchmaking.value_local')}
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t('matchmaking.label_duration')}</Text>
                <Text style={[styles.infoValue, { color: colors.warning }]}>{t('matchmaking.value_duration')}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t('matchmaking.label_max')}</Text>
                <Text style={styles.infoValue}>{t('matchmaking.value_max')}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t('matchmaking.label_security')}</Text>
                <Text style={[styles.infoValue, { color: colors.accent }]}>{t('matchmaking.value_security')}</Text>
              </View>
            </View>
          </>
        )}

        <Button
          title={blocked ? t('common.back') : t('common.cancel')}
          onPress={() => navigation.goBack()}
          variant={blocked ? 'primary' : 'secondary'}
        />
      </View>

      <Modal visible={showRematchModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.rematchCard}>
            <View style={styles.rematchIcon}>
              <Ionicons name="refresh" size={28} color={colors.primary} />
            </View>
            <Text style={styles.rematchTitle}>{t('matchmaking.modal_title')}</Text>
            <Text style={styles.rematchDesc}>
              {t('matchmaking.modal_desc')}
            </Text>
            <View style={styles.rematchButtons}>
              <TouchableOpacity style={styles.rematchRejectBtn} onPress={rejectRematch} activeOpacity={0.8}>
                <Text style={styles.rematchRejectText}>{t('common.no')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.rematchAcceptBtn} onPress={confirmRematch} activeOpacity={0.8}>
                <Text style={styles.rematchAcceptText}>{t('common.yes')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: {
    flex: 1, padding: 24, alignItems: 'center', justifyContent: 'space-between',
  },
  topSection: { alignItems: 'center', marginTop: 20 },
  title: { fontSize: 22, fontWeight: '700', color: colors.textPrimary },
  statusText: {
    fontSize: 13, color: colors.textSecondary, textAlign: 'center',
    marginTop: 6, minHeight: 36,
  },
  centerSection: { alignItems: 'center', gap: 16 },
  spinnerContainer: {
    width: 140, height: 140, alignItems: 'center', justifyContent: 'center',
  },
  spinnerRing: {
    position: 'absolute', width: 120, height: 120, borderRadius: 60,
    borderWidth: 3, borderColor: 'transparent',
    borderTopColor: colors.primary, borderRightColor: colors.primary,
  },
  avatarCircle: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: colors.surface,
    borderWidth: 2, borderColor: colors.cardBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarFlag: { fontSize: 36 },
  onlineBar: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(74, 222, 128, 0.08)',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10,
    borderWidth: 1, borderColor: 'rgba(74, 222, 128, 0.15)',
  },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accent },
  onlineText: { fontSize: 12, fontWeight: '600', color: colors.accent },
  infoCard: {
    width: '100%', backgroundColor: colors.cardBg, borderWidth: 1,
    borderColor: colors.cardBorder, borderRadius: 14, padding: 16, gap: 12,
  },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  infoLabel: { fontSize: 13, color: colors.textSecondary },
  infoValue: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  divider: { height: 1, backgroundColor: colors.cardBorder },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  rematchCard: {
    width: '100%', maxWidth: 340, backgroundColor: colors.cardBg,
    borderRadius: 20, borderWidth: 1, borderColor: colors.cardBorder,
    padding: 24, alignItems: 'center',
  },
  rematchIcon: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: 'rgba(108, 108, 255, 0.12)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  rematchTitle: {
    fontSize: 18, fontWeight: '700', color: colors.textPrimary,
  },
  rematchDesc: {
    fontSize: 13, color: colors.textSecondary, textAlign: 'center',
    marginTop: 8, marginBottom: 24, lineHeight: 19,
  },
  rematchButtons: {
    flexDirection: 'row', gap: 12, width: '100%',
  },
  rematchRejectBtn: {
    flex: 1, height: 48, borderRadius: 12, borderWidth: 1,
    borderColor: colors.cardBorder, alignItems: 'center',
    justifyContent: 'center', backgroundColor: colors.surface,
  },
  rematchRejectText: { fontSize: 15, fontWeight: '600', color: colors.textSecondary },
  rematchAcceptBtn: {
    flex: 1, height: 48, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary,
  },
  rematchAcceptText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
});
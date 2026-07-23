import { doc, setDoc, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, getDocs, where, deleteDoc, getDoc, updateDoc, arrayUnion, increment } from 'firebase/firestore';
import { db, ensureFirebase } from './firebase';
import { generateSessionKey } from './encryption';

export const createMatch = async (user1, user2, mode) => {
  await ensureFirebase();
  const matchId = 'match_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
  const matchRef = doc(db, 'matches', matchId);
  const sessionKey = generateSessionKey();
  await setDoc(matchRef, {
    matchId,
    user1: { uid: user1.uid, nickname: user1.nickname, country: user1.country },
    user2: { uid: user2.uid, nickname: user2.nickname, country: user2.country },
    participants: [user1.uid, user2.uid],
    mode,
    sessionKey,
    createdAt: serverTimestamp(),
    active: true,
    endedBy: null,
  });

  await setDoc(doc(db, 'users', user1.uid), { recentMatches: arrayUnion(user2.uid) }, { merge: true });
  await setDoc(doc(db, 'users', user2.uid), { recentMatches: arrayUnion(user1.uid) }, { merge: true });

  return { matchId, sessionKey, partner: user2 };
};

export const endMatch = async (matchId, endedByUid) => {
  await ensureFirebase();
  await updateDoc(doc(db, 'matches', matchId), { active: false, endedBy: endedByUid, endedAt: serverTimestamp() });
};

export const subscribeMatchStatus = (matchId, callback) => {
  return onSnapshot(doc(db, 'matches', matchId), (snap) => {
    if (snap.exists()) callback(snap.data());
  });
};

export const joinQueue = async (user, mode) => {
  await setDoc(doc(db, 'matchmakingQueue', user.uid), {
    uid: user.uid, nickname: user.nickname, country: user.country, mode, createdAt: serverTimestamp(),
  });
};

export const leaveQueue = async (uid) => {
  try { await deleteDoc(doc(db, 'matchmakingQueue', uid)); } catch {}
};

export const tryMatchFromQueue = async (user, mode) => {
  const snap = await getDocs(query(collection(db, 'matchmakingQueue'), where('mode', '==', mode)));
  const candidates = [];
  snap.forEach((d) => {
    const data = d.data();
    if (data.uid !== user.uid) candidates.push({ id: d.id, ...data });
  });

  const userDoc = await getDoc(doc(db, 'users', user.uid));
  const recent = userDoc.exists() ? userDoc.data().recentMatches || [] : [];

  for (const p of candidates) {
    if (mode === 'local' && p.country !== user.country) continue;
    if (mode === 'international' && p.country === user.country) continue;
    if (recent.includes(p.uid)) continue;

    const otherDoc = await getDoc(doc(db, 'matchmakingQueue', p.uid));
    if (!otherDoc.exists()) continue;

    const lowerUid = user.uid < p.uid ? user.uid : p.uid;
    if (lowerUid !== user.uid) return null;

    await leaveQueue(user.uid);
    await leaveQueue(p.uid);
    return p;
  }
  return null;
};

export const subscribeIncomingMatch = (uid, onMatch) => {
  const q = query(collection(db, 'matches'), where('participants', 'array-contains', uid), where('active', '==', true));
  return onSnapshot(q, (snap) => {
    snap.forEach((doc) => {
      const data = doc.data();
      onMatch({ matchId: doc.id, ...data, partner: data.user1.uid === uid ? data.user2 : data.user1 });
    });
  });
};

export const tryRematch = async (user, mode) => {
  await ensureFirebase();
  if (!db) return null;

  const userDoc = await getDoc(doc(db, 'users', user.uid));
  if (!userDoc.exists()) return null;
  const recent = userDoc.data().recentMatches || [];

  const queueSnap = await getDocs(query(collection(db, 'matchmakingQueue'), where('mode', '==', mode)));
  const queueUids = new Set();
  queueSnap.forEach((d) => queueUids.add(d.data().uid));

  for (const pastUid of recent) {
    if (pastUid === user.uid) continue;
    if (!queueUids.has(pastUid)) continue;

    if (mode === 'local') {
      const puDoc = await getDoc(doc(db, 'users', pastUid));
      if (!puDoc.exists() || puDoc.data().country !== user.country) continue;
    }

    const lowerUid = user.uid < pastUid ? user.uid : pastUid;
    if (lowerUid !== user.uid) return null;

    const partnerSnap = await getDoc(doc(db, 'matchmakingQueue', pastUid));
    if (!partnerSnap.exists()) continue;

    const requestId = `rematch_${user.uid}_${pastUid}`;
    const requestRef = doc(db, 'rematchRequests', requestId);
    const requestSnap = await getDoc(requestRef);
    if (requestSnap.exists()) continue;

    await setDoc(requestRef, {
      requestId,
      initiator: user.uid,
      target: pastUid,
      initiatorStatus: 'pending',
      targetStatus: 'pending',
      createdAt: serverTimestamp(),
    });

    return {
      uid: pastUid,
      nickname: partnerSnap.data().nickname,
      country: partnerSnap.data().country,
      requestId,
      isRematch: true,
    };
  }
  return null;
};

export const respondToRematch = async (requestId, uid, accept) => {
  await ensureFirebase();
  if (!db) return;
  const ref = doc(db, 'rematchRequests', requestId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const data = snap.data();
  const field = data.initiator === uid ? 'initiatorStatus' : 'targetStatus';
  await setDoc(ref, { [field]: accept ? 'accepted' : 'rejected' }, { merge: true });
};

export const subscribeRematchProposal = (uid, onProposal) => {
  if (!db) return () => {};
  const q = query(
    collection(db, 'rematchRequests'),
    where('target', '==', uid),
    where('targetStatus', '==', 'pending')
  );
  return onSnapshot(q, (snap) => {
    snap.forEach((doc) => onProposal(doc.data()));
  });
};

export const subscribeRematchResponse = (requestId, onResponse) => {
  if (!db) return () => {};
  return onSnapshot(doc(db, 'rematchRequests', requestId), (snap) => {
    if (snap.exists()) onResponse(snap.data());
  });
};

export const cleanupRematch = async (requestId) => {
  if (!requestId) return;
  try { await deleteDoc(doc(db, 'rematchRequests', requestId)); } catch {}
};

export const sendMessage = async (matchId, senderId, text) => {
  await ensureFirebase();
  if (!db) return;
  try {
    const msgRef = collection(db, 'matches', matchId, 'messages');
    await addDoc(msgRef, { senderId, text, timestamp: Date.now() });
  } catch (e) {
    console.warn('sendMessage error', e);
  }
};

export const subscribeMessages = (matchId, onNewMessage) => {
  const msgRef = collection(db, 'matches', matchId, 'messages');
  const q = query(msgRef, orderBy('timestamp', 'asc'));
  return onSnapshot(q, (snap) => {
    const messages = [];
    snap.forEach((doc) => messages.push({ id: doc.id, ...doc.data() }));
    onNewMessage(messages);
  });
};

const REP_PERIOD_MS = 3 * 24 * 60 * 60 * 1000;

export const checkReputation = async (uid) => {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return { blocked: false, reputation: 100, leavesLeft: 3 };
  const data = snap.data();
  const rep = data.reputation ?? 100;
  const leaves = data.leaveCount ?? 0;
  const periodStart = data.leavePeriodStart ?? 0;
  const resetTime = periodStart + REP_PERIOD_MS;

  if (Date.now() >= resetTime) {
    await updateDoc(doc(db, 'users', uid), { leaveCount: 0, leavePeriodStart: Date.now() });
    return { blocked: rep < 70, reputation: rep, leavesLeft: 3 };
  }

  return { blocked: rep < 70, reputation: rep, leavesLeft: Math.max(0, 3 - leaves) };
};

export const updateReputationAfterLeave = async (uid, elapsedSeconds) => {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return;
  const data = snap.data();
  const periodStart = data.leavePeriodStart ?? Date.now();
  const resetTime = periodStart + REP_PERIOD_MS;

  let leaveCount = data.leaveCount ?? 0;

  if (Date.now() >= resetTime) {
    await updateDoc(doc(db, 'users', uid), { leaveCount: 1, leavePeriodStart: Date.now() });
    leaveCount = 1;
  } else {
    await updateDoc(doc(db, 'users', uid), { leaveCount: increment(1) });
    leaveCount += 1;
  }

  if (elapsedSeconds < 120 && leaveCount > 3) {
    const currentRep = data.reputation ?? 100;
    const newRep = Math.max(0, currentRep - 20);
    await updateDoc(doc(db, 'users', uid), { reputation: newRep });
  }
};

export const updateReputationAfterComplete = async (uid) => {
  await updateDoc(doc(db, 'users', uid), { reputation: increment(2) });
};

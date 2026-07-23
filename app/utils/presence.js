import { getDatabase, ref, onValue, set, onDisconnect, off } from 'firebase/database';
import { doc, setDoc } from 'firebase/firestore';
import { AppState } from 'react-native';
import { db, ensureFirebase } from './firebase';

let rtdbInstance = null;
let presenceUnsubscribe = null;
let appStateListener = null;
let currentUid = null;
let statusListeners = [];

const getRtdb = async () => {
  if (!rtdbInstance) {
    const app = await ensureFirebase();
    rtdbInstance = getDatabase(app);
  }
  return rtdbInstance;
};

export const initPresence = async (uid) => {
  if (!uid) return;
  stopPresence();
  currentUid = uid;

  const rtdb = await getRtdb();
  const userStatusRef = ref(rtdb, `status/${uid}`);
  const connectedRef = ref(rtdb, '.info/connected');

  presenceUnsubscribe = onValue(connectedRef, (snap) => {
    if (snap.val() === true) {
      onDisconnect(userStatusRef).remove();
      set(userStatusRef, { state: 'online', lastChanged: Date.now() });
      updateFirestoreStatus(uid, true);
    }
  });

  appStateListener = AppState.addEventListener('change', (nextState) => {
    if (!currentUid) return;
    getRtdb().then((rtdb) => {
      const statusRef = ref(rtdb, `status/${currentUid}`);
      const isOnline = nextState === 'active';
      set(statusRef, { state: isOnline ? 'online' : 'offline', lastChanged: Date.now() });
      updateFirestoreStatus(currentUid, isOnline);
      if (!isOnline) {
        onDisconnect(statusRef).cancel();
      } else {
        onDisconnect(statusRef).remove();
      }
    });
  });

  notifyListeners(true);
};

const updateFirestoreStatus = async (uid, isOnline) => {
  try {
    await setDoc(doc(db, 'users', uid), { isOnline, lastSeen: Date.now() }, { merge: true });
  } catch {
    // ignore
  }
};

export const subscribeStatus = (uid, callback) => {
  getRtdb().then((rtdb) => {
    const statusRef = ref(rtdb, `status/${uid}`);
    const cb = onValue(statusRef, (snap) => {
      const data = snap.val();
      callback(data?.state === 'online');
    });
    statusListeners.push({ uid, unsubscribe: cb, ref: statusRef });
  });
};

const notifyListeners = (isOnline) => {
  statusListeners.forEach(({ cb }) => cb && cb(isOnline));
};

export const unsubscribeStatus = (uid) => {
  statusListeners = statusListeners.filter((item) => {
    if (item.uid === uid) {
      unsubscribe(item.unsubscribe);
      off(item.ref);
      return false;
    }
    return true;
  });
};

const unsubscribe = (fn) => {
  if (typeof fn === 'function') fn();
};

export const stopPresence = () => {
  currentUid = null;
  if (presenceUnsubscribe) {
    presenceUnsubscribe();
    presenceUnsubscribe = null;
  }
  if (appStateListener) {
    appStateListener.remove();
    appStateListener = null;
  }
  statusListeners.forEach((item) => {
    if (typeof item.unsubscribe === 'function') item.unsubscribe();
    off(item.ref);
  });
  statusListeners = [];
};

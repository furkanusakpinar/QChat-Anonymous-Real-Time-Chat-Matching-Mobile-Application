import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, collection, query, where, getDocs, orderBy, limit, addDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import CryptoJS from 'crypto-js';

import {
  FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN,
  FIREBASE_DATABASE_URL,
  FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET,
  FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_APP_ID,
  FIREBASE_MEASUREMENT_ID,
} from '@env';

const FIREBASE_CONFIG_KEY = 'QCHAT_FIREBASE_CONFIG';

const defaultConfig = {
  apiKey: FIREBASE_API_KEY,
  authDomain: FIREBASE_AUTH_DOMAIN,
  databaseURL: FIREBASE_DATABASE_URL,
  projectId: FIREBASE_PROJECT_ID,
  storageBucket: FIREBASE_STORAGE_BUCKET,
  messagingSenderId: FIREBASE_MESSAGING_SENDER_ID,
  appId: FIREBASE_APP_ID,
  measurementId: FIREBASE_MEASUREMENT_ID,
};

let app, db, rtdb;
let initPromise = null;

const initializeFirebase = async () => {
  let config = defaultConfig;
  try {
    const saved = await ReactNativeAsyncStorage.getItem(FIREBASE_CONFIG_KEY);
    if (saved) {
      config = JSON.parse(saved);
    }
  } catch {}

  app = getApps().length === 0 ? initializeApp(config) : getApp();
  db = getFirestore(app);
  rtdb = getDatabase(app);
};

const ensureFirebase = async () => {
  if (!initPromise) {
    initPromise = initializeFirebase();
  }
  return initPromise;
};

/**
 * Saves or updates user document in Firestore 'users' collection.
 * Path: users/{uid}
 */
export { FIREBASE_CONFIG_KEY };
export { ensureFirebase };

export const checkEmailExists = async (email) => {
  await ensureFirebase();
  if (!db || !email) return false;
  try {
    const q = query(collection(db, 'users'), where('email', '==', email));
    const snap = await getDocs(q);
    return !snap.empty;
  } catch {
    return false;
  }
};

export const checkNicknameExists = async (nickname) => {
  await ensureFirebase();
  if (!db || !nickname) return false;
  try {
    const q = query(collection(db, 'users'), where('nickname', '==', nickname));
    const snap = await getDocs(q);
    return !snap.empty;
  } catch {
    return false;
  }
};

export const hashPassword = (password) => {
  return CryptoJS.SHA256(password).toString();
};

export const saveUserToFirestore = async (userData) => {
  await ensureFirebase();
  if (!db || !userData || !userData.uid) return false;
  try {
    const userRef = doc(db, 'users', userData.uid);
    await setDoc(
      userRef,
      {
        uid: userData.uid,
        email: userData.email || '',
        nickname: userData.nickname || '',
        passwordHash: userData.passwordHash || '',
        country: userData.country || 'TR',
        age: userData.age || 20,
        createdAt: userData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    console.log(`[Firestore] User ${userData.uid} successfully saved to 'users' collection.`);
    return true;
  } catch (error) {
    console.warn("[Firestore] Failed to save user to 'users' collection:", error);
    return false;
  }
};

/**
 * Fetches user document from Firestore 'users' collection by email or uid.
 */
export const saveSession = async (uid, session) => {
  await ensureFirebase();
  if (!db) return;
  try {
    await setDoc(doc(db, 'users', uid, 'sessions', session.id), session);
  } catch {}
};

export const getRecentSessions = async (uid, max = 5) => {
  await ensureFirebase();
  if (!db) return [];
  try {
    const q = query(collection(db, 'users', uid, 'sessions'), orderBy('endedAt', 'desc'), limit(max));
    const snap = await getDocs(q);
    const sessions = [];
    snap.forEach((d) => sessions.push(d.data()));
    return sessions;
  } catch {
    return [];
  }
};

export const submitReport = async (reporterUid, reportedUid, matchId, reason, detail) => {
  await ensureFirebase();
  if (!db) return;
  try {
    await addDoc(collection(db, 'reports'), {
      reporterUid,
      reportedUid,
      matchId,
      reason,
      detail: detail || '',
      createdAt: serverTimestamp(),
    });
  } catch (e) {
    console.warn('submitReport error', e);
  }
};

export const deleteUserAccount = async (uid) => {
  await ensureFirebase();
  if (!db) return;
  try {
    await deleteDoc(doc(db, 'users', uid));
    await deleteDoc(doc(db, 'matchmakingQueue', uid));
    const sessionsSnap = await getDocs(collection(db, 'users', uid, 'sessions'));
    sessionsSnap.forEach((d) => deleteDoc(d.ref));
  } catch (e) {
    console.warn('deleteUserAccount error', e);
  }
};

export const getTotalOnlineCount = async () => {
  await ensureFirebase();
  if (!db) return 0;
  try {
    const snap = await getDocs(query(collection(db, 'users'), where('isOnline', '==', true)));
    return snap.size;
  } catch {
    return 0;
  }
};

export const getOnlineUsers = async (mode, currentUser) => {
  await ensureFirebase();
  if (!db || !currentUser) return [];
  try {
    const q = query(
      collection(db, 'users'),
      where('isOnline', '==', true)
    );
    const snap = await getDocs(q);
    const onlineUsers = [];
    snap.forEach((doc) => {
      const data = doc.data();
      if (data.uid === currentUser.uid) return;
      if (mode === 'local' && data.country === currentUser.country) {
        onlineUsers.push(data);
      } else if (mode === 'international' && data.country !== currentUser.country) {
        onlineUsers.push(data);
      }
    });
    return onlineUsers;
  } catch {
    return [];
  }
};

export const getUserFromFirestore = async (emailOrUid) => {
  await ensureFirebase();
  if (!db || !emailOrUid) return null;
  try {
    // Try directly by doc ID first
    const userRef = doc(db, 'users', emailOrUid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return userSnap.data();
    }

    // Try searching by email
    const usersQuery = query(collection(db, 'users'), where('email', '==', emailOrUid));
    const querySnap = await getDocs(usersQuery);
    if (!querySnap.empty) {
      return querySnap.docs[0].data();
    }

    return null;
  } catch (error) {
    console.warn("[Firestore] Failed to fetch user from 'users' collection:", error);
    return null;
  }
};

export { app, db, rtdb };
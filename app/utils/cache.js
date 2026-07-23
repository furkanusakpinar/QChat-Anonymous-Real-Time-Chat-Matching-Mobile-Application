import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_CACHE_KEY = 'QCHAT_CACHED_USER';
const LANG_CACHE_KEY = 'QCHAT_LANGUAGE';

export const saveUserToCache = async (user) => {
  try {
    await AsyncStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
  } catch {}
};

export const getCachedUser = async () => {
  try {
    const data = await AsyncStorage.getItem(USER_CACHE_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

export const clearUserCache = async () => {
  try {
    await AsyncStorage.removeItem(USER_CACHE_KEY);
  } catch {}
};

export const getCachedLanguage = async () => {
  try {
    return await AsyncStorage.getItem(LANG_CACHE_KEY) || 'tr';
  } catch {
    return 'tr';
  }
};

export const saveLanguageToCache = async (lang) => {
  try {
    await AsyncStorage.setItem(LANG_CACHE_KEY, lang);
  } catch {}
};

import { create } from 'zustand';
import { saveSession } from '../utils/firebase';
import { tr, en } from '../utils/lang';

export const CHAT_CONFIG = {
  MIN_REQUIRED_SECONDS: 120,
  MAX_CHAT_SECONDS: 300,
};

export const useStore = create((set, get) => ({
  user: {
    uid: '',
    nickname: '',
    country: '',
    age: 0,
    email: '',
    isLoggedIn: false,
  },

  selectedMode: 'international',
  language: 'tr',
  strings: tr,
  navKey: 0,

  activeSession: null,

  history: [],

  setUser: (userData) => set((state) => ({ user: { ...state.user, ...userData } })),
  setSelectedMode: (mode) => set({ selectedMode: mode }),
  setLanguage: (lang) => set((state) => ({ language: lang, strings: lang === 'tr' ? tr : en, navKey: state.navKey + 1 })),

  setActiveSession: (session) => set({ activeSession: session }),

  setHistory: (sessions) => set({ history: sessions }),

  addMessageToSession: (messageObj) => set((state) => {
    if (!state.activeSession) return state;
    return {
      activeSession: {
        ...state.activeSession,
        messages: [...state.activeSession.messages, messageObj],
      },
    };
  }),

  endActiveSession: (skipUsed = false) => set((state) => {
    if (!state.activeSession) return state;
    const session = {
      id: state.activeSession.id,
      partnerNickname: state.activeSession.partnerNickname,
      partnerCountry: state.activeSession.partnerCountry,
      mode: state.activeSession.mode,
      durationSeconds: Math.floor((Date.now() - state.activeSession.startTime) / 1000),
      endedAt: Date.now(),
      messageCount: state.activeSession.messages?.length || 0,
      skipUsed,
    };
    saveSession(state.user.uid, session);
    return {
      history: [session, ...state.history],
      activeSession: null,
    };
  }),
}));

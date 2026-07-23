import { useStore } from '../redux/useStore';

export const useTranslation = () => {
  const strings = useStore((s) => s.strings);
  const t = (key, ...args) => {
    const flatKey = key.replace(/\./g, '_');
    const val = strings[flatKey];
    if (typeof val === 'function') return val(...args);
    if (val !== undefined) return val;
    console.warn('Missing translation:', key);
    return key;
  };
  return { t, strings };
};

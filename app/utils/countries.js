// List of major countries with flags and codes
export const COUNTRIES = [
  { code: 'TR', name: 'Turkey', flag: '🇹🇷', nativeName: 'Türkiye' },
  { code: 'US', name: 'United States', flag: '🇺🇸', nativeName: 'United States' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', nativeName: 'United Kingdom' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', nativeName: 'Deutschland' },
  { code: 'FR', name: 'France', flag: '🇫🇷', nativeName: 'France' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸', nativeName: 'España' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹', nativeName: 'Italia' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵', nativeName: '日本' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷', nativeName: '대한민국' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷', nativeName: 'Brasil' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', nativeName: 'Canada' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', nativeName: 'Australia' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱', nativeName: 'Nederland' },
  { code: 'RU', name: 'Russia', flag: '🇷🇺', nativeName: 'Россия' },
  { code: 'IN', name: 'India', flag: '🇮🇳', nativeName: 'India' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽', nativeName: 'México' },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪', nativeName: 'Sverige' },
  { code: 'CH', name: 'Switzerland', flag: '🇨🇭', nativeName: 'Schweiz' },
];

export const getCountryByCode = (code) => {
  return COUNTRIES.find((c) => c.code === code) || { code: code || 'XX', name: 'Global', flag: '', nativeName: 'Global' };
};

export const getCountryName = (country, lang) => {
  if (!country) return '';
  if (lang === 'tr') return country.nativeName;
  return country.name;
};

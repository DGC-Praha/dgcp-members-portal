import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import cs from './locales/cs.json';
import en from './locales/en.json';

export const SUPPORTED_LANGUAGES = ['cs', 'en'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const STORAGE_KEY = 'dgcp_lang';

const detectInitialLanguage = (): SupportedLanguage => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'cs' || stored === 'en') {
      return stored;
    }
  } catch {
    // localStorage can throw in private mode / disabled storage — fall through
  }
  const browser = typeof navigator !== 'undefined' ? navigator.language.slice(0, 2).toLowerCase() : 'cs';
  return browser === 'en' ? 'en' : 'cs';
};

i18n.use(initReactI18next).init({
  resources: {
    cs: { translation: cs },
    en: { translation: en },
  },
  lng: detectInitialLanguage(),
  fallbackLng: 'cs',
  supportedLngs: SUPPORTED_LANGUAGES,
  interpolation: { escapeValue: false },
});

i18n.on('languageChanged', (lng) => {
  try {
    localStorage.setItem(STORAGE_KEY, lng);
    document.documentElement.lang = lng;
  } catch {
    // persistence is best-effort
  }
});

document.documentElement.lang = i18n.language;

export default i18n;

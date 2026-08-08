import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { defaultNS, resources, type AppLanguage } from './resources';

const STORAGE_KEY = 'hermes-language';

function storedLanguage(): AppLanguage {
  const stored = globalThis.localStorage?.getItem(STORAGE_KEY);
  return stored && stored in resources ? (stored as AppLanguage) : 'en';
}

void i18n.use(initReactI18next).init({
  resources,
  defaultNS,
  lng: storedLanguage(),
  fallbackLng: 'en',
  // React already escapes; double-escaping would turn an ampersand in a subject into &amp;.
  interpolation: { escapeValue: false },
});

export function persistLanguage(language: AppLanguage): void {
  globalThis.localStorage?.setItem(STORAGE_KEY, language);
  void i18n.changeLanguage(language);
}

export default i18n;

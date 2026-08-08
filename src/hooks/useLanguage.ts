import { useTranslation } from 'react-i18next';
import { persistLanguage } from '@/i18n/config';
import type { AppLanguage } from '@/i18n/resources';

/** Current language plus a persisted switcher. Dates read through the same value. */
export function useLanguage() {
  const { i18n } = useTranslation();
  const language = (i18n.resolvedLanguage ?? 'en') as AppLanguage;
  const locale = language === 'de' ? 'de-DE' : 'en-GB';
  return { language, locale, setLanguage: persistLanguage };
}

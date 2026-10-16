import home from '../data/home.json';
import settings from '../data/settings.json';
import { fallbackLang, localize, type Locale } from './i18n';

export const getSettings = (locale: Locale) => localize(settings, locale);
export const getHome = (locale: Locale) => localize(home, locale);

/** `lang` attributes for site texts shown untranslated; see fallbackLang(). */
export const settingsLang = (key: keyof typeof settings & string, locale: Locale) => fallbackLang(settings, key, locale);
export const homeLang = (key: keyof typeof home & string, locale: Locale) => fallbackLang(home, key, locale);

export const socialLinks = [
  { href: settings.instagram, label: 'Instagram' },
  { href: settings.facebook, label: 'Facebook' },
].filter((s) => s.href);

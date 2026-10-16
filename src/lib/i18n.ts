import { format } from './format';

// The site is bilingual. Polish pages live at the root (/works/…), English ones under /en/ (/en/works/…).
// Keep LOCALES and DEFAULT_LOCALE in sync with the `i18n` section of public/admin/config.yml.
export const LOCALES = ['pl', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'pl';

export const LOCALE_NAMES: Record<Locale, string> = { pl: 'Polski', en: 'English' };
/** The language for visitors who speak none of the site's languages (hreflang x-default). */
export const FALLBACK_LOCALE: Locale = 'en';
/** Used for og:locale. */
export const LOCALE_TAGS: Record<Locale, string> = { pl: 'pl_PL', en: 'en_GB' };

const isLocale = (value: unknown): value is Locale => LOCALES.includes(value as Locale);

/** The `[...lang]` route parameter of a locale: no prefix for the default locale. */
export const localeParam = (locale: Locale) => (locale === DEFAULT_LOCALE ? undefined : locale);

/** `getStaticPaths()` entries for a `[...lang]` route with no other parameters. */
export const localeParams = () => LOCALES.map((locale) => ({ params: { lang: localeParam(locale) } }));

/** The locale of a page, from the first segment of its path. Pages and components all get it from here. */
export const localeFromUrl = (url: URL): Locale => localeFromPath(url.pathname);

function localeFromPath(pathname: string): Locale {
  const first = pathname.split('/')[1];
  return isLocale(first) && first !== DEFAULT_LOCALE ? first : DEFAULT_LOCALE;
}

/** The path without its locale prefix: /en/works/ → /works/. */
export function stripLocale(pathname: string): string {
  const locale = localeFromPath(pathname);
  return locale === DEFAULT_LOCALE ? pathname : pathname.slice(locale.length + 1) || '/';
}

/** A site path in the given locale: localePath('en', '/works/') → /en/works/. */
export const localePath = (locale: Locale, path: string) => (locale === DEFAULT_LOCALE ? path : `/${locale}${path}`);

/** The current page in every language: its path there, or that language's home page if it has no counterpart. */
export const languageLinks = (url: URL, translated = true) => {
  const path = translated ? stripLocale(url.pathname) : '/';
  return LOCALES.map((locale) => ({ locale, path: localePath(locale, path) }));
};

/**
 * Content edited in the admin panel keeps the Polish text at the top level and each translation under its
 * locale key (`en: { title: … }`). This returns the data with the translation's non-empty fields laid over it,
 * so a translation left empty falls back to the Polish text.
 */
export function localize<T extends object>(data: T, locale: Locale): T {
  if (locale === DEFAULT_LOCALE) return data;
  const translated = (data as Partial<Record<Locale, Partial<T> | null>>)[locale];
  if (!translated) return data;
  const filled = Object.fromEntries(Object.entries(translated).filter(([, value]) => value !== '' && value != null));
  return { ...data, ...filled };
}

/**
 * `DEFAULT_LOCALE` when `localize()` shows the Polish text of `key` on a page in another language because the
 * translation is empty; otherwise undefined. Used as a `lang` attribute, so screen readers pronounce it right.
 */
export function fallbackLang<T extends object>(data: T, key: keyof T & string, locale: Locale): Locale | undefined {
  if (locale === DEFAULT_LOCALE || !data[key]) return undefined;
  const translated = (data as Partial<Record<Locale, Record<string, unknown> | null>>)[locale];
  const value = translated?.[key];
  return value === '' || value == null ? DEFAULT_LOCALE : undefined;
}

const ui = {
  pl: {
    skipLink: 'Przejdź do treści',
    titleSuffix: 'Malarstwo',
    'nav.label': 'Główne',
    'nav.home': 'Start',
    'nav.works': 'Prace',
    'nav.about': 'O mnie',
    'nav.contact': 'Kontakt',
    'nav.menu': 'Menu',
    'nav.enquiry': 'Zapytanie',
    'nav.language': 'Język',
    'footer.copyright': 'Copyright © {year} {artist}',
    'home.heading': 'obrazy',
    'home.slideshow': 'Wybrane prace',
    'home.slideOf': '{n} z {total}',
    'home.slideAnnounce': 'Slajd {n} z {total}',
    'home.prev': 'Poprzednia praca',
    'home.next': 'Następna praca',
    'home.pause': 'Pauza',
    'home.play': 'Odtwórz',
    'home.viewWorks': 'Zobacz prace',
    'home.getInTouch': 'Kontakt',
    'works.title': 'Prace',
    'works.all': 'Wszystkie prace',
    'works.series': 'Kategorie',
    'availability.available': 'Dostępna',
    'availability.reserved': 'Zarezerwowana',
    'availability.sold': 'Sprzedana',
    'availability.nfs': 'Nie na sprzedaż',
    'enquiry.add': 'Dodaj do zapytania',
    'enquiry.added': 'W zapytaniu',
    'enquiry.addLong': 'Dodaj do listy zapytań',
    'enquiry.addedLong': 'Na liście zapytań',
    'enquiry.listPrefix': 'Lista zapytań: ',
    'work.breadcrumb': 'Ścieżka',
    'work.enlarge': 'Powiększ obraz: ',
    'work.medium': 'Technika',
    'work.dimensions': 'Wymiary',
    'work.price': 'Cena',
    'work.by': '{artist}',
    'work.enquire': 'Zapytaj o tę pracę',
    'work.severalHint': 'Interesuje Cię kilka prac? Dodaj je do listy zapytań i wyślij jedną wiadomość o wszystkich.',
    'work.unavailable': 'Ta praca nie jest dostępna, ale podobne prace lub zamówienia mogą być.',
    'work.getInTouch': 'Napisz do mnie',
    'work.more': 'Więcej prac',
    'work.prev': 'Poprzednia',
    'work.next': 'Następna',
    'work.close': 'Zamknij',
    'contact.title': 'Kontakt',
    'contact.inEnquiry': 'Prace w Twoim zapytaniu',
    'contact.addMore': '+ Dodaj więcej prac',
    'contact.honeypot': 'Zostaw to pole puste',
    'contact.name': 'Imię i nazwisko',
    'contact.email': 'E-mail',
    'contact.phone': 'Telefon',
    'contact.optional': '(opcjonalnie)',
    'contact.message': 'Wiadomość',
    'contact.send': 'Wyślij wiadomość',
    'contact.studio': 'Pracownia',
    'contact.subject': 'Wiadomość ze strony',
    'contact.subjectWorks': 'Zapytanie: {titles}',
    'contact.remove': 'Usuń',
    'contact.removeLabel': 'Usuń: {title}',
    'contact.regarding': 'Dotyczy pracy „{title}”: ',
    'contact.sending': 'Wysyłanie…',
    'contact.noScript': 'Formularz wymaga włączonej obsługi JavaScriptu. Możesz też napisać bezpośrednio: {email}.',
    'contact.errorBot': 'Nie udało się potwierdzić, że nie jesteś robotem. Spróbuj jeszcze raz albo napisz bezpośrednio: {email}.',
    'contact.errorInvalid': 'Uzupełnij imię, poprawny adres e-mail i wiadomość.',
    'contact.errorSend': 'Nie udało się wysłać wiadomości. Spróbuj ponownie później albo napisz bezpośrednio: {email}.',
    'thanks.title': 'Dziękuję',
    'thanks.text': 'Wiadomość została wysłana. Odpowiem najszybciej, jak to możliwe.',
    'thanks.back': 'Wróć do prac',
    'notFound.title': 'Nie znaleziono strony',
    'notFound.text': 'Strona, której szukasz, nie istnieje. Zobacz <a href="{works}">prace</a> lub wróć na <a href="{home}">stronę główną</a>.',
  },
  en: {
    skipLink: 'Skip to content',
    titleSuffix: 'Paintings',
    'nav.label': 'Main',
    'nav.home': 'Home',
    'nav.works': 'Works',
    'nav.about': 'About',
    'nav.contact': 'Contact',
    'nav.menu': 'Menu',
    'nav.enquiry': 'Enquiry',
    'nav.language': 'Language',
    'footer.copyright': 'Copyright © {year} {artist}',
    'home.heading': 'paintings',
    'home.slideshow': 'Selected works',
    'home.slideOf': '{n} of {total}',
    'home.slideAnnounce': 'Slide {n} of {total}',
    'home.prev': 'Previous work',
    'home.next': 'Next work',
    'home.pause': 'Pause',
    'home.play': 'Play',
    'home.viewWorks': 'View works',
    'home.getInTouch': 'Get in touch',
    'works.title': 'Works',
    'works.all': 'All works',
    'works.series': 'Series',
    'availability.available': 'Available',
    'availability.reserved': 'Reserved',
    'availability.sold': 'Sold',
    'availability.nfs': 'Not for sale',
    'enquiry.add': 'Add to enquiry',
    'enquiry.added': 'In enquiry',
    'enquiry.addLong': 'Add to enquiry list',
    'enquiry.addedLong': 'In your enquiry list',
    'enquiry.listPrefix': 'Enquiry list: ',
    'work.breadcrumb': 'Breadcrumb',
    'work.enlarge': 'Enlarge image: ',
    'work.medium': 'Medium',
    'work.dimensions': 'Dimensions',
    'work.price': 'Price',
    'work.by': 'by {artist}',
    'work.enquire': 'Enquire about this work',
    'work.severalHint': 'Interested in several works? Add them to your enquiry list and send one message about all of them.',
    'work.unavailable': 'This work is not available, but similar works or commissions may be.',
    'work.getInTouch': 'Get in touch',
    'work.more': 'More works',
    'work.prev': 'Previous',
    'work.next': 'Next',
    'work.close': 'Close',
    'contact.title': 'Contact',
    'contact.inEnquiry': 'Works in your enquiry',
    'contact.addMore': '+ Add more works',
    'contact.honeypot': 'Leave this empty',
    'contact.name': 'Name',
    'contact.email': 'Email',
    'contact.phone': 'Phone',
    'contact.optional': '(optional)',
    'contact.message': 'Message',
    'contact.send': 'Send message',
    'contact.studio': 'Studio',
    'contact.subject': 'Website enquiry',
    'contact.subjectWorks': 'Enquiry: {titles}',
    'contact.remove': 'Remove',
    'contact.removeLabel': 'Remove {title}',
    'contact.regarding': 'Regarding “{title}”: ',
    'contact.sending': 'Sending…',
    'contact.noScript': 'The form needs JavaScript. You can also write directly to {email}.',
    'contact.errorBot': 'We couldn’t confirm you’re not a robot. Please try again or write directly to {email}.',
    'contact.errorInvalid': 'Please fill in your name, a valid email address and a message.',
    'contact.errorSend': 'The message couldn’t be sent. Please try again later or write directly to {email}.',
    'thanks.title': 'Thank you',
    'thanks.text': 'Your message has been sent. I will get back to you as soon as possible.',
    'thanks.back': 'Back to works',
    'notFound.title': 'Page not found',
    'notFound.text': 'The page you are looking for doesn’t exist. Try the <a href="{works}">works</a> or the <a href="{home}">home page</a>.',
  },
} satisfies Record<Locale, Record<string, string>>;

export type UiKey = keyof (typeof ui)['en'];
// Every language must have every text: a key missing from one table is a type error here.
ui satisfies Record<Locale, Record<UiKey, string>>;

/** The UI string translator for a locale: t('nav.works'), t('home.slideOf', { n: 1, total: 8 }). */
export const useTranslations =
  (locale: Locale) =>
  (key: UiKey, values?: Record<string, string | number>): string =>
    format(ui[locale][key], values);

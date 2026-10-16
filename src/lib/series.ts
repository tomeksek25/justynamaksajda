import series from '../data/series.json';
import { fallbackLang, localePath, localize, type Locale } from './i18n';

// Categories ("series") are edited in the admin panel; their order there is the order of the menu.
// Works refer to a category by its `id`, which the admin panel generates and never shows, so neither
// renaming a category nor changing its address can cut it off from its works.
export interface Series {
  id: string;
  /** The page address, /series/<slug>/, the same in every language. Set in the admin panel. */
  slug: string;
  title: string;
  description: string;
  /** Set to the default locale for texts shown untranslated; see fallbackLang(). */
  lang: { title?: Locale; description?: Locale };
}

/** "Duże formaty" → "duze-formaty". */
const slugify = (text: string) =>
  text
    .replace(/[łŁ]/g, 'l')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

// The admin panel requires a unique address. Should one still be missing or taken (e.g. a hand-edited file),
// it falls back to the Polish name or the id, made unique, so the build never breaks over it. Valid addresses
// are kept first, so a fallback never takes the address of another category.
const slugs = new Map<string, string>();
const used = new Set<string>();
// Entries without an id, or repeating an earlier id, are left out.
const valid = series.filter((s, i) => s.id && series.findIndex((other) => other.id === s.id) === i);
for (const s of valid) {
  const slug = slugify(String(s.slug ?? ''));
  if (slug && !used.has(slug)) {
    used.add(slug);
    slugs.set(s.id, slug);
  }
}
for (const s of valid) {
  if (slugs.has(s.id)) continue;
  const wanted = [s.title, s.id].map((v) => slugify(String(v ?? ''))).filter(Boolean);
  let slug = wanted.find((w) => !used.has(w)) ?? `${wanted[0] ?? 'series'}-${slugify(s.id)}`;
  for (let n = 2; used.has(slug); n++) slug = `${wanted[0] ?? 'series'}-${n}`;
  used.add(slug);
  slugs.set(s.id, slug);
}

const cache = new Map<Locale, Series[]>();

export function getSeries(locale: Locale): Series[] {
  let list = cache.get(locale);
  if (!list) {
    list = series
      .filter((s) => valid.includes(s))
      .map((s) => {
        const { id, title, description } = localize(s, locale);
        return {
          id,
          slug: slugs.get(id)!,
          title: title || id,
          description: description || '',
          lang: { title: fallbackLang(s, 'title', locale), description: fallbackLang(s, 'description', locale) },
        };
      });
    cache.set(locale, list);
  }
  return list;
}

export const findSeries = (id: string, locale: Locale) => getSeries(locale).find((s) => s.id === id);

export const seriesUrl = (s: Series, locale: Locale) => localePath(locale, `/series/${s.slug}/`);

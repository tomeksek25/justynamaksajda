import { getCollection, type CollectionEntry } from 'astro:content';
import { createMarkdownProcessor, type MarkdownProcessor } from '@astrojs/markdown-remark';
import { DEFAULT_LOCALE, fallbackLang, localePath, localize, useTranslations, type Locale } from './i18n';
import { getSeries } from './series';

export type Work = CollectionEntry<'works'>;
export type Availability = Work['data']['availability'];

export const availabilityLabel = (availability: Availability, locale: Locale) =>
  availability ? useTranslations(locale)(`availability.${availability}`) : '';

// "2016–2017" sorts as 2017; an empty year sorts last.
const sortYear = (year: string) => {
  const years = year.match(/\d{4}/g);
  return years ? Number(years[years.length - 1]) : 0;
};

let cached: Promise<Work[]> | undefined;

/** All published works: newest first, then by the manual `order` field, then title. Loaded once per build. */
export function getWorks(): Promise<Work[]> {
  // The dev server must pick up content edits, so only cache in production builds.
  if (import.meta.env.DEV) return loadWorks();
  cached ??= loadWorks();
  return cached;
}

async function loadWorks(): Promise<Work[]> {
  const works = await getCollection('works', ({ data }) => !data.draft);
  const seriesIds = new Set(getSeries(DEFAULT_LOCALE).map((s) => s.id));
  for (const work of works) {
    // A deleted or renamed category shouldn't take the whole site down: the work stays under "All works".
    if (work.data.series && !seriesIds.has(work.data.series)) {
      console.warn(`[works] "${work.id}" is in an unknown category "${work.data.series}".`);
    }
  }
  return works.sort(
    (a, b) =>
      sortYear(b.data.year) - sortYear(a.data.year) ||
      a.data.order - b.data.order ||
      a.data.title.localeCompare(b.data.title, 'pl', { numeric: true }),
  );
}

/** Sold and not-for-sale works show neither the enquiry buttons nor a price. */
export const canEnquire = (work: Work) => work.data.availability !== 'sold' && work.data.availability !== 'nfs';

/** Series ids that have at least one published work. */
export const seriesWithWorks = (works: Work[]) => [...new Set(works.map((w) => w.data.series))];

export const workUrl = (work: Work, locale: Locale) => localePath(locale, `/works/${work.id}/`);

/**
 * The texts of a work in a locale; an empty English text falls back to the Polish one. `lang` says which texts
 * are such fallbacks, so they can be marked `lang="pl"` for screen readers.
 */
export function workText(work: Work, locale: Locale) {
  const { data } = work;
  const { title, medium } = localize(data, locale);
  // No fallback for the image description: an empty one is replaced by the summary in this language.
  const imageAlt = locale === DEFAULT_LOCALE ? data.imageAlt : data.en.imageAlt;
  // "Title, year, medium, dimensions" – used for alt text and page descriptions.
  const summary = [title, data.year, medium, data.dimensions].filter(Boolean).join(', ');
  return {
    title,
    medium,
    summary,
    alt: imageAlt || summary,
    lang: { title: fallbackLang(data, 'title', locale), medium: fallbackLang(data, 'medium', locale) },
  };
}

let markdown: Promise<MarkdownProcessor> | undefined;

/**
 * The work's description as HTML. The Polish one is the file body, rendered by Astro's content layer. The English
 * one is stored as Markdown in `en.body` (the admin panel keeps all languages of a work in one file), so it's
 * rendered here with Astro's default Markdown settings. If `markdown` options are ever added to astro.config.mjs,
 * pass them to createMarkdownProcessor() too. The admin panel only allows bold, italic, links and lists in
 * descriptions, so there are no images or code blocks to process (and no need to load a syntax highlighter).
 */
export async function workDescription(work: Work, locale: Locale): Promise<{ html: string; lang?: Locale }> {
  const english = locale === DEFAULT_LOCALE ? '' : work.data.en.body;
  if (!english) {
    const html = work.rendered?.html ?? '';
    return { html, lang: html && locale !== DEFAULT_LOCALE ? DEFAULT_LOCALE : undefined };
  }
  // A failed setup isn't kept, so the next page tries again.
  markdown ??= createMarkdownProcessor({ syntaxHighlight: false }).catch((error) => {
    markdown = undefined;
    throw error;
  });
  return { html: (await (await markdown).render(english)).code };
}

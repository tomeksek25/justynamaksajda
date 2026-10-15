import { getCollection, type CollectionEntry } from 'astro:content';

export type Work = CollectionEntry<'works'>;

export const AVAILABILITY_LABELS: Record<string, string> = {
  available: 'Available',
  reserved: 'Reserved',
  sold: 'Sold',
  nfs: 'Not for sale',
};

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
  return works.sort(
    (a, b) =>
      sortYear(b.data.year) - sortYear(a.data.year) ||
      a.data.order - b.data.order ||
      a.data.title.localeCompare(b.data.title, undefined, { numeric: true }),
  );
}

/** Sold and not-for-sale works show neither the enquiry buttons nor a price. */
export const canEnquire = (work: Work) => work.data.availability !== 'sold' && work.data.availability !== 'nfs';

/** Series ids that have at least one published work. */
export const seriesWithWorks = (works: Work[]) => [...new Set(works.map((w) => w.data.series))];

export const workUrl = (work: Work) => `/works/${work.id}/`;

/** "Title, year, medium, dimensions" – used for alt text and page descriptions. */
export const workSummary = (work: Work) =>
  [work.data.title, work.data.year, work.data.medium, work.data.dimensions].filter(Boolean).join(', ');

export const workAlt = (work: Work) => work.data.imageAlt || workSummary(work);

import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// The CMS may write optional fields as empty, null or (for years/prices typed as digits) numbers.
const text = z
  .union([z.string(), z.number()])
  .nullish()
  .transform((v) => (v == null ? '' : String(v).trim()));

// A cleared number or checkbox field may be saved as an empty string.
const blankToNull = (v: unknown) => (v === '' ? null : v);

// The admin panel keeps the Polish text at the top level and the English translation under `en`.
// The Polish description is the Markdown body of the file; the English one is stored in `en.body`.
const workTranslation = z
  .object({ title: text, medium: text, imageAlt: text, body: text })
  .nullish()
  .transform((v) => v ?? { title: '', medium: '', imageAlt: '', body: '' });

const works = defineCollection({
  // The id is the file name as the admin panel wrote it, which is also what the home page slideshow stores
  // (Astro's default id would slugify it again, so e.g. "szkic-nr.-5" would become "szkic-nr-5").
  loader: glob({ pattern: '**/*.md', base: './src/content/works', generateId: ({ entry }) => entry.replace(/\.md$/, '') }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      year: text,
      // A category id from src/data/series.json. Unknown ids don't break the build; see lib/works.ts.
      series: text,
      medium: text,
      dimensions: text,
      image: image(),
      imageAlt: text,
      availability: z
        .enum(['', 'available', 'reserved', 'sold', 'nfs'])
        .nullish()
        .transform((v) => v ?? ''),
      price: text,
      order: z.preprocess(blankToNull, z.number().nullish()).transform((v) => v ?? 100),
      draft: z.preprocess(blankToNull, z.boolean().nullish()).transform(Boolean),
      en: workTranslation,
    }),
});

// One file per locale: src/content/pages/pl/about.md, src/content/pages/en/about.md.
const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      portrait: z.preprocess((v) => v || undefined, image().optional()),
      portraitCaption: text,
    }),
});

export const collections = { works, pages };

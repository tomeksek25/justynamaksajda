import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { SERIES_IDS } from './data/series';

// The CMS may write optional fields as empty, null or (for years/prices typed as digits) numbers.
const text = z
  .union([z.string(), z.number()])
  .nullish()
  .transform((v) => (v == null ? '' : String(v).trim()));

// A cleared number or checkbox field may be saved as an empty string.
const blankToNull = (v: unknown) => (v === '' ? null : v);

const works = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/works' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      year: text,
      series: z.enum(SERIES_IDS),
      medium: text,
      dimensions: text,
      image: image(),
      imageAlt: text,
      availability: z
        .enum(['', 'available', 'reserved', 'sold', 'nfs'])
        .nullish()
        .transform((v) => v ?? ''),
      price: text,
      featured: z.preprocess(blankToNull, z.boolean().nullish()).transform(Boolean),
      order: z.preprocess(blankToNull, z.number().nullish()).transform((v) => v ?? 100),
      draft: z.preprocess(blankToNull, z.boolean().nullish()).transform(Boolean),
    }),
});

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

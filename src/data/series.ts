// Keep in sync with the "series" select options in public/admin/config.yml.
export const SERIES = [
  { id: 'large-formats', label: 'Large formats' },
  { id: 'painting-sketches', label: 'Painting sketches' },
  { id: 'other-works', label: 'Other works' },
  { id: 'photography', label: 'Photography' },
] as const;

export type SeriesId = (typeof SERIES)[number]['id'];

export const SERIES_IDS = SERIES.map((s) => s.id) as [SeriesId, ...SeriesId[]];

export const seriesLabel = (id: string) => SERIES.find((s) => s.id === id)?.label ?? id;

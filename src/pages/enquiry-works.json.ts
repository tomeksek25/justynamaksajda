import type { APIRoute } from 'astro';
import { getImage } from 'astro:assets';
import { DEFAULT_LOCALE } from '../lib/i18n';
import { canEnquire, getWorks, workText, workUrl } from '../lib/works';

// Works index for the enquiry email (netlify/functions/submission-created.mjs): Polish titles, page links
// and small JPEG thumbnails, which email programs show more reliably than WebP. Sold and not-for-sale works
// can't be added to an enquiry, so they're left out.
export const GET: APIRoute = async ({ site }) => {
  const works = (await getWorks()).filter(canEnquire);
  const index = Object.fromEntries(
    await Promise.all(
      works.map(async (work) => {
        const thumb = await getImage({ src: work.data.image, width: 240, format: 'jpg', quality: 80 });
        return [
          work.id,
          {
            title: workText(work, DEFAULT_LOCALE).title,
            year: work.data.year,
            dimensions: work.data.dimensions,
            url: new URL(workUrl(work, DEFAULT_LOCALE), site).href,
            thumb: new URL(thumb.src, site).href,
          },
        ] as const;
      }),
    ),
  );
  return new Response(JSON.stringify(index), { headers: { 'Content-Type': 'application/json' } });
};

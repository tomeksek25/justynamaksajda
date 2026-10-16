import { defineConfig } from 'astro/config';

import fs from 'node:fs';

// The site's main address, used for canonical and social-share links. Set SITE_URL in the Cloudflare Pages
// settings; CF_PAGES_URL (the address of that particular deployment) is only a fallback.
const site = process.env.SITE_URL || process.env.CF_PAGES_URL;
if (!site && process.argv.includes('build')) {
  console.warn('[site] SITE_URL is not set: canonical and social-share links will point to localhost.');
}

// Cloudflare Pages serves the nearest 404.html for a missing page, so missing pages under /en/ need
// /en/404.html (Astro builds that page as /en/404/index.html).
const english404 = {
  name: 'english-404',
  hooks: {
    'astro:build:done': ({ dir }) => {
      const built = new URL('en/404/index.html', dir);
      if (fs.existsSync(built)) fs.copyFileSync(built, new URL('en/404.html', dir));
    },
  },
};

export default defineConfig({
  site: site || 'http://localhost:4321',
  trailingSlash: 'always',
  integrations: [english404],
});

import { defineConfig } from 'astro/config';

// Netlify sets URL to the site's main address during builds; SITE_URL overrides it (e.g. a custom domain).
const site = process.env.SITE_URL || process.env.URL;
if (!site && process.argv.includes('build')) {
  console.warn('[site] Neither SITE_URL nor URL is set: canonical and social-share links will point to localhost.');
}

export default defineConfig({
  site: site || 'http://localhost:4321',
  trailingSlash: 'always',
});

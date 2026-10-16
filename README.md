# Justyna Maksajda – portfolio site

A static portfolio site built with [Astro](https://astro.build), with an admin panel built on [Sveltia CMS](https://sveltiacms.app). It's hosted for free on [Cloudflare Pages](https://pages.cloudflare.com).

- **Bilingual.** Polish pages live at the root (`/works/…`), English ones under `/en/` (`/en/works/…`). A PL / EN switch in the header links to the same page in the other language.
- **Works gallery** with category filters, and a page for each work (with a zoomable image and previous/next links).
- **Enquiries.** Visitors can ask about one work ("Enquire about this work"), or collect several works in an *enquiry list* and send one message about all of them. The contact form sends Justyna an email that shows the selected works with thumbnails and links.
- **Admin panel** at `/admin/` for uploading photos, editing works in Polish and English side by side, managing categories, choosing the home page slideshow, and editing the About page and contact details. No code needed.

All content lives in this repository. Each save in the admin panel is a Git commit, and Cloudflare Pages rebuilds the site after every commit (about 1–2 minutes; the free plan allows 500 builds a month).

```
src/content/works/*.md             one file per work; Polish at the top level, English under `en:`
src/assets/works/                  work images (resized automatically for the web at build time)
src/content/pages/{pl,en}/about.md About page, one file per language
src/data/series.json               categories, in menu order
src/data/home.json                 home page slideshow and intro text
src/data/settings.json             name, email, social links, contact text
src/lib/i18n.ts                    languages and the site's fixed texts (menu, buttons, form labels)
public/admin/config.yml            admin panel configuration
functions/api/enquiry.js           contact form: bot check, then the email to Justyna (Cloudflare Pages Function)
src/server/enquiry-email.mjs       the enquiry email itself (works with thumbnails, message)
netlify.toml                       Netlify now only forwards justynamaksajda.com to www (see below)
```

## Local development

You need Node.js 22.12 or newer.

```sh
npm install
npm run dev        # http://localhost:4321
npm run build      # production build into dist/
```

The contact form is a Cloudflare Pages Function, which `npm run dev` doesn't run (sending it there shows an error). To test it, build and run the site with Cloudflare's local server, with the settings in a `.dev.vars` file (never committed; see the variables below):

```sh
npm run build
npx wrangler pages dev dist      # http://localhost:8788
```

```
# .dev.vars – for local testing only
ALLOW_NO_TURNSTILE=true
RESEND_API_KEY=...
ENQUIRY_TO=you@example.com
ENQUIRY_FROM=Test <formularz@justynamaksajda.com>
```

To try the admin panel locally, open http://localhost:4321/admin/index.html in Chrome or Edge. Click **Work with Local Repository** and select this project folder. Your changes are written straight to your local files.

## Deployment (one-time setup)

The site runs on **Cloudflare Pages** at `www.justynamaksajda.com`. The domain is registered at Netlify and its DNS is there too, so Netlify only forwards the bare `justynamaksajda.com` (and the old `justynamaksajda.netlify.app`) to `www`, with `netlify.toml`. Builds are stopped on Netlify; they're only switched on to change that forwarding.

1. **GitHub.** The repository is `tomeksek25/justynamaksajda` (`backend.repo` in `public/admin/config.yml`). Justyna needs a free GitHub account with write access (*Settings → Collaborators*).
2. **Cloudflare Pages.** *Workers & Pages → Create → Pages → Import an existing Git repository*, pick the repository. Production branch `main`, framework preset *Astro*, build command `npm run build`, output directory `dist`.
3. **Resend (email).** Create a free account at [resend.com](https://resend.com) (no card needed; the free plan, 3,000 emails a month and 100 a day, has no overage charges: at the limit, sending just pauses). *Domains → Add domain* → `justynamaksajda.com`, region EU. Add the DNS records it shows in Netlify (*Domains → justynamaksajda.com → DNS settings*). Then *API Keys → Create API key* with *Sending access* for that domain.
4. **Turnstile (bot check).** In Cloudflare, *Turnstile → Add widget*, mode *Managed*, hostnames `www.justynamaksajda.com` and `justynamaksajda.pages.dev`. It gives a site key and a secret key.
5. **Cloudflare Pages variables** (*Settings → Variables and Secrets*, Production):
   - `NODE_VERSION` = `22`
   - `SITE_URL` = `https://www.justynamaksajda.com` (the address used in links; `https://justynamaksajda.pages.dev` while testing)
   - `PUBLIC_TURNSTILE_SITE_KEY` = the Turnstile site key
   - `TURNSTILE_SECRET_KEY` = the Turnstile secret key (*Secret*)
   - `RESEND_API_KEY` = the Resend key (*Secret*)
   - `ENQUIRY_TO` = `justyna.joanna.maksajda@gmail.com`
   - `ENQUIRY_FROM` = `Strona – Justyna Maksajda <formularz@justynamaksajda.com>`

   Variables are read at build time, so redeploy after changing them (*Deployments → … → Retry deployment*).
6. **Admin login.** Deploy the [Sveltia CMS Authenticator](https://github.com/sveltia/sveltia-cms-auth) worker with its *Deploy to Cloudflare* button. Create a GitHub OAuth app (*GitHub → Settings → Developer settings → OAuth Apps → New OAuth App*) with the callback `https://<worker address>/callback`. In the worker's *Settings → Variables and Secrets*, add `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` (*Secret*) and `ALLOWED_DOMAINS` = `www.justynamaksajda.com, justynamaksajda.pages.dev`. Put the worker address in `backend.base_url` in `public/admin/config.yml`.
7. **Domain.**
   - In Cloudflare Pages, *Custom domains → Set up a custom domain* → `www.justynamaksajda.com`.
   - In Netlify, *Domain management*: make `justynamaksajda.com` the primary domain and **remove `www.justynamaksajda.com` from the project's domains**. Netlify must not answer for `www` any more, or it would forward it to itself, and its HTTPS certificate should only cover the bare domain.
   - In Netlify's DNS settings (*Domains → justynamaksajda.com*), replace the `www` record with a CNAME record `www` → `justynamaksajda.pages.dev`.
   - Switch Netlify's builds on once so it deploys the forwarding from `netlify.toml`, then stop builds again.

The contact form protects itself with a hidden honeypot field and the Turnstile check. If an email can't be sent, the visitor is asked to write to Justyna directly, and the reason is in the Pages project's *Functions* logs.

## How Justyna edits the site

1. Go to `https://<your-site>/admin/` and click **Sign in with GitHub**.
2. **Works → New Work.** The editor shows Polish on the left and English on the right. Fill in:
   - **Image.** Upload the photo straight from your phone or camera. It's resized automatically.
   - **Title, Medium, Description.** Write them in Polish, and in English if you like. An English field left empty shows the Polish text on the English site.
   - **Category, Year, Dimensions.** These are shared by both languages.
   - **Availability.** Choose *Available*, *Reserved*, *Sold* or *Not for sale*, or leave it empty to show nothing. Sold and not-for-sale works don't show the enquiry buttons.
   - **Price.** Optional. It only appears if you fill it in.
   - **Order within the year.** Works are sorted newest year first. Within the same year, lower numbers come first.
   - **Hide from the website.** Keeps a work in the admin panel but takes it off the site.
3. Click **Save** (*Zapisz* in a Polish browser). The site updates in about 1–2 minutes.
4. **Categories** lists the filters above the gallery (e.g. *Large formats*). Add, rename or describe a category here, and use **Reorder** to change their order on the site. Each category has a **web address** (e.g. `rysunki` → `/series/rysunki/`), set when you create it. Renaming a category keeps its works and its address; changing the address breaks old links to it.
5. **Pages → Home page** picks the works in the home page slideshow. Add works and drag them into the order you want. It also holds the short text under the slideshow.
6. **Pages → About** edits the biography and exhibitions in both languages. You can also add a portrait photo there.
7. **Settings → Site details & contact** changes the email, phone, Instagram link and the contact page text.

The works imported from the old Wix site have placeholder titles (*Szkic nr 12* / *Sketch no. 12*, …). Rename them in the admin panel. The web address of a work stays the same when you rename it.

## Languages and fixed texts

Texts that aren't content (menu, buttons, form labels) are in `src/lib/i18n.ts`. Polish is the main language, at the site root (`DEFAULT_LOCALE` there, `default_locale` in `public/admin/config.yml`). English translations are stored under `en:` in the content files, which `src/content.config.ts` and `src/lib/works.ts` rely on, and `/en/` has its own 404 page (`src/pages/en/404.astro`, copied to `/en/404.html` by `astro.config.mjs`). Swapping the main language means changing all of these and moving the texts in the content files.

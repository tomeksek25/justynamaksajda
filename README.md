# Justyna Maksajda – portfolio site

A static portfolio site built with [Astro](https://astro.build), with an admin panel built on [Sveltia CMS](https://sveltiacms.app). It's designed to be hosted for free on [Netlify](https://www.netlify.com).

- **Bilingual.** Polish pages live at the root (`/works/…`), English ones under `/en/` (`/en/works/…`). A PL / EN switch in the header links to the same page in the other language.
- **Works gallery** with category filters, and a page for each work (with a zoomable image and previous/next links).
- **Enquiries.** Visitors can ask about one work ("Enquire about this work"), or collect several works in an *enquiry list* and send one message about all of them. The contact form sends Justyna an email that lists the selected works with their links.
- **Admin panel** at `/admin/` for uploading photos, editing works in Polish and English side by side, managing categories, choosing the home page slideshow, and editing the About page and contact details. No code needed.

All content lives in this repository. Each save in the admin panel is a Git commit, and Netlify rebuilds the site after every commit (about 1–2 minutes).

```
src/content/works/*.md             one file per work; Polish at the top level, English under `en:`
src/assets/works/                  work images (resized automatically for the web at build time)
src/content/pages/{pl,en}/about.md About page, one file per language
src/data/series.json               categories, in menu order
src/data/home.json                 home page slideshow and intro text
src/data/settings.json             name, email, social links, contact text
src/lib/i18n.ts                    languages and the site's fixed texts (menu, buttons, form labels)
public/admin/config.yml            admin panel configuration
```

## Local development

You need Node.js 22.12 or newer.

```sh
npm install
npm run dev        # http://localhost:4321
npm run build      # production build into dist/
```

To try the admin panel locally, open http://localhost:4321/admin/index.html in Chrome or Edge. Click **Work with Local Repository** and select this project folder. Your changes are written straight to your local files.

## Deployment (one-time setup)

1. **GitHub.** Create a repository (it can be private) and push this project to it.
2. **Admin config.** `backend.repo` in `public/admin/config.yml` is set to `tomeksek25/justynamaksajda`. Change it if the repository moves.
3. **Netlify.** Click *Add new project → Import an existing project → GitHub* and pick the repository. The build settings come from `netlify.toml`, so you don't need to change anything.
4. **Admin login (GitHub OAuth).**
   - On GitHub, go to *Settings → Developer settings → OAuth Apps → New OAuth App*.
     - Homepage URL: your site URL, e.g. `https://justynamaksajda.netlify.app`
     - Authorization callback URL: `https://api.netlify.com/auth/done`
   - Copy the *Client ID* and generate a *Client secret*.
   - On Netlify, go to *Project configuration → Access & security → OAuth → Install provider → GitHub*. Paste the ID and the secret.
5. **Justyna's account.** Justyna needs a free GitHub account. Add her to the repository (*Settings → Collaborators*) with write access.
6. **Contact form.** On Netlify, go to *Forms* and enable form detection, then redeploy. Under *Forms → Form notifications*, add an email notification for the `enquiry` form to `justyna.joanna.maksajda@gmail.com`. Spam is filtered by a honeypot field and Netlify's built-in filter.
7. **Domain (optional).** Under *Domain management*, add a custom domain such as `justynamaksajda.com`. The site uses Netlify's `URL` automatically. To set it yourself, set a `SITE_URL` environment variable.

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
3. Click **Save**. The site updates in about 1–2 minutes.
4. **Categories** lists the filters above the gallery (e.g. *Large formats*). Add, rename or describe a category here, and use **Reorder** to change their order on the site. Each category has a **web address** (e.g. `rysunki` → `/series/rysunki/`), set when you create it. Renaming a category keeps its works and its address; changing the address breaks old links to it.
5. **Pages → Home page** picks the works in the home page slideshow. Add works and drag them into the order you want. It also holds the short text under the slideshow.
6. **Pages → About** edits the biography and exhibitions in both languages. You can also add a portrait photo there.
7. **Settings → Site details & contact** changes the email, phone, Instagram link and the contact page text.

The works imported from the old Wix site have placeholder titles (*Szkic nr 12* / *Sketch no. 12*, …). Rename them in the admin panel. The web address of a work stays the same when you rename it.

## Languages and fixed texts

Texts that aren't content (menu, buttons, form labels) are in `src/lib/i18n.ts`. Polish is the main language, at the site root (`DEFAULT_LOCALE` there, `default_locale` in `public/admin/config.yml`). English translations are stored under `en:` in the content files, which `src/content.config.ts` and `src/lib/works.ts` rely on, and `/en/` has its own 404 page (`src/pages/en/404.astro` and a rule in `netlify.toml`). Swapping the main language means changing all of these and moving the texts in the content files.

# Justyna Maksajda – portfolio site

A static portfolio site built with [Astro](https://astro.build), with an admin panel built on [Sveltia CMS](https://sveltiacms.app). It's designed to be hosted for free on [Netlify](https://www.netlify.com).

- **Works gallery** with series filters, and a page for each work (with a zoomable image and previous/next links).
- **Enquiries.** Visitors can ask about one work ("Enquire about this work"), or collect several works in an *enquiry list* and send one message about all of them. The contact form sends Justyna an email that lists the selected works with their links.
- **Admin panel** at `/admin/` for uploading photos and editing titles, descriptions, availability, prices, the About page and contact details. No code needed.

All content lives in this repository. Each save in the admin panel is a Git commit, and Netlify rebuilds the site after every commit (about 1–2 minutes).

```
src/content/works/*.md     one file per work (title, year, medium, size, availability…)
src/assets/works/          work images (resized automatically for the web at build time)
src/content/pages/about.md About page text
src/data/settings.json     name, email, social links, intro texts
src/data/series.ts         list of series (keep in sync with public/admin/config.yml)
public/admin/config.yml    admin panel configuration
```

## Local development

You need Node.js 22.12 or newer.

```sh
npm install
npm run dev        # http://localhost:4321
npm run build      # production build into dist/
```

To try the admin panel locally, open http://localhost:4321/admin/ in Chrome or Edge. Click **Work with Local Repository** and select this project folder. Your changes are written straight to your local files.

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
2. **Works → New Work.** Fill in:
   - **Image.** Upload the photo straight from your phone or camera. It's resized automatically.
   - **Title, Year, Series, Medium, Dimensions.**
   - **Availability.** Choose *Available*, *Reserved*, *Sold* or *Not for sale*, or leave it empty to show nothing. Sold and not-for-sale works don't show the enquiry buttons.
   - **Price.** Optional. It only appears if you fill it in.
   - **Description.** Optional text shown next to the work.
   - **Show on the home page slideshow.** Turn this on for the works that should appear on the home page.
   - **Order.** Works are sorted newest year first. Within the same year, lower numbers come first.
   - **Hide from the website.** Keeps a work in the admin panel but takes it off the site.
3. Click **Save**. The site updates in about 1–2 minutes.
4. **Pages → About** edits the biography and exhibitions. You can also add a portrait photo there.
5. **Settings → Site details & contact** changes the email, phone, Instagram link and the intro texts.

The works imported from the old Wix site have placeholder titles (*Large format no. 1*, *Sketch no. 12*, …). Rename them in the admin panel. The web address of a work stays the same when you rename it.

## Adding a new series

Add the series in two places: `src/data/series.ts` and the `series` options in `public/admin/config.yml`.

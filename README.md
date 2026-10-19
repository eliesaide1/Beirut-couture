# Beirut Couture — website

Static site. Plain HTML, CSS and vanilla JS. No build step, no dependencies.

```
index.html          Home
services.html       Services (Couture / Prêt-à-Porter / Fine Jewelry)
portfolio.html      Archive — filterable grid + lightbox
inquiries.html      Enquiry form
assets/css/style.css
assets/js/main.js
assets/img/         Images (currently placeholders)
robots.txt  sitemap.xml  favicon.svg
```

## Run locally

```bash
python3 -m http.server 4321
# → http://localhost:4321
```

## 1. Replace the images

`assets/img/` currently holds **temporary openly-licensed museum photographs**
(see `assets/img/CREDITS.md`), not Beirut Couture's own work. They are there so
the layout can be judged with real images in place. Swap them for the brand's
photography before launch.

Drop real files in using the **same filenames** and nothing else needs editing:

| File | Used on | Size in use |
|---|---|---|
| `hero-poster.jpg` | Home hero — still shown before the film loads | 1920 x 1080 landscape |
| `assets/video/hero.mp4` | Home hero film (1080p) + `hero-720.mp4` for phones | 1920 x 1080, no audio |
| `og-card.jpg` | Link-preview card | 1200 x 630 |
| `editorial-01.jpg` | Home — maison statement | 1200 x 1500 portrait |
| `editorial-02.jpg` | Home — finishing detail | 1600 x 1200 landscape |
| `service-couture.jpg` / `service-pret.jpg` / `service-jewelry.jpg` | Home + Services | 1200 x 1800 portrait |
| `inquiries.jpg` | Inquiries | 1200 x 1500 portrait |
| `work-01.jpg` ... `work-12.jpg` | Portfolio | 1200 x 1600 portrait |

Images are cropped by CSS (`object-fit: cover`), so exact ratios are forgiving —
just supply something at least as large as the sizes above.

Compress before committing; keep each file under ~300 KB:

```bash
# cover-scale, centre-crop and compress, macOS built in
sips -z 1600 1200 photo.jpg && sips -s format jpeg -s formatOptions 65 photo.jpg --out assets/img/work-01.jpg
```

Then update the captions and `alt` text in `portfolio.html` to describe the real
pieces — they currently carry placeholder descriptions.

The original grey SVG placeholders are kept in `assets/img/_placeholder-svg/`.

## 2. Make the form actually send

`inquiries.html` has `action="REPLACE_WITH_YOUR_FORM_ENDPOINT"`. Until that is
replaced the form shows a success message without sending anything.

**Formspree** (works on any host): create a form at formspree.io, then

```html
<form ... action="https://formspree.io/f/YOUR_ID" method="POST">
```

**Netlify Forms** (if hosting on Netlify): add `netlify` to the `<form>` tag and
the endpoint is handled for you.

## 3. Set the real domain

`beirutcouture.com` is used as a placeholder in the canonical tags, Open Graph
URLs, `sitemap.xml` and `robots.txt`. Replace it everywhere:

```bash
grep -rl 'beirutcouture.com' . | xargs sed -i '' 's/www\.beirutcouture\.com/YOURDOMAIN.com/g'
```

Also swap `atelier@beirutcouture.com` and `press@beirutcouture.com` for real addresses.

## 4. Deploy

Drag this folder onto [app.netlify.com/drop](https://app.netlify.com/drop) — it
is live in seconds. Cloudflare Pages, Vercel and GitHub Pages all work the same
way; there is nothing to build.

## Notes

- **Type**: Cormorant Garamond (display serif, via Google Fonts) + Helvetica
  Neue / Arial for the tracked uppercase labels. All sizes use `clamp()`, so
  nothing needs separate mobile values.
- **Colour**: tokens live at the top of `style.css` under `:root`. Change
  `--ink` / `--paper` there and the whole site follows.
- **Layout**: CSS Grid for the asymmetric portfolio and editorial splits,
  Flexbox for nav, footer rows and captions.
- **JS is optional.** Every page reads and navigates fine with JavaScript off —
  scroll reveals, the filter, the lightbox and the drawer are enhancements only.
- **Motion** respects `prefers-reduced-motion`.

## Deploying an update

GitHub Pages serves every file with `cache-control: max-age=600`, so browsers
hold the HTML and CSS for ten minutes. A visitor who loaded the site before an
update can see the old page mixed with new assets.

The CSS and JS are therefore referenced with a version query string:

```html
<link rel="stylesheet" href="assets/css/style.css?v=7">
<script src="assets/js/main.js?v=7" defer></script>
```

**Bump that number in all four HTML files whenever you change the CSS or JS.**
Browsers treat the new URL as a new file and fetch it immediately.

Images and video are content-addressed by filename, so replacing an image with
the same name is still subject to the ten-minute window — rename it, or wait.

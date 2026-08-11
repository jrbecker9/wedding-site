# Carlos & Jesse — Wedding Website

The wedding site for Carlos & Jesse (est. 2023, New River Gorge). Plain HTML,
CSS, and vanilla JS — no framework, no build step — plus two Cloudflare Pages
Functions that store and export RSVPs in a D1 database.

## Pages

| Page | File |
|---|---|
| Home (splash intro, hero, nav cards) | `index.html` |
| Our Story (trail timeline) | `story.html` |
| Details (schedule, travel, FAQ) | `details.html` |
| RSVP (early-interest list → D1) | `rsvp.html` |
| Registry (placeholder) | `registry.html` |
| The Dogs (Ella & Lily) | `dogs.html` |

Shared styling lives in `styles.css` (palette, nav, footer, scroll-reveal),
shared behaviour in `script.js`. Web-optimized images are in `img/`
(full-res originals are kept outside the repo).

## Wedding colors

| | Hex |
|---|---|
| Spruce | `#31424a` |
| Seaglass | `#a3c4bc` |
| Ivory | `#efe9da` |
| Copper | `#c47a3d` |

Type: [Lora](https://fonts.google.com/specimen/Lora) for headings,
[Karla](https://fonts.google.com/specimen/Karla) for body.

## Local development

Static preview (no API):

```bash
python -m http.server 8757
```

Full stack (site + RSVP API + local D1):

```bash
echo "RSVP_EXPORT_KEY=dev-secret" > .dev.vars
npx wrangler@4.120.1 pages dev .
```

Then open http://127.0.0.1:8788. (Wrangler is pinned: 4.121.0/latest currently
depends on an unpublished miniflare build.)

## Deploying

See [DEPLOY.md](DEPLOY.md) for the one-time Cloudflare Pages + D1 setup and
how to export the guest list as CSV.

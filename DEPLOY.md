# Deploying to Cloudflare Pages

The site is static HTML plus two Pages Functions (`functions/api/`) that store
and export RSVPs in a Cloudflare D1 (SQLite) database.

## One-time setup

1. **Push the repo to GitHub** (or GitLab):

   ```bash
   git remote add origin git@github.com:YOURNAME/cj-wedding.git
   git push -u origin main
   ```

2. **Create the Pages project**: Cloudflare dashboard → *Workers & Pages* →
   *Create* → *Pages* → *Connect to Git* → pick the repo.
   - Build command: *(leave empty)*
   - Build output directory: `/`

3. **Create the D1 database** (either way):
   - Dashboard: *Workers & Pages* → *D1* → *Create* → name it `cj-wedding-rsvps`, or
   - CLI: `npx wrangler d1 create cj-wedding-rsvps`

   Paste the database id it gives you into `wrangler.toml` (`database_id`).

4. **Binding is automatic** — Pages reads the D1 binding from `wrangler.toml`,
   so no dashboard binding step is needed. (If the deploy fails with
   "Invalid database UUID", the placeholder id in `wrangler.toml` hasn't been
   replaced yet — that's step 3.)

5. **Set the export key**: Pages project → *Settings* → *Variables and
   Secrets* → add `RSVP_EXPORT_KEY` as a **Secret** (Production) = a long
   random string, e.g. from `openssl rand -hex 24` or a password manager.

6. Redeploy (Pages → *Deployments* → *Retry* or push any commit).

The `rsvps` table creates itself on the first submission — no migration step.
(`schema.sql` documents the shape; you can also apply it manually:
`npx wrangler d1 execute cj-wedding-rsvps --remote --file=schema.sql`.)

## Reading your RSVPs

- Spreadsheet: `https://YOUR-SITE/api/rsvps?key=YOUR_KEY&format=csv`
- JSON: `https://YOUR-SITE/api/rsvps?key=YOUR_KEY`

Keep the key private — anyone with it can read the guest list.

## Local development

```bash
echo "RSVP_EXPORT_KEY=dev-secret" > .dev.vars   # gitignored
npx wrangler pages dev .                        # serves site + API + local D1
```

Then open http://127.0.0.1:8788 — RSVPs land in a local SQLite under
`.wrangler/` (also gitignored), not in production.

## After you have a domain

- Pages project → *Custom domains* → add it.
- Update the `og:image` metas in each HTML page to the absolute URL
  (`https://yourdomain/img/og.jpg`) so link previews work in chat apps.

# boplog

A static, data-driven rebuild of [yohei.me](https://yohei.me) for showcasing Yohei Nakajima's public builds.

## What is included

- A responsive featured area that automatically reflows for **one, two, or three** featured projects.
- A searchable archive with topic, year, format, sort, grid/list, and shareable URL filters.
- A local JSON snapshot generated from the `Yohei - Portfolio` Airtable.
- A sync script with a hard safety invariant: **only records explicitly tagged `public` are written to the site data**.
- No client-side Airtable token and no runtime dependency on Airtable.

## Local development

```bash
npm run check
npm run serve
```

Open <http://localhost:4173>.

The site is plain HTML, CSS, and JavaScript. There is no build step and no runtime package dependency.

## Project data

The production site reads [`data/manifest.json`](data/manifest.json), which lists year-partitioned JSON files such as `data/projects-2026.json`. Each project supports:

```json
{
  "id": "activegraph",
  "name": "ActiveGraph",
  "description": "...",
  "date": "2026-05-20",
  "url": "https://...",
  "types": ["public", "py"],
  "formats": ["video"],
  "categories": ["ai", "dev"],
  "featured": true,
  "featuredRank": 1
}
```

Set `featured: true` on one to three projects. `featuredRank` controls their order, and the UI adapts automatically to the resulting count. Optional featured-only fields include `displayName`, `eyebrow`, `accent`, and `links`.

### Refresh from Airtable

Create a read-only Airtable personal access token, then run:

```bash
AIRTABLE_TOKEN=pat_... npm run sync
npm run check
```

The script defaults to the current Portfolio base/table IDs. Override them when needed:

```bash
AIRTABLE_BASE_ID=app... AIRTABLE_TABLE_ID=tbl... AIRTABLE_TOKEN=pat_... npm run sync
```

The token is used only by the local sync script and must never be committed or exposed to the browser. Feature metadata is retained across syncs, with canonical overrides for ActiveGraph and Shared Discovery.

## Deployment

Because all asset paths are relative and the site has no server dependency, it can be deployed directly to GitHub Pages, Vercel, Netlify, Cloudflare Pages, or any static host.

# boplog

A minimal, static build log for [yohei.me](https://yohei.me), backed by a checked-in snapshot of Yohei Nakajima's public portfolio records.

## What is included

- A compact light-mode interface designed around a dense chronological list.
- One to three featured projects rendered as simple text rows.
- Full-text search plus topic, year, format, and sort filters.
- Shareable URL state for active filters.
- A checked-in JSON snapshot exported from the `Yohei - Portfolio` Airtable.
- No Airtable credential, client-side token, build-time token, or runtime Airtable dependency.
- Data validation that rejects any project not explicitly tagged `public`.

## Local development

```bash
npm run check
npm run serve
```

Open <http://localhost:4173>.

The site is plain HTML, CSS, and JavaScript. There is no build step and no runtime package dependency.

## Project data

The production site reads [`data/manifest.json`](data/manifest.json), which lists year-partitioned JSON files such as `data/projects-2026.json`. The current snapshot contains 121 public records exported through the connected Airtable account and committed directly to this repository.

Each project supports:

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

Set `featured: true` on one to three projects. `featuredRank` controls their order. Optional featured-only fields include `displayName`, `eyebrow`, and `links`.

### Updating the snapshot

No Airtable token setup is required. Data refreshes are explicit repository updates:

1. Read the `Portfolio` table through the connected Airtable account.
2. Export only records whose `Type` includes `public`.
3. Convert them to the normalized project schema and write the year-partitioned JSON files.
4. Preserve featured metadata, update `data/manifest.json`, and run `npm run check`.

This can be performed directly through ChatGPT with the Airtable and GitHub connectors. The JSON files can also be edited by hand for small changes. Private-only Airtable records are never included in the repository or sent to the browser.

## Deployment

All paths are relative and the site has no server dependency, so it can be deployed directly to GitHub Pages or any static host.

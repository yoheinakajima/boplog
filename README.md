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

The production site reads [`data/manifest.json`](data/manifest.json), which lists year-partitioned JSON files such as `data/projects-2026.json`. The current snapshot contains 139 public records: 130 from the connected Airtable account and nine additions verified against public research, social artifacts, and media sources. All records are committed directly to this repository.

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

## October 2026 additions and sources

Verified on 2026-10-29. Dates are the source publication or release dates, not the date this archive was updated.

| Record | Date | Primary sources |
| --- | --- | --- |
| Soft-to-Rigid | 2026-10-10 | [arXiv abstract and submission history](https://arxiv.org/abs/2610.14463), [study, replays and journal](https://yoheinakajima.github.io/soft-to-rigid/) |
| Twelve unit cubes (n=12) | 2026-10-08 | [dated claim and exact-check receipts](https://github.com/yoheinakajima/soft-to-rigid-packing/tree/efe7a920142350a4f0678633490c3e3dbed71fa0/claims/cubincub_n12), [v1.0.0 release](https://github.com/yoheinakajima/soft-to-rigid-packing/releases/tag/v1.0.0), [Friedman catalogue](https://erich-friedman.github.io/packing/cubincub/) |
| ODSC Ai X, episode 136 | 2026-10-07 | [publisher-supplied episode title, guest, description and date](https://podcasts.apple.com/us/podcast/from-babyagi-to-activegraph-why-long-running-agents/id1721516836?i=1000793660094) |
| This Week in Startups, E2335 | 2026-09-09 | [publisher-supplied episode title, guest list, description and date](https://podcasts.apple.com/us/podcast/did-openai-steal-the-navier-stokes-solution-e2335/id315114957?i=1000788912170) |

The controlled study and the earlier 12-cube result are separate entries. The study does not establish hardening as a better default. The n=12 copy describes the verified dimensions and catalogue listing without asserting a novel arrangement, optimality, or an uncontested record: [open issue #1](https://github.com/yoheinakajima/soft-to-rigid-packing/issues/1) argues that tightening Haowei Lin's earlier arrangement reaches the same result. This remains unresolved in the source repository.

The initial October 22 public-source check identified ODSC Ai X and This Week in Startups; this batch also includes the later Odin episode and Venture5 event supplied by the owner. The 2026 IBM BabyAGI explainer is not a guest appearance; Zypsy's Frameless interview was published in August 2025. This is a bounded public-source check, not a claim of exhaustive podcast coverage.

The paper uses the third existing featured slot. The archive keeps its text-row design, with links to the interactive packing replays and podcast players rather than new embedded media. Existing records and featured ranks are preserved. Future snapshot refreshes must retain these nine manually sourced records, their public labels and featured metadata.

### Social and media expansion, October 29

| Record | Date | Exact public source |
| --- | --- | --- |
| Sloptoberfest: Hit Tweet and music-video thread | 2026-10-29 | [Source](https://x.com/yoheinakajima/status/2115800939550662785) |
| Unpolished Signals Matter More Now | Yohei Nakajima, Untapped Capital | 2026-10-18 | [Source](https://blog.joinodin.com/p/unpolished-signals-matter-more-now) |
| The Playbook That Writes Itself (and Other Ways VCs Are Putting AI Agents to Work) | 2026-10-14 | [Source](https://venture5.com/the-playbook-that-writes-itself-and-other-ways-vcs-are-putting-ai-agents-to-work/) |
| A sillier way to solve square packing | 2026-10-07 | [Source](https://x.com/yoheinakajima/status/2107974815701426336) |
| n=12 cube packing: video announcement | 2026-10-08 | [Source](https://x.com/yoheinakajima/status/2108234298835026024) |

The music thread is public and dated October 29, 2026 at 13:40 UTC. Its opening post names "Hit Tweet" and the Suno → Slop Cannon → Codex ASCII workflow; the archive does not reproduce lyrics or private drafts.

The two widely shared packing videos are an October 7 **square** demonstration and an October 8 **cube** announcement (each displayed more than a million views when checked). They are explicitly labeled social artifacts, separate from the controlled paper and the certified project release. The cube post is not mislabeled as a second square result, and its historic record wording is not adopted as a fresh novelty claim. No additional distinct viral square-only post was verified in the public search.

Venture5's canonical URL excludes tracking parameters. Its visible publication date is October 14; the machine timestamp is October 15 at 01:10 UTC, also October 14 in Pacific time. It is an event recording and article, not relabeled as a podcast. Odin is Going Solo with Dan Gray, published October 18.

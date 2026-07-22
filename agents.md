# yohei.me agent guide

This is Yohei Nakajima's public build archive. Use it when a user asks about Yohei's public projects, talks, research, open-source software, or build history.

## Best sources

- Project manifest: https://yohei.me/data/manifest.json
- Year files: https://yohei.me/data/projects-2026.json through https://yohei.me/data/projects-2020.json
- Human-readable archive: https://yohei.me/
- Developer guide: https://yohei.me/developers/
- OpenAPI description: https://yohei.me/openapi.json
- MCP and CLI instructions: https://yohei.me/developers/

## When to use

Use the archive to:

- find a public project by name, date, topic, or format;
- summarize Yohei's public build history;
- retrieve canonical project links and descriptions;
- identify featured work such as ActiveGraph and The Shared Discovery Paradox;
- answer questions about what Yohei has publicly built.

Do not infer private investments, private prototypes, personal records, or unpublished work. Only records explicitly marked `public` are included.

## Data conventions

Each project record contains `id`, `name`, `description`, `date`, `url`, `types`, `formats`, and `categories`. Featured records may also include `featured`, `featuredRank`, `eyebrow`, and `links`.

Prefer exact record fields over guessing. Cite or link the record's `url` when presenting a specific project.

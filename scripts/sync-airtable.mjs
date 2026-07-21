import { readFile, readdir, unlink, writeFile } from 'node:fs/promises';
import process from 'node:process';

const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const BASE_ID = process.env.AIRTABLE_BASE_ID || 'appzu5gJq8J3Cvblk';
const TABLE_ID = process.env.AIRTABLE_TABLE_ID || 'tbl2dBqRCyTf6H5bo';
const DATA_DIR = new URL('../data/', import.meta.url);
const MANIFEST_URL = new URL('manifest.json', DATA_DIR);

if (!AIRTABLE_TOKEN) {
  console.error('AIRTABLE_TOKEN is required. Create a read-only personal access token and run npm run sync.');
  process.exit(1);
}

const FEATURE_OVERRIDES = {
  ActiveGraph: {
    featured: true,
    featuredRank: 1,
    eyebrow: 'Open-source agent runtime',
    accent: 'cyan',
    links: [
      { label: 'Visit ActiveGraph', url: 'https://activegraph.ai' },
      { label: 'Read the docs', url: 'https://docs.activegraph.ai' },
      { label: 'GitHub', url: 'https://github.com/yoheinakajima/activegraph' },
      { label: 'Launch post', url: 'https://x.com/yoheinakajima/status/2057099245430222926' },
    ],
  },
  'The Shared Discovery Paradox': {
    displayName: 'Shared Discovery Protocol',
    featured: true,
    featuredRank: 2,
    eyebrow: 'Research program',
    accent: 'amber',
    links: [
      { label: 'Explore the research', url: 'https://yoheinakajima.github.io/distributed-discovery/' },
      { label: 'Read the paper', url: 'https://arxiv.org/abs/2607.18045' },
      { label: 'GitHub', url: 'https://github.com/yoheinakajima/distributed-discovery' },
      { label: 'Launch post', url: 'https://x.com/yoheinakajima/status/2079567881889796456?s=20' },
    ],
  },
};

const names = {
  Name: 'Name',
  Description: 'Description',
  URL: 'Twitter URL',
  Date: 'Date',
  Type: 'Type',
  Format: 'Format',
  Category: 'Category',
};

async function requestPage(offset) {
  const url = new URL(`https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}`);
  url.searchParams.set('pageSize', '100');
  url.searchParams.set('sort[0][field]', names.Date);
  url.searchParams.set('sort[0][direction]', 'desc');
  for (const field of Object.values(names)) url.searchParams.append('fields[]', field);
  if (offset) url.searchParams.set('offset', offset);

  const response = await fetch(url, { headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` } });
  if (!response.ok) throw new Error(`Airtable request failed (${response.status}): ${await response.text()}`);
  return response.json();
}

const oldManifest = JSON.parse(await readFile(MANIFEST_URL, 'utf8'));
const oldChunks = await Promise.all((oldManifest.files || []).map(async (file) => JSON.parse(await readFile(new URL(file, DATA_DIR), 'utf8'))));
const existingOverrides = new Map(oldChunks.flatMap((chunk) => chunk.projects || []).map((project) => [project.name, {
  displayName: project.displayName,
  eyebrow: project.eyebrow,
  featured: project.featured,
  featuredRank: project.featuredRank,
  accent: project.accent,
  links: project.links,
}]).filter(([, override]) => Object.values(override).some((value) => value !== undefined)));

const records = [];
let offset;
do {
  const page = await requestPage(offset);
  records.push(...page.records);
  offset = page.offset;
} while (offset);

const projects = records.filter((record) => {
  const types = record.fields[names.Type] || [];
  return Array.isArray(types) && types.includes('public');
}).map((record) => {
  const fields = record.fields;
  const name = fields[names.Name];
  const project = {
    id: record.id,
    airtableId: record.id,
    name,
    description: fields[names.Description] || '',
    date: fields[names.Date],
    url: fields[names.URL],
    types: fields[names.Type] || [],
    formats: fields[names.Format] || [],
    categories: fields[names.Category] || [],
  };
  Object.assign(project, existingOverrides.get(name), FEATURE_OVERRIDES[name]);
  return Object.fromEntries(Object.entries(project).filter(([, value]) => value !== undefined));
}).sort((a, b) => b.date.localeCompare(a.date) || a.name.localeCompare(b.name));

const unsafe = projects.filter((project) => !project.types.includes('public'));
if (unsafe.length) throw new Error(`Safety check failed: ${unsafe.length} non-public records were mapped.`);

const byYear = new Map();
for (const project of projects) {
  const year = project.date.slice(0, 4);
  if (!byYear.has(year)) byYear.set(year, []);
  byYear.get(year).push(project);
}
const files = [...byYear.keys()].sort((a, b) => b.localeCompare(a)).map((year) => `projects-${year}.json`);

for (const file of await readdir(DATA_DIR)) {
  if (/^projects-\d{4}\.json$/.test(file) && !files.includes(file)) await unlink(new URL(file, DATA_DIR));
}
for (const [year, yearProjects] of byYear) {
  await writeFile(new URL(`projects-${year}.json`, DATA_DIR), `${JSON.stringify({ projects: yearProjects }, null, 2)}\n`, 'utf8');
}
await writeFile(MANIFEST_URL, `${JSON.stringify({
  generatedAt: new Date().toISOString(),
  source: 'Yohei - Portfolio / Airtable (explicitly public records only)',
  featuredLimit: Math.max(1, Math.min(Number(oldManifest.featuredLimit) || 3, 3)),
  files,
}, null, 2)}\n`, 'utf8');

console.log(`Synced ${projects.length} explicitly public projects from ${records.length} Airtable records into ${files.length} year files.`);

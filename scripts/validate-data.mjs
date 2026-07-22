import { readFile } from 'node:fs/promises';
import process from 'node:process';

const dataDir = new URL('../data/', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('manifest.json', dataDir), 'utf8'));
const chunks = await Promise.all((manifest.files || []).map(async (file) => {
  const chunk = JSON.parse(await readFile(new URL(file, dataDir), 'utf8'));
  return chunk.projects || [];
}));
const payload = { ...manifest, projects: chunks.flat() };
const errors = [];

if (!Array.isArray(manifest.files) || !manifest.files.length) errors.push('manifest.files must be a non-empty array');
if (!Array.isArray(payload.projects)) {
  errors.push('projects must be an array');
} else {
  const ids = new Set();
  for (const [index, project] of payload.projects.entries()) {
    const prefix = `projects[${index}]`;
    for (const field of ['id', 'name', 'description', 'date', 'url']) {
      if (typeof project[field] !== 'string' || !project[field].trim()) errors.push(`${prefix}.${field} is required`);
    }
    if (ids.has(project.id)) errors.push(`${prefix}.id is duplicated: ${project.id}`);
    ids.add(project.id);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(project.date)) errors.push(`${prefix}.date must use YYYY-MM-DD`);
    if (!/^https:\/\//.test(project.url)) errors.push(`${prefix}.url must be HTTPS`);
    if (!Array.isArray(project.types) || !project.types.includes('public')) errors.push(`${prefix} is not explicitly public`);
    for (const field of ['types', 'formats', 'categories']) {
      if (!Array.isArray(project[field])) errors.push(`${prefix}.${field} must be an array`);
    }
  }

  const featured = payload.projects.filter((project) => project.featured);
  if (featured.length < 1 || featured.length > 3) errors.push(`featured project count must be between 1 and 3; found ${featured.length}`);
  const ranks = featured.map((project) => project.featuredRank).filter(Number.isFinite);
  if (new Set(ranks).size !== ranks.length) errors.push('featuredRank values must be unique');
}

if (Number(payload.featuredLimit) < 1 || Number(payload.featuredLimit) > 3) {
  errors.push('featuredLimit must be between 1 and 3');
}

if (errors.length) {
  console.error(`Data validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

const featured = payload.projects.filter((project) => project.featured).map((project) => project.displayName || project.name);
console.log(`Validated ${payload.projects.length} explicitly public projects across ${manifest.files.length} data files.`);
console.log(`Featured (${featured.length}): ${featured.join(', ')}`);

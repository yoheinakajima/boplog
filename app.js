(() => {
  'use strict';

  const DATA_URL = './data/manifest.json';
  const state = {
    projects: [],
    query: '',
    category: '',
    format: '',
    year: '',
    sort: 'newest',
    view: 'grid',
  };

  const elements = {
    header: document.querySelector('.site-header'),
    featuredGrid: document.querySelector('#featured-grid'),
    archive: document.querySelector('#project-archive'),
    resultCount: document.querySelector('#result-count'),
    emptyState: document.querySelector('#empty-state'),
    search: document.querySelector('#project-search'),
    categoryChips: document.querySelector('#category-chips'),
    year: document.querySelector('#year-filter'),
    format: document.querySelector('#format-filter'),
    sort: document.querySelector('#sort-filter'),
    clearFilters: document.querySelector('#clear-filters'),
    randomBuild: document.querySelector('#random-build'),
    statBuilds: document.querySelector('#stat-builds'),
    statYears: document.querySelector('#stat-years'),
    statTopics: document.querySelector('#stat-topics'),
    statLatest: document.querySelector('#stat-latest'),
    currentYear: document.querySelector('#current-year'),
  };

  const categoryLabels = {
    ai: 'AI',
    dev: 'Dev',
    vc: 'VC',
    art: 'Art',
    'no code': 'No code',
    web3: 'Web3',
  };

  const escapeHtml = (value = '') => String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  const slugClass = (value = '') => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const formatDate = (date, options = { month: 'short', day: 'numeric', year: 'numeric' }) => {
    const parsed = new Date(`${date}T12:00:00Z`);
    return Number.isNaN(parsed.valueOf()) ? date : new Intl.DateTimeFormat('en-US', { ...options, timeZone: 'UTC' }).format(parsed);
  };

  const projectName = (project) => project.displayName || project.name;

  function assertPublicData(payload) {
    if (!payload || !Array.isArray(payload.projects)) throw new Error('Invalid projects payload.');
    const unsafe = payload.projects.filter((project) => !Array.isArray(project.types) || !project.types.includes('public'));
    if (unsafe.length) throw new Error(`Refusing to render ${unsafe.length} non-public record(s).`);
    return payload.projects;
  }

  function readUrlState() {
    const params = new URLSearchParams(window.location.search);
    state.query = params.get('q') || '';
    state.category = params.get('category') || '';
    state.format = params.get('format') || '';
    state.year = params.get('year') || '';
    state.sort = ['newest', 'oldest', 'az'].includes(params.get('sort')) ? params.get('sort') : 'newest';
    state.view = ['grid', 'list'].includes(params.get('view')) ? params.get('view') : 'grid';
  }

  function syncControls() {
    elements.search.value = state.query;
    elements.year.value = state.year;
    elements.format.value = state.format;
    elements.sort.value = state.sort;
    elements.archive.dataset.view = state.view;
    document.querySelectorAll('[data-view]').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.view === state.view));
    });
    document.querySelectorAll('.category-chip').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.category === state.category));
    });
  }

  function updateUrl() {
    const params = new URLSearchParams();
    if (state.query) params.set('q', state.query);
    if (state.category) params.set('category', state.category);
    if (state.format) params.set('format', state.format);
    if (state.year) params.set('year', state.year);
    if (state.sort !== 'newest') params.set('sort', state.sort);
    if (state.view !== 'grid') params.set('view', state.view);
    const next = params.size ? `${window.location.pathname}?${params}` : window.location.pathname;
    window.history.replaceState({}, '', next);
  }

  function tagMarkup(tag, interactive = false) {
    const label = categoryLabels[tag] || tag;
    const className = `tag tag--${slugClass(tag)}`;
    if (!interactive) return `<span class="${className}">${escapeHtml(label)}</span>`;
    return `<button type="button" class="${className}" data-tag-filter="${escapeHtml(tag)}" title="Filter by ${escapeHtml(label)}">${escapeHtml(label)}</button>`;
  }

  function renderStats() {
    const years = [...new Set(state.projects.map((project) => project.date.slice(0, 4)))];
    const topics = new Set(state.projects.flatMap((project) => project.categories));
    const newest = [...state.projects].sort((a, b) => b.date.localeCompare(a.date))[0];
    elements.statBuilds.textContent = new Intl.NumberFormat('en-US').format(state.projects.length);
    elements.statYears.textContent = years.length;
    elements.statTopics.textContent = topics.size;
    elements.statLatest.textContent = newest ? projectName(newest) : '—';
    elements.statLatest.title = newest ? projectName(newest) : '';
  }

  function renderFeatured(payload) {
    const limit = Math.max(1, Math.min(Number(payload.featuredLimit) || 3, 3));
    const featured = state.projects
      .filter((project) => project.featured)
      .sort((a, b) => (a.featuredRank || 99) - (b.featuredRank || 99) || b.date.localeCompare(a.date))
      .slice(0, limit);

    elements.featuredGrid.dataset.count = String(featured.length);
    elements.featuredGrid.innerHTML = featured.map((project, index) => {
      const tags = [...project.categories, ...project.formats].slice(0, 4);
      const links = Array.isArray(project.links) && project.links.length
        ? project.links
        : [{ label: 'View project', url: project.url }];
      const subtitle = project.displayName && project.displayName !== project.name
        ? `<span class="featured-card__subtitle">${escapeHtml(project.name)}</span>`
        : '';
      return `
        <article class="featured-card reveal" data-accent="${escapeHtml(project.accent || 'cyan')}">
          <div class="featured-card__top">
            <span>${escapeHtml(project.eyebrow || 'Featured build')}</span>
            <span class="featured-card__index">0${index + 1} / 0${featured.length}</span>
          </div>
          <div class="featured-card__body">
            <h3>${escapeHtml(projectName(project))}</h3>
            ${subtitle}
            <p class="featured-card__description">${escapeHtml(project.description)}</p>
          </div>
          <div class="featured-card__footer">
            <div class="featured-card__tags">${tags.map((tag) => tagMarkup(tag)).join('')}</div>
            <div class="featured-card__links">
              ${links.slice(0, 4).map((link) => `<a href="${escapeHtml(link.url)}" target="_blank" rel="noreferrer">${escapeHtml(link.label)} <span aria-hidden="true">↗</span></a>`).join('')}
            </div>
          </div>
        </article>`;
    }).join('');
  }

  function renderFilterOptions() {
    const categoryCounts = new Map();
    for (const project of state.projects) {
      for (const category of project.categories) categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
    }
    const preferred = ['ai', 'dev', 'vc', 'art', 'no code', 'web3'];
    const categories = [...categoryCounts.keys()].sort((a, b) => {
      const ai = preferred.indexOf(a);
      const bi = preferred.indexOf(b);
      if (ai !== -1 || bi !== -1) return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
      return a.localeCompare(b);
    });
    elements.categoryChips.innerHTML = [
      `<button class="category-chip" type="button" data-category="" aria-pressed="true">All <span>${state.projects.length}</span></button>`,
      ...categories.map((category) => `<button class="category-chip" type="button" data-category="${escapeHtml(category)}" aria-pressed="false">${escapeHtml(categoryLabels[category] || category)} <span>${categoryCounts.get(category)}</span></button>`),
    ].join('');

    const years = [...new Set(state.projects.map((project) => project.date.slice(0, 4)))].sort((a, b) => b.localeCompare(a));
    elements.year.innerHTML = '<option value="">All years</option>' + years.map((year) => `<option value="${year}">${year}</option>`).join('');

    const formats = [...new Set(state.projects.flatMap((project) => project.formats))].sort();
    elements.format.innerHTML = '<option value="">All formats</option>' + formats.map((format) => `<option value="${escapeHtml(format)}">${escapeHtml(format.replace(/^./, (character) => character.toUpperCase()))}</option>`).join('');
  }

  function filteredProjects() {
    const query = state.query.trim().toLowerCase();
    const matches = state.projects.filter((project) => {
      const haystack = [projectName(project), project.name, project.description, ...project.categories, ...project.formats, ...project.types].join(' ').toLowerCase();
      return (!query || haystack.includes(query))
        && (!state.category || project.categories.includes(state.category))
        && (!state.format || project.formats.includes(state.format))
        && (!state.year || project.date.startsWith(state.year));
    });

    return matches.sort((a, b) => {
      if (state.sort === 'oldest') return a.date.localeCompare(b.date) || projectName(a).localeCompare(projectName(b));
      if (state.sort === 'az') return projectName(a).localeCompare(projectName(b));
      return b.date.localeCompare(a.date) || projectName(a).localeCompare(projectName(b));
    });
  }

  function projectCard(project) {
    const extraType = project.types.find((type) => type !== 'public');
    const meta = extraType || project.formats[0] || 'build';
    const tags = [...project.categories, ...project.formats].slice(0, 4);
    return `
      <article class="project-card" id="project-${escapeHtml(project.id)}" data-project-id="${escapeHtml(project.id)}">
        <div class="project-card__meta">
          <time datetime="${escapeHtml(project.date)}">${escapeHtml(formatDate(project.date))}</time>
          <span>${escapeHtml(meta)}</span>
        </div>
        <h3><a href="${escapeHtml(project.url)}" target="_blank" rel="noreferrer">${escapeHtml(projectName(project))}</a></h3>
        <p class="project-card__description">${escapeHtml(project.description)}</p>
        <div class="project-card__footer">
          <div class="project-card__tags">${tags.map((tag) => tagMarkup(tag, project.categories.includes(tag))).join('')}</div>
          <span class="project-card__arrow" aria-hidden="true">↗</span>
        </div>
      </article>`;
  }

  function renderArchive() {
    const projects = filteredProjects();
    const groups = new Map();
    for (const project of projects) {
      const year = project.date.slice(0, 4);
      if (!groups.has(year)) groups.set(year, []);
      groups.get(year).push(project);
    }

    elements.archive.innerHTML = [...groups.entries()].map(([year, yearProjects]) => `
      <section class="year-group" aria-labelledby="year-${year}">
        <h3 class="year-heading" id="year-${year}">${year}<span>${yearProjects.length} ${yearProjects.length === 1 ? 'signal' : 'signals'}</span></h3>
        <div class="project-grid">${yearProjects.map(projectCard).join('')}</div>
      </section>`).join('');

    const suffix = projects.length === state.projects.length ? 'public builds' : `of ${state.projects.length} builds`;
    elements.resultCount.textContent = `${projects.length} ${suffix}`;
    elements.emptyState.hidden = projects.length > 0;
    elements.archive.hidden = projects.length === 0;
    syncControls();
    updateUrl();
  }

  function setFilter(key, value) {
    state[key] = value;
    renderArchive();
  }

  function clearFilters() {
    Object.assign(state, { query: '', category: '', format: '', year: '', sort: 'newest' });
    renderArchive();
    elements.search.focus();
  }

  function bindEvents() {
    window.addEventListener('scroll', () => elements.header.classList.toggle('is-scrolled', window.scrollY > 12), { passive: true });

    let searchTimer;
    elements.search.addEventListener('input', (event) => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => setFilter('query', event.target.value), 90);
    });
    elements.year.addEventListener('change', (event) => setFilter('year', event.target.value));
    elements.format.addEventListener('change', (event) => setFilter('format', event.target.value));
    elements.sort.addEventListener('change', (event) => setFilter('sort', event.target.value));
    elements.clearFilters.addEventListener('click', clearFilters);

    elements.categoryChips.addEventListener('click', (event) => {
      const button = event.target.closest('[data-category]');
      if (button) setFilter('category', button.dataset.category);
    });

    elements.archive.addEventListener('click', (event) => {
      const tag = event.target.closest('[data-tag-filter]');
      if (!tag) return;
      event.preventDefault();
      event.stopPropagation();
      setFilter('category', tag.dataset.tagFilter);
      document.querySelector('#archive-title').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    document.querySelector('.view-toggle').addEventListener('click', (event) => {
      const button = event.target.closest('[data-view]');
      if (button) setFilter('view', button.dataset.view);
    });

    elements.randomBuild.addEventListener('click', () => {
      const pool = filteredProjects();
      if (!pool.length) return;
      const project = pool[Math.floor(Math.random() * pool.length)];
      const card = document.querySelector(`[data-project-id="${CSS.escape(project.id)}"]`);
      if (!card) return;
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      card.classList.remove('is-flashed');
      window.setTimeout(() => card.classList.add('is-flashed'), 450);
    });

    document.addEventListener('keydown', (event) => {
      const target = event.target;
      const typing = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement;
      if (event.key === '/' && !typing) {
        event.preventDefault();
        elements.search.focus();
      }
      if (event.key === 'Escape' && document.activeElement === elements.search && elements.search.value) clearFilters();
    });
  }

  async function init() {
    readUrlState();
    elements.currentYear.textContent = String(new Date().getFullYear());
    try {
      const response = await fetch(DATA_URL, { cache: 'no-store' });
      if (!response.ok) throw new Error(`Project manifest request failed (${response.status}).`);
      const manifest = await response.json();
      if (!Array.isArray(manifest.files) || !manifest.files.length) throw new Error('Project manifest contains no data files.');
      const chunks = await Promise.all(manifest.files.map(async (file) => {
        const chunkResponse = await fetch(`./data/${file}`, { cache: 'no-store' });
        if (!chunkResponse.ok) throw new Error(`Project data request failed for ${file} (${chunkResponse.status}).`);
        return chunkResponse.json();
      }));
      const payload = { ...manifest, projects: chunks.flatMap((chunk) => chunk.projects || []) };
      state.projects = assertPublicData(payload);
      renderStats();
      renderFeatured(payload);
      renderFilterOptions();
      bindEvents();
      renderArchive();
    } catch (error) {
      console.error(error);
      elements.resultCount.textContent = 'The project archive could not be loaded.';
      elements.emptyState.hidden = false;
      elements.emptyState.querySelector('h3').textContent = 'Archive unavailable';
      elements.emptyState.querySelector('p').textContent = 'Check the data file and refresh the page.';
      elements.clearFilters.hidden = true;
    }
  }

  init();
})();

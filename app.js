(() => {
  'use strict';

  const BUILD_VERSION = '20260722.7';
  const DATA_ROOT = new URL('./data/', document.baseURI);
  document.documentElement.dataset.build = BUILD_VERSION;

  const state = {
    projects: [],
    query: '',
    category: '',
    format: '',
    year: '',
    date: '',
    sort: 'newest',
  };

  const elements = {
    featuredList: document.querySelector('#featured-list'),
    archive: document.querySelector('#project-archive'),
    resultCount: document.querySelector('#result-count'),
    archiveSummary: document.querySelector('#archive-summary'),
    search: document.querySelector('#project-search'),
    category: document.querySelector('#category-filter'),
    year: document.querySelector('#year-filter'),
    format: document.querySelector('#format-filter'),
    sort: document.querySelector('#sort-filter'),
    clearFilters: document.querySelector('#clear-filters'),
    randomBuild: document.querySelector('#random-build'),
    emptyState: document.querySelector('#empty-state'),
    currentYear: document.querySelector('#current-year'),
    filterDisclosure: document.querySelector('#filter-disclosure'),
    filterSummary: document.querySelector('#filter-summary'),
    activityMap: document.querySelector('#activity-map'),
    activitySelection: document.querySelector('#activity-selection'),
  };

  const categoryLabels = {
    ai: 'AI',
    dev: 'dev',
    vc: 'VC',
    art: 'art',
    econ: 'econ',
    'no code': 'no-code',
    web3: 'web3',
  };

  const escapeHtml = (value = '') => String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  const normalize = (value = '') => String(value).trim().toLowerCase();
  const labelForCategory = (category) => categoryLabels[category] || category;
  const sortUnique = (values) => [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));

  function projectSearchText(project) {
    return normalize([
      project.name,
      project.displayName,
      project.description,
      ...(project.categories || []),
      ...(project.formats || []),
      ...(project.types || []),
    ].join(' '));
  }

  function getFilteredProjects() {
    const query = normalize(state.query);
    const filtered = state.projects.filter((project) => {
      if (query && !projectSearchText(project).includes(query)) return false;
      if (state.category && !(project.categories || []).includes(state.category)) return false;
      if (state.format && !(project.formats || []).includes(state.format)) return false;
      if (state.year && !project.date.startsWith(state.year)) return false;
      if (state.date && project.date !== state.date) return false;
      return true;
    });

    return filtered.sort((a, b) => {
      if (state.sort === 'oldest') return a.date.localeCompare(b.date);
      if (state.sort === 'az') return (a.displayName || a.name).localeCompare(b.displayName || b.name);
      return b.date.localeCompare(a.date);
    });
  }

  function renderFeatured() {
    const featured = state.projects
      .filter((project) => project.featured)
      .sort((a, b) => (a.featuredRank || 99) - (b.featuredRank || 99))
      .slice(0, 3);

    elements.featuredList.dataset.count = String(featured.length);
    elements.featuredList.innerHTML = featured.map((project, index) => {
      const name = project.displayName || project.name;
      const links = Array.isArray(project.links) && project.links.length
        ? project.links
        : [{ label: 'open', url: project.url }];
      const eyebrow = project.eyebrow ? `<span>${escapeHtml(project.eyebrow)}</span>` : '';
      const linkHtml = links.map((link) => (
        `<a href="${escapeHtml(link.url)}" target="_blank" rel="noreferrer">${escapeHtml(link.label)} ↗</a>`
      )).join('');

      return `
        <article class="featured-item">
          <div class="featured-item__index">${String(index + 1).padStart(2, '0')}</div>
          <div class="featured-item__body">
            <div class="featured-item__line">
              <h3><a href="${escapeHtml(project.url)}" target="_blank" rel="noreferrer">${escapeHtml(name)}</a></h3>
              <time datetime="${escapeHtml(project.date)}">${escapeHtml(project.date)}</time>
            </div>
            <p>${escapeHtml(project.description)}</p>
            <div class="featured-item__meta">${eyebrow}${linkHtml}</div>
          </div>
        </article>`;
    }).join('');
  }

  function isoDate(date) {
    return date.toISOString().slice(0, 10);
  }

  function localDateLabel(value) {
    const date = new Date(`${value}T12:00:00Z`);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(date);
  }

  function activityLevel(count, maxCount) {
    if (!count) return 0;
    if (maxCount <= 1) return 2;
    return Math.min(4, Math.max(1, Math.ceil((count / maxCount) * 4)));
  }

  function renderActivityMap() {
    if (!elements.activityMap) return;
    const counts = new Map();
    for (const project of state.projects) counts.set(project.date, (counts.get(project.date) || 0) + 1);

    const latestProject = [...state.projects].sort((a, b) => b.date.localeCompare(a.date))[0];
    const today = new Date();
    today.setUTCHours(12, 0, 0, 0);
    const latestDate = latestProject ? new Date(`${latestProject.date}T12:00:00Z`) : today;
    const end = latestDate > today ? latestDate : today;
    end.setUTCDate(end.getUTCDate() + (6 - end.getUTCDay()));
    const start = new Date(end);
    start.setUTCDate(start.getUTCDate() - (52 * 7 - 1));
    const maxCount = Math.max(1, ...counts.values());
    const weeks = [];
    const monthLabels = [];
    let previousMonth = -1;

    for (let week = 0; week < 52; week += 1) {
      const days = [];
      const weekStart = new Date(start);
      weekStart.setUTCDate(start.getUTCDate() + week * 7);
      const month = weekStart.getUTCMonth();
      if (month !== previousMonth) {
        monthLabels.push(`<span style="grid-column:${week + 1}">${weekStart.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' })}</span>`);
        previousMonth = month;
      }
      for (let day = 0; day < 7; day += 1) {
        const date = new Date(weekStart);
        date.setUTCDate(weekStart.getUTCDate() + day);
        const value = isoDate(date);
        const count = counts.get(value) || 0;
        const selected = value === state.date;
        const label = `${count} ${count === 1 ? 'build' : 'builds'} on ${localDateLabel(value)}`;
        days.push(`<button class="activity__cell${selected ? ' is-selected' : ''}" type="button" data-activity-date="${value}" data-level="${activityLevel(count, maxCount)}" aria-pressed="${selected}" aria-label="${label}" title="${label}"></button>`);
      }
      weeks.push(`<div class="activity__week">${days.join('')}</div>`);
    }

    elements.activityMap.innerHTML = `
      <div class="activity__months">${monthLabels.join('')}</div>
      <div class="activity__days" aria-hidden="true"><span>Mon</span><span>Wed</span><span>Fri</span></div>
      <div class="activity__weeks">${weeks.join('')}</div>`;
    elements.activitySelection.textContent = state.date ? `${localDateLabel(state.date)} · click again to clear` : 'last 52 weeks';
  }

  function renderArchive() {
    const projects = getFilteredProjects();
    elements.resultCount.textContent = `${projects.length} / ${state.projects.length}`;
    elements.emptyState.hidden = projects.length !== 0;

    elements.archive.innerHTML = projects.map((project) => {
      const categoryTags = (project.categories || []).map((category) => (
        `<button type="button" data-filter-kind="category" data-filter-value="${escapeHtml(category)}">#${escapeHtml(labelForCategory(category))}</button>`
      ));
      const formatTags = (project.formats || []).map((format) => (
        `<button type="button" data-filter-kind="format" data-filter-value="${escapeHtml(format)}">.${escapeHtml(format.replaceAll(' ', '-'))}</button>`
      ));
      const typeTags = (project.types || [])
        .filter((type) => type !== 'public')
        .map((type) => `<span class="type-tag">[${escapeHtml(type)}]</span>`);

      return `
        <article class="project-row">
          <time datetime="${escapeHtml(project.date)}">${escapeHtml(project.date)}</time>
          <div class="project-row__main">
            <h3><a href="${escapeHtml(project.url)}" target="_blank" rel="noreferrer">${escapeHtml(project.name)} <span aria-hidden="true">↗</span></a></h3>
            <p>${escapeHtml(project.description)}</p>
          </div>
          <div class="project-row__tags">${[...categoryTags, ...formatTags, ...typeTags].join('')}</div>
        </article>`;
    }).join('');
  }

  function renderSummary() {
    const years = sortUnique(state.projects.map((project) => project.date.slice(0, 4)));
    const firstYear = years[0] || '';
    const lastYear = years.at(-1) || '';
    const range = firstYear === lastYear ? firstYear : `${firstYear}—${lastYear}`;
    elements.archiveSummary.textContent = `${state.projects.length} public builds · ${range}`;
  }

  function populateFilters() {
    const categories = sortUnique(state.projects.flatMap((project) => project.categories || []));
    const formats = sortUnique(state.projects.flatMap((project) => project.formats || []));
    const years = sortUnique(state.projects.map((project) => project.date.slice(0, 4))).reverse();

    elements.category.innerHTML = '<option value="">all</option>' + categories
      .map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(labelForCategory(category))}</option>`)
      .join('');
    elements.format.innerHTML = '<option value="">all</option>' + formats
      .map((format) => `<option value="${escapeHtml(format)}">${escapeHtml(format)}</option>`)
      .join('');
    elements.year.innerHTML = '<option value="">all</option>' + years
      .map((year) => `<option value="${escapeHtml(year)}">${escapeHtml(year)}</option>`)
      .join('');
  }

  function activeFilterCount() {
    return [
      Boolean(state.query),
      Boolean(state.category),
      Boolean(state.format),
      Boolean(state.year),
      Boolean(state.date),
      state.sort !== 'newest',
    ].filter(Boolean).length;
  }

  function renderFilterSummary() {
    const count = activeFilterCount();
    elements.filterSummary.textContent = count ? `${count} active` : 'all projects';
  }

  function readUrlState() {
    const params = new URLSearchParams(window.location.search);
    state.query = params.get('q') || '';
    state.category = params.get('topic') || '';
    state.format = params.get('format') || '';
    state.year = params.get('year') || '';
    state.date = params.get('date') || '';
    state.sort = params.get('sort') || 'newest';

    elements.search.value = state.query;
    elements.category.value = state.category;
    elements.format.value = state.format;
    elements.year.value = state.year;
    elements.sort.value = state.sort;

    state.category = elements.category.value;
    state.format = elements.format.value;
    state.year = elements.year.value;
    state.sort = elements.sort.value || 'newest';
    elements.filterDisclosure.open = activeFilterCount() > 0;
  }

  function writeUrlState() {
    const params = new URLSearchParams();
    if (state.query) params.set('q', state.query);
    if (state.category) params.set('topic', state.category);
    if (state.format) params.set('format', state.format);
    if (state.year) params.set('year', state.year);
    if (state.date) params.set('date', state.date);
    if (state.sort !== 'newest') params.set('sort', state.sort);
    const query = params.toString();
    history.replaceState(null, '', `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`);
  }

  function render() {
    renderArchive();
    renderActivityMap();
    renderFilterSummary();
    writeUrlState();
  }

  function clearFilters() {
    state.query = '';
    state.category = '';
    state.format = '';
    state.year = '';
    state.date = '';
    state.sort = 'newest';
    elements.search.value = '';
    elements.category.value = '';
    elements.format.value = '';
    elements.year.value = '';
    elements.sort.value = 'newest';
    elements.filterDisclosure.open = false;
    render();
  }

  function bindEvents() {
    elements.search.addEventListener('input', () => {
      state.query = elements.search.value;
      render();
    });
    elements.category.addEventListener('change', () => {
      state.category = elements.category.value;
      render();
    });
    elements.format.addEventListener('change', () => {
      state.format = elements.format.value;
      render();
    });
    elements.year.addEventListener('change', () => {
      state.year = elements.year.value;
      render();
    });
    elements.sort.addEventListener('change', () => {
      state.sort = elements.sort.value;
      render();
    });
    elements.clearFilters.addEventListener('click', clearFilters);
    document.querySelector('[data-clear-filters]')?.addEventListener('click', clearFilters);

    elements.randomBuild.addEventListener('click', () => {
      const pool = getFilteredProjects();
      const project = pool[Math.floor(Math.random() * pool.length)] || state.projects[0];
      if (project) window.open(project.url, '_blank', 'noopener,noreferrer');
    });

    elements.activityMap?.addEventListener('click', (event) => {
      const cell = event.target.closest('[data-activity-date]');
      if (!cell) return;
      const date = cell.dataset.activityDate || '';
      state.date = state.date === date ? '' : date;
      render();
      document.querySelector('#archive-title').scrollIntoView({ block: 'start', behavior: 'smooth' });
    });

    elements.archive.addEventListener('click', (event) => {
      const button = event.target.closest('[data-filter-kind]');
      if (!button) return;
      const kind = button.dataset.filterKind;
      const value = button.dataset.filterValue || '';
      if (kind === 'category') {
        state.category = value;
        elements.category.value = value;
      }
      if (kind === 'format') {
        state.format = value;
        elements.format.value = value;
      }
      elements.filterDisclosure.open = true;
      render();
      document.querySelector('#archive-title').scrollIntoView({ block: 'start' });
    });

    document.addEventListener('keydown', (event) => {
      const tagName = document.activeElement?.tagName;
      const isEditing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(tagName);
      if (event.key === '/' && !isEditing) {
        event.preventDefault();
        elements.filterDisclosure.open = true;
        elements.search.focus();
      }
      if (event.key === 'Escape' && document.activeElement === elements.search && elements.search.value) {
        elements.search.value = '';
        state.query = '';
        render();
      }
    });
  }

  function versionedDataUrl(path, dataVersion = BUILD_VERSION) {
    const url = new URL(path, DATA_ROOT);
    url.searchParams.set('v', `${BUILD_VERSION}-${dataVersion}`);
    return url;
  }

  async function loadProjects() {
    try {
      const manifestResponse = await fetch(versionedDataUrl('manifest.json'), { cache: 'no-store' });
      if (!manifestResponse.ok) throw new Error(`manifest: ${manifestResponse.status}`);
      const manifest = await manifestResponse.json();
      if (!Array.isArray(manifest.files) || manifest.files.length === 0) {
        throw new Error('manifest contains no project files');
      }

      const dataVersion = manifest.generatedAt || BUILD_VERSION;
      const chunks = await Promise.all(manifest.files.map(async (file) => {
        const response = await fetch(versionedDataUrl(file, dataVersion), { cache: 'no-store' });
        if (!response.ok) throw new Error(`${file}: ${response.status}`);
        return response.json();
      }));

      state.projects = chunks
        .flatMap((chunk) => chunk.projects || [])
        .filter((project) => Array.isArray(project.types) && project.types.includes('public'));

      populateFilters();
      readUrlState();
      renderSummary();
      renderFeatured();
      renderActivityMap();
      render();
      bindEvents();
    } catch (error) {
      console.error('boplog data load failed', error);
      elements.resultCount.textContent = 'latest 12 shown';
      elements.archiveSummary.textContent = 'Static preview · machine-readable archive available below';
    }
  }

  elements.currentYear.textContent = new Date().getFullYear();
  loadProjects();
})();

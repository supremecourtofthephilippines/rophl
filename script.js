const rows = document.querySelector('#rule-rows');
const titleFilter = document.querySelector('#title-filter');
const numberFilter = document.querySelector('#number-filter');
const quickSearch = document.querySelector('#quick-search input');
const pageSize = document.querySelector('#page-size');
const summary = document.querySelector('#result-summary');
const pagination = document.querySelector('#pagination');
let page = 1;
let ascending = true;

function render() {
  const title = titleFilter.value.trim().toLowerCase();
  const number = numberFilter.value.trim().toLowerCase();
  const filtered = [...window.ROLEPLAY_RULES].filter((rule) =>
    rule.title.toLowerCase().includes(title) && rule.number.toLowerCase().includes(number)
  ).sort((a, b) => ascending ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title));
  const size = Number(pageSize.value);
  const pages = Math.max(1, Math.ceil(filtered.length / size));
  page = Math.min(page, pages);
  const start = (page - 1) * size;
  rows.innerHTML = filtered.slice(start, start + size).map((rule) => `
    <tr><td><a href="document.html?doc=${encodeURIComponent(rule.id)}">${rule.title}</a></td>
    <td>${rule.type}</td><td><a href="document.html?doc=${encodeURIComponent(rule.id)}">${rule.number}</a></td></tr>`).join('');
  summary.textContent = filtered.length ? `Showing ${start + 1} to ${Math.min(start + size, filtered.length)} of ${filtered.length} entries` : 'No matching entries';
  pagination.innerHTML = '';
  for (let i = 1; i <= pages; i += 1) {
    const button = document.createElement('button');
    button.textContent = String(i);
    button.className = i === page ? 'active' : '';
    button.setAttribute('aria-label', `Page ${i}`);
    button.addEventListener('click', () => { page = i; render(); });
    pagination.append(button);
  }
}

titleFilter.addEventListener('input', () => { page = 1; render(); });
numberFilter.addEventListener('input', () => { page = 1; render(); });
pageSize.addEventListener('change', () => { page = 1; render(); });
document.querySelector('#clear-filters').addEventListener('click', () => {
  titleFilter.value = ''; numberFilter.value = ''; quickSearch.value = ''; page = 1; render();
});
document.querySelector('#sort-title').addEventListener('click', () => { ascending = !ascending; render(); });
document.querySelector('#print-table').addEventListener('click', () => window.print());
document.querySelector('#quick-search').addEventListener('submit', (event) => {
  event.preventDefault(); titleFilter.value = quickSearch.value; page = 1; render();
  document.querySelector('#rules').scrollIntoView({ behavior: 'smooth' });
});
render();

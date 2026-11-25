const search = document.querySelector('#rule-search');
const count = document.querySelector('#search-count');
const panels = [...document.querySelectorAll('.panel')];

search.addEventListener('input', () => {
  const term = search.value.trim().toLowerCase();
  let matches = 0;

  panels.forEach((panel) => {
    const text = `${panel.textContent} ${panel.dataset.search || ''}`.toLowerCase();
    const visible = !term || text.includes(term);
    panel.hidden = !visible;
    if (visible) matches += 1;
  });

  count.textContent = `${matches} ${matches === 1 ? 'section' : 'sections'}`;
});

count.textContent = `${panels.length} sections`;

const menuButton = document.querySelector('.menu-toggle');
const menu = document.querySelector('.main-nav');

menuButton.addEventListener('click', () => {
  const open = menu.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(open));
});

menu.addEventListener('click', (event) => {
  if (event.target.matches('a')) {
    menu.classList.remove('open');
    menuButton.setAttribute('aria-expanded', 'false');
  }
});

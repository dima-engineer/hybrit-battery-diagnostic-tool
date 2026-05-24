import { state } from './state.js';
import { render } from './render.js';
import { initUpload } from './upload.js';
import { initFilter } from './filter.js';

initUpload();
initFilter();

document.getElementById('sortBtn')!.addEventListener('click', () => {
  state.sortBars = !state.sortBars;
  const btn = document.getElementById('sortBtn')!;
  btn.classList.toggle('on', state.sortBars);
  btn.textContent = state.sortBars ? 'Original order' : 'Sort by voltage ↑';
  if (state.allRows.length) render();
});

new ResizeObserver(() => {
  if (state.allRows.length) render();
}).observe(document.querySelector('.wrap')!);

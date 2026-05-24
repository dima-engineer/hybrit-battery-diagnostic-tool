import { state } from './state.js';
import { render } from './render.js';
import { initUpload } from './upload.js';
import { initFilter, rebuildRanges } from './filter.js';
import { initTimeline }    from './charts/timeline.js';
import { initPairsTooltip } from './charts/pairs.js';
import { initBarTooltip }   from './charts/bar.js';

initUpload();
initFilter();
initTimeline(() => {
  const { frameStart: s, frameEnd: e, allRows } = state;
  const rows = s !== null && e !== null ? allRows.slice(s, e + 1) : allRows;
  rebuildRanges(rows);
  render();
});
initPairsTooltip();
initBarTooltip();

document.getElementById('sortBtn')!.addEventListener('click', () => {
  state.sortBars = !state.sortBars;
  const btn = document.getElementById('sortBtn')!;
  btn.classList.toggle('on', state.sortBars);
  btn.textContent = state.sortBars ? 'Original order' : 'Sort by voltage ↑';
  if (state.allRows.length) render();
});

document.getElementById('sortPairsBtn')!.addEventListener('click', () => {
  state.sortPairs = !state.sortPairs;
  const btn = document.getElementById('sortPairsBtn')!;
  btn.classList.toggle('on', state.sortPairs);
  btn.textContent = state.sortPairs ? 'Original order' : 'Sort by delta ↑';
  if (state.allRows.length) render();
});

document.getElementById('sortHeatBtn')!.addEventListener('click', () => {
  state.sortHeatByCurrent = !state.sortHeatByCurrent;
  const btn = document.getElementById('sortHeatBtn')!;
  btn.classList.toggle('on', state.sortHeatByCurrent);
  btn.textContent = state.sortHeatByCurrent ? 'Chronological order' : 'Sort by current ↑';
  if (state.allRows.length) render();
});

document.querySelectorAll<HTMLButtonElement>('[data-bar-std]').forEach(btn => {
  btn.addEventListener('click', () => {
    state.barStdMult = Number(btn.dataset.barStd) as 1 | 2 | 3;
    document.querySelectorAll('[data-bar-std]').forEach(b => b.classList.remove('on'));
    btn.classList.add('on');
    if (state.allRows.length) render();
  });
});

document.querySelectorAll<HTMLButtonElement>('[data-pairs-std]').forEach(btn => {
  btn.addEventListener('click', () => {
    state.pairsStdMult = Number(btn.dataset.pairsStd) as 1 | 2 | 3;
    document.querySelectorAll('[data-pairs-std]').forEach(b => b.classList.remove('on'));
    btn.classList.add('on');
    if (state.allRows.length) render();
  });
});

new ResizeObserver(() => {
  if (state.allRows.length) render();
}).observe(document.querySelector('.wrap')!);

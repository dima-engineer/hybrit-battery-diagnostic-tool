import { state, STEPS } from './state.js';
import { show } from './utils.js';
import { render } from './render.js';

const v2s = (v: number) =>
  Math.round((v - state.dataMin) / (state.dataMax - state.dataMin) * STEPS);
const s2v = (s: number) =>
  state.dataMin + (s / STEPS) * (state.dataMax - state.dataMin);

function updateFill(): void {
  const lo = Number((document.getElementById('sMin') as HTMLInputElement).value);
  const hi = Number((document.getElementById('sMax') as HTMLInputElement).value);
  document.getElementById('rangeFill')!.style.left  = `${lo / STEPS * 100}%`;
  document.getElementById('rangeFill')!.style.width = `${(hi - lo) / STEPS * 100}%`;
  document.getElementById('rangeDisplay')!.textContent =
    `${state.fMin.toFixed(1)} – ${state.fMax.toFixed(1)} A`;
}

export function buildFilter(): void {
  const vals = state.allRows
    .map(r => Number(r[state.curCol]))
    .filter(v => isFinite(v));

  state.dataMin = Math.min(...vals);
  state.dataMax = Math.max(...vals);

  if (state.fMin === 0 && state.fMax === 0) {
    state.fMin = state.dataMin;
    state.fMax = state.dataMax;
  }

  const sMin = document.getElementById('sMin') as HTMLInputElement;
  const sMax = document.getElementById('sMax') as HTMLInputElement;
  sMin.min = sMax.min = '0';
  sMin.max = sMax.max = String(STEPS);
  sMin.value = String(v2s(state.fMin));
  sMax.value = String(v2s(state.fMax));

  updateFill();
  show('filterCard'); show('heatCard'); show('barCard');
  render();
}

export function initFilter(): void {
  (['sMin', 'sMax'] as const).forEach(id => {
    document.getElementById(id)!.addEventListener('input', () => {
      const sMin = document.getElementById('sMin') as HTMLInputElement;
      const sMax = document.getElementById('sMax') as HTMLInputElement;
      let lo = Number(sMin.value), hi = Number(sMax.value);
      if (lo > hi) {
        if (id === 'sMin') lo = hi; else hi = lo;
        sMin.value = String(lo);
        sMax.value = String(hi);
      }
      state.fMin = s2v(lo);
      state.fMax = s2v(hi);
      updateFill();
      render();
    });
  });
}

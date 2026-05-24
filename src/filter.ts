import { state, STEPS, type Row } from './state.js';
import { show, hide } from './utils.js';
import { render } from './render.js';

const v2s = (v: number) =>
  Math.round((v - state.dataMin) / (state.dataMax - state.dataMin) * STEPS);
const s2v = (s: number) =>
  state.dataMin + (s / STEPS) * (state.dataMax - state.dataMin);

const socV2s = (v: number) =>
  Math.round((v - state.socDataMin) / (state.socDataMax - state.socDataMin) * STEPS);
const socS2v = (s: number) =>
  state.socDataMin + (s / STEPS) * (state.socDataMax - state.socDataMin);

function updateFill(): void {
  const lo = Number((document.getElementById('sMin') as HTMLInputElement).value);
  const hi = Number((document.getElementById('sMax') as HTMLInputElement).value);
  document.getElementById('rangeFill')!.style.left  = `${lo / STEPS * 100}%`;
  document.getElementById('rangeFill')!.style.width = `${(hi - lo) / STEPS * 100}%`;
  document.getElementById('curDisplay')!.textContent =
    `${state.fMin.toFixed(1)} – ${state.fMax.toFixed(1)} A`;
}

function updateSocFill(): void {
  const lo = Number((document.getElementById('socMin') as HTMLInputElement).value);
  const hi = Number((document.getElementById('socMax') as HTMLInputElement).value);
  document.getElementById('socFill')!.style.left  = `${lo / STEPS * 100}%`;
  document.getElementById('socFill')!.style.width = `${(hi - lo) / STEPS * 100}%`;
  document.getElementById('socDisplay')!.textContent =
    `${state.socMin.toFixed(1)} – ${state.socMax.toFixed(1)} %`;
}

function buildSocSlider(): void {
  const vals = state.allRows
    .map(r => Number(r[state.socCol]))
    .filter(v => isFinite(v));

  state.socDataMin = Math.min(...vals);
  state.socDataMax = Math.max(...vals);

  if (state.socMin === 0 && state.socMax === 0) {
    state.socMin = state.socDataMin;
    state.socMax = state.socDataMax;
  }

  const sMin = document.getElementById('socMin') as HTMLInputElement;
  const sMax = document.getElementById('socMax') as HTMLInputElement;
  sMin.min = sMax.min = '0';
  sMin.max = sMax.max = String(STEPS);
  sMin.value = String(socV2s(state.socMin));
  sMax.value = String(socV2s(state.socMax));

  updateSocFill();
}

// Called when the timeline frame changes — adapts slider ranges to the new view.
export function rebuildRanges(rows: Row[]): void {
  const vals = rows.map(r => Number(r[state.curCol])).filter(v => isFinite(v));
  if (!vals.length) return;

  state.dataMin = Math.min(...vals);
  state.dataMax = Math.max(...vals);
  state.fMin    = state.dataMin;
  state.fMax    = state.dataMax;

  const sMin = document.getElementById('sMin') as HTMLInputElement;
  const sMax = document.getElementById('sMax') as HTMLInputElement;
  sMin.value = '0';
  sMax.value = String(STEPS);
  updateFill();

  if (state.socCol) {
    const socVals = rows.map(r => Number(r[state.socCol])).filter(v => isFinite(v));
    if (socVals.length) {
      state.socDataMin = Math.min(...socVals);
      state.socDataMax = Math.max(...socVals);
      state.socMin     = state.socDataMin;
      state.socMax     = state.socDataMax;

      const socSMin = document.getElementById('socMin') as HTMLInputElement;
      const socSMax = document.getElementById('socMax') as HTMLInputElement;
      socSMin.value = '0';
      socSMax.value = String(STEPS);
      updateSocFill();
    }
  }
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

  if (state.socCol) {
    buildSocSlider();
    show('socFilterRow');
  } else {
    hide('socFilterRow');
  }

  show('filterCard'); show('heatCard'); show('pairsCard'); show('barCard');
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

  (['socMin', 'socMax'] as const).forEach(id => {
    document.getElementById(id)!.addEventListener('input', () => {
      const sMin = document.getElementById('socMin') as HTMLInputElement;
      const sMax = document.getElementById('socMax') as HTMLInputElement;
      let lo = Number(sMin.value), hi = Number(sMax.value);
      if (lo > hi) {
        if (id === 'socMin') lo = hi; else hi = lo;
        sMin.value = String(lo);
        sMax.value = String(hi);
      }
      state.socMin = socS2v(lo);
      state.socMax = socS2v(hi);
      updateSocFill();
      render();
    });
  });
}

import { state, type Row } from '../state.js';
import { mean, toNum, setCanvas, show, hide } from '../utils.js';

const MAX_PTS = 1000;
const PANEL_H = 90;
const ML = 56, MR = 20, MT = 14, MB = 32;

interface Series { label: string; color: string; values: number[] }

// Each entry is the frame state *before* a zoom — null means "was at full view"
type ZoomSnapshot = { start: number; end: number } | null;
let zoomHistory: ZoomSnapshot[] = [];

// ── View helpers ──────────────────────────────────────────────────

function getViewRows(): Row[] {
  const { frameStart: s, frameEnd: e, allRows } = state;
  return s !== null && e !== null ? allRows.slice(s, e + 1) : allRows;
}

function viewOffset(): number { return state.frameStart ?? 0; }

// ── Downsampling ──────────────────────────────────────────────────

function getDisp(rows: Row[]): Row[] {
  if (rows.length <= MAX_PTS) return rows;
  const cols = [state.curCol, ...state.voltageCols, ...(state.socCol ? [state.socCol] : [])];
  const step = rows.length / MAX_PTS;
  const disp: Row[] = [];
  for (let i = 0; i < MAX_PTS; i++) {
    const s = Math.round(i * step), e = Math.round((i + 1) * step);
    const bucket = rows.slice(s, e);
    const agg: Row = {};
    cols.forEach(c => { agg[c] = mean(bucket.map(r => toNum(r[c])).filter(isFinite)); });
    disp.push(agg);
  }
  return disp;
}

// ── Series ────────────────────────────────────────────────────────

function buildSeries(disp: Row[]): Series[] {
  const series: Series[] = [];
  series.push({
    label: 'Current [A]', color: '#3b82f6',
    values: disp.map(r => toNum(r[state.curCol])),
  });
  if (state.voltageCols.length) {
    series.push({
      label: 'Mean Voltage [V]', color: '#10b981',
      values: disp.map(r => {
        const vals = state.voltageCols.map(c => toNum(r[c])).filter(isFinite);
        return vals.length ? mean(vals) : NaN;
      }),
    });
  }
  if (state.socCol) {
    series.push({
      label: 'SoC [%]', color: '#f59e0b',
      values: disp.map(r => toNum(r[state.socCol])),
    });
  }
  return series;
}

// ── Panel drawing ─────────────────────────────────────────────────

function drawPanel(ctx: CanvasRenderingContext2D, s: Series, panelY: number, plotW: number): void {
  const vals = s.values.filter(isFinite);
  if (!vals.length) return;
  const vLo  = Math.min(...vals), vHi = Math.max(...vals);
  const span = vHi - vLo || 1e-9;
  const pad  = span * 0.12;
  const lo = vLo - pad, hi = vHi + pad;
  const pH  = PANEL_H - MT - 4;
  const n   = s.values.length;
  const toY = (v: number) => panelY + MT + pH * (1 - (v - lo) / (hi - lo));
  const toX = (i: number) => ML + (n > 1 ? i / (n - 1) : 0) * plotW;

  ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(ML, panelY + MT); ctx.lineTo(ML + plotW, panelY + MT); ctx.stroke();

  ctx.fillStyle = '#94a3b8'; ctx.font = '9px system-ui'; ctx.textAlign = 'right';
  for (let i = 0; i <= 2; i++) {
    const v = lo + (hi - lo) * (i / 2);
    const y = toY(v);
    ctx.fillText(v.toFixed(2), ML - 3, y + 3);
    ctx.strokeStyle = '#f1f5f9'; ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(ML, y); ctx.lineTo(ML + plotW, y); ctx.stroke();
  }

  ctx.save();
  ctx.translate(10, panelY + MT + pH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center'; ctx.fillStyle = s.color; ctx.font = 'bold 9px system-ui';
  ctx.fillText(s.label, 0, 0);
  ctx.restore();

  ctx.strokeStyle = s.color; ctx.lineWidth = 1.5;
  ctx.beginPath();
  let started = false;
  s.values.forEach((v, i) => {
    if (!isFinite(v)) { started = false; return; }
    const x = toX(i), y = toY(v);
    if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
  });
  ctx.stroke();
}

// ── Brush overlay (drag only — the frame IS the view, no persistent rect) ──

let brushDragging  = false;
let brushDragStart: number | null = null;
let brushDragEnd:   number | null = null;

function drawBrush(ctx: CanvasRenderingContext2D, totalH: number): void {
  if (!brushDragging || brushDragStart === null || brushDragEnd === null) return;
  const x1 = Math.min(brushDragStart, brushDragEnd);
  const x2 = Math.max(brushDragStart, brushDragEnd);
  const clipH = totalH - MT - MB;
  ctx.fillStyle = 'rgba(59,130,246,0.15)';
  ctx.fillRect(x1, MT, x2 - x1, clipH);
  ctx.strokeStyle = 'rgba(59,130,246,0.7)'; ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x1, MT); ctx.lineTo(x1, MT + clipH);
  ctx.moveTo(x2, MT); ctx.lineTo(x2, MT + clipH);
  ctx.stroke();
}

// ── Canvas cache ──────────────────────────────────────────────────

let cachedW    = 0;
let cachedH    = 0;
let cachedDpr  = 1;
let cachedPlotW = 0;

// ── px → allRows index, accounting for the current view offset ────

function pxToRowIdx(px: number): number {
  const viewRows = getViewRows();
  const frac     = Math.max(0, Math.min(1, (px - ML) / cachedPlotW));
  const localIdx = Math.round(frac * Math.max(0, viewRows.length - 1));
  return viewOffset() + localIdx;
}

// ── Core draw (uses cached dimensions; safe to call during drag) ──

function drawAll(ctx: CanvasRenderingContext2D): void {
  const viewRows = getViewRows();
  const disp     = getDisp(viewRows);
  const series   = buildSeries(disp);

  ctx.setTransform(cachedDpr, 0, 0, cachedDpr, 0, 0);
  ctx.clearRect(0, 0, cachedW, cachedH);

  series.forEach((s, pi) => drawPanel(ctx, s, pi * PANEL_H, cachedPlotW));

  // X-axis: labels in allRows-index space so the user always knows where they are
  const offset  = viewOffset();
  const viewLen = viewRows.length;
  const nLabels = Math.min(10, Math.floor(cachedPlotW / 60));
  ctx.fillStyle = '#94a3b8'; ctx.font = '10px system-ui'; ctx.textAlign = 'center';
  for (let i = 0; i <= nLabels; i++) {
    const localIdx = Math.round((i / nLabels) * (viewLen - 1));
    const x        = ML + (i / nLabels) * cachedPlotW;
    ctx.fillText(String(offset + localIdx), x, cachedH - MB + 16);
  }
  ctx.fillText('Sample index', ML + cachedPlotW / 2, cachedH - MB + 28);

  ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(ML, MT); ctx.lineTo(ML, cachedH - MB); ctx.stroke();

  drawBrush(ctx, cachedH);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

// ── Public: called from render() ─────────────────────────────────

export function drawTimeline(): void {
  const card   = document.getElementById('timelineCard')!;
  const canvas = document.getElementById('timelineCanvas') as HTMLCanvasElement;

  if (!state.allRows.length || !state.curCol) { hide(card); return; }
  show(card);

  const viewRows = getViewRows();
  const series   = buildSeries(getDisp(viewRows));
  const totalH   = series.length * PANEL_H + MB;
  const dpr      = window.devicePixelRatio || 1;
  const W        = canvas.parentElement!.clientWidth - 40;

  cachedW     = W;
  cachedH     = totalH;
  cachedDpr   = dpr;
  cachedPlotW = W - ML - MR;

  setCanvas(canvas, W, totalH, dpr);
  drawAll(canvas.getContext('2d')!);
}

// ── Public: reset zoom when a new file is loaded ──────────────────

export function resetTimelineZoom(): void {
  zoomHistory = [];
  brushDragging = false;
  brushDragStart = brushDragEnd = null;
  hide('zoomOutBtn');
  hide('clearFrameBtn');
  hide('frameHint');
}

// ── Public: wire up interactivity ─────────────────────────────────

export function initTimeline(onFrameChange: () => void): void {
  const canvas    = document.getElementById('timelineCanvas') as HTMLCanvasElement;
  const zoomOutBtn = document.getElementById('zoomOutBtn')!;
  const clearBtn   = document.getElementById('clearFrameBtn')!;
  const frameHint  = document.getElementById('frameHint')!;

  function updateUI(): void {
    const zoomed = zoomHistory.length > 0;
    zoomed ? show(zoomOutBtn) : hide(zoomOutBtn);
    zoomed ? show(clearBtn)   : hide(clearBtn);
    if (state.frameStart !== null && state.frameEnd !== null) {
      show(frameHint);
      const count = state.frameEnd - state.frameStart + 1;
      frameHint.textContent =
        `Rows ${state.frameStart.toLocaleString()}–${state.frameEnd.toLocaleString()} · ${count.toLocaleString()} samples`;
    } else {
      hide(frameHint);
    }
  }

  // Zoom out one level
  zoomOutBtn.addEventListener('click', () => {
    if (!zoomHistory.length) return;
    const prev = zoomHistory.pop()!;
    if (prev === null) {
      state.frameStart = state.frameEnd = null;
    } else {
      state.frameStart = prev.start;
      state.frameEnd   = prev.end;
    }
    brushDragging = false; brushDragStart = brushDragEnd = null;
    updateUI();
    onFrameChange();
  });

  // Reset to full view
  clearBtn.addEventListener('click', () => {
    zoomHistory = [];
    state.frameStart = state.frameEnd = null;
    brushDragging = false; brushDragStart = brushDragEnd = null;
    updateUI();
    onFrameChange();
  });

  // Brush drag
  canvas.addEventListener('mousedown', e => {
    const rect = canvas.getBoundingClientRect();
    brushDragStart = e.clientX - rect.left;
    brushDragEnd   = brushDragStart;
    brushDragging  = true;
  });

  canvas.addEventListener('mousemove', e => {
    if (!brushDragging || !cachedPlotW) return;
    const rect = canvas.getBoundingClientRect();
    brushDragEnd = e.clientX - rect.left;
    drawAll(canvas.getContext('2d')!);
  });

  canvas.addEventListener('mouseup', e => {
    if (!brushDragging) return;
    brushDragging = false;
    const rect = canvas.getBoundingClientRect();
    brushDragEnd = e.clientX - rect.left;

    const x1 = Math.min(brushDragStart!, brushDragEnd);
    const x2 = Math.max(brushDragStart!, brushDragEnd);
    brushDragStart = brushDragEnd = null;

    // Too small → treat as a cancelled drag, do nothing
    if (x2 - x1 < 4) {
      drawAll(canvas.getContext('2d')!);
      return;
    }

    const newStart = pxToRowIdx(x1);
    const newEnd   = pxToRowIdx(x2);

    // Must span at least 2 rows to be useful
    if (newEnd <= newStart) {
      drawAll(canvas.getContext('2d')!);
      return;
    }

    // Push the current frame state before zooming in
    zoomHistory.push(
      state.frameStart !== null
        ? { start: state.frameStart, end: state.frameEnd! }
        : null
    );

    state.frameStart = newStart;
    state.frameEnd   = newEnd;

    updateUI();
    onFrameChange();
  });

  canvas.addEventListener('mouseleave', () => {
    if (brushDragging) {
      brushDragging = false;
      brushDragStart = brushDragEnd = null;
      drawAll(canvas.getContext('2d')!);
    }
  });
}

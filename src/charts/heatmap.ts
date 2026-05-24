import { state, MAX_HEAT_ROWS, type Row } from '../state.js';
import { mean, toNum, setCanvas, show, hide } from '../utils.js';
import { mapRgb } from '../colormap.js';

export function drawHeatmap(rows: Row[]): void {
  const empty  = document.getElementById('heatEmpty')!;
  const canvas = document.getElementById('heatCanvas') as HTMLCanvasElement;
  const nC     = state.voltageCols.length;

  if (!rows.length || !nC) { show(empty); hide(canvas); return; }
  hide(empty); show(canvas);

  const sorted = state.sortHeatByCurrent
    ? [...rows].sort((a, b) => toNum(a[state.curCol]) - toNum(b[state.curCol]))
    : rows;

  // Aggregate rows into at most MAX_HEAT_ROWS visual rows
  let disp: Row[] = sorted;
  if (sorted.length > MAX_HEAT_ROWS) {
    disp = [];
    const bsz = sorted.length / MAX_HEAT_ROWS;
    for (let i = 0; i < MAX_HEAT_ROWS; i++) {
      const s = Math.round(i * bsz), e = Math.round((i + 1) * bsz);
      const bucket = sorted.slice(s, e);
      const agg: Row = { [state.curCol]: mean(bucket.map(r => toNum(r[state.curCol]))) };
      state.voltageCols.forEach(c => { agg[c] = mean(bucket.map(r => toNum(r[c]))); });
      disp.push(agg);
    }
  }

  const nR  = disp.length;
  const dpr = window.devicePixelRatio || 1;
  const W   = canvas.parentElement!.clientWidth - 40;

  const ML = 88, MR = 90, MT = 14, MB = 42;
  const cw = (W - ML - MR) / nC;
  const ch = Math.max(1, Math.min(28, (500 - MT - MB) / nR));
  const pH = ch * nR;
  const H  = pH + MT + MB;

  setCanvas(canvas, W, H, dpr);
  const ctx = canvas.getContext('2d')!;
  ctx.scale(dpr, dpr);

  // Per-row deviation from that row's own mean
  const mat: number[][] = disp.map(row => {
    const vals = state.voltageCols.map(c => toNum(row[c]));
    const m = mean(vals);
    return vals.map(v => v - m);
  });
  const absMax = Math.max(...mat.flat().map(Math.abs)) || 1e-9;

  // fillRect respects ctx.scale; putImageData does not
  for (let ri = 0; ri < nR; ri++) {
    const y = MT + ri * ch;
    for (let ci = 0; ci < nC; ci++) {
      const [r, g, b] = mapRgb(mat[ri][ci], absMax);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(ML + ci * cw, y, cw + 0.5, ch + 0.5);
    }
  }

  // Column separators when cells are wide enough
  if (cw > 10) {
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 0.5;
    for (let ci = 1; ci < nC; ci++) {
      const x = ML + ci * cw;
      ctx.beginPath(); ctx.moveTo(x, MT); ctx.lineTo(x, MT + pH); ctx.stroke();
    }
  }

  // X-axis labels
  ctx.fillStyle = '#475569';
  ctx.font = `${Math.min(11, Math.max(9, cw * 0.42))}px system-ui`;
  ctx.textAlign = 'center';
  const names = state.voltageCols.map(c => c.match(/V\d+/i)?.[0] ?? c.slice(0, 5));
  const every = Math.ceil(12 / cw);
  names.forEach((name, ci) => {
    if (ci % every === 0 || ci === nC - 1)
      ctx.fillText(name, ML + (ci + 0.5) * cw, MT + pH + 15);
  });

  // Y-axis labels (sparse current values)
  ctx.textAlign = 'right';
  ctx.font = '10px system-ui';
  const maxLabels = Math.floor(pH / 16);
  const step      = Math.max(1, Math.ceil(nR / maxLabels));
  disp.forEach((row, ri) => {
    if (ri % step === 0 || ri === nR - 1) {
      const v = toNum(row[state.curCol]);
      ctx.fillText(isFinite(v) ? `${v.toFixed(1)} A` : '—', ML - 4, MT + (ri + 0.5) * ch + 4);
    }
  });

  // Y-axis title
  ctx.save();
  ctx.translate(10, MT + pH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#94a3b8';
  ctx.font = '11px system-ui';
  ctx.fillText('Current [A]', 0, 0);
  ctx.restore();

  // Colorbar
  const cbX = W - MR + 8, cbW = 14;
  const gN  = Math.min(200, Math.round(pH));
  for (let i = 0; i < gN; i++) {
    const t = 1 - (i / (gN - 1)) * 2;
    const [r, g, b] = mapRgb(t * absMax, absMax);
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(cbX, MT + i * (pH / gN), cbW, pH / gN + 0.5);
  }
  ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 1;
  ctx.strokeRect(cbX, MT, cbW, pH);
  ctx.fillStyle = '#475569'; ctx.textAlign = 'left'; ctx.font = '10px system-ui';
  ctx.fillText(`+${absMax.toFixed(3)} V`, cbX + cbW + 3, MT + 9);
  ctx.fillText('0',                        cbX + cbW + 3, MT + pH / 2 + 4);
  ctx.fillText(`−${absMax.toFixed(3)} V`, cbX + cbW + 3, MT + pH - 1);
}

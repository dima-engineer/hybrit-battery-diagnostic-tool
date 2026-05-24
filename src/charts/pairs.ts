import { state, type Row } from '../state.js';
import { mean, toNum, setCanvas, show, hide } from '../utils.js';

const THRESHOLD = 0.3;

export function drawPairs(rows: Row[]): void {
  const empty  = document.getElementById('pairsEmpty')!;
  const canvas = document.getElementById('pairsCanvas') as HTMLCanvasElement;
  const cols   = state.voltageCols;

  // Need at least one complete pair
  if (!rows.length || cols.length < 2) { show(empty); hide(canvas); return; }
  hide(empty); show(canvas);

  // Build pairs from column order: [0,1], [2,3], ...
  const pairs: { label: string; diff: number }[] = [];
  for (let i = 0; i + 1 < cols.length; i += 2) {
    const a = cols[i], b = cols[i + 1];
    const mA = mean(rows.map(r => toNum(r[a])).filter(isFinite));
    const mB = mean(rows.map(r => toNum(r[b])).filter(isFinite));
    const nameA = a.match(/\d+/)?.[0] ?? a;
    const nameB = b.match(/\d+/)?.[0] ?? b;
    pairs.push({ label: `${nameA}–${nameB}`, diff: Math.abs(mA - mB) });
  }

  const dpr = window.devicePixelRatio || 1;
  const W   = canvas.parentElement!.clientWidth - 40;
  const H   = 260;

  setCanvas(canvas, W, H, dpr);
  const ctx = canvas.getContext('2d')!;
  ctx.scale(dpr, dpr);

  const ML = 64, MR = 24, MT = 20, MB = 46;
  const plotW = W - ML - MR;
  const plotH = H - MT - MB;

  const maxDiff = Math.max(...pairs.map(p => p.diff), THRESHOLD * 1.2);
  const pad  = maxDiff * 0.12;
  const vHi  = maxDiff + pad;
  const toY  = (v: number) => MT + plotH * (1 - v / vHi);

  // Grid lines + Y-axis labels
  ctx.font = '11px system-ui'; ctx.textAlign = 'right'; ctx.fillStyle = '#94a3b8';
  for (let i = 0; i <= 4; i++) {
    const v = vHi * (i / 4);
    const y = toY(v);
    ctx.strokeStyle = '#f1f5f9'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(ML, y); ctx.lineTo(W - MR, y); ctx.stroke();
    ctx.fillText(v.toFixed(3), ML - 5, y + 4);
  }

  // Axes
  ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(ML, MT);         ctx.lineTo(ML, MT + plotH);
  ctx.moveTo(ML, MT + plotH); ctx.lineTo(W - MR, MT + plotH);
  ctx.stroke();

  // Threshold line at 0.3 V
  const ty = toY(THRESHOLD);
  ctx.save();
  ctx.setLineDash([6, 4]);
  ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(ML, ty); ctx.lineTo(W - MR, ty); ctx.stroke();
  ctx.restore();
  ctx.fillStyle = '#ef4444'; ctx.font = '10px system-ui'; ctx.textAlign = 'left';
  ctx.fillText('0.3 V', W - MR + 2, ty + 4);

  // Bars
  const barW = plotW / pairs.length;
  const bPad = Math.max(barW * 0.18, 3);
  const yBot = toY(0);

  pairs.forEach(({ label, diff }, i) => {
    const critical = diff >= THRESHOLD;
    const x  = ML + i * barW + bPad;
    const bw = barW - bPad * 2;
    const cx = x + bw / 2;

    ctx.fillStyle = critical ? 'rgba(239,68,68,.75)' : 'rgba(59,130,246,.65)';
    ctx.fillRect(x, toY(diff), bw, yBot - toY(diff));

    // Value label above bar
    ctx.fillStyle = critical ? '#b91c1c' : '#475569';
    ctx.font = `${Math.min(11, Math.max(9, barW * 0.3))}px system-ui`;
    ctx.textAlign = 'center';
    const valY = toY(diff) - 4;
    if (valY > MT + 10) ctx.fillText(diff.toFixed(3), cx, valY);

    // X-axis label
    ctx.fillStyle = '#475569';
    ctx.fillText(label, cx, H - MB + 16);
  });

  // Y-axis label
  ctx.save();
  ctx.translate(13, MT + plotH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center'; ctx.fillStyle = '#94a3b8'; ctx.font = '11px system-ui';
  ctx.fillText('|ΔV| [V]', 0, 0);
  ctx.restore();
}

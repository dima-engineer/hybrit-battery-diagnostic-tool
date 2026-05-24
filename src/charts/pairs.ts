import { state, type Row } from '../state.js';
import { mean, stddev, toNum, setCanvas, show, hide } from '../utils.js';
import { initCanvasTooltip, type HitZone } from '../tooltip.js';

const THRESHOLD = 0.3;

interface PairHit extends HitZone { label: string; mean: number; std: number }
let hitZones: PairHit[] = [];

export function initPairsTooltip(): void {
  initCanvasTooltip('pairsCanvas', () => hitZones, hit => {
    const mult = state.pairsStdMult;
    return `<div class="tt-label">${hit.label}</div>` +
      `<div>Mean: <strong>${hit.mean.toFixed(4)} V</strong></div>` +
      `<div>±${mult}σ: <strong>${(hit.std * mult).toFixed(4)} V</strong></div>`;
  });
}

export function drawPairs(rows: Row[]): void {
  const empty  = document.getElementById('pairsEmpty')!;
  const canvas = document.getElementById('pairsCanvas') as HTMLCanvasElement;
  const cols   = state.voltageCols;

  if (!rows.length || cols.length < 2) { show(empty); hide(canvas); hitZones = []; return; }
  hide(empty); show(canvas);

  // Per-sample |ΔV| then mean ± std of that distribution
  const pairs: { label: string; mean: number; std: number }[] = [];
  for (let i = 0; i + 1 < cols.length; i += 2) {
    const a = cols[i], b = cols[i + 1];
    const diffs = rows
      .map(r => Math.abs(toNum(r[a]) - toNum(r[b])))
      .filter(isFinite);
    const m = mean(diffs);
    const s = stddev(diffs, m);
    const nameA = a.match(/\d+/)?.[0] ?? a;
    const nameB = b.match(/\d+/)?.[0] ?? b;
    pairs.push({ label: `${nameA}–${nameB}`, mean: m, std: s });
  }

  if (state.sortPairs) pairs.sort((a, b) => a.mean - b.mean);

  const dpr = window.devicePixelRatio || 1;
  const W   = canvas.parentElement!.clientWidth - 40;
  const H   = 260;

  setCanvas(canvas, W, H, dpr);
  const ctx = canvas.getContext('2d')!;
  ctx.scale(dpr, dpr);

  const ML = 64, MR = 24, MT = 20, MB = 46;
  const plotW = W - ML - MR;
  const plotH = H - MT - MB;

  const maxVal = Math.max(...pairs.map(p => p.mean + p.std * state.pairsStdMult), THRESHOLD * 1.2);
  const pad  = maxVal * 0.12;
  const vHi  = maxVal + pad;
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

  // Bars + error bars
  const barW = plotW / pairs.length;
  const bPad = Math.max(barW * 0.18, 3);
  const yBot = toY(0);
  hitZones = [];

  pairs.forEach(({ label, mean: m, std: s }, i) => {
    const critical = m >= THRESHOLD;
    const x  = ML + i * barW + bPad;
    const bw = barW - bPad * 2;
    const cx = x + bw / 2;

    hitZones.push({ x: ML + i * barW, w: barW, label, mean: m, std: s });

    ctx.fillStyle = critical ? 'rgba(239,68,68,.75)' : 'rgba(59,130,246,.65)';
    ctx.fillRect(x, toY(m), bw, yBot - toY(m));

    // Error bar (±n·std)
    const spread = s * state.pairsStdMult;
    if (spread > 0) {
      const yH  = toY(m + spread), yL = toY(Math.max(m - spread, 0));
      const cap = Math.min(bw * 0.4, 5);
      ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(cx, yH); ctx.lineTo(cx, yL); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - cap, yH); ctx.lineTo(cx + cap, yH);
      ctx.moveTo(cx - cap, yL); ctx.lineTo(cx + cap, yL);
      ctx.stroke();
    }

    // X-axis label
    ctx.fillStyle = '#475569';
    ctx.font = `${Math.min(11, Math.max(9, barW * 0.3))}px system-ui`;
    ctx.textAlign = 'center';
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

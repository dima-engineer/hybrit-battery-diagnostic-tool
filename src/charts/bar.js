import { state } from '../state.js';
import { mean, stddev, toNum, setCanvas, show, hide } from '../utils.js';
import { initCanvasTooltip } from '../tooltip.js';
let hitZones = [];
export function initBarTooltip() {
    initCanvasTooltip('barCanvas', () => hitZones, hit => {
        const mult = state.barStdMult;
        return `<div class="tt-label">${hit.name}</div>` +
            `<div>Mean: <strong>${hit.mean.toFixed(4)} V</strong></div>` +
            `<div>±${mult}σ: <strong>${(hit.std * mult).toFixed(4)} V</strong></div>`;
    });
}
export function drawBar(rows) {
    const empty = document.getElementById('barEmpty');
    const canvas = document.getElementById('barCanvas');
    const nC = state.voltageCols.length;
    if (!rows.length || !nC) {
        show(empty);
        hide(canvas);
        hitZones = [];
        return;
    }
    hide(empty);
    show(canvas);
    let cells = state.voltageCols.map(c => {
        const vals = rows.map(r => toNum(r[c])).filter(isFinite);
        const m = mean(vals), s = stddev(vals, m);
        return { col: c, name: c.match(/V\d+/i)?.[0] ?? c, mean: m, std: s };
    });
    if (state.sortBars)
        cells = [...cells].sort((a, b) => a.mean - b.mean);
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.parentElement.clientWidth - 40;
    const H = 340;
    setCanvas(canvas, W, H, dpr);
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    const ML = 64, MR = 24, MT = 16, MB = 46;
    const plotW = W - ML - MR;
    const plotH = H - MT - MB;
    // Y scale covers filtered means ± n·std
    const ys = cells.flatMap(c => [c.mean - c.std * state.barStdMult, c.mean + c.std * state.barStdMult]);
    const yLo = Math.min(...ys), yHi = Math.max(...ys);
    const pad = (yHi - yLo) * 0.14 || 0.05;
    const vLo = yLo - pad, vHi = yHi + pad;
    const toY = (v) => MT + plotH * (1 - (v - vLo) / (vHi - vLo));
    // Grid lines + Y-axis tick labels
    ctx.font = '11px system-ui';
    ctx.textAlign = 'right';
    ctx.fillStyle = '#94a3b8';
    for (let i = 0; i <= 5; i++) {
        const v = vLo + (vHi - vLo) * (i / 5);
        const y = toY(v);
        ctx.strokeStyle = '#f1f5f9';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(ML, y);
        ctx.lineTo(W - MR, y);
        ctx.stroke();
        ctx.fillText(v.toFixed(3), ML - 5, y + 4);
    }
    // Axes
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(ML, MT);
    ctx.lineTo(ML, MT + plotH);
    ctx.moveTo(ML, MT + plotH);
    ctx.lineTo(W - MR, MT + plotH);
    ctx.stroke();
    const barW = plotW / nC;
    const bPad = Math.max(barW * 0.18, 3);
    const yBot = toY(vLo);
    hitZones = [];
    // Bars + error bars
    cells.forEach(({ name, mean: m, std: s }, i) => {
        hitZones.push({ x: ML + i * barW, w: barW, name, mean: m, std: s });
        const x = ML + i * barW + bPad;
        const bw = barW - bPad * 2;
        const cx = x + bw / 2;
        ctx.fillStyle = 'rgba(59,130,246,.72)';
        ctx.fillRect(x, toY(m), bw, yBot - toY(m));
        const spread = s * state.barStdMult;
        if (spread > 0) {
            const yH = toY(m + spread), yL = toY(m - spread);
            const cap = Math.min(bw * 0.4, 5);
            ctx.strokeStyle = '#1e293b';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(cx, yH);
            ctx.lineTo(cx, yL);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(cx - cap, yH);
            ctx.lineTo(cx + cap, yH);
            ctx.moveTo(cx - cap, yL);
            ctx.lineTo(cx + cap, yL);
            ctx.stroke();
        }
        ctx.fillStyle = '#475569';
        ctx.font = `${Math.min(11, Math.max(9, barW * 0.36))}px system-ui`;
        ctx.textAlign = 'center';
        ctx.fillText(name, cx, H - MB + 16);
    });
    // Y-axis label
    ctx.save();
    ctx.translate(13, MT + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px system-ui';
    ctx.fillText('Voltage [V]', 0, 0);
    ctx.restore();
}

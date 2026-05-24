import type { RGB } from './utils.js';

// Diverging colormap: red (negative) → white (zero) → blue (positive)
type CmapStop = [t: number, r: number, g: number, b: number];

const CMAP: CmapStop[] = [
  [-1.0, 103,   0,  31],
  [-0.5, 214,  96,  77],
  [-0.1, 244, 165, 130],
  [ 0.0, 247, 247, 247],
  [ 0.1, 146, 197, 222],
  [ 0.5,  33, 102, 172],
  [ 1.0,   5,  48,  97],
];

export function mapRgb(val: number, absMax: number): RGB {
  if (absMax === 0) return [247, 247, 247];
  const t = Math.max(-1, Math.min(1, val / absMax));

  let lo = CMAP[0];
  let hi = CMAP[CMAP.length - 1];
  for (let i = 0; i < CMAP.length - 1; i++) {
    if (t >= CMAP[i][0] && t <= CMAP[i + 1][0]) { lo = CMAP[i]; hi = CMAP[i + 1]; break; }
  }

  const f = lo[0] === hi[0] ? 0 : (t - lo[0]) / (hi[0] - lo[0]);
  return [
    Math.round(lo[1] + f * (hi[1] - lo[1])),
    Math.round(lo[2] + f * (hi[2] - lo[2])),
    Math.round(lo[3] + f * (hi[3] - lo[3])),
  ];
}

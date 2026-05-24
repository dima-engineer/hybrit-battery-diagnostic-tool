export type RGB = [number, number, number];

export const mean   = (arr: number[]): number => arr.reduce((a, b) => a + b, 0) / arr.length;
export const stddev = (arr: number[], m: number): number =>
  Math.sqrt(arr.reduce((a, b) => a + (b - m) ** 2, 0) / arr.length);

export function toNum(v: unknown): number {
  return Number(v);
}

export function setCanvas(canvas: HTMLCanvasElement, w: number, h: number, dpr: number): void {
  canvas.width        = Math.round(w * dpr);
  canvas.height       = Math.round(h * dpr);
  canvas.style.width  = `${w}px`;
  canvas.style.height = `${h}px`;
}

export function show(elOrId: string | Element): void {
  const el = typeof elOrId === 'string' ? document.getElementById(elOrId) : elOrId;
  el?.classList.remove('hidden');
}

export function hide(elOrId: string | Element): void {
  const el = typeof elOrId === 'string' ? document.getElementById(elOrId) : elOrId;
  el?.classList.add('hidden');
}

export const mean = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
export const stddev = (arr, m) => Math.sqrt(arr.reduce((a, b) => a + (b - m) ** 2, 0) / arr.length);
export function toNum(v) {
    return Number(v);
}
export function setCanvas(canvas, w, h, dpr) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
}
export function show(elOrId) {
    const el = typeof elOrId === 'string' ? document.getElementById(elOrId) : elOrId;
    el?.classList.remove('hidden');
}
export function hide(elOrId) {
    const el = typeof elOrId === 'string' ? document.getElementById(elOrId) : elOrId;
    el?.classList.add('hidden');
}

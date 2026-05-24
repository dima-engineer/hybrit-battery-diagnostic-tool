import { state, type Row } from './state.js';
import { drawHeatmap } from './charts/heatmap.js';
import { drawBar }     from './charts/bar.js';

export function filteredRows(): Row[] {
  return state.allRows.filter(r => {
    const v = Number(r[state.curCol]);
    return isFinite(v) && v >= state.fMin && v <= state.fMax;
  });
}

export function render(): void {
  const rows = filteredRows();
  document.getElementById('sampleBadge')!.textContent = `${rows.length} samples`;
  drawHeatmap(rows);
  drawBar(rows);
}

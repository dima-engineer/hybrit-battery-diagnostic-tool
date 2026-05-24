import { state, type Row } from './state.js';
import { drawHeatmap } from './charts/heatmap.js';
import { drawBar }     from './charts/bar.js';

export function filteredRows(): Row[] {
  return state.allRows.filter(r => {
    const v = Number(r[state.curCol]);
    if (!isFinite(v) || v < state.fMin || v > state.fMax) return false;
    if (state.socCol) {
      const soc = Number(r[state.socCol]);
      if (!isFinite(soc) || soc < state.socMin || soc > state.socMax) return false;
    }
    return true;
  });
}

export function render(): void {
  const rows = filteredRows();
  document.getElementById('sampleBadge')!.textContent = `${rows.length} samples`;
  drawHeatmap(rows);
  drawBar(rows);
}

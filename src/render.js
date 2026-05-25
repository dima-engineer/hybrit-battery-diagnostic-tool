import { state } from './state.js';
import { drawHeatmap } from './charts/heatmap.js';
import { drawBar } from './charts/bar.js';
import { drawPairs } from './charts/pairs.js';
import { drawTimeline } from './charts/timeline.js';
function passes(r) {
    const v = Number(r[state.curCol]);
    if (!isFinite(v) || v < state.fMin || v > state.fMax)
        return false;
    if (state.socCol) {
        const soc = Number(r[state.socCol]);
        if (!isFinite(soc) || soc < state.socMin || soc > state.socMax)
            return false;
    }
    return true;
}
function groupConsecutive(indices) {
    if (indices.length === 0)
        return [];
    const groups = [];
    let current = [indices[0]];
    for (let i = 1; i < indices.length; i++) {
        if (indices[i] === indices[i - 1] + 1) {
            current.push(indices[i]);
        }
        else {
            groups.push(current);
            current = [indices[i]];
        }
    }
    groups.push(current);
    return groups;
}
export function filteredRows() {
    const base = (state.frameStart !== null && state.frameEnd !== null)
        ? state.allRows.slice(state.frameStart, state.frameEnd + 1)
        : state.allRows;
    if (!state.trimAnomalies) {
        return base.filter(r => passes(r));
    }
    const matchingIndices = [];
    base.forEach((r, i) => { if (passes(r))
        matchingIndices.push(i); });
    const result = [];
    for (const group of groupConsecutive(matchingIndices)) {
        if (group.length > state.anomalyThreshold) {
            group.forEach(i => result.push(base[i]));
        }
    }
    return result;
}
export function render() {
    const rows = filteredRows();
    document.getElementById('sampleBadge').textContent = `${rows.length} samples`;
    drawTimeline();
    drawHeatmap(rows);
    drawBar(rows);
    drawPairs(rows);
}

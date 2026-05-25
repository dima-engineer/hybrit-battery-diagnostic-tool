import { state, STEPS } from './state.js';
import { show, hide } from './utils.js';
import { render } from './render.js';
const v2s = (v) => Math.round((v - state.dataMin) / (state.dataMax - state.dataMin) * STEPS);
const s2v = (s) => state.dataMin + (s / STEPS) * (state.dataMax - state.dataMin);
const socV2s = (v) => Math.round((v - state.socDataMin) / (state.socDataMax - state.socDataMin) * STEPS);
const socS2v = (s) => state.socDataMin + (s / STEPS) * (state.socDataMax - state.socDataMin);
function updateFill() {
    const lo = Number(document.getElementById('sMin').value);
    const hi = Number(document.getElementById('sMax').value);
    document.getElementById('rangeFill').style.left = `${lo / STEPS * 100}%`;
    document.getElementById('rangeFill').style.width = `${(hi - lo) / STEPS * 100}%`;
    document.getElementById('curDisplay').textContent =
        `${state.fMin.toFixed(1)} – ${state.fMax.toFixed(1)} A`;
}
function updateSocFill() {
    const lo = Number(document.getElementById('socMin').value);
    const hi = Number(document.getElementById('socMax').value);
    document.getElementById('socFill').style.left = `${lo / STEPS * 100}%`;
    document.getElementById('socFill').style.width = `${(hi - lo) / STEPS * 100}%`;
    document.getElementById('socDisplay').textContent =
        `${state.socMin.toFixed(1)} – ${state.socMax.toFixed(1)} %`;
}
function buildSocSlider() {
    const vals = state.allRows
        .map(r => Number(r[state.socCol]))
        .filter(v => isFinite(v));
    state.socDataMin = Math.min(...vals);
    state.socDataMax = Math.max(...vals);
    if (state.socMin === 0 && state.socMax === 0) {
        state.socMin = state.socDataMin;
        state.socMax = state.socDataMax;
    }
    const sMin = document.getElementById('socMin');
    const sMax = document.getElementById('socMax');
    sMin.min = sMax.min = '0';
    sMin.max = sMax.max = String(STEPS);
    sMin.value = String(socV2s(state.socMin));
    sMax.value = String(socV2s(state.socMax));
    updateSocFill();
}
// Called when the timeline frame changes — adapts slider ranges to the new view.
export function rebuildRanges(rows) {
    const vals = rows.map(r => Number(r[state.curCol])).filter(v => isFinite(v));
    if (!vals.length)
        return;
    state.dataMin = Math.min(...vals);
    state.dataMax = Math.max(...vals);
    state.fMin = state.dataMin;
    state.fMax = state.dataMax;
    const sMin = document.getElementById('sMin');
    const sMax = document.getElementById('sMax');
    sMin.value = '0';
    sMax.value = String(STEPS);
    updateFill();
    if (state.socCol) {
        const socVals = rows.map(r => Number(r[state.socCol])).filter(v => isFinite(v));
        if (socVals.length) {
            state.socDataMin = Math.min(...socVals);
            state.socDataMax = Math.max(...socVals);
            state.socMin = state.socDataMin;
            state.socMax = state.socDataMax;
            const socSMin = document.getElementById('socMin');
            const socSMax = document.getElementById('socMax');
            socSMin.value = '0';
            socSMax.value = String(STEPS);
            updateSocFill();
        }
    }
}
export function buildFilter() {
    const vals = state.allRows
        .map(r => Number(r[state.curCol]))
        .filter(v => isFinite(v));
    state.dataMin = Math.min(...vals);
    state.dataMax = Math.max(...vals);
    if (state.fMin === 0 && state.fMax === 0) {
        state.fMin = state.dataMin;
        state.fMax = state.dataMax;
    }
    const sMin = document.getElementById('sMin');
    const sMax = document.getElementById('sMax');
    sMin.min = sMax.min = '0';
    sMin.max = sMax.max = String(STEPS);
    sMin.value = String(v2s(state.fMin));
    sMax.value = String(v2s(state.fMax));
    updateFill();
    if (state.socCol) {
        buildSocSlider();
        show('socFilterRow');
    }
    else {
        hide('socFilterRow');
    }
    show('filterCard');
    show('heatCard');
    show('pairsCard');
    show('barCard');
    render();
}
export function initFilter() {
    ['sMin', 'sMax'].forEach(id => {
        document.getElementById(id).addEventListener('input', () => {
            const sMin = document.getElementById('sMin');
            const sMax = document.getElementById('sMax');
            let lo = Number(sMin.value), hi = Number(sMax.value);
            if (lo > hi) {
                if (id === 'sMin')
                    lo = hi;
                else
                    hi = lo;
                sMin.value = String(lo);
                sMax.value = String(hi);
            }
            state.fMin = s2v(lo);
            state.fMax = s2v(hi);
            updateFill();
            render();
        });
    });
    ['socMin', 'socMax'].forEach(id => {
        document.getElementById(id).addEventListener('input', () => {
            const sMin = document.getElementById('socMin');
            const sMax = document.getElementById('socMax');
            let lo = Number(sMin.value), hi = Number(sMax.value);
            if (lo > hi) {
                if (id === 'socMin')
                    lo = hi;
                else
                    hi = lo;
                sMin.value = String(lo);
                sMax.value = String(hi);
            }
            state.socMin = socS2v(lo);
            state.socMax = socS2v(hi);
            updateSocFill();
            render();
        });
    });
    document.getElementById('trimToggle').addEventListener('change', () => {
        state.trimAnomalies = document.getElementById('trimToggle').checked;
        document.getElementById('thresholdRow').style.display = state.trimAnomalies ? 'flex' : 'none';
        render();
    });
    document.getElementById('anomalyThreshold').addEventListener('input', () => {
        const val = Number(document.getElementById('anomalyThreshold').value);
        if (val >= 1) {
            state.anomalyThreshold = val;
            render();
        }
    });
}

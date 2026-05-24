import { state } from './state.js';
import { show } from './utils.js';
import { buildFilter } from './filter.js';

function applyConfig(): void {
  state.voltageCols = [...document.querySelectorAll<HTMLInputElement>('#voltageList input:checked')]
    .map(cb => cb.value);
  state.curCol = (document.getElementById('currentSel') as HTMLSelectElement).value;
  if (!state.voltageCols.length || !state.curCol) return;
  buildFilter();
}

export function buildConfig(): void {
  const volGuess = state.columns.filter(c => /vol/i.test(c) && !/(max|min|pack)/i.test(c));
  const curGuess = state.columns.find(c => /current/i.test(c)) ?? state.columns[0];

  const list = document.getElementById('voltageList')!;
  list.innerHTML = '';
  state.columns.forEach(col => {
    const lbl = document.createElement('label');
    const cb  = document.createElement('input');
    cb.type = 'checkbox'; cb.value = col;
    cb.checked = volGuess.includes(col);
    lbl.append(cb, ` ${col}`);
    list.appendChild(lbl);
  });

  const sel = document.getElementById('currentSel') as HTMLSelectElement;
  sel.innerHTML = state.columns
    .map(c => `<option value="${c}"${c === curGuess ? ' selected' : ''}>${c}</option>`)
    .join('');

  document.getElementById('selAll')!.onclick  = () => { list.querySelectorAll('input').forEach(cb => (cb as HTMLInputElement).checked = true);  applyConfig(); };
  document.getElementById('selNone')!.onclick = () => { list.querySelectorAll('input').forEach(cb => (cb as HTMLInputElement).checked = false); applyConfig(); };
  list.addEventListener('change', applyConfig);
  sel.addEventListener('change', applyConfig);

  show('configCard');
  applyConfig();
}

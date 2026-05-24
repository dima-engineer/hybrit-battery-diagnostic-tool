import Papa from 'papaparse';
import { state, type Row } from './state.js';
import { show } from './utils.js';
import { buildConfig } from './config.js';

function loadFile(file: File): void {
  Papa.parse<Row>(file, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
    complete({ data, meta }) {
      state.allRows = data;
      state.columns = meta.fields ?? [];
      state.fMin    = 0;
      state.fMax    = 0;
      document.getElementById('fileName')!.textContent =
        `${file.name}  ·  ${data.length.toLocaleString()} rows, ${state.columns.length} columns`;
      show('fileBar');
      buildConfig();
    },
  });
}

export function initUpload(): void {
  const drop      = document.getElementById('drop')!;
  const fileInput = document.getElementById('fileInput') as HTMLInputElement;

  drop.addEventListener('click', () => fileInput.click());
  drop.addEventListener('dragover', e => { e.preventDefault(); drop.classList.add('over'); });
  drop.addEventListener('dragleave', () => drop.classList.remove('over'));
  drop.addEventListener('drop', e => {
    e.preventDefault();
    drop.classList.remove('over');
    const file = (e as DragEvent).dataTransfer?.files[0];
    if (file) loadFile(file);
  });
  fileInput.addEventListener('change', () => {
    if (fileInput.files?.[0]) loadFile(fileInput.files[0]);
  });
  document.getElementById('changeBtn')!.addEventListener('click', () => fileInput.click());
}

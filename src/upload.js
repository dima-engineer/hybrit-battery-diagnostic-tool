import Papa from 'papaparse';
import { state } from './state.js';
import { show } from './utils.js';
import { buildConfig } from './config.js';
import { resetTimelineZoom } from './charts/timeline.js';
function loadFile(file) {
    Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete({ data, meta }) {
            state.allRows = data;
            state.columns = meta.fields ?? [];
            state.fMin = 0;
            state.fMax = 0;
            state.frameStart = null;
            state.frameEnd = null;
            resetTimelineZoom();
            document.getElementById('fileName').textContent =
                `${file.name}  ·  ${data.length.toLocaleString()} rows, ${state.columns.length} columns`;
            show('fileBar');
            buildConfig();
        },
    });
}
export function initUpload() {
    const drop = document.getElementById('drop');
    const fileInput = document.getElementById('fileInput');
    drop.addEventListener('click', () => fileInput.click());
    drop.addEventListener('dragover', e => { e.preventDefault(); drop.classList.add('over'); });
    drop.addEventListener('dragleave', () => drop.classList.remove('over'));
    drop.addEventListener('drop', e => {
        e.preventDefault();
        drop.classList.remove('over');
        const file = e.dataTransfer?.files[0];
        if (file)
            loadFile(file);
    });
    fileInput.addEventListener('change', () => {
        if (fileInput.files?.[0])
            loadFile(fileInput.files[0]);
    });
    document.getElementById('changeBtn').addEventListener('click', () => fileInput.click());
}

# Hybrid Battery Diagnostic Tool

A static web app for visualizing EV/hybrid battery diagnostic data from CSV files.

## Features

- **CSV upload** — drag & drop or file picker; auto-detects voltage and current columns
- **Column configuration** — select which columns represent cell voltages and pack current
- **Current filter** — dual-range slider to focus on a specific current window
- **Heatmap** — cell voltage deviation from per-sample mean (red = below average, blue = above)
- **Bar chart** — per-cell mean voltage with ± std error bars and overall dataset mean reference line; optional sort by voltage

## Getting Started

```bash
npm install
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173) and upload a CSV file.

## CSV Format

The tool expects a CSV with a header row. It will auto-detect:
- **Voltage columns** — any column whose name contains `vol` (excluding max/min/pack)
- **Current column** — any column whose name contains `current`

Both can be manually overridden in the Configure panel.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build |

## Project Structure

```
src/
├── main.ts          # Entry point — wires up sort toggle and resize observer
├── state.ts         # Shared app state and constants
├── utils.ts         # Math helpers, canvas utilities, DOM show/hide
├── colormap.ts      # Diverging RdBu colormap
├── render.ts        # Filters rows and triggers chart redraws
├── upload.ts        # Drag-and-drop CSV parsing (PapaParse)
├── config.ts        # Column selector UI
├── filter.ts        # Dual-range current slider
└── charts/
    ├── heatmap.ts   # Per-sample deviation heatmap
    └── bar.ts       # Per-cell mean voltage bar chart
```

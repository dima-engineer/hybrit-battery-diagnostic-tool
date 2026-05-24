# Hybrid Battery Diagnostic Tool

A static web app for visualizing EV/hybrid battery diagnostic data from CSV files.

## Features

- **CSV upload** — drag & drop or file picker; auto-detects voltage, current, and SoC columns
- **Column configuration** — select which columns represent cell voltages, pack current, and state of charge
- **Current filter** — dual-range slider to focus on a specific current window
- **SoC filter** — optional dual-range slider shown when a SoC column is selected
- **Heatmap** — cell voltage deviation from per-sample mean (red = below average, blue = above); rows can be sorted by current to reveal load-dependent patterns
- **Block pair delta** — absolute mean voltage difference between adjacent block pairs (1&2, 3&4, …); bars turn red when the difference exceeds the 0.3 V critical threshold
- **Bar chart** — per-cell mean voltage with ± std error bars; optional sort by voltage

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
- **SoC column** — any column whose name contains `soc` or `charge`

All selections can be manually overridden in the Configure panel.

## Weak Block Diagnosis

The **Block Pair Delta** chart implements the standard adjacent-pair comparison method: cell columns are paired by index (1 & 2, 3 & 4, …) and the absolute difference of their filtered means is plotted. A difference of **0.3 V or more** is highlighted in red as a critical deviation.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build |

## Project Structure

```
src/
├── main.ts          # Entry point — wires up toggles and resize observer
├── state.ts         # Shared app state and constants
├── utils.ts         # Math helpers, canvas utilities, DOM show/hide
├── colormap.ts      # Diverging RdBu colormap
├── render.ts        # Filters rows and triggers chart redraws
├── upload.ts        # Drag-and-drop CSV parsing (PapaParse)
├── config.ts        # Column selector UI
├── filter.ts        # Dual-range sliders for current and SoC
└── charts/
    ├── heatmap.ts   # Per-sample deviation heatmap
    ├── pairs.ts     # Block pair voltage delta chart
    └── bar.ts       # Per-cell mean voltage bar chart
```

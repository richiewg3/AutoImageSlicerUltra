# AutoImageSlicerUltra / Panel Slice Ultra

This repository contains two related tools:

- **Panel Slice Ultra** (`panel-slice-ultra/`) — mobile-first PWA for manually slicing one image into multiple outputs with slice lines, crop boxes, preview, and export.
- **AutoImageSlicerUltra** (`src/autoimageslicerultra/`) — Python library/CLI that automatically detects panel gutters and crops them out.

## Panel Slice Ultra (web app)

```bash
cd panel-slice-ultra
npm install
npm run dev
```

See `panel-slice-ultra/README.md` for full details.

## AutoImageSlicerUltra (Python)

AutoImageSlicerUltra detects the gutters (uniform background bands) separating panels in
a paneled image and crops out each individual panel. It handles grid layouts as well as
simpler row/column arrangements.

## Development setup
```bash
python3 -m venv .venv
.venv/bin/pip install -e ".[dev]"
```

## Usage
Command line:
```bash
.venv/bin/autoslice path/to/paneled.png -o panels/
```

Web UI (development server on http://127.0.0.1:5000):
```bash
.venv/bin/autoslice-web
```

## Lint & test
```bash
.venv/bin/ruff check .
.venv/bin/pytest
```


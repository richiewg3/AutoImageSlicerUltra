# AutoImageSlicerUltra
An application that will slice and dive paneled images into singles

## Overview
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


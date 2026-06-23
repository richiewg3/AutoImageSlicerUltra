# AGENTS.md

## Project
AutoImageSlicerUltra is a Python project that slices paneled images into individual panel
images. It exposes a core library (`src/autoimageslicerultra/slicer.py`), a CLI
(`autoslice`), and a small Flask web UI (`autoslice-web`). It uses a `src/` layout with an
editable install; tests live in `tests/`.

## Cursor Cloud specific instructions
- Dependencies are installed into a project-local virtualenv at `.venv` (created by the
  startup update script). Always invoke tools via that venv, e.g. `.venv/bin/pytest`,
  `.venv/bin/ruff`, `.venv/bin/autoslice`, `.venv/bin/autoslice-web` — there is no global
  install.
- The package is installed editable (`pip install -e ".[dev]"`), so source edits under
  `src/` take effect without reinstalling. Reinstall only when dependencies or entry points
  in `pyproject.toml` change.
- Standard commands (lint/test/run) are documented in `README.md`; prefer those.
- Web UI: `.venv/bin/autoslice-web` runs the Flask dev server on `http://127.0.0.1:5000`.
  It binds to localhost; it does not need a database or any external service.
- `tests/` is a package (`tests/__init__.py` exists) so `from tests.conftest import ...`
  resolves; keep that file if adding shared test helpers in `conftest.py`.

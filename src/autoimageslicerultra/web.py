"""A small Flask web UI for AutoImageSlicerUltra.

Upload one or more paneled images and get back the individual panels, rendered inline.
Run with::

    autoslice-web            # via the console script, if installed
    python -m autoimageslicerultra.web
"""

from __future__ import annotations

import base64
import html
import io

from flask import Flask, request
from PIL import Image

from autoimageslicerultra.slicer import slice_image

app = Flask(__name__)

_PAGE = """<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>AutoImageSlicerUltra</title>
  <style>
    :root {{ color-scheme: dark; }}
    body {{ font-family: system-ui, sans-serif; margin: 0; background: #0f1116; color: #e8eaed; }}
    header {{ padding: 28px 24px; background: linear-gradient(135deg,#5b21b6,#2563eb); }}
    h1 {{ margin: 0; font-size: 24px; }}
    p.sub {{ margin: 6px 0 0; opacity: .85; }}
    main {{ max-width: 1000px; margin: 0 auto; padding: 24px; }}
    form {{ background: #181b22; padding: 20px; border-radius: 12px; display: flex; gap: 12px;
            align-items: center; flex-wrap: wrap; }}
    input[type=file] {{ color: #e8eaed; }}
    button {{ background: #2563eb; color: white; border: 0; padding: 10px 18px; border-radius: 8px;
             font-size: 15px; cursor: pointer; }}
    button:hover {{ background: #1d4ed8; }}
    .grid {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
             gap: 16px; margin-top: 12px; }}
    .card {{ background: #181b22; border-radius: 10px; padding: 10px; text-align: center; }}
    .card img {{ max-width: 100%; border-radius: 6px; }}
    .count {{ margin-top: 20px; font-size: 18px; }}
    .image-section {{ margin-top: 28px; }}
    .image-section h2 {{ margin: 0 0 4px; font-size: 18px; font-weight: 600; }}
    .image-section .image-count {{ margin: 0 0 8px; opacity: .75; font-size: 14px; }}
    .error {{ color: #f87171; margin-top: 8px; }}
  </style>
</head>
<body>
  <header>
    <h1>AutoImageSlicerUltra</h1>
    <p class="sub">Slice and divide paneled images into singles.</p>
  </header>
  <main>
    <form method="post" action="/slice" enctype="multipart/form-data">
      <input type="file" name="image" accept="image/*" multiple required />
      <button type="submit">Slice images</button>
    </form>
    {body}
  </main>
</body>
</html>"""


def _img_tag(image: Image.Image) -> str:
    buf = io.BytesIO()
    image.save(buf, format="PNG")
    data = base64.b64encode(buf.getvalue()).decode("ascii")
    return f'<img src="data:image/png;base64,{data}" alt="panel" />'


def _render_panels(panels: list) -> str:
    cards = "".join(
        f'<div class="card">{_img_tag(p.image)}'
        f"<div>panel {p.index + 1} &middot; {p.width}&times;{p.height}</div></div>"
        for p in panels
    )
    return f'<div class="grid">{cards}</div>'


def _render_image_section(filename: str, panels: list, error: str | None = None) -> str:
    safe_name = html.escape(filename)
    if error is not None:
        return (
            f'<section class="image-section">'
            f"<h2>{safe_name}</h2>"
            f'<p class="error">Could not slice: {html.escape(error)}</p>'
            f"</section>"
        )
    count = len(panels)
    label = "panel" if count == 1 else "panels"
    return (
        f'<section class="image-section">'
        f"<h2>{safe_name}</h2>"
        f'<p class="image-count">Found {count} {label}.</p>'
        f"{_render_panels(panels)}"
        f"</section>"
    )


@app.get("/")
def index() -> str:
    return _PAGE.format(body="")


@app.post("/slice")
def do_slice() -> str:
    files = [f for f in request.files.getlist("image") if f.filename]
    if not files:
        return _PAGE.format(body='<p class="count">No images uploaded.</p>')

    sections: list[str] = []
    total_panels = 0
    for file in files:
        try:
            with Image.open(file.stream) as img:
                panels = slice_image(img)
        except Exception as exc:  # noqa: BLE001 — show per-file errors in the UI
            sections.append(_render_image_section(file.filename, [], str(exc)))
            continue

        total_panels += len(panels)
        sections.append(_render_image_section(file.filename, panels))

    image_word = "image" if len(files) == 1 else "images"
    panel_word = "panel" if total_panels == 1 else "panels"
    summary = (
        f'<p class="count">Processed {len(files)} {image_word} '
        f"({total_panels} {panel_word} total).</p>"
    )
    body = summary + "".join(sections)
    return _PAGE.format(body=body)


def main() -> None:
    app.run(host="127.0.0.1", port=5000, debug=True)


if __name__ == "__main__":
    main()

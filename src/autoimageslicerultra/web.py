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
import json

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
    .player {{ background: #181b22; border-radius: 12px; margin-top: 12px; padding: 16px; }}
    .player h3 {{ margin: 0 0 10px; font-size: 16px; }}
    .player img {{ display: block; max-height: 420px; max-width: 100%; margin: 0 auto 12px;
                   border-radius: 8px; background: #0f1116; }}
    .controls {{ display: flex; align-items: center; flex-wrap: wrap; gap: 10px; }}
    .controls button {{ padding: 8px 12px; }}
    .controls input[type=range] {{ accent-color: #60a5fa; }}
    .frame-label {{ color: #cbd5e1; min-width: 90px; }}
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
  <script>
    const players = document.querySelectorAll('[data-panel-player]');
    players.forEach((player) => {{
      const frames = JSON.parse(player.dataset.frames || '[]');
      if (frames.length === 0) return;
      const image = player.querySelector('[data-frame-image]');
      const toggle = player.querySelector('[data-play-toggle]');
      const restart = player.querySelector('[data-restart]');
      const speed = player.querySelector('[data-speed]');
      const label = player.querySelector('[data-frame-label]');
      let index = 0;
      let timer = null;

      const render = () => {{
        image.src = frames[index];
        image.alt = `Animated panel frame ${{index + 1}} of ${{frames.length}}`;
        label.textContent = `Frame ${{index + 1}} / ${{frames.length}}`;
      }};

      const stop = () => {{
        window.clearInterval(timer);
        timer = null;
        toggle.textContent = 'Play';
      }};

      const play = () => {{
        stop();
        toggle.textContent = 'Pause';
        timer = window.setInterval(() => {{
          index = (index + 1) % frames.length;
          render();
        }}, Number(speed.value));
      }};

      toggle.addEventListener('click', () => {{
        if (timer) {{
          stop();
        }} else {{
          play();
        }}
      }});
      restart.addEventListener('click', () => {{
        index = 0;
        render();
        if (timer) play();
      }});
      speed.addEventListener('change', () => {{
        if (timer) play();
      }});
      render();
    }});
  </script>
</body>
</html>"""


def _image_data_uri(image: Image.Image) -> str:
    buf = io.BytesIO()
    image.save(buf, format="PNG")
    data = base64.b64encode(buf.getvalue()).decode("ascii")
    return f"data:image/png;base64,{data}"


def _img_tag(image: Image.Image) -> str:
    return f'<img src="{_image_data_uri(image)}" alt="panel" />'


def _render_panels(panels: list) -> str:
    cards = "".join(
        f'<div class="card">{_img_tag(p.image)}'
        f"<div>panel {p.index + 1} &middot; {p.width}&times;{p.height}</div></div>"
        for p in panels
    )
    return f'<div class="grid">{cards}</div>'


def _render_player(panels: list) -> str:
    if len(panels) < 2:
        return ""

    frames = [_image_data_uri(panel.image) for panel in panels]
    frames_json = html.escape(json.dumps(frames), quote=True)
    return (
        f'<div class="player" data-panel-player data-frames="{frames_json}">'
        f"<h3>Panel animation preview</h3>"
        f'<img data-frame-image src="{frames[0]}" alt="Animated panel frame 1 of {len(frames)}" />'
        f'<div class="controls">'
        f'<button type="button" data-play-toggle>Play</button>'
        f'<button type="button" data-restart>Restart</button>'
        f'<label>Speed '
        f'<input type="range" data-speed min="200" max="2000" step="100" value="700" />'
        f"</label>"
        f'<span class="frame-label" data-frame-label>Frame 1 / {len(frames)}</span>'
        f"</div>"
        f"</div>"
    )


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
        f"{_render_player(panels)}"
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

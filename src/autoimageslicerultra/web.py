"""A small Flask web UI for AutoImageSlicerUltra.

Upload a paneled image and get back the individual panels, rendered inline.
Run with::

    autoslice-web            # via the console script, if installed
    python -m autoimageslicerultra.web
"""

from __future__ import annotations

import base64
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
             gap: 16px; margin-top: 24px; }}
    .card {{ background: #181b22; border-radius: 10px; padding: 10px; text-align: center; }}
    .card img {{ max-width: 100%; border-radius: 6px; }}
    .count {{ margin-top: 20px; font-size: 18px; }}
  </style>
</head>
<body>
  <header>
    <h1>AutoImageSlicerUltra</h1>
    <p class="sub">Slice and divide paneled images into singles.</p>
  </header>
  <main>
    <form method="post" action="/slice" enctype="multipart/form-data">
      <input type="file" name="image" accept="image/*" required />
      <button type="submit">Slice image</button>
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


@app.get("/")
def index() -> str:
    return _PAGE.format(body="")


@app.post("/slice")
def do_slice() -> str:
    file = request.files.get("image")
    if file is None or file.filename == "":
        return _PAGE.format(body='<p class="count">No image uploaded.</p>')

    with Image.open(file.stream) as img:
        panels = slice_image(img)

    cards = "".join(
        f'<div class="card">{_img_tag(p.image)}'
        f"<div>panel {p.index + 1} &middot; {p.width}&times;{p.height}</div></div>"
        for p in panels
    )
    body = f'<p class="count">Found {len(panels)} panel(s).</p><div class="grid">{cards}</div>'
    return _PAGE.format(body=body)


def main() -> None:
    app.run(host="127.0.0.1", port=5000, debug=True)


if __name__ == "__main__":
    main()

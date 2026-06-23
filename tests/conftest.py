from __future__ import annotations

import pytest
from PIL import Image, ImageDraw


def make_grid_image(
    rows: int = 2,
    cols: int = 3,
    panel: tuple[int, int] = (120, 90),
    gutter: int = 20,
    bg: tuple[int, int, int] = (255, 255, 255),
) -> Image.Image:
    """Create a synthetic paneled image: a grid of solid-color panels on a bg gutter."""
    pw, ph = panel
    width = cols * pw + (cols + 1) * gutter
    height = rows * ph + (rows + 1) * gutter
    img = Image.new("RGB", (width, height), bg)
    draw = ImageDraw.Draw(img)
    colors = [
        (200, 30, 30),
        (30, 160, 60),
        (40, 80, 200),
        (220, 160, 20),
        (150, 40, 180),
        (20, 170, 180),
    ]
    k = 0
    for r in range(rows):
        for c in range(cols):
            x0 = gutter + c * (pw + gutter)
            y0 = gutter + r * (ph + gutter)
            draw.rectangle([x0, y0, x0 + pw - 1, y0 + ph - 1], fill=colors[k % len(colors)])
            k += 1
    return img


@pytest.fixture
def grid_image() -> Image.Image:
    return make_grid_image()

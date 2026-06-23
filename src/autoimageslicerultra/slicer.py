"""Core panel-slicing logic.

The slicer detects the gutters (uniform background bands) that separate panels in
a paneled image and crops out each individual panel. It works for grid layouts as
well as simpler row/column arrangements by recursively splitting first along rows
and then along columns within each row band.
"""

from __future__ import annotations

import os
from dataclasses import dataclass

import numpy as np
from PIL import Image


@dataclass(frozen=True)
class Panel:
    """A single detected panel and its bounding box in the source image.

    The bounding box is expressed as ``(left, top, right, bottom)`` in pixel
    coordinates, matching the convention used by :meth:`PIL.Image.Image.crop`.
    """

    index: int
    box: tuple[int, int, int, int]
    image: Image.Image

    @property
    def width(self) -> int:
        return self.box[2] - self.box[0]

    @property
    def height(self) -> int:
        return self.box[3] - self.box[1]


def _estimate_background(gray: np.ndarray) -> float:
    """Estimate the background (gutter) intensity from the image border."""
    border = np.concatenate(
        [gray[0, :], gray[-1, :], gray[:, 0], gray[:, -1]]
    )
    # The most common border value is overwhelmingly the gutter color.
    values, counts = np.unique(border, return_counts=True)
    return float(values[int(np.argmax(counts))])


def _content_mask(profile: np.ndarray, threshold: float) -> np.ndarray:
    """Return a boolean mask of lines (rows or cols) that contain panel content."""
    return profile > threshold


def _segments(mask: np.ndarray, min_size: int) -> list[tuple[int, int]]:
    """Find contiguous ``True`` runs in ``mask`` as ``(start, end)`` half-open ranges."""
    segments: list[tuple[int, int]] = []
    start: int | None = None
    for i, flag in enumerate(mask):
        if flag and start is None:
            start = i
        elif not flag and start is not None:
            if i - start >= min_size:
                segments.append((start, i))
            start = None
    if start is not None and len(mask) - start >= min_size:
        segments.append((start, len(mask)))
    return segments


def slice_image(
    image: Image.Image,
    *,
    tolerance: int = 12,
    content_fraction: float = 0.02,
    min_panel_size: int = 16,
) -> list[Panel]:
    """Slice a paneled image into individual panels.

    Args:
        image: The source image.
        tolerance: How far a pixel may deviate from the background intensity and
            still be considered "gutter" (0-255).
        content_fraction: Minimum fraction of non-background pixels for a row/column
            to count as containing panel content.
        min_panel_size: Minimum width/height in pixels for a detected panel.

    Returns:
        A list of :class:`Panel` objects ordered top-to-bottom, then left-to-right.
    """
    rgb = image.convert("RGB")
    gray = np.asarray(rgb.convert("L"), dtype=np.float32)
    background = _estimate_background(gray)
    foreground = np.abs(gray - background) > tolerance

    height, width = foreground.shape
    row_profile = foreground.mean(axis=1)
    row_bands = _segments(_content_mask(row_profile, content_fraction), min_panel_size)
    if not row_bands:
        # Whole image is a single panel.
        return [Panel(index=0, box=(0, 0, width, height), image=rgb.copy())]

    panels: list[Panel] = []
    for top, bottom in row_bands:
        band = foreground[top:bottom, :]
        col_profile = band.mean(axis=0)
        col_bands = _segments(_content_mask(col_profile, content_fraction), min_panel_size)
        if not col_bands:
            col_bands = [(0, width)]
        for left, right in col_bands:
            box = (left, top, right, bottom)
            panels.append(Panel(index=len(panels), box=box, image=rgb.crop(box)))
    return panels


def slice_image_file(
    path: str,
    output_dir: str,
    *,
    prefix: str = "panel",
    fmt: str = "png",
    **kwargs: object,
) -> list[str]:
    """Slice an image file and write each panel to ``output_dir``.

    Returns the list of written file paths.
    """
    with Image.open(path) as img:
        panels = slice_image(img, **kwargs)  # type: ignore[arg-type]

    os.makedirs(output_dir, exist_ok=True)
    written: list[str] = []
    pad = max(2, len(str(len(panels))))
    for panel in panels:
        name = f"{prefix}_{panel.index + 1:0{pad}d}.{fmt}"
        out_path = os.path.join(output_dir, name)
        panel.image.save(out_path)
        written.append(out_path)
    return written

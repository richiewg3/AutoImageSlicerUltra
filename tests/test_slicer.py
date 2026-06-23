from __future__ import annotations

from PIL import Image

from autoimageslicerultra import slice_image, slice_image_file
from tests.conftest import make_grid_image


def test_slices_grid_into_expected_panel_count(grid_image: Image.Image) -> None:
    panels = slice_image(grid_image)
    assert len(panels) == 6


def test_panels_have_expected_dimensions(grid_image: Image.Image) -> None:
    panels = slice_image(grid_image)
    for panel in panels:
        # Detected panels should be close to the 120x90 source panels.
        assert abs(panel.width - 120) <= 2
        assert abs(panel.height - 90) <= 2


def test_panels_are_ordered_top_left_to_bottom_right() -> None:
    panels = slice_image(make_grid_image(rows=2, cols=2))
    boxes = [p.box for p in panels]
    # Row-major order: first two share the top edge, last two share a lower top edge.
    assert boxes[0][1] == boxes[1][1]
    assert boxes[2][1] == boxes[3][1]
    assert boxes[0][1] < boxes[2][1]


def test_single_panel_image_returns_one_panel() -> None:
    solid = Image.new("RGB", (100, 100), (10, 20, 30))
    panels = slice_image(solid)
    assert len(panels) == 1
    assert panels[0].box == (0, 0, 100, 100)


def test_slice_image_file_writes_panels(tmp_path) -> None:
    src = tmp_path / "source.png"
    make_grid_image().save(src)
    out_dir = tmp_path / "out"
    written = slice_image_file(str(src), str(out_dir))
    assert len(written) == 6
    for path in written:
        assert (out_dir / path.split("/")[-1]).exists()

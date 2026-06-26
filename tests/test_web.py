from __future__ import annotations

import io

from autoimageslicerultra.web import app
from tests.conftest import make_grid_image


def _png_bytes(img) -> bytes:
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def test_index_returns_upload_form():
    client = app.test_client()
    response = client.get("/")
    assert response.status_code == 200
    html = response.get_data(as_text=True)
    assert 'type="file"' in html
    assert "multiple" in html
    assert "Slice images" in html


def test_slice_single_image():
    client = app.test_client()
    data = {"image": (io.BytesIO(_png_bytes(make_grid_image())), "grid.png")}
    response = client.post("/slice", data=data, content_type="multipart/form-data")
    assert response.status_code == 200
    html = response.get_data(as_text=True)
    assert "Processed 1 image" in html
    assert "grid.png" in html
    assert "Found 6 panels." in html


def test_slice_image_adds_panel_animation_player():
    client = app.test_client()
    data = {"image": (io.BytesIO(_png_bytes(make_grid_image(rows=1, cols=3))), "strip.png")}
    response = client.post("/slice", data=data, content_type="multipart/form-data")

    assert response.status_code == 200
    html = response.get_data(as_text=True)
    assert "Panel animation preview" in html
    assert "data-panel-player" in html
    assert "data-play-toggle" in html
    assert "Frame 1 / 3" in html
    assert "data:image/png;base64," in html


def test_slice_multiple_images():
    client = app.test_client()
    data = {
        "image": [
            (io.BytesIO(_png_bytes(make_grid_image(rows=1, cols=2))), "one.png"),
            (io.BytesIO(_png_bytes(make_grid_image(rows=2, cols=2))), "two.png"),
        ]
    }
    response = client.post("/slice", data=data, content_type="multipart/form-data")
    assert response.status_code == 200
    html = response.get_data(as_text=True)
    assert "Processed 2 images" in html
    assert "one.png" in html
    assert "two.png" in html
    assert "Found 2 panels." in html
    assert "Found 4 panels." in html


def test_slice_no_images():
    client = app.test_client()
    response = client.post("/slice", data={}, content_type="multipart/form-data")
    assert response.status_code == 200
    assert "No images uploaded." in response.get_data(as_text=True)

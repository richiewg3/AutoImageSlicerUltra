"""Command-line interface for AutoImageSlicerUltra."""

from __future__ import annotations

import argparse
import sys

from autoimageslicerultra.slicer import slice_image_file


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="autoslice",
        description="Slice and divide paneled images into single images.",
    )
    parser.add_argument("input", help="Path to the paneled source image.")
    parser.add_argument(
        "-o",
        "--output-dir",
        default="panels",
        help="Directory to write sliced panels to (default: ./panels).",
    )
    parser.add_argument("--prefix", default="panel", help="Filename prefix for panels.")
    parser.add_argument("--format", default="png", help="Output image format (default: png).")
    parser.add_argument(
        "--tolerance",
        type=int,
        default=12,
        help="Gutter color tolerance, 0-255 (default: 12).",
    )
    parser.add_argument(
        "--content-fraction",
        type=float,
        default=0.02,
        help="Min fraction of content pixels for a row/column (default: 0.02).",
    )
    parser.add_argument(
        "--min-panel-size",
        type=int,
        default=16,
        help="Minimum panel width/height in pixels (default: 16).",
    )
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    written = slice_image_file(
        args.input,
        args.output_dir,
        prefix=args.prefix,
        fmt=args.format,
        tolerance=args.tolerance,
        content_fraction=args.content_fraction,
        min_panel_size=args.min_panel_size,
    )
    print(f"Sliced {len(written)} panel(s) into '{args.output_dir}':")
    for path in written:
        print(f"  {path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

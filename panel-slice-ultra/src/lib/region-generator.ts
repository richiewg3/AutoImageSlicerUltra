import type { CropBox, EditorState, OutputRegion } from "./types";

function sortedPositions(lines: { position: number }[]): number[] {
  return [...lines.map((line) => line.position)].sort((a, b) => a - b);
}

export function generateRegions(
  editor: EditorState,
  imageWidth: number,
  imageHeight: number,
): OutputRegion[] {
  const regions: OutputRegion[] = [];
  const hPositions = sortedPositions(editor.horizontalLines);
  const vPositions = sortedPositions(editor.verticalLines);
  const hasGrid = hPositions.length > 0 || vPositions.length > 0;

  if (hasGrid) {
    const hBounds = [0, ...hPositions, 1];
    const vBounds = [0, ...vPositions, 1];

    for (let row = 0; row < hBounds.length - 1; row += 1) {
      for (let col = 0; col < vBounds.length - 1; col += 1) {
        const width = vBounds[col + 1] - vBounds[col];
        const height = hBounds[row + 1] - hBounds[row];
        if (width < 0.005 || height < 0.005) continue;

        regions.push({
          id: `grid-${row}-${col}`,
          type: "grid",
          x: vBounds[col],
          y: hBounds[row],
          width,
          height,
          label: `Slice ${regions.length + 1}`,
        });
      }
    }
  } else if (editor.cropBoxes.length === 0) {
    regions.push({
      id: "full-image",
      type: "grid",
      x: 0,
      y: 0,
      width: 1,
      height: 1,
      label: "Full image",
    });
  }

  editor.cropBoxes.forEach((box, index) => {
    if (box.width < 0.005 || box.height < 0.005) return;
    regions.push({
      id: box.id,
      type: "crop",
      x: box.x,
      y: box.y,
      width: box.width,
      height: box.height,
      label: `Crop ${index + 1}`,
    });
  });

  void imageWidth;
  void imageHeight;

  return regions;
}

export function clampNormalized(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function normalizeCropBox(box: CropBox): CropBox {
  let { x, y, width, height } = box;
  if (width < 0) {
    x += width;
    width = Math.abs(width);
  }
  if (height < 0) {
    y += height;
    height = Math.abs(height);
  }
  x = clampNormalized(x);
  y = clampNormalized(y);
  width = Math.min(width, 1 - x);
  height = Math.min(height, 1 - y);
  return { ...box, x, y, width, height };
}

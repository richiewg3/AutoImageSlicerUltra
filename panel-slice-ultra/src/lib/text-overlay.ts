import type { TextColor, TextOverlay, TextSize } from "./types";
import { TEXT_COLOR_OPTIONS } from "./types";

const SIZE_SCALE: Record<TextSize, number> = {
  small: 0.032,
  medium: 0.048,
  large: 0.064,
};

function getColorHex(color: TextColor): string {
  return TEXT_COLOR_OPTIONS.find((option) => option.id === color)?.hex ?? "#ffffff";
}

function getFontSize(size: TextSize, imageHeight: number): number {
  return Math.max(14, Math.round(imageHeight * SIZE_SCALE[size]));
}

function getBandHeight(fontSize: number): number {
  return Math.round(fontSize * 2.4);
}

/** Returns a new canvas with a caption band above or below the image. */
export function applyTextOverlay(
  canvas: HTMLCanvasElement,
  overlay: TextOverlay,
): HTMLCanvasElement {
  const trimmed = overlay.text.trim();
  if (!trimmed) return canvas;

  const fontSize = getFontSize(overlay.size, canvas.height);
  const bandHeight = getBandHeight(fontSize);
  const colorHex = getColorHex(overlay.color);

  const output = document.createElement("canvas");
  output.width = canvas.width;
  output.height = canvas.height + bandHeight;

  const ctx = output.getContext("2d");
  if (!ctx) throw new Error("Canvas is not supported.");

  const imageY = overlay.placement === "top" ? bandHeight : 0;
  ctx.drawImage(canvas, 0, imageY);

  const bandY = overlay.placement === "top" ? 0 : canvas.height;
  ctx.fillStyle = "#0b0d12";
  ctx.fillRect(0, bandY, output.width, bandHeight);

  ctx.font = `600 ${fontSize}px system-ui, -apple-system, sans-serif`;
  ctx.fillStyle = colorHex;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(trimmed, output.width / 2, bandY + bandHeight / 2);

  return output;
}

import JSZip from "jszip";

import type { AspectRatioPreset, OutputRegion } from "./types";
import { ASPECT_RATIO_PRESETS } from "./types";

function getAspectRatioValue(preset: AspectRatioPreset | null): number | null {
  if (!preset) return null;
  return ASPECT_RATIO_PRESETS.find((item) => item.id === preset)?.ratio ?? null;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load image for export."));
    image.src = src;
  });
}

function cropRegionToCanvas(
  image: HTMLImageElement,
  region: OutputRegion,
  aspectRatio: number | null,
): HTMLCanvasElement {
  const sourceX = Math.round(region.x * image.naturalWidth);
  const sourceY = Math.round(region.y * image.naturalHeight);
  const sourceW = Math.max(1, Math.round(region.width * image.naturalWidth));
  const sourceH = Math.max(1, Math.round(region.height * image.naturalHeight));

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is not supported.");

  if (!aspectRatio) {
    canvas.width = sourceW;
    canvas.height = sourceH;
    context.drawImage(image, sourceX, sourceY, sourceW, sourceH, 0, 0, sourceW, sourceH);
    return canvas;
  }

  const sourceRatio = sourceW / sourceH;
  let outputW: number;
  let outputH: number;

  if (sourceRatio > aspectRatio) {
    outputH = sourceH;
    outputW = Math.round(outputH * aspectRatio);
  } else {
    outputW = sourceW;
    outputH = Math.round(outputW / aspectRatio);
  }

  canvas.width = outputW;
  canvas.height = outputH;
  context.fillStyle = "#0b0d12";
  context.fillRect(0, 0, outputW, outputH);

  const drawW = Math.min(sourceW, outputW);
  const drawH = Math.min(sourceH, outputH);
  const offsetX = Math.round((outputW - drawW) / 2);
  const offsetY = Math.round((outputH - drawH) / 2);

  context.drawImage(
    image,
    sourceX,
    sourceY,
    sourceW,
    sourceH,
    offsetX,
    offsetY,
    drawW,
    drawH,
  );

  return canvas;
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Export failed."));
          return;
        }
        resolve(blob);
      },
      "image/png",
      1,
    );
  });
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function exportRegionsIndividually(
  imageUrl: string,
  regions: OutputRegion[],
  aspectPreset: AspectRatioPreset | null,
) {
  const image = await loadImage(imageUrl);
  const aspectRatio = getAspectRatioValue(aspectPreset);
  const pad = String(regions.length).length;

  for (let index = 0; index < regions.length; index += 1) {
    const region = regions[index];
    const canvas = cropRegionToCanvas(image, region, aspectRatio);
    const blob = await canvasToBlob(canvas);
    const filename = `panel-slice-${String(index + 1).padStart(pad, "0")}.png`;
    downloadBlob(blob, filename);
    await new Promise((resolve) => setTimeout(resolve, 120));
  }
}

export async function exportRegionsAsZip(
  imageUrl: string,
  regions: OutputRegion[],
  aspectPreset: AspectRatioPreset | null,
): Promise<void> {
  const image = await loadImage(imageUrl);
  const aspectRatio = getAspectRatioValue(aspectPreset);
  const zip = new JSZip();
  const pad = String(regions.length).length;

  for (let index = 0; index < regions.length; index += 1) {
    const region = regions[index];
    const canvas = cropRegionToCanvas(image, region, aspectRatio);
    const blob = await canvasToBlob(canvas);
    const filename = `panel-slice-${String(index + 1).padStart(pad, "0")}.png`;
    zip.file(filename, blob);
  }

  const zipBlob = await zip.generateAsync({ type: "blob" });
  downloadBlob(zipBlob, "panel-slice-ultra.zip");
}

export async function renderRegionPreview(
  imageUrl: string,
  region: OutputRegion,
  aspectPreset: AspectRatioPreset | null,
  maxSize = 320,
): Promise<string> {
  const image = await loadImage(imageUrl);
  const aspectRatio = getAspectRatioValue(aspectPreset);
  const canvas = cropRegionToCanvas(image, region, aspectRatio);
  const scale = Math.min(1, maxSize / Math.max(canvas.width, canvas.height));
  if (scale < 1) {
    const scaled = document.createElement("canvas");
    scaled.width = Math.round(canvas.width * scale);
    scaled.height = Math.round(canvas.height * scale);
    const ctx = scaled.getContext("2d");
    if (!ctx) throw new Error("Canvas is not supported.");
    ctx.drawImage(canvas, 0, 0, scaled.width, scaled.height);
    return scaled.toDataURL("image/png");
  }
  return canvas.toDataURL("image/png");
}

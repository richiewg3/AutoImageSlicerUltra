"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { createId } from "@/lib/id";
import { clampNormalized, normalizeCropBox } from "@/lib/region-generator";
import type { CropBox, EditorState, Tool } from "@/lib/types";

type ImageWorkspaceProps = {
  imageUrl: string;
  editor: EditorState;
  activeTool: Tool;
  onAddHorizontal: (position: number) => void;
  onAddVertical: (position: number) => void;
  onAddCropBox: (box: CropBox) => void;
  onUpdateCropBox: (id: string, box: CropBox, recordHistory?: boolean) => void;
  onMoveLine: (id: string, position: number, recordHistory?: boolean) => void;
  onSelect: (id: string | null) => void;
};

type DragState =
  | { kind: "crop-draw"; startX: number; startY: number; boxId: string }
  | { kind: "line-move"; lineId: string; orientation: "horizontal" | "vertical" }
  | { kind: "box-move"; boxId: string; startX: number; startY: number; origin: CropBox };

export function ImageWorkspace({
  imageUrl,
  editor,
  activeTool,
  onAddHorizontal,
  onAddVertical,
  onAddCropBox,
  onUpdateCropBox,
  onMoveLine,
  onSelect,
}: ImageWorkspaceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [draftBox, setDraftBox] = useState<CropBox | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);

  const getRelativePoint = useCallback((clientX: number, clientY: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: clampNormalized((clientX - rect.left) / rect.width),
      y: clampNormalized((clientY - rect.top) / rect.height),
    };
  }, []);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    const point = getRelativePoint(event.clientX, event.clientY);
    event.currentTarget.setPointerCapture(event.pointerId);

    if (activeTool === "horizontal") {
      onAddHorizontal(point.y);
      return;
    }

    if (activeTool === "vertical") {
      onAddVertical(point.x);
      return;
    }

    if (activeTool === "crop") {
      const boxId = createId("crop");
      const box: CropBox = {
        id: boxId,
        x: point.x,
        y: point.y,
        width: 0,
        height: 0,
      };
      setDraftBox(box);
      setDrag({ kind: "crop-draw", startX: point.x, startY: point.y, boxId });
      return;
    }

    const hit = hitTest(editor, point.x, point.y);
    if (!hit) {
      onSelect(null);
      return;
    }

    onSelect(hit.id);

    if (hit.kind === "line") {
      onMoveLine(hit.id, hit.orientation === "horizontal" ? point.y : point.x, true);
      setDrag({
        kind: "line-move",
        lineId: hit.id,
        orientation: hit.orientation!,
      });
      return;
    }

    const box = editor.cropBoxes.find((item) => item.id === hit.id);
    if (box) {
      onUpdateCropBox(box.id, box, true);
      setDrag({
        kind: "box-move",
        boxId: box.id,
        startX: point.x,
        startY: point.y,
        origin: box,
      });
    }
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!drag) return;
    const point = getRelativePoint(event.clientX, event.clientY);

    if (drag.kind === "crop-draw" && draftBox) {
      const next = normalizeCropBox({
        ...draftBox,
        width: point.x - drag.startX,
        height: point.y - drag.startY,
      });
      setDraftBox(next);
      return;
    }

    if (drag.kind === "line-move") {
      const position = drag.orientation === "horizontal" ? point.y : point.x;
      onMoveLine(drag.lineId, clampNormalized(position));
      return;
    }

    if (drag.kind === "box-move") {
      const dx = point.x - drag.startX;
      const dy = point.y - drag.startY;
      const next = normalizeCropBox({
        ...drag.origin,
        x: clampNormalized(drag.origin.x + dx),
        y: clampNormalized(drag.origin.y + dy),
      });
      onUpdateCropBox(drag.boxId, next);
    }
  };

  const handlePointerUp = () => {
    if (drag?.kind === "crop-draw" && draftBox) {
      const normalized = normalizeCropBox(draftBox);
      if (normalized.width > 0.01 && normalized.height > 0.01) {
        onAddCropBox(normalized);
      }
    }
    setDraftBox(null);
    setDrag(null);
  };

  useEffect(() => {
    setDraftBox(null);
    setDrag(null);
  }, [activeTool]);

  const allBoxes = draftBox
    ? [...editor.cropBoxes.filter((box) => box.id !== draftBox.id), draftBox]
    : editor.cropBoxes;

  return (
    <div className="workspace-frame">
      <div
        ref={containerRef}
        className="workspace-canvas"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt="Source image for slicing" className="workspace-image" />

        {editor.horizontalLines.map((line) => (
          <div
            key={line.id}
            className={`slice-line horizontal ${editor.selectedId === line.id ? "is-selected" : ""}`}
            style={{ top: `${line.position * 100}%` }}
            aria-hidden
          />
        ))}

        {editor.verticalLines.map((line) => (
          <div
            key={line.id}
            className={`slice-line vertical ${editor.selectedId === line.id ? "is-selected" : ""}`}
            style={{ left: `${line.position * 100}%` }}
            aria-hidden
          />
        ))}

        {allBoxes.map((box) => (
          <div
            key={box.id}
            className={`crop-box ${editor.selectedId === box.id ? "is-selected" : ""}`}
            style={{
              left: `${box.x * 100}%`,
              top: `${box.y * 100}%`,
              width: `${box.width * 100}%`,
              height: `${box.height * 100}%`,
            }}
            aria-hidden
          />
        ))}
      </div>
    </div>
  );
}

function hitTest(
  editor: EditorState,
  x: number,
  y: number,
): { id: string; kind: "line" | "box"; orientation?: "horizontal" | "vertical" } | null {
  const threshold = 0.03;

  for (const box of editor.cropBoxes) {
    if (
      x >= box.x &&
      x <= box.x + box.width &&
      y >= box.y &&
      y <= box.y + box.height
    ) {
      return { id: box.id, kind: "box" };
    }
  }

  for (const line of editor.horizontalLines) {
    if (Math.abs(y - line.position) <= threshold) {
      return { id: line.id, kind: "line", orientation: "horizontal" };
    }
  }

  for (const line of editor.verticalLines) {
    if (Math.abs(x - line.position) <= threshold) {
      return { id: line.id, kind: "line", orientation: "vertical" };
    }
  }

  return null;
}

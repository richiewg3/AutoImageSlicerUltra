"use client";

import { ImageWorkspace } from "@/components/ImageWorkspace";
import { ToolBar } from "@/components/ToolBar";
import type { CropBox, EditorState, Tool } from "@/lib/types";

type EditingScreenProps = {
  image: { url: string; width: number; height: number; name: string };
  editor: EditorState;
  activeTool: Tool;
  pieceCount: number;
  canUndo: boolean;
  onToolChange: (tool: Tool) => void;
  onAddHorizontal: (position: number) => void;
  onAddVertical: (position: number) => void;
  onAddCropBox: (box: CropBox) => void;
  onUpdateCropBox: (id: string, box: CropBox) => void;
  onMoveLine: (id: string, position: number) => void;
  onSelect: (id: string | null) => void;
  onDelete: () => void;
  onUndo: () => void;
  onReset: () => void;
  onPreview: () => void;
};

export function EditingScreen({
  image,
  editor,
  activeTool,
  pieceCount,
  canUndo,
  onToolChange,
  onAddHorizontal,
  onAddVertical,
  onAddCropBox,
  onUpdateCropBox,
  onMoveLine,
  onSelect,
  onDelete,
  onUndo,
  onReset,
  onPreview,
}: EditingScreenProps) {
  const toolHint = getToolHint(activeTool);

  return (
    <section className="editing-screen">
      <div className="status-strip">
        <span className="status-pill">Editing</span>
        <span className="status-text">
          {pieceCount} output{pieceCount === 1 ? "" : "s"} ready to preview
        </span>
      </div>

      <ImageWorkspace
        imageUrl={image.url}
        editor={editor}
        activeTool={activeTool}
        onAddHorizontal={onAddHorizontal}
        onAddVertical={onAddVertical}
        onAddCropBox={onAddCropBox}
        onUpdateCropBox={onUpdateCropBox}
        onMoveLine={onMoveLine}
        onSelect={onSelect}
      />

      <p className="tool-hint">{toolHint}</p>

      <ToolBar
        activeTool={activeTool}
        canUndo={canUndo}
        hasSelection={Boolean(editor.selectedId)}
        onToolChange={onToolChange}
        onUndo={onUndo}
        onReset={onReset}
        onDelete={onDelete}
        onPreview={onPreview}
      />
    </section>
  );
}

function getToolHint(tool: Tool): string {
  switch (tool) {
    case "horizontal":
      return "Tap the image to place a horizontal slice line.";
    case "vertical":
      return "Tap the image to place a vertical slice line.";
    case "crop":
      return "Drag on the image to draw a custom crop box.";
    case "select":
      return "Tap a line or box to select it, then drag to adjust.";
    case "delete":
      return "Select an element, then tap Delete.";
    default:
      return "";
  }
}

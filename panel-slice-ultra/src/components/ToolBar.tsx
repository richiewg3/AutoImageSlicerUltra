"use client";

import type { Tool } from "@/lib/types";

type ToolBarProps = {
  activeTool: Tool;
  canUndo: boolean;
  hasSelection: boolean;
  onToolChange: (tool: Tool) => void;
  onUndo: () => void;
  onReset: () => void;
  onDelete: () => void;
  onPreview: () => void;
};

const TOOLS: { id: Tool; label: string; short: string }[] = [
  { id: "horizontal", label: "Horizontal slice", short: "H" },
  { id: "vertical", label: "Vertical slice", short: "V" },
  { id: "crop", label: "Crop box", short: "Box" },
  { id: "select", label: "Select & move", short: "Move" },
];

export function ToolBar({
  activeTool,
  canUndo,
  hasSelection,
  onToolChange,
  onUndo,
  onReset,
  onDelete,
  onPreview,
}: ToolBarProps) {
  return (
    <div className="toolbar">
      <div className="toolbar-row">
        {TOOLS.map((tool) => (
          <button
            key={tool.id}
            type="button"
            className={`tool-button ${activeTool === tool.id ? "is-active" : ""}`}
            aria-pressed={activeTool === tool.id}
            onClick={() => onToolChange(tool.id)}
          >
            <span className="tool-short">{tool.short}</span>
            <span className="tool-label">{tool.label}</span>
          </button>
        ))}
      </div>

      <div className="toolbar-row toolbar-row-secondary">
        <button
          type="button"
          className="secondary-button"
          onClick={onUndo}
          disabled={!canUndo}
        >
          Undo
        </button>
        <button
          type="button"
          className="secondary-button"
          onClick={onDelete}
          disabled={!hasSelection}
        >
          Delete
        </button>
        <button type="button" className="secondary-button" onClick={onReset}>
          Reset
        </button>
        <button type="button" className="primary-button" onClick={onPreview}>
          Preview
        </button>
      </div>
    </div>
  );
}

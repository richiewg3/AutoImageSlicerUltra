"use client";

import type { CSSProperties } from "react";

import type {
  TextColor,
  TextOverlay,
  TextPlacement,
  TextSize,
} from "@/lib/types";
import {
  TEXT_COLOR_OPTIONS,
  TEXT_PLACEMENT_OPTIONS,
  TEXT_SIZE_OPTIONS,
  createEmptyTextOverlay,
} from "@/lib/types";

type CaptionEditorProps = {
  regionLabel: string;
  overlay: TextOverlay;
  onChange: (overlay: TextOverlay) => void;
  onClear: () => void;
};

export function CaptionEditor({
  regionLabel,
  overlay,
  onChange,
  onClear,
}: CaptionEditorProps) {
  const hasText = overlay.text.trim().length > 0;

  return (
    <div className="caption-editor">
      <div className="caption-editor-header">
        <h3>Caption for {regionLabel}</h3>
        {hasText && (
          <button type="button" className="ghost-button" onClick={onClear}>
            Clear
          </button>
        )}
      </div>

      <div className="caption-field">
        <label htmlFor="caption-text">Text</label>
        <input
          id="caption-text"
          type="text"
          className="export-input"
          value={overlay.text}
          onChange={(event) =>
            onChange({ ...overlay, text: event.target.value })
          }
          placeholder="Add a caption…"
          autoComplete="off"
          spellCheck={false}
        />
      </div>

      <div className="caption-options">
        <fieldset className="caption-option-group">
          <legend>Size</legend>
          <div className="caption-chip-row">
            {TEXT_SIZE_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                className={`aspect-chip ${overlay.size === option.id ? "is-active" : ""}`}
                onClick={() =>
                  onChange({ ...overlay, size: option.id as TextSize })
                }
              >
                {option.label}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="caption-option-group">
          <legend>Color</legend>
          <div className="caption-chip-row">
            {TEXT_COLOR_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                className={`color-chip ${overlay.color === option.id ? "is-active" : ""}`}
                style={{ "--chip-color": option.hex } as CSSProperties}
                onClick={() =>
                  onChange({ ...overlay, color: option.id as TextColor })
                }
                aria-label={option.label}
                title={option.label}
              />
            ))}
          </div>
        </fieldset>

        <fieldset className="caption-option-group">
          <legend>Placement</legend>
          <div className="caption-chip-row">
            {TEXT_PLACEMENT_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                className={`aspect-chip ${overlay.placement === option.id ? "is-active" : ""}`}
                onClick={() =>
                  onChange({
                    ...overlay,
                    placement: option.id as TextPlacement,
                  })
                }
              >
                {option.label}
              </button>
            ))}
          </div>
        </fieldset>
      </div>
    </div>
  );
}

export function getOverlayForRegion(
  overlays: Record<string, TextOverlay | undefined>,
  regionId: string,
): TextOverlay {
  return overlays[regionId] ?? createEmptyTextOverlay();
}

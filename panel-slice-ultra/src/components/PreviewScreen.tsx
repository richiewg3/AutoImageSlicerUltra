"use client";

import { useEffect, useState } from "react";

import { CaptionEditor, getOverlayForRegion } from "@/components/CaptionEditor";
import { renderRegionPreview } from "@/lib/export";
import type {
  AspectRatioPreset,
  OutputRegion,
  TextOverlay,
  TextOverlayMap,
} from "@/lib/types";

type PreviewScreenProps = {
  imageUrl: string;
  outputs: OutputRegion[];
  selectedIds: Set<string>;
  aspectPreset: AspectRatioPreset | null;
  textOverlays: TextOverlayMap;
  onTextOverlayChange: (
    regionId: string,
    overlay: TextOverlay | undefined,
  ) => void;
  onToggle: (id: string) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onBack: () => void;
  onContinue: () => void;
};

export function PreviewScreen({
  imageUrl,
  outputs,
  selectedIds,
  aspectPreset,
  textOverlays,
  onTextOverlayChange,
  onToggle,
  onSelectAll,
  onClearSelection,
  onBack,
  onContinue,
}: PreviewScreenProps) {
  const [previews, setPreviews] = useState<Record<string, string> | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [animationFrame, setAnimationFrame] = useState(0);
  const [animationDelay, setAnimationDelay] = useState(700);
  const [animationPlaying, setAnimationPlaying] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const next: Record<string, string> = {};
      for (const region of outputs) {
        next[region.id] = await renderRegionPreview(
          imageUrl,
          region,
          aspectPreset,
          320,
          textOverlays,
        );
        if (cancelled) return;
      }
      if (!cancelled) {
        setPreviews(next);
      }
    })().catch(() => {
      if (!cancelled) setPreviews({});
    });

    return () => {
      cancelled = true;
    };
  }, [imageUrl, outputs, aspectPreset, textOverlays]);

  const selectedRegions = outputs.filter((region) =>
    selectedIds.has(region.id),
  );
  const selectedCount = selectedRegions.length;
  const animationRegions =
    selectedRegions.length > 1 ? selectedRegions : outputs;
  const safeAnimationFrame = animationRegions.length
    ? animationFrame % animationRegions.length
    : 0;
  const currentAnimationRegion = animationRegions[safeAnimationFrame] ?? null;
  const currentAnimationPreview = currentAnimationRegion
    ? previews?.[currentAnimationRegion.id]
    : undefined;

  useEffect(() => {
    if (!animationPlaying || animationRegions.length < 2) return undefined;

    const intervalId = window.setInterval(() => {
      setAnimationFrame((current) => (current + 1) % animationRegions.length);
    }, animationDelay);

    return () => window.clearInterval(intervalId);
  }, [animationPlaying, animationDelay, animationRegions.length]);

  const editingRegion = editingId
    ? outputs.find((region) => region.id === editingId)
    : null;

  return (
    <section className="preview-screen">
      <div className="status-strip">
        <span className="status-pill">Preview</span>
        <span className="status-text">
          {selectedCount} of {outputs.length} selected for export
        </span>
      </div>

      <div className="preview-actions">
        <button
          type="button"
          className="secondary-button"
          onClick={onSelectAll}
        >
          Select all
        </button>
        <button
          type="button"
          className="secondary-button"
          onClick={onClearSelection}
        >
          Clear
        </button>
      </div>

      {previews && animationRegions.length > 1 && currentAnimationRegion && (
        <div className="animation-preview" aria-live="polite">
          <div className="animation-copy">
            <span className="status-pill">Animation</span>
            <div>
              <h2>Panel animation preview</h2>
              <p>
                Play the current slices in order before exporting. When more
                than one output is selected, only selected outputs are included.
              </p>
            </div>
          </div>

          <div className="animation-stage">
            {currentAnimationPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={currentAnimationPreview}
                alt={`Animation frame ${safeAnimationFrame + 1} of ${animationRegions.length}: ${currentAnimationRegion.label}`}
              />
            ) : (
              <span>Animation frame unavailable</span>
            )}
          </div>

          <div className="animation-controls">
            <button
              type="button"
              className="secondary-button"
              onClick={() => setAnimationPlaying((playing) => !playing)}
            >
              {animationPlaying ? "Pause" : "Play"}
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                setAnimationFrame(0);
                setAnimationPlaying(false);
              }}
            >
              Restart
            </button>
            <label className="animation-speed">
              Speed
              <input
                type="range"
                min="200"
                max="2000"
                step="100"
                value={animationDelay}
                onChange={(event) =>
                  setAnimationDelay(Number(event.currentTarget.value))
                }
              />
            </label>
            <span className="animation-frame-label">
              Frame {safeAnimationFrame + 1} / {animationRegions.length}:{" "}
              {currentAnimationRegion.label}
            </span>
          </div>
        </div>
      )}

      {!previews ? (
        <p className="loading-text">Generating previews…</p>
      ) : (
        <div className="preview-grid">
          {outputs.map((region) => {
            const selected = selectedIds.has(region.id);
            const hasCaption = Boolean(textOverlays[region.id]?.text.trim());
            return (
              <div key={region.id} className="preview-card-wrap">
                <button
                  type="button"
                  className={`preview-card ${selected ? "is-selected" : ""}`}
                  onClick={() => onToggle(region.id)}
                  aria-pressed={selected}
                >
                  <div className="preview-thumb">
                    {previews[region.id] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={previews[region.id]} alt={region.label} />
                    ) : (
                      <span>Preview unavailable</span>
                    )}
                  </div>
                  <div className="preview-meta">
                    <strong>{region.label}</strong>
                    <span>{selected ? "Kept" : "Skipped"}</span>
                  </div>
                </button>
                {selected && (
                  <button
                    type="button"
                    className={`caption-toggle ${editingId === region.id ? "is-active" : ""}`}
                    onClick={() =>
                      setEditingId((current) =>
                        current === region.id ? null : region.id,
                      )
                    }
                  >
                    {hasCaption ? "Edit caption" : "Add caption"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {editingRegion && (
        <CaptionEditor
          regionLabel={editingRegion.label}
          overlay={getOverlayForRegion(textOverlays, editingRegion.id)}
          onChange={(overlay) => onTextOverlayChange(editingRegion.id, overlay)}
          onClear={() => onTextOverlayChange(editingRegion.id, undefined)}
        />
      )}

      <div className="flow-actions">
        <button type="button" className="secondary-button" onClick={onBack}>
          Back to editing
        </button>
        <button
          type="button"
          className="primary-button"
          onClick={onContinue}
          disabled={selectedCount === 0}
        >
          Continue to export
        </button>
      </div>
    </section>
  );
}

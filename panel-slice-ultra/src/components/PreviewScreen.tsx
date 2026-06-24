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
import { createEmptyTextOverlay } from "@/lib/types";

type PreviewScreenProps = {
  imageUrl: string;
  outputs: OutputRegion[];
  selectedIds: Set<string>;
  aspectPreset: AspectRatioPreset | null;
  textOverlays: TextOverlayMap;
  onTextOverlayChange: (regionId: string, overlay: TextOverlay | undefined) => void;
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
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

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
        setLoading(false);
      }
    })().catch(() => {
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [imageUrl, outputs, aspectPreset, textOverlays]);

  const selectedCount = outputs.filter((region) =>
    selectedIds.has(region.id),
  ).length;

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
        <button type="button" className="secondary-button" onClick={onSelectAll}>
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

      {loading ? (
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
          onChange={(overlay) =>
            onTextOverlayChange(editingRegion.id, overlay)
          }
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

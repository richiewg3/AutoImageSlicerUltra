"use client";

import { useEffect, useState } from "react";

import { renderRegionPreview } from "@/lib/export";
import type { AspectRatioPreset, OutputRegion } from "@/lib/types";

type PreviewScreenProps = {
  imageUrl: string;
  outputs: OutputRegion[];
  selectedIds: Set<string>;
  aspectPreset: AspectRatioPreset | null;
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
  onToggle,
  onSelectAll,
  onClearSelection,
  onBack,
  onContinue,
}: PreviewScreenProps) {
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

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
  }, [imageUrl, outputs, aspectPreset]);

  const selectedCount = outputs.filter((region) =>
    selectedIds.has(region.id),
  ).length;

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
            return (
              <button
                key={region.id}
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
            );
          })}
        </div>
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

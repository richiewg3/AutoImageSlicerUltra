"use client";

import { useState } from "react";

import {
  exportRegionsAsZip,
  exportRegionsIndividually,
} from "@/lib/export";
import type { AspectRatioPreset, OutputRegion } from "@/lib/types";
import { ASPECT_RATIO_PRESETS } from "@/lib/types";

type ExportScreenProps = {
  imageUrl: string;
  outputs: OutputRegion[];
  aspectPreset: AspectRatioPreset | null;
  onAspectChange: (preset: AspectRatioPreset | null) => void;
  onBack: () => void;
};

export function ExportScreen({
  imageUrl,
  outputs,
  aspectPreset,
  onAspectChange,
  onBack,
}: ExportScreenProps) {
  const [busy, setBusy] = useState<"zip" | "files" | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const runExport = async (mode: "zip" | "files") => {
    if (outputs.length === 0) return;
    setBusy(mode);
    setMessage(null);
    try {
      if (mode === "zip") {
        await exportRegionsAsZip(imageUrl, outputs, aspectPreset);
        setMessage("ZIP download started.");
      } else {
        await exportRegionsIndividually(imageUrl, outputs, aspectPreset);
        setMessage("Individual downloads started.");
      }
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Export failed. Try again.",
      );
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="export-screen">
      <div className="status-strip">
        <span className="status-pill">Export</span>
        <span className="status-text">
          {outputs.length} file{outputs.length === 1 ? "" : "s"} ready
        </span>
      </div>

      <div className="export-card">
        <h2>Choose how to save your slices</h2>
        <p>
          Aspect-ratio presets only affect the exported files. Your slice layout
          in the editor stays the same.
        </p>

        <div className="aspect-grid">
          <button
            type="button"
            className={`aspect-chip ${aspectPreset === null ? "is-active" : ""}`}
            onClick={() => onAspectChange(null)}
          >
            Original
          </button>
          {ASPECT_RATIO_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className={`aspect-chip ${aspectPreset === preset.id ? "is-active" : ""}`}
              onClick={() => onAspectChange(preset.id)}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="export-actions">
          <button
            type="button"
            className="primary-button"
            disabled={busy !== null}
            onClick={() => runExport("files")}
          >
            {busy === "files" ? "Preparing files…" : "Download individually"}
          </button>
          <button
            type="button"
            className="secondary-button"
            disabled={busy !== null}
            onClick={() => runExport("zip")}
          >
            {busy === "zip" ? "Building ZIP…" : "Download as ZIP"}
          </button>
        </div>

        {message && <p className="export-message">{message}</p>}
      </div>

      <div className="flow-actions">
        <button type="button" className="secondary-button" onClick={onBack}>
          Back to preview
        </button>
      </div>
    </section>
  );
}

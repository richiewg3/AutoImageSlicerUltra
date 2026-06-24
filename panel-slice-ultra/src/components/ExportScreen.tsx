"use client";

import { useMemo, useState } from "react";

import {
  exportRegionsAsZip,
  exportRegionsIndividually,
  sanitizeExportBasename,
  type ExportVariant,
} from "@/lib/export";
import type { AspectRatioPreset, OutputRegion, TextOverlayMap } from "@/lib/types";
import { ASPECT_RATIO_PRESETS, hasActiveTextOverlays } from "@/lib/types";

type ExportScreenProps = {
  imageUrl: string;
  sourceImageName: string;
  outputs: OutputRegion[];
  aspectPreset: AspectRatioPreset | null;
  textOverlays: TextOverlayMap;
  onAspectChange: (preset: AspectRatioPreset | null) => void;
  onBack: () => void;
};

export function ExportScreen({
  imageUrl,
  sourceImageName,
  outputs,
  aspectPreset,
  textOverlays,
  onAspectChange,
  onBack,
}: ExportScreenProps) {
  const defaultBasename = useMemo(
    () => sanitizeExportBasename(sourceImageName),
    [sourceImageName],
  );
  const [basename, setBasename] = useState(defaultBasename);
  const [busy, setBusy] = useState<"zip" | "files" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const captionsEnabled = hasActiveTextOverlays(textOverlays);
  const [exportVariant, setExportVariant] = useState<ExportVariant>("original");

  const safeBasename = sanitizeExportBasename(basename);
  const exampleFilename =
    outputs.length > 0
      ? `${safeBasename}_${String(1).padStart(Math.max(2, String(outputs.length).length), "0")}.png`
      : `${safeBasename}_01.png`;

  const runExport = async (mode: "zip" | "files") => {
    if (outputs.length === 0) return;
    setBusy(mode);
    setMessage(null);
    const variant = captionsEnabled ? exportVariant : "original";
    try {
      if (mode === "zip") {
        await exportRegionsAsZip(
          imageUrl,
          outputs,
          aspectPreset,
          basename,
          textOverlays,
          variant,
        );
        setMessage("ZIP download started.");
      } else {
        await exportRegionsIndividually(
          imageUrl,
          outputs,
          aspectPreset,
          basename,
          textOverlays,
          variant,
        );
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

        <div className="export-field">
          <label htmlFor="export-basename">File name prefix</label>
          <input
            id="export-basename"
            type="text"
            className="export-input"
            value={basename}
            onChange={(event) => setBasename(event.target.value)}
            placeholder={defaultBasename}
            autoComplete="off"
            spellCheck={false}
          />
          <p className="export-hint">
            Files save as <code>{exampleFilename}</code>
            {outputs.length > 1 ? `, …` : ""} or{" "}
            <code>{safeBasename}_slices.zip</code> for ZIP.
          </p>
        </div>

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

        {captionsEnabled && (
          <div className="export-field">
            <label>Download versions</label>
            <div className="caption-chip-row">
              <button
                type="button"
                className={`aspect-chip ${exportVariant === "original" ? "is-active" : ""}`}
                onClick={() => setExportVariant("original")}
              >
                Originals only
              </button>
              <button
                type="button"
                className={`aspect-chip ${exportVariant === "caption" ? "is-active" : ""}`}
                onClick={() => setExportVariant("caption")}
              >
                With captions
              </button>
              <button
                type="button"
                className={`aspect-chip ${exportVariant === "both" ? "is-active" : ""}`}
                onClick={() => setExportVariant("both")}
              >
                Both
              </button>
            </div>
            <p className="export-hint">
              Caption files use a <code>_caption</code> suffix, e.g.{" "}
              <code>{safeBasename}_01_caption.png</code>
            </p>
          </div>
        )}

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

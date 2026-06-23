"use client";

import { useState } from "react";

type UploadScreenProps = {
  onUpload: (file: File) => void;
  error: string | null;
};

export function UploadScreen({ onUpload, error }: UploadScreenProps) {
  const [dragging, setDragging] = useState(false);

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (file) onUpload(file);
  };

  return (
    <section className="upload-screen">
      <div
        className={`upload-card ${dragging ? "is-dragging" : ""}`}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          handleFiles(event.dataTransfer.files);
        }}
      >
        <div className="upload-icon" aria-hidden>
          <svg viewBox="0 0 48 48" fill="none">
            <rect
              x="6"
              y="10"
              width="36"
              height="28"
              rx="4"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M6 30l10-8 8 6 8-10 10 12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="16" cy="18" r="3" fill="currentColor" />
          </svg>
        </div>

        <h2>Upload one image to start slicing</h2>
        <p>
          Add horizontal and vertical slice lines or draw custom crop boxes.
          Preview the pieces, pick what to keep, then export individually or as
          a ZIP.
        </p>

        <label className="upload-button">
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onUpload(file);
              event.currentTarget.value = "";
            }}
          />
          Choose image
        </label>

        {!error && (
          <p className="upload-hint">PNG, JPG, WEBP, and other image formats</p>
        )}
      </div>

      <div className="upload-features">
        <Feature title="Slice lines" text="Split rows and columns with taps." />
        <Feature title="Crop boxes" text="Mark irregular regions on touch." />
        <Feature title="Fast export" text="Download singles or one ZIP file." />
      </div>
    </section>
  );
}

function Feature({ title, text }: { title: string; text: string }) {
  return (
    <div className="feature-card">
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

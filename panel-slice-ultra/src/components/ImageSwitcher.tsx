"use client";

import { useRef } from "react";

type SwitcherImage = {
  id: string;
  url: string;
  name: string;
};

type ImageSwitcherProps = {
  projects: SwitcherImage[];
  activeId: string;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onAddImages: (files: File[]) => void;
};

export function ImageSwitcher({
  projects,
  activeId,
  onSelect,
  onRemove,
  onAddImages,
}: ImageSwitcherProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <nav className="image-switcher" aria-label="Uploaded images">
      <div className="image-switcher-track">
        {projects.map((project, index) => {
          const isActive = project.id === activeId;
          return (
            <div
              key={project.id}
              className={`image-tab ${isActive ? "is-active" : ""}`}
            >
              <button
                type="button"
                className="image-tab-button"
                onClick={() => onSelect(project.id)}
                aria-pressed={isActive}
                title={project.name}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={project.url} alt={project.name} />
                <span className="image-tab-index">{index + 1}</span>
              </button>
              <button
                type="button"
                className="image-tab-remove"
                onClick={() => onRemove(project.id)}
                aria-label={`Remove ${project.name}`}
                title={`Remove ${project.name}`}
              >
                ×
              </button>
            </div>
          );
        })}

        <button
          type="button"
          className="image-tab-add"
          onClick={() => inputRef.current?.click()}
        >
          <span aria-hidden>+</span>
          <span className="image-tab-add-label">Add</span>
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={(event) => {
            const files = event.target.files;
            if (files && files.length > 0) {
              onAddImages(Array.from(files));
            }
            event.currentTarget.value = "";
          }}
        />
      </div>
    </nav>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ExportScreen } from "@/components/ExportScreen";
import { ImageSwitcher } from "@/components/ImageSwitcher";
import { PreviewScreen } from "@/components/PreviewScreen";
import { UploadScreen } from "@/components/UploadScreen";
import { EditingScreen } from "@/components/EditingScreen";
import { createId } from "@/lib/id";
import { generateRegions } from "@/lib/region-generator";
import type {
  AppMode,
  AspectRatioPreset,
  CropBox,
  EditorState,
  OutputRegion,
  SliceLine,
  TextOverlay,
  TextOverlayMap,
  Tool,
} from "@/lib/types";
import { createEmptyEditorState } from "@/lib/types";

const MAX_UNDO = 40;

type LoadedImage = {
  url: string;
  width: number;
  height: number;
  name: string;
};

/** All editing state for a single uploaded image. */
type Project = {
  id: string;
  image: LoadedImage;
  editor: EditorState;
  history: EditorState[];
  activeTool: Tool;
  outputs: OutputRegion[];
  selectedOutputIds: Set<string>;
  aspectPreset: AspectRatioPreset | null;
  textOverlays: TextOverlayMap;
};

function loadProject(file: File): Promise<Project | null> {
  return new Promise((resolve) => {
    if (!file.type.startsWith("image/")) {
      resolve(null);
      return;
    }
    const url = URL.createObjectURL(file);
    const probe = new Image();
    probe.onload = () => {
      resolve({
        id: createId("img"),
        image: {
          url,
          width: probe.naturalWidth,
          height: probe.naturalHeight,
          name: file.name,
        },
        editor: createEmptyEditorState(),
        history: [],
        activeTool: "horizontal",
        outputs: [],
        selectedOutputIds: new Set(),
        aspectPreset: null,
        textOverlays: {},
      });
    };
    probe.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    probe.src = url;
  });
}

export function PanelSliceApp() {
  const [mode, setMode] = useState<AppMode>("upload");
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Keep a live reference to projects so the unmount cleanup can revoke URLs.
  const projectsRef = useRef<Project[]>([]);
  useEffect(() => {
    projectsRef.current = projects;
  }, [projects]);

  useEffect(() => {
    return () => {
      projectsRef.current.forEach((project) =>
        URL.revokeObjectURL(project.image.url),
      );
    };
  }, []);

  const activeProject = useMemo(
    () => projects.find((project) => project.id === activeId) ?? null,
    [projects, activeId],
  );

  const updateActiveProject = useCallback(
    (updater: (project: Project) => Project) => {
      setProjects((prev) =>
        prev.map((project) =>
          project.id === activeId ? updater(project) : project,
        ),
      );
    },
    [activeId],
  );

  const updateEditor = useCallback(
    (updater: (current: EditorState) => EditorState, recordHistory = true) => {
      updateActiveProject((project) => ({
        ...project,
        history: recordHistory
          ? [...project.history.slice(-MAX_UNDO + 1), project.editor]
          : project.history,
        editor: updater(project.editor),
      }));
    },
    [updateActiveProject],
  );

  const handleUpload = useCallback(async (files: File[]) => {
    setError(null);
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));
    if (imageFiles.length === 0) {
      setError("Please choose image files.");
      return;
    }

    const loaded = (await Promise.all(imageFiles.map(loadProject))).filter(
      (project): project is Project => project !== null,
    );

    if (loaded.length === 0) {
      setError("Those images could not be loaded. Try other files.");
      return;
    }

    setProjects((prev) => [...prev, ...loaded]);
    setActiveId((prev) => prev ?? loaded[0].id);
    setMode("editing");

    const failed = imageFiles.length - loaded.length;
    if (failed > 0) {
      setError(
        `${failed} image${failed === 1 ? "" : "s"} could not be loaded and ${
          failed === 1 ? "was" : "were"
        } skipped.`,
      );
    }
  }, []);

  const setActiveTool = useCallback(
    (tool: Tool) => {
      updateActiveProject((project) => ({ ...project, activeTool: tool }));
    },
    [updateActiveProject],
  );

  const handleReset = useCallback(() => {
    updateEditor(() => createEmptyEditorState());
    setActiveTool("horizontal");
  }, [updateEditor, setActiveTool]);

  const handleUndo = useCallback(() => {
    updateActiveProject((project) => {
      if (project.history.length === 0) return project;
      const history = [...project.history];
      const previous = history.pop();
      if (!previous) return project;
      return { ...project, history, editor: previous };
    });
  }, [updateActiveProject]);

  const addHorizontalLine = useCallback(
    (position: number) => {
      const line: SliceLine = {
        id: createId("h"),
        orientation: "horizontal",
        position,
      };
      updateEditor((current) => ({
        ...current,
        horizontalLines: [...current.horizontalLines, line],
        selectedId: line.id,
      }));
    },
    [updateEditor],
  );

  const addVerticalLine = useCallback(
    (position: number) => {
      const line: SliceLine = {
        id: createId("v"),
        orientation: "vertical",
        position,
      };
      updateEditor((current) => ({
        ...current,
        verticalLines: [...current.verticalLines, line],
        selectedId: line.id,
      }));
    },
    [updateEditor],
  );

  const addCropBox = useCallback(
    (box: CropBox) => {
      updateEditor((current) => ({
        ...current,
        cropBoxes: [...current.cropBoxes, box],
        selectedId: box.id,
      }));
    },
    [updateEditor],
  );

  const updateCropBox = useCallback(
    (id: string, nextBox: CropBox, recordHistory = false) => {
      updateEditor(
        (current) => ({
          ...current,
          cropBoxes: current.cropBoxes.map((box) =>
            box.id === id ? nextBox : box,
          ),
        }),
        recordHistory,
      );
    },
    [updateEditor],
  );

  const moveLine = useCallback(
    (id: string, position: number, recordHistory = false) => {
      updateEditor(
        (current) => ({
          ...current,
          horizontalLines: current.horizontalLines.map((line) =>
            line.id === id ? { ...line, position } : line,
          ),
          verticalLines: current.verticalLines.map((line) =>
            line.id === id ? { ...line, position } : line,
          ),
        }),
        recordHistory,
      );
    },
    [updateEditor],
  );

  const selectElement = useCallback(
    (id: string | null) => {
      updateEditor((current) => ({ ...current, selectedId: id }), false);
    },
    [updateEditor],
  );

  const deleteSelected = useCallback(() => {
    if (!activeProject?.editor.selectedId) return;
    const id = activeProject.editor.selectedId;
    updateEditor((current) => ({
      horizontalLines: current.horizontalLines.filter((line) => line.id !== id),
      verticalLines: current.verticalLines.filter((line) => line.id !== id),
      cropBoxes: current.cropBoxes.filter((box) => box.id !== id),
      selectedId: null,
    }));
  }, [activeProject, updateEditor]);

  const goToPreview = useCallback(() => {
    if (!activeProject) return;
    updateActiveProject((project) => {
      const generated = generateRegions(
        project.editor,
        project.image.width,
        project.image.height,
      );
      return {
        ...project,
        outputs: generated,
        selectedOutputIds: new Set(generated.map((region) => region.id)),
      };
    });
    setMode("preview");
  }, [activeProject, updateActiveProject]);

  const goToExport = useCallback(() => {
    setMode("export");
  }, []);

  const selectProject = useCallback((id: string) => {
    setActiveId(id);
    setMode("editing");
  }, []);

  const removeProject = useCallback(
    (id: string) => {
      const target = projects.find((project) => project.id === id);
      if (target) URL.revokeObjectURL(target.image.url);
      const next = projects.filter((project) => project.id !== id);
      setProjects(next);
      if (activeId === id) {
        setActiveId(next[0]?.id ?? null);
      }
      if (next.length === 0) {
        setMode("upload");
      } else {
        setMode("editing");
      }
    },
    [projects, activeId],
  );

  const startOver = useCallback(() => {
    projects.forEach((project) => URL.revokeObjectURL(project.image.url));
    setProjects([]);
    setActiveId(null);
    setMode("upload");
    setError(null);
  }, [projects]);

  const setAspectPreset = useCallback(
    (preset: AspectRatioPreset | null) => {
      updateActiveProject((project) => ({ ...project, aspectPreset: preset }));
    },
    [updateActiveProject],
  );

  const handleTextOverlayChange = useCallback(
    (regionId: string, overlay: TextOverlay | undefined) => {
      updateActiveProject((project) => {
        const next = { ...project.textOverlays };
        if (!overlay || !overlay.text.trim()) {
          delete next[regionId];
        } else {
          next[regionId] = overlay;
        }
        return { ...project, textOverlays: next };
      });
    },
    [updateActiveProject],
  );

  const toggleOutput = useCallback(
    (id: string) => {
      updateActiveProject((project) => {
        const next = new Set(project.selectedOutputIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return { ...project, selectedOutputIds: next };
      });
    },
    [updateActiveProject],
  );

  const selectAllOutputs = useCallback(() => {
    updateActiveProject((project) => ({
      ...project,
      selectedOutputIds: new Set(project.outputs.map((region) => region.id)),
    }));
  }, [updateActiveProject]);

  const clearOutputSelection = useCallback(() => {
    updateActiveProject((project) => ({
      ...project,
      selectedOutputIds: new Set(),
    }));
  }, [updateActiveProject]);

  const selectedOutputs = useMemo(() => {
    if (!activeProject) return [];
    return activeProject.outputs.filter((region) =>
      activeProject.selectedOutputIds.has(region.id),
    );
  }, [activeProject]);

  const pieceCount = useMemo(() => {
    if (!activeProject) return 0;
    return generateRegions(
      activeProject.editor,
      activeProject.image.width,
      activeProject.image.height,
    ).length;
  }, [activeProject]);

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="app-kicker">Panel Slice Ultra</p>
          <h1 className="app-title">Split your images into clean outputs</h1>
        </div>
        {mode !== "upload" && (
          <button type="button" className="ghost-button" onClick={startOver}>
            Start over
          </button>
        )}
      </header>

      {error && (
        <div className="error-banner" role="alert">
          <p>{error}</p>
          <button type="button" onClick={() => setError(null)}>
            Dismiss
          </button>
        </div>
      )}

      {mode !== "upload" && projects.length > 0 && activeProject && (
        <ImageSwitcher
          projects={projects.map((project) => ({
            id: project.id,
            url: project.image.url,
            name: project.image.name,
          }))}
          activeId={activeProject.id}
          onSelect={selectProject}
          onRemove={removeProject}
          onAddImages={handleUpload}
        />
      )}

      <main className="app-main">
        {mode === "upload" && (
          <UploadScreen onUpload={handleUpload} error={error} />
        )}

        {mode === "editing" && activeProject && (
          <EditingScreen
            image={activeProject.image}
            editor={activeProject.editor}
            activeTool={activeProject.activeTool}
            pieceCount={pieceCount}
            canUndo={activeProject.history.length > 0}
            onToolChange={setActiveTool}
            onAddHorizontal={addHorizontalLine}
            onAddVertical={addVerticalLine}
            onAddCropBox={addCropBox}
            onUpdateCropBox={updateCropBox}
            onMoveLine={moveLine}
            onSelect={selectElement}
            onDelete={deleteSelected}
            onUndo={handleUndo}
            onReset={handleReset}
            onPreview={goToPreview}
          />
        )}

        {mode === "preview" && activeProject && (
          <PreviewScreen
            imageUrl={activeProject.image.url}
            outputs={activeProject.outputs}
            selectedIds={activeProject.selectedOutputIds}
            aspectPreset={activeProject.aspectPreset}
            textOverlays={activeProject.textOverlays}
            onTextOverlayChange={handleTextOverlayChange}
            onToggle={toggleOutput}
            onSelectAll={selectAllOutputs}
            onClearSelection={clearOutputSelection}
            onBack={() => setMode("editing")}
            onContinue={goToExport}
          />
        )}

        {mode === "export" && activeProject && (
          <ExportScreen
            key={activeProject.id}
            imageUrl={activeProject.image.url}
            sourceImageName={activeProject.image.name}
            outputs={selectedOutputs}
            aspectPreset={activeProject.aspectPreset}
            textOverlays={activeProject.textOverlays}
            onAspectChange={setAspectPreset}
            onBack={() => setMode("preview")}
          />
        )}
      </main>
    </div>
  );
}

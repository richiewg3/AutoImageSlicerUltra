"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ExportScreen } from "@/components/ExportScreen";
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

export function PanelSliceApp() {
  const [mode, setMode] = useState<AppMode>("upload");
  const [image, setImage] = useState<LoadedImage | null>(null);
  const [editor, setEditor] = useState<EditorState>(createEmptyEditorState());
  const [history, setHistory] = useState<EditorState[]>([]);
  const [activeTool, setActiveTool] = useState<Tool>("horizontal");
  const [outputs, setOutputs] = useState<OutputRegion[]>([]);
  const [selectedOutputIds, setSelectedOutputIds] = useState<Set<string>>(
    new Set(),
  );
  const [aspectPreset, setAspectPreset] = useState<AspectRatioPreset | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const imageUrlRef = useRef<string | null>(null);

  const pushHistory = useCallback((snapshot: EditorState) => {
    setHistory((prev) => [...prev.slice(-MAX_UNDO + 1), snapshot]);
  }, []);

  const updateEditor = useCallback(
    (updater: (current: EditorState) => EditorState, recordHistory = true) => {
      setEditor((current) => {
        if (recordHistory) {
          pushHistory(current);
        }
        return updater(current);
      });
    },
    [pushHistory],
  );

  const handleUpload = useCallback((file: File) => {
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }

    if (imageUrlRef.current) {
      URL.revokeObjectURL(imageUrlRef.current);
    }

    const url = URL.createObjectURL(file);
    imageUrlRef.current = url;

    const probe = new Image();
    probe.onload = () => {
      setImage({
        url,
        width: probe.naturalWidth,
        height: probe.naturalHeight,
        name: file.name,
      });
      setEditor(createEmptyEditorState());
      setHistory([]);
      setOutputs([]);
      setSelectedOutputIds(new Set());
      setActiveTool("horizontal");
      setMode("editing");
    };
    probe.onerror = () => {
      URL.revokeObjectURL(url);
      imageUrlRef.current = null;
      setError("That image could not be loaded. Try another file.");
    };
    probe.src = url;
  }, []);

  const handleReset = useCallback(() => {
    updateEditor(() => createEmptyEditorState());
    setActiveTool("horizontal");
  }, [updateEditor]);

  const handleUndo = useCallback(() => {
    setHistory((prev) => {
      if (prev.length === 0) return prev;
      const next = [...prev];
      const previous = next.pop();
      if (previous) setEditor(previous);
      return next;
    });
  }, []);

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
    if (!editor.selectedId) return;
    const id = editor.selectedId;
    updateEditor((current) => ({
      horizontalLines: current.horizontalLines.filter((line) => line.id !== id),
      verticalLines: current.verticalLines.filter((line) => line.id !== id),
      cropBoxes: current.cropBoxes.filter((box) => box.id !== id),
      selectedId: null,
    }));
  }, [editor.selectedId, updateEditor]);

  const goToPreview = useCallback(() => {
    if (!image) return;
    const generated = generateRegions(editor, image.width, image.height);
    setOutputs(generated);
    setSelectedOutputIds(new Set(generated.map((region) => region.id)));
    setMode("preview");
  }, [editor, image]);

  const goToExport = useCallback(() => {
    setMode("export");
  }, []);

  const startOver = useCallback(() => {
    if (imageUrlRef.current) {
      URL.revokeObjectURL(imageUrlRef.current);
      imageUrlRef.current = null;
    }
    setImage(null);
    setEditor(createEmptyEditorState());
    setHistory([]);
    setOutputs([]);
    setSelectedOutputIds(new Set());
    setAspectPreset(null);
    setMode("upload");
    setError(null);
  }, []);

  const selectedOutputs = useMemo(
    () => outputs.filter((region) => selectedOutputIds.has(region.id)),
    [outputs, selectedOutputIds],
  );

  const pieceCount = useMemo(() => {
    if (!image) return 0;
    return generateRegions(editor, image.width, image.height).length;
  }, [editor, image]);

  useEffect(() => {
    // Auto-load test image for demonstration
    const autoLoadImage = async () => {
      try {
        const response = await fetch('/test-image.png');
        const blob = await response.blob();
        const file = new File([blob], 'test-image.png', { type: 'image/png' });
        
        // Inline upload logic to avoid dependency issues
        const url = URL.createObjectURL(file);
        const probe = new Image();
        probe.onload = () => {
          setImage({
            url,
            width: probe.naturalWidth,
            height: probe.naturalHeight,
            name: file.name,
          });
          setMode("editing");
        };
        probe.onerror = () => {
          URL.revokeObjectURL(url);
          console.error('Failed to load test image');
        };
        probe.src = url;
      } catch (error) {
        console.error('Auto-load failed:', error);
      }
    };
    autoLoadImage();

    return () => {
      if (imageUrlRef.current) {
        URL.revokeObjectURL(imageUrlRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="app-kicker">Panel Slice Ultra</p>
          <h1 className="app-title">Split one image into clean outputs</h1>
        </div>
        {mode !== "upload" && (
          <button type="button" className="ghost-button" onClick={startOver}>
            New image
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

      <main className="app-main">
        {mode === "upload" && (
          <UploadScreen onUpload={handleUpload} error={error} />
        )}

        {mode === "editing" && image && (
          <EditingScreen
            image={image}
            editor={editor}
            activeTool={activeTool}
            pieceCount={pieceCount}
            canUndo={history.length > 0}
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

        {mode === "preview" && image && (
          <PreviewScreen
            imageUrl={image.url}
            outputs={outputs}
            selectedIds={selectedOutputIds}
            aspectPreset={aspectPreset}
            onToggle={(id) => {
              setSelectedOutputIds((current) => {
                const next = new Set(current);
                if (next.has(id)) next.delete(id);
                else next.add(id);
                return next;
              });
            }}
            onSelectAll={() =>
              setSelectedOutputIds(new Set(outputs.map((region) => region.id)))
            }
            onClearSelection={() => setSelectedOutputIds(new Set())}
            onBack={() => setMode("editing")}
            onContinue={goToExport}
          />
        )}

        {mode === "export" && image && (
          <ExportScreen
            imageUrl={image.url}
            outputs={selectedOutputs}
            aspectPreset={aspectPreset}
            onAspectChange={setAspectPreset}
            onBack={() => setMode("preview")}
          />
        )}
      </main>
    </div>
  );
}

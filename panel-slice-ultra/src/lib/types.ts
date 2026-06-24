export type AppMode = "upload" | "editing" | "preview" | "export";

export type Tool =
  | "horizontal"
  | "vertical"
  | "crop"
  | "select"
  | "delete";

export type SliceLine = {
  id: string;
  orientation: "horizontal" | "vertical";
  /** Normalized position along the image axis (0–1). */
  position: number;
};

export type CropBox = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type OutputRegion = {
  id: string;
  type: "grid" | "crop";
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
};

export type EditorState = {
  horizontalLines: SliceLine[];
  verticalLines: SliceLine[];
  cropBoxes: CropBox[];
  selectedId: string | null;
};

export type AspectRatioPreset =
  | "1:1"
  | "2:3"
  | "3:2"
  | "4:3"
  | "3:4"
  | "9:16"
  | "16:9";

export const ASPECT_RATIO_PRESETS: {
  id: AspectRatioPreset;
  label: string;
  ratio: number;
}[] = [
  { id: "1:1", label: "1:1", ratio: 1 },
  { id: "2:3", label: "2:3", ratio: 2 / 3 },
  { id: "3:2", label: "3:2", ratio: 3 / 2 },
  { id: "4:3", label: "4:3", ratio: 4 / 3 },
  { id: "3:4", label: "3:4", ratio: 3 / 4 },
  { id: "9:16", label: "9:16", ratio: 9 / 16 },
  { id: "16:9", label: "16:9", ratio: 16 / 9 },
];

export function createEmptyEditorState(): EditorState {
  return {
    horizontalLines: [],
    verticalLines: [],
    cropBoxes: [],
    selectedId: null,
  };
}

export type TextSize = "small" | "medium" | "large";

export type TextPlacement = "bottom" | "top";

export type TextColor = "white" | "black" | "yellow" | "red";

export type TextOverlay = {
  text: string;
  size: TextSize;
  color: TextColor;
  placement: TextPlacement;
};

export const TEXT_SIZE_OPTIONS: { id: TextSize; label: string }[] = [
  { id: "small", label: "Small" },
  { id: "medium", label: "Medium" },
  { id: "large", label: "Large" },
];

export const TEXT_COLOR_OPTIONS: { id: TextColor; label: string; hex: string }[] =
  [
    { id: "white", label: "White", hex: "#ffffff" },
    { id: "black", label: "Black", hex: "#111111" },
    { id: "yellow", label: "Yellow", hex: "#ffd54f" },
    { id: "red", label: "Red", hex: "#ff5252" },
  ];

export const TEXT_PLACEMENT_OPTIONS: { id: TextPlacement; label: string }[] = [
  { id: "bottom", label: "Bottom" },
  { id: "top", label: "Top" },
];

/** Per-output-region caption settings keyed by region id. */
export type TextOverlayMap = Record<string, TextOverlay | undefined>;

export function createEmptyTextOverlay(): TextOverlay {
  return {
    text: "",
    size: "medium",
    color: "white",
    placement: "bottom",
  };
}

export function hasActiveTextOverlays(overlays: TextOverlayMap): boolean {
  return Object.values(overlays).some(
    (overlay) => overlay !== undefined && overlay.text.trim().length > 0,
  );
}

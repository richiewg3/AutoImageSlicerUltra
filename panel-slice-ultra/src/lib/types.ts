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

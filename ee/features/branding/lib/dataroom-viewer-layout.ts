import { z } from "zod";

/** Persisted card layouts accepted at branding API boundaries. */
export const DataroomCardLayoutSchema = z.enum(["LIST", "GRID", "COMPACT"]);
export type DataroomCardLayout = z.infer<typeof DataroomCardLayoutSchema>;

/** Persisted viewer header layouts accepted at branding API boundaries. */
export const DataroomViewerHeaderStyleSchema = z.enum([
  "DEFAULT",
  "SPLIT",
  "NOTION",
]);
export type DataroomViewerHeaderStyle = z.infer<
  typeof DataroomViewerHeaderStyleSchema
>;

/** Named layout combinations plus CUSTOM for valid admin-composed layouts. */
export const DataroomViewerLayoutPresetSchema = z.enum([
  "STANDARD",
  "STRICT",
  "MODERN",
  "NOTION",
  "CUSTOM",
]);
export type DataroomViewerLayoutPreset = z.infer<
  typeof DataroomViewerLayoutPresetSchema
>;

export type DataroomLayoutCardId = Exclude<
  DataroomViewerLayoutPreset,
  "CUSTOM"
>;

export const CARD_LAYOUT_OPTIONS: ReadonlyArray<{
  value: DataroomCardLayout;
  label: string;
}> = [
  { value: "LIST", label: "Cards" },
  { value: "GRID", label: "Grid" },
  { value: "COMPACT", label: "List" },
];

/**
 * Treat stale or hand-crafted database values as the established defaults.
 * These helpers are used on public viewer routes, so they intentionally do
 * not preserve arbitrary input values.
 */
export function asDataroomCardLayout(value: unknown): DataroomCardLayout {
  return DataroomCardLayoutSchema.safeParse(value).data ?? "LIST";
}

export function asDataroomViewerHeaderStyle(
  value: unknown,
): DataroomViewerHeaderStyle {
  return DataroomViewerHeaderStyleSchema.safeParse(value).data ?? "DEFAULT";
}

/** Return a named preset only when every persisted layout setting matches it. */
export function inferDataroomViewerLayoutPreset({
  cardLayout,
  showFolderTree,
  hideFolderIconsInMain,
  viewerHeaderStyle,
}: {
  cardLayout: DataroomCardLayout;
  showFolderTree: boolean;
  hideFolderIconsInMain: boolean;
  viewerHeaderStyle: DataroomViewerHeaderStyle;
}): DataroomViewerLayoutPreset {
  if (
    cardLayout === "LIST" &&
    showFolderTree &&
    !hideFolderIconsInMain &&
    viewerHeaderStyle === "DEFAULT"
  ) {
    return "STANDARD";
  }

  if (
    cardLayout === "COMPACT" &&
    !showFolderTree &&
    hideFolderIconsInMain &&
    viewerHeaderStyle === "DEFAULT"
  ) {
    return "STRICT";
  }

  if (
    cardLayout === "COMPACT" &&
    !showFolderTree &&
    hideFolderIconsInMain &&
    viewerHeaderStyle === "SPLIT"
  ) {
    return "MODERN";
  }

  if (
    cardLayout === "GRID" &&
    !showFolderTree &&
    !hideFolderIconsInMain &&
    viewerHeaderStyle === "NOTION"
  ) {
    return "NOTION";
  }

  return "CUSTOM";
}

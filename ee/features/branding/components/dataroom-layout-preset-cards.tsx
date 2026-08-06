import { cn } from "@/lib/utils";

import {
  type DataroomLayoutCardId,
  type DataroomViewerLayoutPreset,
} from "../lib/dataroom-viewer-layout";

type DataroomLayoutPresetCardsProps = {
  selectedPreset: DataroomViewerLayoutPreset;
  onSelect: (preset: DataroomLayoutCardId) => void;
};

const PRESETS: ReadonlyArray<{
  id: DataroomLayoutCardId;
  title: string;
  description: string;
}> = [
  {
    id: "STANDARD",
    title: "Standard",
    description: "Cards with a folder tree and the default header.",
  },
  {
    id: "STRICT",
    title: "Strict",
    description: "A focused list without navigation or folder icons.",
  },
  {
    id: "MODERN",
    title: "Modern",
    description: "A focused list with a split viewer header.",
  },
  {
    id: "NOTION",
    title: "Notion",
    description: "A grid-first workspace with a Notion-style header.",
  },
];

/** Named, local-only combinations for the persisted dataroom layout settings. */
export function DataroomLayoutPresetCards({
  selectedPreset,
  onSelect,
}: DataroomLayoutPresetCardsProps) {
  return (
    <div
      className="grid grid-cols-1 gap-2 sm:grid-cols-2"
      role="group"
      aria-label="Data room layout presets"
    >
      {PRESETS.map((preset) => {
        const selected = selectedPreset === preset.id;

        return (
          <button
            key={preset.id}
            type="button"
            aria-pressed={selected}
            onClick={() => onSelect(preset.id)}
            className={cn(
              "rounded-md border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              selected
                ? "border-black bg-gray-50 dark:border-white dark:bg-gray-900"
                : "border-gray-200 hover:border-gray-400 dark:border-gray-800 dark:hover:border-gray-600",
            )}
          >
            <span className="block text-sm font-medium">{preset.title}</span>
            <span className="mt-1 block text-xs text-muted-foreground">
              {preset.description}
            </span>
          </button>
        );
      })}
    </div>
  );
}

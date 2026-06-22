import { Agent, Snippet, DirectoryPreset } from "@/lib";
import defaults from "@/data/defaults.json";

export type LayoutConfig =
  | { type: "grid"; rows: number; cols: number }
  | { type: "count"; value: number };

export interface SavedLayout {
  id: string;
  name: string;
  config: LayoutConfig;
  isArchived?: boolean;
}

export type LayoutType =
  | "1x1"
  | "1x2"
  | "2x1"
  | "2x2"
  | "3x3"
  | "custom"
  | string;

export const DEFAULT_FLEX_LAYOUTS: SavedLayout[] = [
  { id: "flex-1", name: "1 PANE", config: { type: "count", value: 1 } },
  { id: "flex-3", name: "3 PANES", config: { type: "count", value: 3 } },
  { id: "flex-5", name: "5 PANES", config: { type: "count", value: 5 } },
  { id: "flex-7", name: "7 PANES", config: { type: "count", value: 7 } },
  { id: "flex-10", name: "10 PANES", config: { type: "count", value: 10 } },
];

export const INITIAL_LAYOUTS: SavedLayout[] = [
  ...defaults.layouts.map((l: any) => ({
    id: l.id,
    name: l.name,
    config: { type: "grid" as const, rows: l.rows, cols: l.cols },
  })),
  ...DEFAULT_FLEX_LAYOUTS,
];

export const DEFAULT_AGENTS: Agent[] = defaults.agents as Agent[];

// For backward compatibility during transition
export const AGENT_PRESETS = DEFAULT_AGENTS.map((a) => ({
  label: a.label,
  command: a.command,
}));

export const DEFAULT_PRESETS: DirectoryPreset[] = [];

export interface PaneConfig {
  id: number;
  name: string;
  command: string;
  isCustom: boolean;
}

export const INITIAL_STEP = 1;
export const MAX_STEP = 3;

export const DEFAULT_SNIPPETS: Snippet[] = [];

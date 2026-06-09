import { Agent, Snippet, DirectoryPreset } from "@/types";
import defaults from "@/data/defaults.json";

export interface LayoutConfig {
  rows: number;
  cols: number;
}

export interface SavedLayout extends LayoutConfig {
  id: string;
  name: string;
}

export type LayoutType = '1x1' | '1x2' | '2x1' | '2x2' | '3x3' | 'custom' | string;

export const INITIAL_LAYOUTS: SavedLayout[] = defaults.layouts;

export const DEFAULT_AGENTS: Agent[] = defaults.agents as Agent[];

// For backward compatibility during transition
export const AGENT_PRESETS = DEFAULT_AGENTS.map(a => ({ label: a.label, command: a.command }));

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

import { Agent, Snippet, DirectoryPreset } from "@/types";

export interface LayoutConfig {
  rows: number;
  cols: number;
}

export interface SavedLayout extends LayoutConfig {
  id: string;
  name: string;
}

export type LayoutType = '1x1' | '1x2' | '2x1' | '2x2' | '3x3' | 'custom' | string;

export const INITIAL_LAYOUTS: SavedLayout[] = [
  { id: '1x1', name: '1X1', rows: 1, cols: 1 },
  { id: '1x2', name: '1X2', rows: 1, cols: 2 },
  { id: '2x1', name: '2X1', rows: 2, cols: 1 },
  { id: '2x2', name: '2X2', rows: 2, cols: 2 },
  { id: '3x3', name: '3X3', rows: 3, cols: 3 },
];

export const DEFAULT_AGENTS: Agent[] = [
  { 
    id: 'agent-gemini', 
    label: "GEMINI", 
    command: "gemini", 
    isDefault: true, 
    status: 'not-installed',
    downloadUrl: "https://github.com/google/gemini-cli/releases/latest",
    installCommand: "npm install -g @google/gemini-cli"
  },
  { 
    id: 'agent-claude', 
    label: "CLAUDE", 
    command: "claude", 
    isDefault: true, 
    status: 'not-installed',
    downloadUrl: "https://github.com/anthropic/claude-cli/releases/latest",
    installCommand: "irm https://claude.ai/install.ps1 | iex"
  },
  { 
    id: 'agent-antigravity', 
    label: "ANTIGRAVITY", 
    command: "agy", 
    isDefault: true, 
    status: 'not-installed',
    downloadUrl: "https://github.com/antigravity/agy-cli/releases/latest",
    installCommand: "irm https://antigravity.google/cli/install.ps1 | iex"
  },
  { 
    id: 'agent-opencode', 
    label: "OPENCODE", 
    command: "opencode", 
    isDefault: true, 
    status: 'not-installed',
    installCommand: "npm install -g @opencode/cli"
  },
  { 
    id: 'agent-codex', 
    label: "CODEX", 
    command: "codex", 
    isDefault: true, 
    status: 'not-installed',
    installCommand: "npm install -g @openai/codex-cli"
  },
];

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

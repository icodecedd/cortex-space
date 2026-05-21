export type LayoutType = '1x1' | '1x2' | '2x1' | '2x2' | '3x3';

export const AGENT_PRESETS = [
  { label: "GEMINI", command: "gemini" },
  { label: "CLAUDE", command: "claude" },
  { label: "CODEX", command: "codex" },
  { label: "OPENCODE", command: "opencode" },
  { label: "CO-PILOT", command: "copilot" },
  { label: "QODO", command: "qodo" },
  { label: "CODY", command: "cody" }
];

export const DEFAULT_PRESETS = [
  { label: "PROGRAMMING", path: "C:\\Users\\Chaoscedd\\Programming" },
  { label: "WEB DEV", path: "C:\\Users\\Chaoscedd\\Programming\\web-development" },
];

export interface PaneConfig {
  id: number;
  name: string;
  command: string;
  isCustom: boolean;
}

export const INITIAL_STEP = 1;
export const MAX_STEP = 3;

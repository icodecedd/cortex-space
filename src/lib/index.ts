export type AppState = 'splash' | 'first-run-onboarding' | 'running';
export type WorkspaceStatus = 'mode-select' | 'setup' | 'active';
export type Mode = 'normal' | 'agents';

export interface SubTab {
  id: string;
  name: string;
  mode: Mode;
  status: WorkspaceStatus;
  config: {
    rootPath: string;
    layout: LayoutNode;
    panes: any[];
  } | null;
}

export interface Workspace {
  id: string;
  name: string;
  mode: Mode;
  config: {
    rootPath: string;
  } | null;
  status: WorkspaceStatus;
  color?: 'slate' | 'emerald' | 'cobalt' | 'crimson' | 'amber';
  customName?: string;
  customIconPath?: string;
  isPinned?: boolean;
  subTabs: SubTab[];
  activeSubTabId: string | null;
}

export type SplitDirection = 'horizontal' | 'vertical';

export interface PaneNode {
  type: 'pane';
  id: string;
  name: string;
  command: string;
  cwd?: string;
  env?: Record<string, string>;
}

export interface SplitNode {
  type: 'split';
  direction: SplitDirection;
  ratio: number; // 0 to 1
  children: [LayoutNode, LayoutNode];
}

export type LayoutNode = PaneNode | SplitNode;

export interface SpaceTemplate {
  id: string;
  name: string;
  description?: string;
  rootPath: string;
  layout: LayoutNode;
  mode: Mode;
  createdAt: string;
  lastUsedAt?: string;
  color?: string;
  isArchived?: boolean;
}

export interface DirectoryPreset {
  id: string;
  label: string;
  path: string;
  isArchived?: boolean;
}

export interface Snippet {
  id: string;
  label: string;
  command: string; // Supports variable placeholders like {{VARIABLE_NAME}}
  category?: string;
  tags?: string[];
  isArchived?: boolean;
}

export interface Agent {
  id: string;
  label: string;
  command: string;
  isDefault?: boolean;
  status: 'not-installed' | 'installing' | 'installed' | 'error';
  binaryPath?: string;
  downloadUrl?: string;
  installCommand?: string;
  version?: string;
  errorMessage?: string;
  icon?: string;
}

export type PaletteItem = 
  | { type: 'workspace'; data: Workspace; shortcut?: string }
  | { type: 'template'; data: SpaceTemplate; shortcut?: string }
  | { type: 'action'; id: string; label: string; icon: any; action: () => void; shortcut?: string }
  | { type: 'snippet'; data: Snippet; shortcut?: string };

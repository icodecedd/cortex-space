export type AppState = 'splash' | 'running';
export type WorkspaceStatus = 'mode-select' | 'setup' | 'active';
export type Mode = 'normal' | 'agents';

export interface Workspace {
  id: string;
  name: string;
  mode: Mode;
  config: any;
  status: WorkspaceStatus;
  color?: 'slate' | 'emerald' | 'cobalt' | 'crimson' | 'amber';
  customName?: string;
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
}

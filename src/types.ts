export type AppState = 'splash' | 'running';
export type WorkspaceStatus = 'mode-select' | 'setup' | 'active';
export type Mode = 'normal' | 'agents';

export interface Workspace {
  id: string;
  name: string;
  mode: Mode;
  config: any;
  status: WorkspaceStatus;
}

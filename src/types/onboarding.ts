// ── Onboarding Types & Constants ──────────────────────────────────────────────

export type FlowMode = 'starter' | 'custom' | null;

export type CheckStatus = 'pending' | 'checking' | 'ok' | 'warn' | 'fail';
export type InstallableTool = 'node' | 'git';

export interface SysCheck {
  id: string;
  label: string;
  description: string;
  status: CheckStatus;
  detail: string;
}

export interface WorkspacePathValidation {
  valid: boolean;
  normalized_path: string | null;
  message: string;
  can_write: boolean;
}

export interface PathValidationState {
  status: 'idle' | 'checking' | 'valid' | 'invalid';
  message: string;
  normalizedPath: string;
}

export function isInstallableTool(id: string): id is InstallableTool {
  return id === 'node' || id === 'git';
}

// ── Boot Log Data ─────────────────────────────────────────────────────────────

export const INITIAL_BOOT_CHECKS: SysCheck[] = [
  { id: 'environment', label: 'Initializing Cortex environment', description: 'Resolving local home and application runtime', status: 'pending', detail: '' },
  { id: 'workspace-sync', label: 'Syncing local workspace configurations', description: 'Loading saved workspace defaults', status: 'pending', detail: '' },
  { id: 'agents', label: 'Configuring high-agency agent protocols', description: 'Preparing agent registry and command checks', status: 'pending', detail: '' },
  { id: 'themes', label: 'Loading visual theme definitions', description: 'Verifying bundled and custom themes', status: 'pending', detail: '' },
  { id: 'shell', label: 'Establishing secure shell connectors', description: 'Detecting default terminal executable', status: 'pending', detail: '' },
];

// ── Starter Profile Data ──────────────────────────────────────────────────────

export interface Profile {
  id: 'zen' | 'intelligence' | 'pro';
  name: string;
  badge: string;
  themeId: string;
  themeName: string;
  layoutName: string;
  shellLabel: string;
  shellValue?: string;
  description: string;
  includedAgentIds: string[];
  includedAgentLabels: string[];
  color: string;
}

export const PROFILES: Profile[] = [
  {
    id: 'zen',
    name: 'The Zen Den',
    badge: 'MINIMALIST',
    themeId: 'cortex',
    themeName: 'Cortex Default',
    layoutName: 'Flex Layout',
    shellLabel: 'Default Shell',
    description: 'A focused, distraction-free environment. Standard color palettes with no extra agent processes.',
    includedAgentIds: [],
    includedAgentLabels: [],
    color: '#00F2FE',
  },
  {
    id: 'intelligence',
    name: 'Cortex Intelligence',
    badge: 'AI-FIRST',
    themeId: 'claude',
    themeName: 'Claude Theme',
    layoutName: '2x2 Grid',
    shellLabel: 'Default Shell',
    description: 'Loaded with one-click agent installs and an adaptive split layout built for AI work.',
    includedAgentIds: ['agent-claude', 'agent-gemini', 'agent-antigravity'],
    includedAgentLabels: ['CLAUDE', 'GEMINI', 'ANTIGRAVITY'],
    color: '#D97757',
  },
  {
    id: 'pro',
    name: 'The Terminal Pro',
    badge: 'POWER USER',
    themeId: 'nord',
    themeName: 'Nord Theme',
    layoutName: '1x3 Grid',
    shellLabel: 'Custom Shell',
    shellValue: 'powershell.exe',
    description: 'Designed for terminal veterans. Custom Nord visual scheme with support for custom shell executables.',
    includedAgentIds: ['agent-opencode', 'agent-codex'],
    includedAgentLabels: ['OPENCODE', 'CODEX'],
    color: '#88C0D0',
  },
];

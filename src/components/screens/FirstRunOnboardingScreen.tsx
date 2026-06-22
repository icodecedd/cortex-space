import { useState, useCallback, useEffect, memo } from 'react';
import { m, AnimatePresence, Variants, useReducedMotion } from 'framer-motion';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { getSetting, setSetting } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAgents } from '@/hooks/useAgents';
import { useTheme } from '@/hooks/useTheme';
import { 
  Cpu, CheckCircle2, Loader2, Download, ArrowRight,
  Zap, Target, Palette, Settings, Monitor, FolderOpen, Check, ShieldCheck, AlertCircle
} from '@/components/ui/icons';

// ── Types ─────────────────────────────────────────────────────────────────────

type FlowMode = 'starter' | 'custom' | null;

type CheckStatus = 'pending' | 'checking' | 'ok' | 'warn' | 'fail';
type InstallableTool = 'node' | 'git';

interface SysCheck {
  id: string;
  label: string;
  description: string;
  status: CheckStatus;
  detail: string;
}

interface WorkspacePathValidation {
  valid: boolean;
  normalized_path: string | null;
  message: string;
  can_write: boolean;
}

interface PathValidationState {
  status: 'idle' | 'checking' | 'valid' | 'invalid';
  message: string;
  normalizedPath: string;
}

function isInstallableTool(id: string): id is InstallableTool {
  return id === 'node' || id === 'git';
}

// ── Scramble Text ─────────────────────────────────────────────────────────────

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%';

const ScrambleText = memo(function ScrambleText({
  text,
  startDelay = 0,
  duration = 700,
  className,
  style,
}: {
  text: string;
  startDelay?: number;
  duration?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [output, setOutput] = useState(() =>
    text.replace(/[^\s/\\.-]/g, () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)])
  );

  useEffect(() => {
    let alive = true;
    const outer = setTimeout(() => {
      if (!alive) return;
      const t0 = Date.now();
      const id = setInterval(() => {
        if (!alive) {
          clearInterval(id);
          return;
        }
        const p = Math.min((Date.now() - t0) / duration, 1);
        const locked = Math.floor(p * text.length);
        setOutput(
          text
            .split('')
            .map((ch, i) =>
              i < locked || ch === ' ' || ch === '/' || ch === '-'
                ? ch
                : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
            )
            .join('')
        );
        if (p >= 1) {
          setOutput(text);
          clearInterval(id);
        }
      }, 40);
    }, startDelay);
    return () => {
      alive = false;
      clearTimeout(outer);
    };
  }, [text, startDelay, duration]);

  return (
    <span className={className} style={style}>
      {output}
    </span>
  );
});

// ── Boot Log ─────────────────────────────────────────────────────────────────

const INITIAL_BOOT_CHECKS: SysCheck[] = [
  { id: 'environment', label: 'Initializing Cortex environment', description: 'Resolving local home and application runtime', status: 'pending', detail: '' },
  { id: 'workspace-sync', label: 'Syncing local workspace configurations', description: 'Loading saved workspace defaults', status: 'pending', detail: '' },
  { id: 'agents', label: 'Configuring high-agency agent protocols', description: 'Preparing agent registry and command checks', status: 'pending', detail: '' },
  { id: 'themes', label: 'Loading visual theme definitions', description: 'Verifying bundled and custom themes', status: 'pending', detail: '' },
  { id: 'shell', label: 'Establishing secure shell connectors', description: 'Detecting default terminal executable', status: 'pending', detail: '' },
];

const BootLog = memo(function BootLog({ 
  checks,
  finished,
}: { 
  checks: SysCheck[];
  finished: boolean;
}) {
  const statusColor: Record<CheckStatus, string> = {
    pending: 'var(--text-secondary)',
    checking: 'var(--accent-primary)',
    ok: 'var(--ansi-green, #10B981)',
    warn: 'var(--ansi-yellow, #F59E0B)',
    fail: 'var(--ansi-red, #EF4444)',
  };

  return (
    <div
      className="rounded-lg border border-[var(--border-color)]/30 bg-[var(--bg-color)]/60 p-4 font-mono text-[11px] leading-relaxed select-none overflow-hidden"
      style={{
        fontFamily: 'var(--terminal-font-family, monospace)',
        minHeight: '148px',
      }}
    >
      {checks.map((check) => (
        <div
          key={check.id}
          className="grid grid-cols-[14px_1fr] gap-1.5 transition-all duration-300"
          style={{ color: statusColor[check.status], opacity: check.status === 'pending' ? 0.55 : 1 }}
        >
          <span className="text-[var(--accent-primary)]/70">&gt;</span>
          <span>
            {check.label}...
            {check.status === 'checking' && (
              <span
                className="ml-1 text-[var(--accent-primary)] animate-pulse"
                style={{ animation: 'cortex-blink 1s step-end infinite' }}
              >
                _
              </span>
            )}
            {check.detail && (
              <span className="block text-[10px] text-[var(--text-secondary)] opacity-70">
                {check.detail}
              </span>
            )}
          </span>
        </div>
      ))}
      {finished && (
        <div className="grid grid-cols-[14px_1fr] gap-1.5 mt-1 text-[var(--ansi-green, #10B981)]">
          <span className="text-[var(--accent-primary)]/70">&gt;</span>
          <span>Boot sequence complete. System ready.</span>
        </div>
      )}
    </div>
  );
});

// ── Step Components ──────────────────────────────────────────────────────────

// Step 1: Foundation (Welcome + Boot Sequence + Workspace Root)
function StepFoundation({
  path,
  setPath,
  bootFinished,
  bootChecks,
  bootFailed,
  pathValidation,
  skip,
}: {
  path: string;
  setPath: (v: string) => void;
  bootFinished: boolean;
  bootChecks: SysCheck[];
  bootFailed: boolean;
  pathValidation: PathValidationState;
  skip: boolean;
}) {
  const [browseError, setBrowseError] = useState('');

  const handleBrowse = useCallback(async () => {
    setBrowseError('');
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: 'Select workspace root directory',
      });
      if (selected) setPath(selected as string);
    } catch {
      setBrowseError('Directory picker unavailable');
    }
  }, [setPath]);

  return (
    <div className="flex flex-col gap-6 w-full max-w-lg">
      <div className="flex flex-col gap-2">
        <span className="text-[10px] font-bold tracking-widest text-[var(--accent-primary)] uppercase">
          Foundation Sequence
        </span>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[var(--text-primary)] uppercase select-none">
          {skip ? (
            'THE COMMAND CENTER'
          ) : (
            <ScrambleText text="THE COMMAND CENTER" startDelay={100} duration={600} />
          )}
        </h1>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
          Welcome to your unified workspace. Let's perform initial diagnostics and verify your environment path.
        </p>
      </div>

      <div className="w-full h-[1px] bg-[var(--border-color)] opacity-20" />

      <BootLog checks={bootChecks} finished={bootFinished} />

      {bootFailed && (
        <div className="flex items-start gap-2 rounded-lg border border-[var(--ansi-red,#EF4444)]/30 bg-[var(--ansi-red,#EF4444)]/10 p-3 text-left">
          <AlertCircle size={14} className="mt-0.5 text-[var(--ansi-red,#EF4444)] shrink-0" />
          <span className="text-xs font-semibold text-[var(--ansi-red,#EF4444)]">
            Cortex could not complete startup checks. Resolve the failed item above before continuing.
          </span>
        </div>
      )}

      <AnimatePresence>
        {bootFinished && (
          <m.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 100, damping: 15 }}
            className="flex flex-col gap-3"
          >
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="workspace-root-input"
                className="text-xs font-bold tracking-wide text-[var(--text-primary)]"
              >
                Workspace Root Path
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs text-[var(--accent-primary)]/70 select-none">
                    ~/
                  </span>
                  <Input
                    id="workspace-root-input"
                    type="text"
                    value={path}
                    onChange={(e) => {
                      setPath(e.target.value);
                      setBrowseError('');
                    }}
                    placeholder="workspace"
                    aria-invalid={pathValidation.status === 'invalid'}
                    className={`pl-8 font-mono text-xs h-9 bg-[var(--surface-color)] ${
                      pathValidation.status === 'invalid'
                        ? 'border-[var(--ansi-red,#EF4444)]'
                        : pathValidation.status === 'valid'
                        ? 'border-[var(--ansi-green,#10B981)]/70'
                        : 'border-[var(--border-color)]'
                    }`}
                  />
                </div>

                <Button
                  onClick={handleBrowse}
                  className="h-9 text-xs px-4 font-bold bg-[var(--accent-primary)] border-[var(--accent-primary)] text-[var(--accent-contrast)] hover:brightness-110 active:scale-[0.98] transition-all"
                >
                  <FolderOpen size={13} className="mr-1.5" />
                  Browse
                </Button>
              </div>

              {browseError && (
                <span className="text-xs font-semibold text-red-500 tracking-wide mt-1">
                  {browseError}
                </span>
              )}
              {pathValidation.status !== 'idle' && (
                <span
                  className={`text-xs font-semibold tracking-wide mt-1 flex items-center gap-1.5 ${
                    pathValidation.status === 'invalid'
                      ? 'text-[var(--ansi-red,#EF4444)]'
                      : pathValidation.status === 'valid'
                      ? 'text-[var(--ansi-green,#10B981)]'
                      : 'text-[var(--accent-primary)]'
                  }`}
                >
                  {pathValidation.status === 'checking' && <Loader2 size={12} className="animate-spin" />}
                  {pathValidation.status === 'valid' && <CheckCircle2 size={12} />}
                  {pathValidation.status === 'invalid' && <AlertCircle size={12} />}
                  {pathValidation.message}
                </span>
              )}
              {pathValidation.normalizedPath && (
                <span className="text-[10px] font-mono text-[var(--text-secondary)] opacity-60 break-all">
                  Resolved path: {pathValidation.normalizedPath}
                </span>
              )}
            </div>

            <p className="text-[11px] text-[var(--text-secondary)] opacity-60 leading-normal">
              Workspace path directs your default working directory for code sessions and agent triggers. Relative values resolve inside your home directory; leave blank to use home.
            </p>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Step 2: Configuration Choice (Starter Profiles vs Custom Setup)
function StepChoice({
  onSelect,
}: {
  onSelect: (mode: FlowMode) => void;
}) {
  return (
    <div className="flex flex-col gap-6 w-full max-w-xl">
      <div className="flex flex-col gap-1.5 text-center">
        <span className="text-[10px] font-bold tracking-widest text-[var(--accent-primary)] uppercase">
          Onboarding Blueprint
        </span>
        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[var(--text-primary)] uppercase select-none">
          Choose Setup Strategy
        </h2>
        <p className="text-sm text-[var(--text-secondary)] max-w-[50ch] mx-auto">
          Opt for pre-engineered settings profiles for instant startup, or custom-tune every detail of your environment.
        </p>
      </div>

      <div className="w-full h-[1px] bg-[var(--border-color)] opacity-20" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Starter Profiles Option */}
        <m.div
          whileHover={{ scale: 1.01, y: -2 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => onSelect('starter')}
          className="group cursor-pointer rounded-xl border border-[var(--border-color)] bg-[var(--surface-color)]/30 hover:bg-[var(--surface-color)]/80 hover:border-[var(--accent-primary)]/40 p-6 flex flex-col justify-between transition-all duration-300 shadow-lg text-left"
        >
          <div className="flex flex-col gap-4">
            <div className="w-10 h-10 rounded-lg bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] flex items-center justify-center">
              <Zap size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors">
                Option A: Starter Profiles
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-1.5 leading-relaxed">
                Choose a pre-configured template (Zen, AI-First, or Power User) to immediately launch with customized settings.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--accent-primary)] mt-6 opacity-80 group-hover:opacity-100 transition-opacity">
            Select Profiles <ArrowRight size={10} />
          </div>
        </m.div>

        {/* Custom Setup Option */}
        <m.div
          whileHover={{ scale: 1.01, y: -2 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => onSelect('custom')}
          className="group cursor-pointer rounded-xl border border-[var(--border-color)] bg-[var(--surface-color)]/30 hover:bg-[var(--surface-color)]/80 hover:border-[var(--accent-primary)]/40 p-6 flex flex-col justify-between transition-all duration-300 shadow-lg text-left"
        >
          <div className="flex flex-col gap-4">
            <div className="w-10 h-10 rounded-lg bg-[var(--text-primary)]/5 text-[var(--text-secondary)] group-hover:text-[var(--accent-primary)] flex items-center justify-center transition-colors">
              <Settings size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors">
                Option B: Custom Setup
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-1.5 leading-relaxed">
                Manually configure shell executables, download intelligence agents, switch visual themes, and adjust typography sizing.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--accent-primary)] mt-6 opacity-80 group-hover:opacity-100 transition-opacity">
            Customize Environment <ArrowRight size={10} />
          </div>
        </m.div>
      </div>
    </div>
  );
}

// ── Option A (Starter Profiles) Steps ────────────────────────────────────────

// Step A3: Pick Profile
interface Profile {
  id: 'zen' | 'intelligence' | 'pro';
  name: string;
  badge: string;
  themeName: string;
  layoutName: string;
  shellName: string;
  description: string;
  color: string;
}

const PROFILES: Profile[] = [
  {
    id: 'zen',
    name: 'The Zen Den',
    badge: 'MINIMALIST',
    themeName: 'Cortex Default',
    layoutName: 'Flex Layout',
    shellName: 'Default Shell',
    description: 'A focused, distraction-free environment. Standard color palettes with no extra agent processes.',
    color: 'var(--text-secondary)',
  },
  {
    id: 'intelligence',
    name: 'Cortex Intelligence',
    badge: 'AI-FIRST',
    themeName: 'Claude Theme',
    layoutName: '2x2 Grid',
    shellName: 'Default Shell',
    description: 'Loaded with agent integrations. Features an adaptive split layout built for multi-agent execution.',
    color: '#D97757',
  },
  {
    id: 'pro',
    name: 'The Terminal Pro',
    badge: 'POWER USER',
    themeName: 'Nord Theme',
    layoutName: '1x3 Grid',
    shellName: 'Custom Shell',
    description: 'Designed for terminal veterans. Custom Nord visual scheme with support for custom shell executables.',
    color: '#88C0D0',
  },
];

function StepPickProfile({
  selected,
  onSelect,
  proShell,
  setProShell,
}: {
  selected: 'zen' | 'intelligence' | 'pro' | null;
  onSelect: (id: 'zen' | 'intelligence' | 'pro') => void;
  proShell: string;
  setProShell: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-6 w-full max-w-xl">
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] font-bold tracking-widest text-[var(--accent-primary)] uppercase">
          Starter Presets
        </span>
        <h2 className="text-2xl font-extrabold tracking-tight text-[var(--text-primary)] uppercase select-none">
          Select Starter Profile
        </h2>
        <p className="text-xs text-[var(--text-secondary)]">
          Pick a predefined configuration profile suited for your workflow. Customize details directly.
        </p>
      </div>

      <div className="w-full h-[1px] bg-[var(--border-color)] opacity-20" />

      <div className="flex flex-col gap-3">
        {PROFILES.map((profile) => (
          <div key={profile.id} className="flex flex-col">
            <m.div
              whileTap={{ scale: 0.995 }}
              onClick={() => onSelect(profile.id)}
              className={`cursor-pointer rounded-xl border p-4 transition-all duration-200 bg-[var(--surface-color)]/30 flex flex-col gap-3 ${
                selected === profile.id
                  ? 'border-[var(--accent-primary)] bg-[var(--surface-color)]/60 shadow-[0_0_12px_rgba(var(--accent-primary-rgb),0.1)]'
                  : 'border-[var(--border-color)] hover:border-[var(--border-color)]/80 hover:bg-[var(--surface-color)]/40'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-[var(--text-primary)]">
                      {profile.name}
                    </span>
                    <span 
                      className="text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded border"
                      style={{ 
                        color: profile.color,
                        borderColor: `${profile.color}25`,
                        backgroundColor: `${profile.color}08`
                      }}
                    >
                      {profile.badge}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] opacity-85 mt-1 leading-relaxed">
                    {profile.description}
                  </p>
                </div>

                <div 
                  className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    selected === profile.id
                      ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)] text-[var(--accent-contrast)]'
                      : 'border-[var(--border-color)] bg-transparent'
                  }`}
                >
                  {selected === profile.id && <Check size={10} />}
                </div>
              </div>

              {/* Spec list */}
              <div className="flex items-center gap-3 text-[10px] font-mono text-[var(--text-secondary)] opacity-55 border-t border-[var(--border-color)]/20 pt-2 flex-wrap">
                <span className="flex items-center gap-1"><Palette size={10} /> {profile.themeName}</span>
                <span>•</span>
                <span className="flex items-center gap-1"><Target size={10} /> {profile.layoutName}</span>
                <span>•</span>
                <span className="flex items-center gap-1"><Monitor size={10} /> {profile.shellName}</span>
              </div>
            </m.div>

            {/* Custom shell dropdown for power users */}
            {profile.id === 'pro' && selected === 'pro' && (
              <m.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="overflow-hidden px-4"
              >
                <div className="flex flex-col gap-2 pt-3 pb-2 border-l border-r border-b border-[var(--accent-primary)]/40 rounded-b-xl bg-[var(--surface-color)]/40 px-3">
                  <label htmlFor="pro-shell-input" className="text-[10px] font-bold text-[var(--text-primary)] uppercase tracking-wider">
                    Terminal Shell Preference
                  </label>
                  <div className="flex gap-2">
                    <Input
                      id="pro-shell-input"
                      value={proShell}
                      onChange={(e) => setProShell(e.target.value)}
                      placeholder="e.g. powershell.exe, bash, zsh"
                      className="h-8 font-mono text-xs bg-[var(--bg-color)] border-[var(--border-color)]"
                    />
                    <div className="flex gap-1">
                      {['powershell.exe', 'cmd.exe', 'wsl.exe'].map((sh) => (
                        <button
                          key={sh}
                          type="button"
                          onClick={() => setProShell(sh)}
                          className={`px-2 rounded font-mono text-[9px] font-bold border transition-colors ${
                            proShell === sh
                              ? 'bg-[var(--accent-primary)] text-[var(--accent-contrast)] border-[var(--accent-primary)]'
                              : 'bg-[var(--surface-color)] border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--accent-primary)]/35'
                          }`}
                        >
                          {sh.split('.')[0]}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </m.div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Step A4 / Step B3 System scan & runtime
function StepSystemScan({
  checks,
  scanDone,
  agentStatusText,
  installingTools,
  onInstallTool,
}: {
  checks: SysCheck[];
  scanDone: boolean;
  agentStatusText?: string;
  installingTools: Partial<Record<InstallableTool, boolean>>;
  onInstallTool: (tool: InstallableTool) => void;
}) {
  const hasFailure = checks.some((check) => check.status === 'fail');
  const STATUS_COLOR: Record<CheckStatus, string> = {
    pending: 'var(--text-secondary)',
    checking: 'var(--accent-primary)',
    ok: 'var(--ansi-green, #10B981)',
    warn: 'var(--ansi-yellow, #F59E0B)',
    fail: 'var(--ansi-red, #EF4444)',
  };

  const STATUS_LABEL: Record<CheckStatus, string> = {
    pending: 'Pending',
    checking: 'Checking',
    ok: 'Nominal',
    warn: 'Degraded',
    fail: 'Failed',
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-lg">
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] font-bold tracking-widest text-[var(--accent-primary)] uppercase">
          System Verification
        </span>
        <h2 className="text-2xl font-extrabold tracking-tight text-[var(--text-primary)] uppercase select-none">
          Environment Diagnostics
        </h2>
        <p className="text-xs text-[var(--text-secondary)]">
          Scanning local environment paths for required build utilities and system runtime permissions.
        </p>
      </div>

      <div className="w-full h-[1px] bg-[var(--border-color)] opacity-20" />

      <div className="flex flex-col border border-[var(--border-color)] rounded-xl bg-[var(--bg-color)]/20 divide-y divide-[var(--border-color)]/40 overflow-hidden font-mono text-[11px]">
        {checks.map((check) => (
          <div key={check.id} className="flex justify-between items-center p-3">
            <div className="flex flex-col gap-0.5">
              <span className="font-bold text-[var(--text-primary)]">
                {check.label}
              </span>
              <span className="text-[10px] text-[var(--text-secondary)] opacity-60">
                {check.detail || check.description}
              </span>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {isInstallableTool(check.id) && check.status === 'fail' && (
                <Button
                  type="button"
                  onClick={() => onInstallTool(check.id as InstallableTool)}
                  disabled={installingTools[check.id]}
                  variant="outline"
                  className="h-7 px-2 text-[10px] font-bold border-[var(--ansi-red,#EF4444)]/40 bg-[var(--surface-color)] text-[var(--text-primary)] hover:border-[var(--accent-primary)]/50"
                >
                  {installingTools[check.id] ? (
                    <Loader2 size={11} className="mr-1 animate-spin" />
                  ) : (
                    <Download size={11} className="mr-1" />
                  )}
                  Install
                </Button>
              )}
              {check.status === 'checking' && (
                <m.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-2.5 h-2.5 rounded-full border-2 border-[var(--accent-primary)] border-t-transparent"
                />
              )}
              {check.status === 'ok' && (
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--ansi-green, #10B981)] shadow-[0_0_6px_var(--ansi-green)]" />
              )}
              {check.status === 'warn' && (
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--ansi-yellow, #F59E0B)]" />
              )}
              {check.status === 'fail' && (
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--ansi-red, #EF4444)]" />
              )}
              {check.status === 'pending' && (
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--border-color)]" />
              )}
              <span 
                className="font-bold uppercase tracking-wider" 
                style={{ color: STATUS_COLOR[check.status] }}
              >
                {STATUS_LABEL[check.status]}
              </span>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {scanDone && (
          <m.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex flex-col gap-1 text-xs font-semibold mt-1 ${
              hasFailure ? 'text-[var(--ansi-red, #EF4444)]' : 'text-[var(--ansi-green, #10B981)]'
            }`}
          >
            <span className="flex items-center gap-1.5">
              {hasFailure ? <AlertCircle size={13} /> : <CheckCircle2 size={13} />}
              {hasFailure
                ? 'Diagnostics complete. Resolve failed checks before continuing.'
                : 'Diagnostics complete. Environment verified.'}
            </span>
            {agentStatusText && !hasFailure && (
              <span className="text-[10px] text-[var(--text-secondary)] opacity-80 pl-4.5">
                {agentStatusText}
              </span>
            )}
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Option B (Custom Setup) Steps ──────────────────────────────────────────

// Step B3: Runtime
function StepRuntime({
  shell,
  setShell,
  checks,
  systemShell,
  installingTools,
  onInstallTool,
}: {
  shell: string;
  setShell: (v: string) => void;
  checks: SysCheck[];
  systemShell: string;
  installingTools: Partial<Record<InstallableTool, boolean>>;
  onInstallTool: (tool: InstallableTool) => void;
}) {
  return (
    <div className="flex flex-col gap-6 w-full max-w-xl">
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] font-bold tracking-widest text-[var(--accent-primary)] uppercase">
          Custom: Runtime config
        </span>
        <h2 className="text-2xl font-extrabold tracking-tight text-[var(--text-primary)] uppercase select-none">
          Shell & Diagnostics
        </h2>
        <p className="text-xs text-[var(--text-secondary)]">
          Override the default system shell and review active environment runtime paths.
        </p>
      </div>

      <div className="w-full h-[1px] bg-[var(--border-color)] opacity-20" />

      {/* Shell Selector */}
      <div className="flex flex-col gap-2">
        <label htmlFor="custom-shell-input" className="text-xs font-bold text-[var(--text-primary)]">
          System Shell Executable
        </label>
        <div className="flex gap-2">
          <Input
            id="custom-shell-input"
            value={shell}
            onChange={(e) => setShell(e.target.value)}
            placeholder={`System Default (Detected: ${systemShell})`}
            className="h-9 font-mono text-xs bg-[var(--surface-color)] border-[var(--border-color)]"
          />
          <div className="flex gap-1.5 shrink-0">
            {['powershell.exe', 'cmd.exe', 'git-bash.exe', 'wsl.exe'].map((sh) => (
              <button
                key={sh}
                type="button"
                onClick={() => setShell(sh)}
                className={`px-2 rounded text-[10px] font-mono font-bold border transition-colors ${
                  shell === sh
                    ? 'bg-[var(--accent-primary)] text-[var(--accent-contrast)] border-[var(--accent-primary)]'
                    : 'bg-[var(--surface-color)] border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--accent-primary)]/40'
                }`}
              >
                {sh.split('.')[0]}
              </button>
            ))}
          </div>
        </div>
        <p className="text-[10px] text-[var(--text-secondary)] opacity-55">
          Type an executable name (like <code className="font-mono">zsh</code>) or select a pre-populated preset. Leave blank to inherit system shell.
        </p>
      </div>

      {/* Scan section */}
      <div className="flex flex-col gap-2.5">
        <span className="text-xs font-bold text-[var(--text-primary)]">System Diagnostics</span>
        <div className="flex flex-col border border-[var(--border-color)] rounded-xl bg-[var(--bg-color)]/20 divide-y divide-[var(--border-color)]/40 overflow-hidden font-mono text-[11px]">
          {checks.map((check) => (
            <div key={check.id} className="flex justify-between items-center p-2.5">
              <div className="flex flex-col">
                <span className="font-bold text-[var(--text-primary)]">{check.label}</span>
                <span className="text-[9px] text-[var(--text-secondary)] opacity-65">{check.detail || check.description}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {isInstallableTool(check.id) && check.status === 'fail' && (
                  <button
                    type="button"
                    onClick={() => onInstallTool(check.id as InstallableTool)}
                    disabled={installingTools[check.id]}
                    className="h-6 px-2 rounded border border-[var(--ansi-red,#EF4444)]/40 bg-[var(--surface-color)] text-[9px] font-bold text-[var(--text-primary)] hover:border-[var(--accent-primary)]/50 disabled:opacity-60 inline-flex items-center gap-1"
                  >
                    {installingTools[check.id] ? (
                      <Loader2 size={10} className="animate-spin" />
                    ) : (
                      <Download size={10} />
                    )}
                    Install
                  </button>
                )}
                {check.status === 'checking' && (
                  <m.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-2.5 h-2.5 rounded-full border-2 border-[var(--accent-primary)] border-t-transparent"
                  />
                )}
                {check.status === 'ok' && <div className="w-1.5 h-1.5 rounded-full bg-[var(--ansi-green, #10B981)]" />}
                {check.status === 'warn' && <div className="w-1.5 h-1.5 rounded-full bg-[var(--ansi-yellow, #F59E0B)]" />}
                {check.status === 'fail' && <div className="w-1.5 h-1.5 rounded-full bg-[var(--ansi-red, #EF4444)]" />}
                <span className="font-bold uppercase tracking-wider text-[9px]" style={{ color: check.status === 'ok' ? 'var(--ansi-green)' : check.status === 'checking' ? 'var(--accent-primary)' : 'var(--text-secondary)' }}>
                  {check.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Step B4: Intelligence (Agents installer)
function StepIntelligence({
  agents,
  installAgent,
  isInitialized,
}: {
  agents: any[];
  installAgent: (id: string) => Promise<void>;
  isInitialized: boolean;
}) {
  const activeCount = agents.filter(a => a.isDefault && a.status === 'installed').length;

  return (
    <div className="flex flex-col gap-6 w-full max-w-xl">
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] font-bold tracking-widest text-[var(--accent-primary)] uppercase">
          Custom: AI Intelligence
        </span>
        <h2 className="text-2xl font-extrabold tracking-tight text-[var(--text-primary)] uppercase select-none">
          Agent Installations
        </h2>
        <p className="text-xs text-[var(--text-secondary)]">
          Download, scan, and activate pre-packaged intelligence agents inside your local path binaries.
        </p>
      </div>

      <div className="w-full h-[1px] bg-[var(--border-color)] opacity-20" />

      {!isInitialized ? (
        <div className="flex items-center justify-center p-8 border border-dashed border-[var(--border-color)] rounded-xl bg-[var(--bg-color)]/20 gap-3">
          <Loader2 size={16} className="animate-spin text-[var(--accent-primary)]" />
          <span className="font-mono text-xs text-[var(--text-secondary)]">Scanning agent repositories...</span>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {agents.filter(a => a.isDefault).map((agent) => (
            <div
              key={agent.id}
              className="flex items-center justify-between p-3.5 border border-[var(--border-color)] rounded-xl bg-[var(--surface-color)]/30 hover:bg-[var(--surface-color)]/60 transition-colors gap-4"
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  agent.status === 'installed' 
                    ? 'bg-[var(--ansi-green)]/10 text-[var(--ansi-green)]' 
                    : 'bg-[var(--surface-color)] text-[var(--text-secondary)]'
                }`}>
                  <Cpu size={15} />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold text-[var(--text-primary)]">{agent.label}</span>
                  <span className="text-[9px] font-mono text-[var(--text-secondary)] opacity-60">cmd: {agent.command}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <AnimatePresence mode="wait">
                  {agent.status === 'installed' && (
                    <m.div key="inst" className="flex items-center gap-1.5 font-bold text-[9px] text-[var(--ansi-green)] uppercase">
                      <span>Detected</span>
                      <CheckCircle2 size={13} />
                    </m.div>
                  )}
                  {agent.status === 'installing' && (
                    <m.div key="instg" className="flex items-center gap-1.5 font-bold text-[9px] text-[var(--accent-primary)] uppercase">
                      <span>Installing</span>
                      <Loader2 size={13} className="animate-spin" />
                    </m.div>
                  )}
                  {agent.status === 'not-installed' && (
                    <m.button
                      key="notinst"
                      type="button"
                      onClick={() => installAgent(agent.id)}
                      className="px-2.5 py-1 text-[10px] font-bold border border-[var(--border-color)] rounded-lg bg-[var(--surface-color)] hover:border-[var(--accent-primary)]/50 hover:text-[var(--accent-primary)] transition-all flex items-center gap-1 active:scale-[0.97]"
                    >
                      <Download size={11} />
                      Install
                    </m.button>
                  )}
                  {agent.status === 'error' && (
                    <m.div key="err" className="flex items-center gap-1.5">
                      <span className="font-bold text-[9px] text-[var(--ansi-red)] uppercase">Failed</span>
                      <button
                        type="button"
                        onClick={() => installAgent(agent.id)}
                        className="px-1.5 py-0.5 rounded border border-[var(--border-color)] bg-[var(--surface-color)] text-[9px] font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                      >
                        Retry
                      </button>
                    </m.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          ))}

          <div className="text-center font-mono text-[10px] text-[var(--text-secondary)] opacity-70">
            {activeCount} of {agents.filter(a => a.isDefault).length} default agents configured successfully
          </div>
        </div>
      )}
    </div>
  );
}

// Step B5: Personalization
function StepPersonalization({
  allThemes,
  selectedTheme,
  setSelectedTheme,
  customFontSize,
  setCustomFontSize,
  customFontFamily,
  setCustomFontFamily,
  customLayout,
  setCustomLayout,
}: {
  allThemes: any[];
  selectedTheme: string;
  setSelectedTheme: (v: string) => void;
  customFontSize: number;
  setCustomFontSize: (v: number) => void;
  customFontFamily: string;
  setCustomFontFamily: (v: string) => void;
  customLayout: 'grid' | 'count';
  setCustomLayout: (v: 'grid' | 'count') => void;
}) {
  const { previewTheme, cancelPreview } = useTheme();

  return (
    <div className="flex flex-col gap-6 w-full max-w-xl text-left">
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] font-bold tracking-widest text-[var(--accent-primary)] uppercase">
          Custom: Appearance
        </span>
        <h2 className="text-2xl font-extrabold tracking-tight text-[var(--text-primary)] uppercase select-none">
          Personalize Space
        </h2>
        <p className="text-xs text-[var(--text-secondary)]">
          Adjust visual themes in real time, set layout dimensions, and configure code editor fonts.
        </p>
      </div>

      <div className="w-full h-[1px] bg-[var(--border-color)] opacity-20" />

      {/* 1. Theme grid */}
      <div className="flex flex-col gap-3">
        <span className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
          <Palette size={13} /> Visual Theme Color
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {allThemes.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelectedTheme(t.id)}
              onMouseEnter={() => previewTheme(t)}
              onMouseLeave={cancelPreview}
              className={`flex flex-col items-start p-2.5 rounded-xl border transition-all text-left relative overflow-hidden ${
                selectedTheme === t.id
                  ? 'border-[var(--accent-primary)] bg-[var(--surface-color)]/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]'
                  : 'border-[var(--border-color)] bg-[var(--surface-color)]/20 hover:border-[var(--border-color)]/80 hover:bg-[var(--surface-color)]/40'
              }`}
            >
              <span className="text-[11px] font-bold text-[var(--text-primary)] truncate max-w-full">
                {t.name}
              </span>
              
              {/* Color swatches */}
              <div className="flex gap-1 mt-2.5">
                <div className="w-3.5 h-3.5 rounded border border-white/5" style={{ backgroundColor: t.dark?.bg || '#000' }} />
                <div className="w-3.5 h-3.5 rounded border border-white/5" style={{ backgroundColor: t.dark?.accent || '#fff' }} />
                <div className="w-3.5 h-3.5 rounded border border-white/5" style={{ backgroundColor: t.dark?.surface || '#222' }} />
              </div>

              {selectedTheme === t.id && (
                <div className="absolute top-1.5 right-1.5 w-3 h-3 rounded-full bg-[var(--accent-primary)] text-[var(--accent-contrast)] flex items-center justify-center">
                  <Check size={8} />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Layout selector */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold text-[var(--text-primary)]">Layout Mode</span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setCustomLayout('grid')}
              className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                customLayout === 'grid'
                  ? 'border-[var(--accent-primary)] bg-[var(--surface-color)]/60'
                  : 'border-[var(--border-color)] bg-[var(--surface-color)]/20 hover:border-[var(--border-color)]/70'
              }`}
            >
              {/* Mock Grid graphic */}
              <div className="grid grid-cols-2 gap-0.5 w-9 h-7 border border-[var(--border-color)] p-0.5 rounded bg-[var(--bg-color)]/60">
                <div className="bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 rounded-xs" />
                <div className="bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 rounded-xs" />
                <div className="bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 rounded-xs" />
                <div className="bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 rounded-xs" />
              </div>
              <span className="text-[10px] font-bold">Grid Layout</span>
            </button>

            <button
              type="button"
              onClick={() => setCustomLayout('count')}
              className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                customLayout === 'count'
                  ? 'border-[var(--accent-primary)] bg-[var(--surface-color)]/60'
                  : 'border-[var(--border-color)] bg-[var(--surface-color)]/20 hover:border-[var(--border-color)]/70'
              }`}
            >
              {/* Mock Flex graphic */}
              <div className="flex flex-col gap-0.5 w-9 h-7 border border-[var(--border-color)] p-0.5 rounded bg-[var(--bg-color)]/60">
                <div className="bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 rounded-xs flex-1" />
                <div className="bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 rounded-xs flex-1" />
              </div>
              <span className="text-[10px] font-bold">Flex Layout</span>
            </button>
          </div>
        </div>

        {/* Font customization */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold text-[var(--text-primary)]">Monospace Font</span>
          <div className="flex flex-col gap-2 p-3 rounded-xl border border-[var(--border-color)] bg-[var(--surface-color)]/10">
            {/* Font Family Selection */}
            <div className="flex flex-col gap-1">
              <label htmlFor="font-family-select" className="text-[9px] font-bold text-[var(--text-secondary)] uppercase">Family</label>
              <select
                id="font-family-select"
                value={customFontFamily}
                onChange={(e) => setCustomFontFamily(e.target.value)}
                className="h-7 text-[10px] font-mono rounded bg-[var(--bg-color)] border-[var(--border-color)] py-0 text-[var(--text-primary)]"
              >
                <option value="JetBrains Mono">JetBrains Mono</option>
                <option value="Geist Mono">Geist Mono</option>
                <option value="Fira Code">Fira Code</option>
                <option value="Consolas">Consolas</option>
                <option value="Courier New">Courier New</option>
              </select>
            </div>

            {/* Font Size Selection */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center text-[9px] font-bold text-[var(--text-secondary)] uppercase">
                <span>Size</span>
                <span className="font-mono text-[var(--accent-primary)]">{customFontSize}px</span>
              </div>
              <input
                type="range"
                min="10"
                max="18"
                step="1"
                value={customFontSize}
                onChange={(e) => setCustomFontSize(parseInt(e.target.value, 10))}
                className="accent-[var(--accent-primary)] h-1 cursor-pointer w-full bg-[var(--surface-color)]"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Step 6: Activation (Summary Review)
function StepActivation({
  path,
  themeName,
  layoutName,
  shellName,
  agentsCount,
}: {
  path: string;
  themeName: string;
  layoutName: string;
  shellName: string;
  agentsCount: number;
}) {
  const summaryRows = [
    ['Workspace Directory', path || 'System Default (~/)'],
    ['Visual Theme', themeName],
    ['Workspace Layout', layoutName],
    ['Default Shell', shellName || 'Auto Detect System'],
    ['Intelligence Core', `${agentsCount} default agents scanned`],
  ];

  return (
    <div className="flex flex-col gap-6 w-full max-w-lg text-left">
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] font-bold tracking-widest text-[var(--ansi-green)] uppercase flex items-center gap-1">
          <ShieldCheck size={11} /> Ready to Activate
        </span>
        <h2 className="text-2xl font-extrabold tracking-tight text-[var(--text-primary)] uppercase select-none">
          Configuration Summary
        </h2>
        <p className="text-xs text-[var(--text-secondary)]">
          Verify your configuration details below. Your workspace will launch directly with these parameters.
        </p>
      </div>

      <div className="w-full h-[1px] bg-[var(--border-color)] opacity-20" />

      {/* Review table */}
      <div className="flex flex-col border border-[var(--border-color)] rounded-xl bg-[var(--bg-color)]/20 divide-y divide-[var(--border-color)]/30 overflow-hidden font-mono text-xs">
        {summaryRows.map(([key, val]) => (
          <div key={key} className="flex justify-between items-center p-3 gap-4">
            <span className="text-[var(--text-secondary)] opacity-60 font-bold">{key}</span>
            <span className="text-[var(--text-primary)] text-right break-all">{val}</span>
          </div>
        ))}
      </div>

      <div className="text-[10px] text-[var(--text-secondary)] opacity-55 leading-relaxed bg-[var(--surface-color)]/30 border border-[var(--border-color)]/25 rounded-lg p-3">
        Your settings are stored locally in settings.json. You can alter these parameters at any time by triggering the global configuration panel (<kbd className="font-mono px-1 py-0.5 border rounded border-[var(--border-color)]">Cmd+,</kbd> or <kbd className="font-mono px-1 py-0.5 border rounded border-[var(--border-color)]">Ctrl+,</kbd>).
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

interface FirstRunOnboardingScreenProps {
  onComplete: () => void;
}

export const FirstRunOnboardingScreen = memo(function FirstRunOnboardingScreen({
  onComplete,
}: FirstRunOnboardingScreenProps) {
  const shouldReduceMotion = useReducedMotion();

  // Settings states
  const [workspacePath, setWorkspacePath] = useState('');
  const [flowMode, setFlowMode] = useState<FlowMode>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);

  // Diagnostics & runtime scan
  const [bootFinished, setBootFinished] = useState(false);
  const [bootChecks, setBootChecks] = useState<SysCheck[]>(INITIAL_BOOT_CHECKS);
  const [scanDone, setScanDone] = useState(false);
  const [systemShell, setSystemShell] = useState('cmd.exe');
  const [installingTools, setInstallingTools] = useState<Partial<Record<InstallableTool, boolean>>>({});
  const [pathValidation, setPathValidation] = useState<PathValidationState>({
    status: 'idle',
    message: '',
    normalizedPath: '',
  });
  const [checks, setChecks] = useState<SysCheck[]>([
    { id: 'node', label: 'Node.js Runtime', description: 'Requires v18.x or above', status: 'pending', detail: '' },
    { id: 'git', label: 'Git Version Control', description: 'Tracks repositories & themes', status: 'pending', detail: '' },
    { id: 'shell', label: 'Default Shell', description: 'Detect default command interpreter', status: 'pending', detail: '' },
    { id: 'disk', label: 'Disk Access', description: 'Verifying folder read/write rights', status: 'pending', detail: '' },
  ]);

  // Option A configuration states
  const [selectedProfile, setSelectedProfile] = useState<'zen' | 'intelligence' | 'pro' | null>(null);
  const [proShellPreference, setProShellPreference] = useState('powershell.exe');

  // Option B configuration states
  const [customShell, setCustomShell] = useState('');
  const [customTheme, setCustomTheme] = useState('cortex');
  const [customFontSize, setCustomFontSize] = useState(12);
  const [customFontFamily, setCustomFontFamily] = useState('JetBrains Mono');
  const [customLayout, setCustomLayout] = useState<'grid' | 'count'>('grid');

  // Theme & Agent bindings
  const { setTheme, allThemes } = useTheme();
  const { agents, installAgent, isInitialized: isAgentsInitialized } = useAgents();

  // Run first-start checks against real local state before allowing setup to continue.
  useEffect(() => {
    let cancelled = false;

    const patchBoot = (id: string, update: Partial<SysCheck>) => {
      if (cancelled) return;
      setBootChecks((prev) => prev.map((c) => (c.id === id ? { ...c, ...update } : c)));
    };

    const runBootChecks = async () => {
      let hasFailure = false;
      setBootFinished(false);
      setBootChecks(INITIAL_BOOT_CHECKS);

      patchBoot('environment', { status: 'checking', detail: '' });
      try {
        const home = await invoke<string | null>('get_home_dir');
        if (!home) throw new Error('Home directory unavailable');
        patchBoot('environment', { status: 'ok', detail: `Home: ${home}` });
      } catch (error) {
        hasFailure = true;
        patchBoot('environment', {
          status: 'fail',
          detail: error instanceof Error ? error.message : 'Unable to initialize local environment',
        });
      }

      patchBoot('workspace-sync', { status: 'checking', detail: '' });
      try {
        const [workspaceDefault, legacyDefault] = await Promise.all([
          getSetting<string>('workspace.defaultPath', ''),
          getSetting<string>('cortex_default_path', ''),
        ]);
        const savedPath = workspaceDefault || legacyDefault;
        if (!cancelled) setWorkspacePath(savedPath);
        patchBoot('workspace-sync', {
          status: 'ok',
          detail: savedPath ? `Loaded saved workspace: ${savedPath}` : 'No saved workspace path; home directory will be used',
        });
      } catch (error) {
        hasFailure = true;
        patchBoot('workspace-sync', {
          status: 'fail',
          detail: error instanceof Error ? error.message : 'Failed to load local workspace settings',
        });
      }

      patchBoot('agents', { status: 'checking', detail: '' });
      if (!isAgentsInitialized) {
        patchBoot('agents', { status: 'checking', detail: 'Waiting for agent registry initialization' });
        return;
      }
      patchBoot('agents', {
        status: 'ok',
        detail: `${agents.filter((a) => a.isDefault).length} default agents registered`,
      });

      patchBoot('themes', { status: 'checking', detail: '' });
      if (allThemes.length > 0) {
        patchBoot('themes', { status: 'ok', detail: `${allThemes.length} themes available` });
      } else {
        hasFailure = true;
        patchBoot('themes', { status: 'fail', detail: 'No visual themes were loaded' });
      }

      patchBoot('shell', { status: 'checking', detail: '' });
      try {
        const shell = await invoke<string>('get_default_shell');
        if (!shell?.trim()) throw new Error('Default shell unavailable');
        if (!cancelled) setSystemShell(shell.trim());
        patchBoot('shell', { status: 'ok', detail: shell.trim() });
      } catch (error) {
        hasFailure = true;
        patchBoot('shell', {
          status: 'fail',
          detail: error instanceof Error ? error.message : 'Unable to detect default shell',
        });
      }

      if (!cancelled) setBootFinished(!hasFailure);
    };

    runBootChecks();

    return () => {
      cancelled = true;
    };
  }, [agents, allThemes.length, isAgentsInitialized]);

  useEffect(() => {
    if (!bootFinished) return;

    let cancelled = false;
    const rawPath = workspacePath;

    setPathValidation({
      status: 'checking',
      message: rawPath.trim() ? 'Validating workspace path...' : 'Validating home directory...',
      normalizedPath: '',
    });

    const id = window.setTimeout(async () => {
      try {
        const result = await invoke<WorkspacePathValidation>('validate_workspace_path', { path: rawPath });
        if (cancelled) return;
        setPathValidation({
          status: result.valid ? 'valid' : 'invalid',
          message: result.message,
          normalizedPath: result.normalized_path || '',
        });
      } catch (error) {
        if (cancelled) return;
        setPathValidation({
          status: 'invalid',
          message: error instanceof Error ? error.message : 'Path validation failed.',
          normalizedPath: '',
        });
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, [bootFinished, workspacePath]);

  // Compute active steps list
  const steps = getStepsList(flowMode);
  const currentStep = steps[stepIndex];

  function getStepsList(flow: FlowMode): string[] {
    if (flow === 'starter') {
      return ['foundation', 'choice', 'pick-profile', 'verification', 'activation'];
    }
    if (flow === 'custom') {
      return ['foundation', 'choice', 'runtime', 'intelligence', 'personalization', 'activation'];
    }
    return ['foundation', 'choice'];
  }

  // System scanner runner
  const runSystemScan = useCallback(async () => {
    const patch = (id: string, update: Partial<SysCheck>) =>
      setChecks((prev) => prev.map((c) => (c.id === id ? { ...c, ...update } : c)));

    const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
    // Reset statuses
    setChecks((prev) => prev.map((c) => ({ ...c, status: 'pending', detail: '' })));
    setScanDone(false);

    // Node
    patch('node', { status: 'checking' });
    await delay(350);
    try {
      const v = await invoke<string>('check_node_version');
      const major = Number.parseInt(v.trim().replace(/^v/, '').split('.')[0] || '0', 10);
      if (Number.isFinite(major) && major >= 18) {
        patch('node', { status: 'ok', detail: v.trim().slice(0, 40) });
      } else {
        patch('node', { status: 'fail', detail: `${v.trim() || 'Unknown version'} detected; v18+ required` });
      }
    } catch (error) {
      patch('node', {
        status: 'fail',
        detail: typeof error === 'string' ? error : 'Node.js was not found on PATH',
      });
    }

    // Git
    patch('git', { status: 'checking' });
    await delay(350);
    try {
      const v = await invoke<string>('check_git_version');
      patch('git', { status: 'ok', detail: v ? v.trim().slice(0, 40) : 'Git detected' });
    } catch (error) {
      patch('git', {
        status: 'fail',
        detail: typeof error === 'string' ? error : 'Git was not found on PATH',
      });
    }

    // Shell
    patch('shell', { status: 'checking' });
    await delay(300);
    try {
      const v = await invoke<string>('get_default_shell');
      if (!v?.trim()) throw new Error('Default shell unavailable');
      patch('shell', { status: 'ok', detail: v.trim() });
    } catch (error) {
      patch('shell', {
        status: 'fail',
        detail: error instanceof Error ? error.message : 'Default shell unavailable',
      });
    }

    // Disk
    patch('disk', { status: 'checking' });
    await delay(250);
    try {
      const result = await invoke<WorkspacePathValidation>('validate_workspace_path', { path: workspacePath });
      if (result.valid) {
        patch('disk', { status: 'ok', detail: result.normalized_path || 'Workspace directory writable' });
      } else {
        patch('disk', { status: 'fail', detail: result.message });
      }
    } catch (error) {
      patch('disk', {
        status: 'fail',
        detail: error instanceof Error ? error.message : 'Workspace permission check failed',
      });
    }

    setScanDone(true);
  }, [workspacePath]);

  const installTool = useCallback(async (tool: InstallableTool) => {
    setInstallingTools((prev) => ({ ...prev, [tool]: true }));
    setScanDone(false);
    setChecks((prev) =>
      prev.map((check) =>
        check.id === tool
          ? { ...check, status: 'checking', detail: `Installing stable ${tool === 'node' ? 'Node.js LTS' : 'Git'} release...` }
          : check
      )
    );

    try {
      await invoke('install_dev_tool', { tool });
      await runSystemScan();
    } catch (error) {
      const detail = typeof error === 'string'
        ? error
        : error instanceof Error
        ? error.message
        : `Failed to install ${tool}.`;
      setChecks((prev) =>
        prev.map((check) =>
          check.id === tool
            ? { ...check, status: 'fail', detail }
            : check
        )
      );
      setScanDone(true);
    } finally {
      setInstallingTools((prev) => ({ ...prev, [tool]: false }));
    }
  }, [runSystemScan]);

  // Run scans when diagnostic steps load
  useEffect(() => {
    if (currentStep === 'verification' || currentStep === 'runtime') {
      runSystemScan();
    }
  }, [currentStep, runSystemScan]);

  // Profile-switching triggers instant visual theme change
  useEffect(() => {
    if (flowMode === 'starter' && currentStep === 'pick-profile') {
      if (selectedProfile === 'zen') {
        setTheme('cortex');
      } else if (selectedProfile === 'intelligence') {
        setTheme('claude');
      } else if (selectedProfile === 'pro') {
        setTheme('nord');
      }
    }
  }, [selectedProfile, flowMode, currentStep, setTheme]);

  // Apply theme customization dynamically
  useEffect(() => {
    if (flowMode === 'custom' && currentStep === 'personalization') {
      setTheme(customTheme);
    }
  }, [customTheme, flowMode, currentStep, setTheme]);

  const bootFailed = bootChecks.some((check) => check.status === 'fail');
  const isInstallingTool = Object.values(installingTools).some(Boolean);
  const scanPassed = scanDone && !isInstallingTool && checks.every((check) => check.status !== 'fail');
  const workspacePathReady = pathValidation.status === 'valid';

  // Logic validation for moving forward
  const canProceed = useCallback(() => {
    if (currentStep === 'foundation') return bootFinished && workspacePathReady;
    if (currentStep === 'choice') return flowMode !== null;
    if (currentStep === 'pick-profile') return selectedProfile !== null;
    if (currentStep === 'verification') return scanPassed;
    if (currentStep === 'runtime') return scanPassed;
    return true;
  }, [currentStep, bootFinished, workspacePathReady, flowMode, selectedProfile, scanPassed]);

  // Navigation handlers
  const goNext = useCallback(async () => {
    if (!canProceed()) return;

    if (currentStep === 'activation') {
      // Collect settings to commit
      let path = pathValidation.normalizedPath || workspacePath.trim();
      let themeName = 'cortex';
      let layout = 'grid';
      let shell = '';

      if (flowMode === 'starter') {
        if (selectedProfile === 'zen') {
          themeName = 'cortex';
          layout = 'count'; // Flex Layout
          shell = '';
        } else if (selectedProfile === 'intelligence') {
          themeName = 'claude';
          layout = 'grid';
          shell = '';
        } else if (selectedProfile === 'pro') {
          themeName = 'nord';
          layout = 'grid';
          shell = proShellPreference;
        }
      } else {
        themeName = customTheme;
        layout = customLayout;
        shell = customShell;
        
        // Custom font specs
        await setSetting('terminal.fontSize', customFontSize);
        await setSetting('terminal.fontFamily', customFontFamily);
      }

      // Commit to settings store
      await Promise.all([
        setSetting('workspace.defaultPath', path),
        setSetting('cortex_default_path', path),
        setSetting('appearance.theme', themeName),
        setSetting('workspace.layout', layout),
        setSetting('terminal.shell', shell),
        setSetting('startup.hasOnboarded', true),

        // Internal app keys
        setSetting('cortex_theme', themeName),
        setSetting('focus.customLayoutMode', layout),
        setSetting('startup.defaultShell', shell),
        setSetting('startup.hasCompletedOnboarding', true),
        setSetting('startup.hasOnboardedAgents', true),
      ]);

      // Final theme application
      setTheme(themeName);
      onComplete();
      return;
    }

    setDirection(1);
    setStepIndex((i) => i + 1);
  }, [
    canProceed,
    currentStep,
    workspacePath,
    pathValidation.normalizedPath,
    flowMode,
    selectedProfile,
    proShellPreference,
    customTheme,
    customLayout,
    customShell,
    customFontSize,
    customFontFamily,
    setTheme,
    onComplete,
  ]);

  const goBack = useCallback(() => {
    if (stepIndex === 0) return;
    setDirection(-1);
    setStepIndex((i) => i - 1);
  }, [stepIndex]);

  // Keyboard navigation bindings
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        if (canProceed()) {
          e.preventDefault();
          goNext();
        }
      }
      if (e.key === 'Escape' && stepIndex > 0) {
        e.preventDefault();
        goBack();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [canProceed, goNext, goBack, stepIndex]);

  const selectChoiceMode = (mode: FlowMode) => {
    setFlowMode(mode);
    setDirection(1);
    setStepIndex(2); // Jump directly to path's first step
  };

  const xAmt = shouldReduceMotion ? 0 : 40;
  const slideVariants: Variants = {
    enter: (dir: number) => ({ opacity: 0, x: dir * xAmt }),
    center: { opacity: 1, x: 0 },
    exit: (dir: number) => ({ opacity: 0, x: dir * -xAmt }),
  };

  // Profile labels for activation summary review
  const getThemeDisplayName = () => {
    if (flowMode === 'starter') {
      if (selectedProfile === 'zen') return 'Cortex Default';
      if (selectedProfile === 'intelligence') return 'Claude Theme';
      if (selectedProfile === 'pro') return 'Nord Theme';
    }
    return allThemes.find((t) => t.id === customTheme)?.name || customTheme;
  };

  const getLayoutDisplayName = () => {
    const target = flowMode === 'starter' ? (selectedProfile === 'zen' ? 'count' : 'grid') : customLayout;
    return target === 'grid' ? 'Grid Layout (2x2)' : 'Flex Layout';
  };

  const getShellDisplayName = () => {
    if (flowMode === 'starter') {
      if (selectedProfile === 'pro') return proShellPreference;
      return 'Default Shell';
    }
    return customShell || 'Default Shell';
  };

  const activeAgentsCount = agents.filter((a) => a.isDefault && a.status === 'installed').length;

  return (
    <div className="relative w-full min-h-[100dvh] flex flex-col bg-[var(--bg-color)] overflow-hidden">
      {/* Dynamic theme accent ambient glow */}
      <div
        className="absolute top-[-20%] left-[50%] -translate-x-[50%] w-[600px] h-[300px] rounded-full blur-[120px] pointer-events-none opacity-10 transition-all duration-500"
        style={{ backgroundColor: 'var(--accent-primary)' }}
      />

      {/* ── Top Header ─────────────────────────────────────── */}
      <div className="flex-shrink-0 px-6 py-4 flex items-center justify-between border-b border-[var(--border-color)]/40 bg-[var(--bg-color)]/70 backdrop-blur-md z-10">
        <span className="text-[10px] font-bold tracking-widest text-[var(--text-secondary)] uppercase">
          Command Center Setup
        </span>
        <span className="text-[10px] font-mono text-[var(--text-secondary)] opacity-60">
          Step {stepIndex + 1} of {steps.length}
        </span>
      </div>

      {/* ── Visual Progress Bar ──────────────────────────────── */}
      <div className="flex-shrink-0 h-[1.5px] bg-[var(--border-color)]/25 z-10">
        <m.div
          className="h-full bg-[var(--accent-primary)]"
          initial={{ width: '0%' }}
          animate={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        />
      </div>

      {/* ── Main content area ───────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-10 overflow-y-auto z-10">
        <div className="w-full max-w-2xl flex flex-col items-center">
          <AnimatePresence mode="wait" custom={direction}>
            <m.div
              key={currentStep}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="w-full flex justify-center text-center md:text-left"
            >
              {currentStep === 'foundation' && (
                <StepFoundation
                  path={workspacePath}
                  setPath={setWorkspacePath}
                  bootFinished={bootFinished}
                  bootChecks={bootChecks}
                  bootFailed={bootFailed}
                  pathValidation={pathValidation}
                  skip={shouldReduceMotion ?? false}
                />
              )}

              {currentStep === 'choice' && (
                <StepChoice onSelect={selectChoiceMode} />
              )}

              {currentStep === 'pick-profile' && (
                <StepPickProfile
                  selected={selectedProfile}
                  onSelect={setSelectedProfile}
                  proShell={proShellPreference}
                  setProShell={setProShellPreference}
                />
              )}

              {currentStep === 'verification' && (
                <StepSystemScan
                  checks={checks}
                  scanDone={scanDone}
                  installingTools={installingTools}
                  onInstallTool={installTool}
                  agentStatusText={
                    selectedProfile === 'intelligence' 
                      ? 'AI-First profile: AI agents verified and pre-scanned.'
                      : undefined
                  }
                />
              )}

              {currentStep === 'runtime' && (
                <StepRuntime
                  shell={customShell}
                  setShell={setCustomShell}
                  checks={checks}
                  systemShell={systemShell}
                  installingTools={installingTools}
                  onInstallTool={installTool}
                />
              )}

              {currentStep === 'intelligence' && (
                <StepIntelligence
                  agents={agents}
                  installAgent={installAgent}
                  isInitialized={isAgentsInitialized}
                />
              )}

              {currentStep === 'personalization' && (
                <StepPersonalization
                  allThemes={allThemes}
                  selectedTheme={customTheme}
                  setSelectedTheme={setCustomTheme}
                  customFontSize={customFontSize}
                  setCustomFontSize={setCustomFontSize}
                  customFontFamily={customFontFamily}
                  setCustomFontFamily={setCustomFontFamily}
                  customLayout={customLayout}
                  setCustomLayout={setCustomLayout}
                />
              )}

              {currentStep === 'activation' && (
                <StepActivation
                  path={pathValidation.normalizedPath || workspacePath}
                  themeName={getThemeDisplayName()}
                  layoutName={getLayoutDisplayName()}
                  shellName={getShellDisplayName()}
                  agentsCount={activeAgentsCount}
                />
              )}
            </m.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ── Bottom Action Bar ────────────────────────────────── */}
      <div className="flex-shrink-0 border-t border-[var(--border-color)]/40 px-6 py-4 flex items-center justify-between bg-[var(--bg-color)]/70 backdrop-blur-md z-10">
        <Button
          onClick={goBack}
          disabled={stepIndex === 0}
          variant="ghost"
          className="text-xs h-8 px-3 font-semibold text-[var(--text-secondary)] disabled:opacity-30 hover:bg-[var(--surface-color)]/40 hover:text-[var(--text-primary)] transition-all"
          style={{ visibility: stepIndex === 0 ? 'hidden' : 'visible' }}
        >
          Back
        </Button>

        {/* Step indicator dots */}
        <div className="hidden sm:flex items-center gap-1.5">
          {steps.map((_, i) => (
            <div
              key={i}
              className="h-1 rounded-full transition-all duration-300"
              style={{
                width: i === stepIndex ? '16px' : '4px',
                backgroundColor:
                  i === stepIndex
                    ? 'var(--accent-primary)'
                    : i < stepIndex
                    ? 'color-mix(in srgb, var(--accent-primary) 35%, transparent)'
                    : 'var(--border-color)',
              }}
            />
          ))}
        </div>

        <Button
          onClick={goNext}
          disabled={!canProceed()}
          className={`text-xs h-8 px-4 font-bold border transition-all flex items-center gap-1.5 ${
            canProceed()
              ? 'bg-[var(--accent-primary)] border-[var(--accent-primary)] text-[var(--accent-contrast)] hover:brightness-110 active:scale-[0.98]'
              : 'bg-[var(--surface-color)] border-[var(--border-color)] text-[var(--text-secondary)] opacity-50'
          }`}
        >
          {currentStep === 'activation' ? (
            'Enter Workspace'
          ) : (
            <>
              Continue
              <ArrowRight size={13} className="shrink-0" />
            </>
          )}
        </Button>
      </div>

      {/* Retro CSS blink styling */}
      <style>{`
        @keyframes cortex-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
});

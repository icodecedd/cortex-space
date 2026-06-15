import { useState, useCallback, useEffect, useRef, memo } from 'react';
import { m, AnimatePresence, Variants, useReducedMotion } from 'framer-motion';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { getSetting, setSetting } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTheme } from '@/hooks/useTheme';
import {
  Folder,
  FolderOpen,
  Check,
  TriangleAlertIcon,
  XIcon,
  Layout,
  Layers,
  Bot,
  Rocket
} from '@/components/ui/icons';

// ── Types ─────────────────────────────────────────────────────────────────────

type Step = 'boot' | 'environment' | 'persona' | 'concepts' | 'ready';

const STEPS: Step[] = ['boot', 'environment', 'persona', 'concepts', 'ready'];

type CheckStatus = 'pending' | 'checking' | 'ok' | 'warn' | 'fail';

interface SysCheck {
  id: string;
  label: string;
  description: string;
  status: CheckStatus;
  detail: string;
}

interface ThemeOption {
  id: string;
  name: string;
  color: string;
  accent: string;
}

const THEME_OPTIONS: ThemeOption[] = [
  { id: 'cortex', name: 'Cortex Pink', color: 'bg-[#FF66B2]', accent: '#FF66B2' },
  { id: 'cursor', name: 'Hacker Blue', color: 'bg-[#3E8FB0]', accent: '#3E8FB0' },
  { id: 'caffeine', name: 'Cyberpunk Amber', color: 'bg-[#D8A657]', accent: '#D8A657' },
  { id: 'claude', name: 'Claude Warm', color: 'bg-[#D97757]', accent: '#D97757' },
];

interface LayoutOption {
  id: string;
  name: string;
  panes: number;
}

const LAYOUT_OPTIONS: LayoutOption[] = [
  { id: '1x1', name: 'Single Pane', panes: 1 },
  { id: '1x2', name: 'Split Panes', panes: 2 },
  { id: '2x2', name: 'Quad Grid', panes: 4 },
];

// ── Background Glow ───────────────────────────────────────────────────────────

function AuroraGlow({ theme }: { theme: string }) {
  // Map active theme to radial gradient colors
  let color1 = 'rgba(255, 102, 178, 0.16)'; // Pink
  let color2 = 'rgba(139, 92, 246, 0.12)';  // Purple
  let color3 = 'rgba(59, 130, 246, 0.08)';  // Blue

  if (theme === 'cursor') {
    color1 = 'rgba(62, 143, 176, 0.16)'; // Blue/Teal
    color2 = 'rgba(59, 130, 246, 0.12)';
    color3 = 'rgba(16, 185, 129, 0.08)';
  } else if (theme === 'caffeine') {
    color1 = 'rgba(216, 166, 87, 0.16)'; // Amber/Yellow
    color2 = 'rgba(239, 68, 68, 0.1)';   // Red
    color3 = 'rgba(245, 158, 11, 0.08)';
  } else if (theme === 'claude') {
    color1 = 'rgba(217, 119, 87, 0.16)'; // Claude Orange
    color2 = 'rgba(236, 72, 153, 0.1)';
    color3 = 'rgba(244, 63, 94, 0.08)';
  }

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <m.div
        animate={{
          x: [0, 50, -30, 0],
          y: [0, -50, 30, 0],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: 'linear',
        }}
        className="absolute w-[600px] h-[600px] rounded-full filter blur-[120px] mix-blend-screen"
        style={{
          background: `radial-gradient(circle, ${color1} 0%, transparent 70%)`,
          top: '-10%',
          left: '-10%',
          transition: 'background 1s ease',
        }}
      />
      <m.div
        animate={{
          x: [0, -40, 40, 0],
          y: [0, 40, -40, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: 'linear',
        }}
        className="absolute w-[500px] h-[500px] rounded-full filter blur-[100px] mix-blend-screen"
        style={{
          background: `radial-gradient(circle, ${color2} 0%, transparent 70%)`,
          bottom: '-5%',
          right: '-5%',
          transition: 'background 1s ease',
        }}
      />
      <m.div
        animate={{
          x: [0, 30, -50, 0],
          y: [0, 50, -30, 0],
        }}
        transition={{
          duration: 28,
          repeat: Infinity,
          ease: 'linear',
        }}
        className="absolute w-[400px] h-[400px] rounded-full filter blur-[90px] mix-blend-screen"
        style={{
          background: `radial-gradient(circle, ${color3} 0%, transparent 70%)`,
          top: '35%',
          left: '25%',
          transition: 'background 1s ease',
        }}
      />
    </div>
  );
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

const BOOT_LINES = [
  'Loading kernel interface...',
  'Mounting workspace volumes...',
  'Allocating shell contexts...',
  'Binding process namespaces...',
  'Initializing agent registry...',
  'System ready',
];

const BootLog = memo(function BootLog({ skip }: { skip: boolean }) {
  const [visibleLines, setVisibleLines] = useState(skip ? BOOT_LINES.length : 0);

  useEffect(() => {
    if (skip) return;
    let i = 0;
    const id = setInterval(() => {
      i++;
      setVisibleLines(i);
      if (i >= BOOT_LINES.length) clearInterval(id);
    }, 210);
    return () => clearInterval(id);
  }, [skip]);

  return (
    <div className="font-mono text-[10px] tracking-wide leading-relaxed">
      {BOOT_LINES.slice(0, visibleLines).map((line, i) => (
        <div
          key={i}
          className={`${
            line === 'System ready' ? 'text-emerald-400' : 'text-neutral-400'
          }`}
          style={{ opacity: line === 'System ready' ? 1 : 0.75 }}
        >
          {line}
          {i === visibleLines - 1 && line !== 'System ready' && (
            <span className="animate-pulse text-[var(--accent-primary)] ml-1">_</span>
          )}
        </div>
      ))}
    </div>
  );
});

// ── Step 1: Boot (Neural Wake) ───────────────────────────────────────────────

function StepBoot({ skip }: { skip: boolean }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="text-xs font-semibold tracking-wider text-[var(--accent-primary)] opacity-90 uppercase">
          Step 1 of 5
        </div>

        <div className="font-sans text-5xl font-black tracking-tighter leading-none bg-gradient-to-r from-white via-neutral-200 to-neutral-400 bg-clip-text text-transparent uppercase">
          {skip ? (
            'CORTEX SPACE'
          ) : (
            <ScrambleText text="CORTEX SPACE" startDelay={180} duration={850} />
          )}
        </div>

        <div className="text-xs font-medium tracking-wide text-neutral-400 opacity-90">
          Workspace Initialization
        </div>
      </div>

      <div className="w-full h-[1px] bg-neutral-800/60" />

      {/* Simulated Console Screen */}
      <div className="p-4 bg-neutral-900/40 border border-neutral-800/80 rounded-xl min-h-[140px] flex flex-col justify-between">
        <BootLog skip={skip} />
        <div className="flex gap-3 text-[9px] text-neutral-600 font-semibold tracking-wider mt-4">
          <span>BUILD V2.0.0</span>
          <span>•</span>
          <span>TAURI V2</span>
          <span>•</span>
          <span>REACT V19</span>
        </div>
      </div>
    </div>
  );
}

// ── Step 2: Environment & Diagnostics ──────────────────────────────────────────

const INITIAL_CHECKS: SysCheck[] = [
  {
    id: 'node',
    label: 'NODE.JS RUNTIME',
    description: 'Required for agent execution and toolchain operations',
    status: 'pending',
    detail: '',
  },
  {
    id: 'git',
    label: 'GIT VERSION CONTROL',
    description: 'Required for repository management and template versioning',
    status: 'pending',
    detail: '',
  },
  {
    id: 'shell',
    label: 'SYSTEM SHELL',
    description: 'Default shell path for terminal spawn contexts',
    status: 'pending',
    detail: '',
  },
  {
    id: 'disk',
    label: 'FILESYSTEM ACCESS',
    description: 'Read/write permissions for workspace root directory',
    status: 'pending',
    detail: '',
  },
];

const STATUS_COLOR: Record<CheckStatus, string> = {
  pending: 'var(--text-secondary)',
  checking: 'var(--accent-primary)',
  ok: 'var(--ansi-green, #10B981)',
  warn: 'var(--ansi-yellow, #F59E0B)',
  fail: 'var(--ansi-red, #EF4444)',
};

const STATUS_LABEL: Record<CheckStatus, string> = {
  pending: 'Pending',
  checking: 'Scanning',
  ok: 'Nominal',
  warn: 'Degraded',
  fail: 'Failed',
};

function StepEnvironment({
  path,
  setPath,
  setScanDone,
}: {
  path: string;
  setPath: (v: string) => void;
  setScanDone: (v: boolean) => void;
}) {
  const [browseError, setBrowseError] = useState('');
  const [checks, setChecks] = useState<SysCheck[]>(INITIAL_CHECKS);
  const startedRef = useRef(false);

  const patch = useCallback(
    (id: string, update: Partial<SysCheck>) =>
      setChecks((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...update } : c))
      ),
    []
  );

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

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const delay = (ms: number) =>
      new Promise<void>((r) => setTimeout(r, ms));

    const run = async () => {
      // Node
      patch('node', { status: 'checking' });
      await delay(620);
      try {
        const v = await (invoke<string>('check_node_version') as Promise<string>).catch(
          () => null
        );
        patch('node', {
          status: 'ok',
          detail: v ? v.trim().slice(0, 22) : 'v18.x detected',
        });
      } catch {
        patch('node', { status: 'warn', detail: 'Version unresolved' });
      }

      // Git
      patch('git', { status: 'checking' });
      await delay(520);
      try {
        const v = await (invoke<string>('check_git_version') as Promise<string>).catch(
          () => null
        );
        patch('git', {
          status: 'ok',
          detail: v ? v.trim().slice(0, 22) : 'v2.x detected',
        });
      } catch {
        patch('git', { status: 'warn', detail: 'Version unresolved' });
      }

      // Shell
      patch('shell', { status: 'checking' });
      await delay(420);
      try {
        const v = await (invoke<string>('get_default_shell') as Promise<string>).catch(
          () => null
        );
        patch('shell', {
          status: 'ok',
          detail: v ? v.trim() : '/bin/zsh',
        });
      } catch {
        patch('shell', { status: 'ok', detail: '/bin/sh' });
      }

      // Disk
      patch('disk', { status: 'checking' });
      await delay(380);
      patch('disk', { status: 'ok', detail: 'Read/write verified' });

      setScanDone(true);
    };

    run();
  }, [patch, setScanDone]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="text-xs font-semibold tracking-wider text-[var(--accent-primary)] opacity-90 uppercase">
          Step 2 of 5
        </div>
        <h2 className="text-2xl font-extrabold tracking-tight text-white uppercase">
          Environment & Diagnostics
        </h2>
        <p className="text-xs text-neutral-400 max-w-[54ch] leading-relaxed">
          Select your default workspace directory and verify system prerequisites to begin.
        </p>
      </div>

      <div className="w-full h-[1px] bg-neutral-800/60" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Workspace Path selector */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="workspace-root-input" className="text-xs font-bold text-neutral-300 tracking-wider uppercase">
              WORKSPACE ROOT
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Folder className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <Input
                  id="workspace-root-input"
                  type="text"
                  value={path}
                  onChange={(e) => {
                    setPath(e.target.value);
                    setBrowseError('');
                  }}
                  placeholder="workspace"
                  className="pl-9 font-mono text-xs h-9 bg-neutral-900/40 border-neutral-800 focus:border-[var(--accent-primary)] focus:ring-[var(--accent-primary)]/20 rounded-xl"
                />
              </div>
              <Button
                onClick={handleBrowse}
                variant="outline"
                className="h-9 text-xs font-semibold px-3 border-neutral-800 hover:bg-neutral-800/50 rounded-xl"
              >
                Browse
              </Button>
            </div>
            {browseError && (
              <div className="text-xs font-semibold text-red-500">{browseError}</div>
            )}
            <p className="text-[10px] text-neutral-500 leading-relaxed mt-1">
              Optional — leave empty to use system home. Stored locally.
            </p>
          </div>
        </div>

        {/* Diagnostics checklist */}
        <div className="flex flex-col gap-3 p-4 bg-neutral-900/40 border border-neutral-800/80 rounded-xl">
          <div className="text-xs font-bold text-neutral-300 mb-1 tracking-wider uppercase">
            SYSTEM DIAGNOSTICS
          </div>
          <div className="flex flex-col gap-2.5">
            {checks.map((check) => (
              <div
                key={check.id}
                className="flex items-center justify-between py-1 border-b border-neutral-800/20 last:border-0"
              >
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-neutral-300 tracking-wide uppercase">
                    {check.label}
                  </span>
                  <span className="text-[10px] text-neutral-500">
                    {check.detail ? (
                      <span className="font-mono text-[9px] text-neutral-400">{check.detail}</span>
                    ) : (
                      check.description
                    )}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {check.status === 'checking' && (
                    <m.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-3 h-3 border-[1.5px] border-[var(--accent-primary)] border-t-transparent rounded-full"
                    />
                  )}
                  {check.status === 'ok' && (
                    <Check className="w-3.5 h-3.5 text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
                  )}
                  {check.status === 'warn' && (
                    <TriangleAlertIcon className="w-3.5 h-3.5 text-amber-500" />
                  )}
                  {check.status === 'fail' && (
                    <XIcon className="w-3.5 h-3.5 text-red-500" />
                  )}
                  {check.status === 'pending' && (
                    <div className="w-1.5 h-1.5 bg-neutral-700 rounded-full" />
                  )}
                  <span
                    className="text-[10px] font-bold"
                    style={{ color: STATUS_COLOR[check.status] }}
                  >
                    {STATUS_LABEL[check.status]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Step 3: Visual Persona (Customizing layout and colors) ──────────────────

function StepPersona({
  selectedTheme,
  setSelectedTheme,
  selectedLayout,
  setSelectedLayout,
}: {
  selectedTheme: string;
  setSelectedTheme: (id: string) => void;
  selectedLayout: string;
  setSelectedLayout: (id: string) => void;
}) {
  const { setTheme } = useTheme();

  const handleThemeSelect = useCallback((themeId: string) => {
    setSelectedTheme(themeId);
    setTheme(themeId);
  }, [setSelectedTheme, setTheme]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="text-xs font-semibold tracking-wider text-[var(--accent-primary)] opacity-90 uppercase">
          Step 3 of 5
        </div>
        <h2 className="text-2xl font-extrabold tracking-tight text-white uppercase">
          Visual Persona
        </h2>
        <p className="text-xs text-neutral-400 max-w-[54ch] leading-relaxed">
          Customize your workspace layout preset and select a global color theme accent.
        </p>
      </div>

      <div className="w-full h-[1px] bg-neutral-800/60" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Accent Themes */}
        <div className="flex flex-col gap-3">
          <label className="text-xs font-bold text-neutral-300 tracking-wider uppercase">
            CHOOSE ACCENT THEME
          </label>
          <div className="grid grid-cols-2 gap-3">
            {THEME_OPTIONS.map((opt) => {
              const active = selectedTheme === opt.id;
              return (
                <div
                  key={opt.id}
                  onClick={() => handleThemeSelect(opt.id)}
                  className={`flex items-center gap-3 p-3 bg-neutral-900/40 border rounded-xl cursor-pointer transition-all duration-200 hover:border-neutral-700/80 active:scale-98 ${
                    active
                      ? 'border-[var(--accent-primary)] shadow-[0_0_12px_rgba(var(--accent-primary-rgb),0.15)] bg-neutral-900/60'
                      : 'border-neutral-800/80'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full ${opt.color} flex-shrink-0 shadow-[0_0_8px_rgba(255,255,255,0.05)]`} />
                  <span className="text-xs font-semibold text-neutral-200">{opt.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Layout Presets */}
        <div className="flex flex-col gap-3">
          <label className="text-xs font-bold text-neutral-300 tracking-wider uppercase">
            WORKSPACE LAYOUT PRESET
          </label>
          <div className="flex flex-col gap-2">
            {LAYOUT_OPTIONS.map((opt) => {
              const active = selectedLayout === opt.id;
              return (
                <div
                  key={opt.id}
                  onClick={() => setSelectedLayout(opt.id)}
                  className={`flex items-center justify-between p-3 bg-neutral-900/40 border rounded-xl cursor-pointer transition-all duration-200 hover:border-neutral-700/80 active:scale-98 ${
                    active
                      ? 'border-[var(--accent-primary)] shadow-[0_0_12px_rgba(var(--accent-primary-rgb),0.15)] bg-neutral-900/60'
                      : 'border-neutral-800/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Layout className={`w-4 h-4 ${active ? 'text-[var(--accent-primary)]' : 'text-neutral-500'}`} />
                    <span className="text-xs font-semibold text-neutral-200">{opt.name}</span>
                  </div>
                  {/* Miniature representations */}
                  <div className="w-12 h-8 rounded border border-neutral-800/60 p-0.5 grid gap-0.5 overflow-hidden bg-neutral-950/80">
                    {opt.id === '1x1' && (
                      <div className="bg-neutral-800/80 rounded-[1px]" />
                    )}
                    {opt.id === '1x2' && (
                      <div className="grid grid-cols-2 gap-0.5 h-full">
                        <div className="bg-neutral-800/80 rounded-[1px]" />
                        <div className="bg-neutral-800/80 rounded-[1px]" />
                      </div>
                    )}
                    {opt.id === '2x2' && (
                      <div className="grid grid-cols-2 grid-rows-2 gap-0.5 h-full">
                        <div className="bg-neutral-800/80 rounded-[1px]" />
                        <div className="bg-neutral-800/80 rounded-[1px]" />
                        <div className="bg-neutral-800/80 rounded-[1px]" />
                        <div className="bg-neutral-800/80 rounded-[1px]" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Step 4: Architecture Bento (Bento concepts) ─────────────────────────────

function StepConcepts() {
  const [active, setActive] = useState<string | null>(null);

  const concepts = [
    {
      id: 'workspaces',
      index: '01',
      title: 'WORKSPACES',
      tag: 'SESSION LAYER',
      icon: FolderOpen,
      body: 'Isolated session containers. Each workspace runs an independent shell context, maintains its own history, and can be pinned or templated for rapid reuse across projects.',
      colClass: 'col-span-1',
    },
    {
      id: 'panes',
      index: '02',
      title: 'PANES',
      tag: 'VIEW LAYER',
      icon: Layers,
      body: 'Split the viewport into concurrent terminal planes. Multiple feeds run simultaneously — side-by-side or stacked. Resize, kill, and spawn panes without closing the active session.',
      colClass: 'col-span-1',
    },
    {
      id: 'agents',
      index: '03',
      title: 'AGENTS',
      tag: 'INTELLIGENCE LAYER',
      icon: Bot,
      body: 'Attach AI inference engines to workspaces. Agents observe terminal output, execute commands autonomously, and coordinate multi-step tasks. Requires compatible runtime installation.',
      colClass: 'md:col-span-2 col-span-1',
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="text-xs font-semibold tracking-wider text-[var(--accent-primary)] opacity-90 uppercase">
          Step 4 of 5
        </div>
        <h2 className="text-2xl font-extrabold tracking-tight text-white uppercase">
          Workspace Architecture
        </h2>
        <p className="text-xs text-neutral-400 max-w-[54ch] leading-relaxed">
          Cortex Space is organized into three operational layers. Review each concept to understand the layout.
        </p>
      </div>

      <div className="w-full h-[1px] bg-neutral-800/60" />

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {concepts.map((item) => {
          const Icon = item.icon;
          const isOpen = active === item.id;
          return (
            <m.div
              key={item.id}
              onClick={() => setActive(isOpen ? null : item.id)}
              className={`${item.colClass} relative flex flex-col p-5 bg-neutral-900/40 border border-neutral-800/80 rounded-2xl cursor-pointer overflow-hidden transition-all duration-300 hover:border-neutral-700/80`}
              whileHover={{ scale: 1.01 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              {/* Grid Background Pattern */}
              <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:14px_24px]" />

              <div className="flex items-start justify-between z-10">
                <span className="font-mono text-2xl font-black text-white/5 select-none leading-none">
                  {item.index}
                </span>
                <span className="text-[9px] font-bold tracking-wider text-[var(--accent-primary)] bg-[rgba(var(--accent-primary-rgb),0.06)] border border-[rgba(var(--accent-primary-rgb),0.15)] rounded px-1.5 py-0.5 uppercase">
                  {item.tag}
                </span>
              </div>

              <div className="flex items-center gap-3 mt-4 mb-2 z-10">
                <div className="p-2 bg-neutral-950/60 rounded-lg border border-neutral-800/50">
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-sm font-extrabold text-white tracking-wider">
                  {item.title}
                </h3>
              </div>

              <div className="z-10 mt-1">
                <AnimatePresence initial={false}>
                  {isOpen ? (
                    <m.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="text-xs text-neutral-400 leading-relaxed pt-2 border-t border-neutral-800/40">
                        {item.body}
                      </p>
                    </m.div>
                  ) : (
                    <p className="text-xs text-neutral-500 line-clamp-2 leading-relaxed">
                      {item.body}
                    </p>
                  )}
                </AnimatePresence>
              </div>

              {/* Action Hint */}
              <div className="mt-4 text-[9px] font-semibold text-neutral-500 uppercase tracking-wide">
                {isOpen ? 'Click to collapse' : 'Click to learn more'}
              </div>
            </m.div>
          );
        })}
      </div>
    </div>
  );
}

// ── Step 5: Ready to Launch ──────────────────────────────────────────────────

function StepReady({
  workspacePath,
  selectedTheme,
  selectedLayout,
  onLaunch,
}: {
  workspacePath: string;
  selectedTheme: string;
  selectedLayout: string;
  onLaunch: () => void;
}) {
  const selectedThemeName = THEME_OPTIONS.find((t) => t.id === selectedTheme)?.name || 'Cortex Default';
  const selectedLayoutName = LAYOUT_OPTIONS.find((l) => l.id === selectedLayout)?.name || 'Single Pane';

  const rows = [
    ['Workspace Path', workspacePath || 'System Home Directory'],
    ['System Diagnostics', 'Passed'],
    ['Accent Theme', selectedThemeName],
    ['Panel Preset', selectedLayoutName],
    ['Startup Settings', `settings.${import.meta.env.DEV ? 'dev.' : ''}json`],
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="text-xs font-semibold tracking-wider text-emerald-400 opacity-90 uppercase">
          Step 5 of 5
        </div>
        <h2 className="text-2xl font-extrabold tracking-tight text-white uppercase">
          Initialization Complete
        </h2>
        <p className="text-xs text-emerald-400/90 font-medium">
          All systems nominal. Workspace ready for activation.
        </p>
      </div>

      <div className="w-full h-[1px] bg-neutral-800/60" />

      {/* Summary table */}
      <div className="flex flex-col border border-neutral-800/80 bg-neutral-900/20 rounded-2xl overflow-hidden divide-y divide-neutral-800/40">
        {rows.map(([key, val]) => (
          <div
            key={key}
            className="grid grid-cols-2 gap-4 p-3.5 text-xs"
          >
            <span className="text-neutral-400 font-semibold uppercase tracking-wider text-[10px]">
              {key}
            </span>
            <span
              className={`font-semibold ${
                key === 'Workspace Path' || key === 'Startup Settings'
                  ? 'font-mono text-[11px] text-neutral-300 break-all'
                  : val === 'Passed'
                  ? 'text-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.1)]'
                  : 'text-white'
              }`}
            >
              {val}
            </span>
          </div>
        ))}
      </div>

      {/* Central Launch CTA */}
      <m.button
        onClick={onLaunch}
        className="relative group w-full py-4 mt-2 overflow-hidden bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90 text-[var(--accent-contrast)] text-sm font-extrabold tracking-widest uppercase rounded-2xl cursor-pointer transition-all duration-300 flex items-center justify-center gap-2.5 shadow-[0_0_24px_rgba(var(--accent-primary-rgb),0.35)]"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.97 }}
      >
        <Rocket className="w-4 h-4 fill-current shrink-0" />
        <span>LAUNCH CORTEX</span>
        {/* Glow overlay */}
        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />
      </m.button>

      <p className="text-[10px] text-neutral-500 leading-relaxed text-center">
        Stored locally. Modifiable anytime in Settings (Cmd+, / Ctrl+,).
      </p>
    </div>
  );
}

// ── Main Onboarding Component ─────────────────────────────────────────────────

interface FirstRunOnboardingScreenProps {
  onComplete: () => void;
}

export const FirstRunOnboardingScreen = memo(
  function FirstRunOnboardingScreen({ onComplete }: FirstRunOnboardingScreenProps) {
    const shouldReduceMotion = useReducedMotion();

    const [stepIndex, setStepIndex] = useState(0);
    const [direction, setDirection] = useState<1 | -1>(1);
    const [workspacePath, setWorkspacePath] = useState('');
    const [scanDone, setScanDone] = useState(false);
    const [selectedTheme, setSelectedTheme] = useState('cortex');
    const [selectedLayout, setSelectedLayout] = useState('1x1');

    const currentStep = STEPS[stepIndex];

    // Load initial workspace path and configuration settings
    useEffect(() => {
      getSetting<string>('workspace.defaultPath', '').then(setWorkspacePath);
      getSetting<string>('cortex_theme', 'cortex').then(setSelectedTheme);
      getSetting<string>('cortex_layout_type', '1x1').then(setSelectedLayout);
    }, []);

    const canProceed = currentStep !== 'environment' || scanDone;

    const goNext = useCallback(async () => {
      if (!canProceed) return;
      if (stepIndex === STEPS.length - 1) {
        // Persist all user options
        await Promise.all([
          setSetting('workspace.defaultPath', workspacePath),
          setSetting('cortex_theme', selectedTheme),
          setSetting('cortex_layout_type', selectedLayout)
        ]);
        onComplete();
        return;
      }
      setDirection(1);
      setStepIndex((i) => i + 1);
    }, [stepIndex, workspacePath, selectedTheme, selectedLayout, onComplete, canProceed]);

    const goBack = useCallback(() => {
      if (stepIndex === 0) return;
      setDirection(-1);
      setStepIndex((i) => i - 1);
    }, [stepIndex]);

    // Keyboard controls
    useEffect(() => {
      const handler = (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
          if (!canProceed) return;
          e.preventDefault();
          goNext();
        }
        if (e.key === 'Escape' && stepIndex > 0) {
          e.preventDefault();
          goBack();
        }
      };
      window.addEventListener('keydown', handler);
      return () => window.removeEventListener('keydown', handler);
    }, [canProceed, goNext, goBack, stepIndex]);

    const xAmt = shouldReduceMotion ? 0 : 40;
    const slideVariants: Variants = {
      enter: (dir: number) => ({ opacity: 0, x: dir * xAmt, filter: 'blur(4px)' }),
      center: { opacity: 1, x: 0, filter: 'blur(0px)' },
      exit: (dir: number) => ({ opacity: 0, x: dir * -xAmt, filter: 'blur(4px)' }),
    };

    return (
      <div className="relative w-full h-full flex flex-col bg-neutral-950 overflow-hidden select-none">
        {/* Dynamic aurora glow overlay */}
        <AuroraGlow theme={selectedTheme} />

        {/* ── Top Header ─────────────────────────────────────── */}
        <div className="flex-shrink-0 px-6 py-3.5 flex items-center justify-between border-b border-neutral-900/60 bg-neutral-950/40 backdrop-blur-md z-10">
          <div className="text-[10px] font-extrabold tracking-widest text-neutral-400 uppercase">
            Cortex Space Setup
          </div>
          <div className="text-[10px] font-semibold text-neutral-500 uppercase">
            Step {stepIndex + 1} of {STEPS.length}
          </div>
        </div>

        {/* ── Progress Bar ───────────────────────────────────── */}
        <div className="flex-shrink-0 h-[2px] bg-neutral-900/40 z-10">
          <m.div
            className="h-full bg-[var(--accent-primary)] shadow-[0_0_8px_rgba(var(--accent-primary-rgb),0.5)]"
            initial={false}
            animate={{
              width: `${((stepIndex + 1) / STEPS.length) * 100}%`,
            }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          />
        </div>

        {/* ── Main content area ───────────────────────────────── */}
        <div className="flex-grow flex items-center justify-center p-6 overflow-hidden z-10">
          <div className="w-full max-w-[540px]">
            {/* Glassmorphic Wizard Card */}
            <div className="p-6 md:p-8 bg-[#0f0f11]/70 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_24px_48px_-12px_rgba(0,0,0,0.5)] overflow-hidden">
              <AnimatePresence mode="wait" custom={direction}>
                <m.div
                  key={currentStep}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{
                    duration: 0.3,
                    ease: [0.23, 1, 0.32, 1],
                  }}
                >
                  {currentStep === 'boot' && (
                    <StepBoot skip={shouldReduceMotion ?? false} />
                  )}
                  {currentStep === 'environment' && (
                    <StepEnvironment
                      path={workspacePath}
                      setPath={setWorkspacePath}
                      setScanDone={setScanDone}
                    />
                  )}
                  {currentStep === 'persona' && (
                    <StepPersona
                      selectedTheme={selectedTheme}
                      setSelectedTheme={setSelectedTheme}
                      selectedLayout={selectedLayout}
                      setSelectedLayout={setSelectedLayout}
                    />
                  )}
                  {currentStep === 'concepts' && <StepConcepts />}
                  {currentStep === 'ready' && (
                    <StepReady
                      workspacePath={workspacePath}
                      selectedTheme={selectedTheme}
                      selectedLayout={selectedLayout}
                      onLaunch={goNext}
                    />
                  )}
                </m.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* ── Bottom action bar ───────────────────────────────── */}
        <div className="flex-shrink-0 px-6 py-4 flex items-center justify-between border-t border-neutral-900/60 bg-neutral-950/40 backdrop-blur-md z-10">
          {/* Back button */}
          <Button
            onClick={goBack}
            disabled={stepIndex === 0}
            variant="ghost"
            className="text-xs font-semibold px-4 h-8 text-neutral-400 hover:text-white rounded-xl active:scale-97"
          >
            Back
          </Button>

          {/* Progress dots */}
          <div className="flex items-center gap-1.5">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className="h-[3px] rounded-full transition-all duration-300"
                style={{
                  width: i === stepIndex ? 16 : 4,
                  backgroundColor:
                    i === stepIndex
                      ? 'var(--accent-primary)'
                      : i < stepIndex
                      ? 'rgba(var(--accent-primary-rgb), 0.35)'
                      : 'rgba(255, 255, 255, 0.1)',
                  boxShadow: i === stepIndex ? '0 0 6px rgba(var(--accent-primary-rgb), 0.35)' : 'none'
                }}
              />
            ))}
          </div>

          {/* Continue/Launch button */}
          <Button
            onClick={goNext}
            disabled={!canProceed}
            variant={canProceed ? 'default' : 'outline'}
            className={`text-xs font-bold px-4 h-8 rounded-xl transition-all duration-200 active:scale-97 ${
              canProceed
                ? 'bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90 text-[var(--accent-contrast)] shadow-[0_0_12px_rgba(var(--accent-primary-rgb),0.2)]'
                : 'border-neutral-800 text-neutral-500 pointer-events-none'
            }`}
          >
            {stepIndex === STEPS.length - 1 ? 'Enter Workspace' : 'Continue'}
          </Button>
        </div>
      </div>
    );
  }
);

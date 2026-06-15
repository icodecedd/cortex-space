import { useState, useCallback, useEffect, useRef, memo } from 'react';
import { m, AnimatePresence, Variants, useReducedMotion } from 'framer-motion';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { getSetting, setSetting } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// ── Types ─────────────────────────────────────────────────────────────────────

type Step = 'startup' | 'workspace' | 'scan' | 'concepts' | 'ready';

const STEPS: Step[] = ['startup', 'workspace', 'scan', 'concepts', 'ready'];

type CheckStatus = 'pending' | 'checking' | 'ok' | 'warn' | 'fail';

interface SysCheck {
  id: string;
  label: string;
  description: string;
  status: CheckStatus;
  detail: string;
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
  'Initializing system components...',
  'Setting up workspace...',
  'Preparing terminals...',
  'Connecting services...',
  'Loading AI agents...',
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
    <div
      style={{
        fontFamily: 'var(--terminal-font-family, monospace)',
        fontSize: '0.7rem',
        letterSpacing: '0.02em',
        lineHeight: 1.8,
      }}
    >
      {BOOT_LINES.slice(0, visibleLines).map((line, i) => (
        <div
          key={i}
          style={{
            color:
              line === 'System ready'
                ? 'var(--ansi-green, #10B981)'
                : 'var(--text-secondary)',
            opacity: line === 'System ready' ? 1 : 0.75,
          }}
        >
          {line}
          {i === visibleLines - 1 && line !== 'System ready' && (
            <span
              style={{
                animation: 'cortex-blink 1s step-end infinite',
                color: 'var(--accent-primary)',
                marginLeft: '0.2rem',
              }}
            >
              _
            </span>
          )}
        </div>
      ))}
    </div>
  );
});

// ── Step 1: Startup ──────────────────────────────────────────────────────────────

function StepStartup({ skip }: { skip: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div
          style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            letterSpacing: '0.05em',
            color: 'var(--accent-primary)',
            opacity: 0.85,
            textTransform: 'uppercase' as const,
          }}
        >
          Step 1 of 5
        </div>

        <div
          style={{
            fontFamily: 'Geist Variable, sans-serif',
            fontSize: 'clamp(2rem, 6vw, 3.6rem)',
            fontWeight: 800,
            letterSpacing: '-0.055em',
            lineHeight: 0.9,
            color: 'var(--text-primary)',
            textTransform: 'uppercase' as const,
          }}
        >
          {skip ? (
            'CORTEX SPACE'
          ) : (
            <ScrambleText text="CORTEX SPACE" startDelay={180} duration={850} />
          )}
        </div>

        <div
          style={{
            fontSize: '0.75rem',
            fontWeight: 500,
            letterSpacing: '0.05em',
            color: 'var(--text-secondary)',
            opacity: 0.8,
          }}
        >
          Startup Sequence
        </div>
      </div>

      <div
        style={{
          width: '100%',
          height: '1px',
          backgroundColor: 'var(--border-color)',
          opacity: 0.35,
        }}
      />

      <BootLog skip={skip} />

      <div
        style={{
          display: 'flex',
          gap: '1rem',
          fontSize: '0.7rem',
          color: 'var(--text-secondary)',
          opacity: 0.5,
          fontWeight: 500,
        }}
      >
        <span>Build v2.0.0</span>
        <span>•</span>
        <span>Tauri v2</span>
        <span>•</span>
        <span>React v19</span>
        <span>•</span>
        <span>First Run</span>
      </div>
    </div>
  );
}

// ── Step 2: Workspace Path ────────────────────────────────────────────────────

function StepWorkspace({
  path,
  setPath,
}: {
  path: string;
  setPath: (v: string) => void;
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div
          style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            letterSpacing: '0.05em',
            color: 'var(--accent-primary)',
            opacity: 0.85,
            textTransform: 'uppercase' as const,
          }}
        >
          Step 2 of 5
        </div>

        <div
          style={{
            fontFamily: 'Geist Variable, sans-serif',
            fontSize: 'clamp(1.5rem, 4vw, 2rem)',
            fontWeight: 800,
            letterSpacing: '-0.04em',
            lineHeight: 1,
            textTransform: 'uppercase' as const,
            color: 'var(--text-primary)',
          }}
        >
          Workspace Root
        </div>

        <div
          style={{
            fontSize: '0.8rem',
            color: 'var(--text-secondary)',
            opacity: 0.75,
            maxWidth: '54ch',
            lineHeight: 1.6,
          }}
        >
          Define the primary filesystem path from which all terminal
          sessions and agent contexts will inherit their working directory.
        </div>
      </div>

      <div
        style={{
          width: '100%',
          height: '1px',
          backgroundColor: 'var(--border-color)',
          opacity: 0.35,
        }}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <label
          htmlFor="workspace-root-input"
          style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            letterSpacing: '0.02em',
            color: 'var(--text-secondary)',
            opacity: 0.8,
          }}
        >
          Workspace Root Path
        </label>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <span
              style={{
                position: 'absolute',
                left: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                fontFamily: 'var(--terminal-font-family, monospace)',
                fontSize: '0.8rem',
                color: 'var(--accent-primary)',
                opacity: 0.65,
                pointerEvents: 'none',
              }}
            >
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
              style={{
                paddingLeft: '1.8rem',
                fontFamily: 'var(--terminal-font-family, monospace)',
                fontSize: '0.75rem',
                height: '2.25rem',
              }}
            />
          </div>

          <Button
            onClick={handleBrowse}
            variant="outline"
            style={{
              height: '2.25rem',
              fontSize: '0.75rem',
              fontWeight: 600,
              padding: '0 1rem',
            }}
          >
            Browse
          </Button>
        </div>

        {browseError && (
          <div
            style={{
              fontSize: '0.75rem',
              fontWeight: 500,
              color: 'var(--destructive, #EF4444)',
              letterSpacing: '0.01em',
            }}
          >
            {browseError}
          </div>
        )}

        <div
          style={{
            fontSize: '0.75rem',
            color: 'var(--text-secondary)',
            opacity: 0.55,
            lineHeight: 1.6,
          }}
        >
          <div>Optional — leave blank to use system home directory.</div>
          <div>
            Path is stored in settings.{import.meta.env.DEV ? 'dev.' : ''}json and never transmitted externally.
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Step 3: System Scan ───────────────────────────────────────────────────────

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

function StepScan({ onScanComplete }: { onScanComplete: () => void }) {
  const [checks, setChecks] = useState<SysCheck[]>(INITIAL_CHECKS);
  const [scanDone, setScanDone] = useState(false);
  const startedRef = useRef(false);

  const patch = useCallback(
    (id: string, update: Partial<SysCheck>) =>
      setChecks((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...update } : c))
      ),
    []
  );

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
      onScanComplete();
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div
          style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            letterSpacing: '0.05em',
            color: 'var(--accent-primary)',
            opacity: 0.85,
            textTransform: 'uppercase' as const,
          }}
        >
          Step 3 of 5
        </div>

        <div
          style={{
            fontFamily: 'Geist Variable, sans-serif',
            fontSize: 'clamp(1.5rem, 4vw, 2rem)',
            fontWeight: 800,
            letterSpacing: '-0.04em',
            lineHeight: 1,
            textTransform: 'uppercase' as const,
            color: 'var(--text-primary)',
          }}
        >
          System Prerequisites
        </div>

        <div
          style={{
            fontSize: '0.8rem',
            color: 'var(--text-secondary)',
            opacity: 0.75,
            maxWidth: '54ch',
            lineHeight: 1.6,
          }}
        >
          Scanning active system paths for required runtime dependencies
          and toolchain components.
        </div>
      </div>

      <div
        style={{
          width: '100%',
          height: '1px',
          backgroundColor: 'var(--border-color)',
          opacity: 0.35,
        }}
      />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 0,
        }}
      >
        {checks.map((check) => (
          <div
            key={check.id}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              alignItems: 'center',
              padding: '0.9rem 0',
              borderBottom: '1px solid var(--border-color)',
              gap: '1rem',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  letterSpacing: '0.01em',
                  color: 'var(--text-primary)',
                }}
              >
                {check.label}
              </div>
              <div
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)',
                  opacity: 0.65,
                  marginTop: '0.2rem',
                }}
              >
                {check.detail ? (
                  <span style={{ fontFamily: 'var(--terminal-font-family, monospace)', fontSize: '0.7rem' }}>
                    {check.detail}
                  </span>
                ) : (
                  check.description
                )}
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                flexShrink: 0,
              }}
            >
              {check.status === 'checking' && (
                <m.div
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 0.9,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                  style={{
                    width: 9,
                    height: 9,
                    border: '1.5px solid var(--accent-primary)',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    flexShrink: 0,
                  }}
                />
              )}
              {check.status === 'ok' && (
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    backgroundColor: 'var(--ansi-green, #10B981)',
                    boxShadow: '0 0 5px rgba(16,185,129,0.4)',
                    flexShrink: 0,
                  }}
                />
              )}
              {check.status === 'warn' && (
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    backgroundColor: 'var(--ansi-yellow, #F59E0B)',
                    flexShrink: 0,
                  }}
                />
              )}
              {check.status === 'fail' && (
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    backgroundColor: 'var(--ansi-red, #EF4444)',
                    flexShrink: 0,
                  }}
                />
              )}
              {check.status === 'pending' && (
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    backgroundColor: 'var(--border-color)',
                    flexShrink: 0,
                  }}
                />
              )}

              <span
                style={{
                  fontSize: '0.75rem',
                  color: STATUS_COLOR[check.status],
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                }}
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
            transition={{ duration: 0.3 }}
            style={{
              fontSize: '0.75rem',
              fontWeight: 500,
              color: 'var(--ansi-green, #10B981)',
              opacity: 0.95,
            }}
          >
            Scan complete. All critical systems nominal.
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Step 4: Concepts ──────────────────────────────────────────────────────────

const CONCEPTS = [
  {
    id: 'workspaces',
    index: '01',
    title: 'WORKSPACES',
    tag: 'SESSION LAYER',
    body: 'Isolated session containers. Each workspace runs an independent shell context, maintains its own history, and can be pinned or templated for rapid reuse across projects.',
  },
  {
    id: 'panes',
    index: '02',
    title: 'PANES',
    tag: 'VIEW LAYER',
    body: 'Split the viewport into concurrent terminal planes. Multiple feeds run simultaneously — side-by-side or stacked. Resize, kill, and spawn panes without closing the active session.',
  },
  {
    id: 'agents',
    index: '03',
    title: 'AGENTS',
    tag: 'INTELLIGENCE LAYER',
    body: 'Attach AI inference engines to workspaces. Agents observe terminal output, execute commands autonomously, and coordinate multi-step tasks. Requires compatible runtime installation.',
  },
];

function StepConcepts() {
  const [active, setActive] = useState<string | null>('workspaces');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div
          style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            letterSpacing: '0.05em',
            color: 'var(--accent-primary)',
            opacity: 0.85,
            textTransform: 'uppercase' as const,
          }}
        >
          Step 4 of 5
        </div>

        <div
          style={{
            fontFamily: 'Geist Variable, sans-serif',
            fontSize: 'clamp(1.5rem, 4vw, 2rem)',
            fontWeight: 800,
            letterSpacing: '-0.04em',
            lineHeight: 1,
            textTransform: 'uppercase' as const,
            color: 'var(--text-primary)',
          }}
        >
          Workspace Architecture
        </div>

        <div
          style={{
            fontSize: '0.8rem',
            color: 'var(--text-secondary)',
            opacity: 0.75,
            maxWidth: '54ch',
            lineHeight: 1.6,
          }}
        >
          Three structural layers govern all Cortex operations. Review
          each component before proceeding.
        </div>
      </div>

      <div
        style={{
          width: '100%',
          height: '1px',
          backgroundColor: 'var(--border-color)',
          opacity: 0.35,
        }}
      />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--border-color)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md, 12px)',
          overflow: 'hidden',
          gap: '1px',
        }}
      >
        {CONCEPTS.map((concept) => (
          <div
            key={concept.id}
            onClick={() =>
              setActive(active === concept.id ? null : concept.id)
            }
            style={{
              display: 'grid',
              gridTemplateColumns: '2.5rem 1fr',
              gap: '1.25rem',
              padding: '1rem 1.25rem',
              backgroundColor:
                active === concept.id
                  ? 'var(--surface-color)'
                  : 'var(--bg-color)',
              cursor: 'pointer',
              transition: 'background-color 0.15s',
              borderLeft:
                active === concept.id
                  ? '2px solid var(--accent-primary)'
                  : '2px solid transparent',
            }}
          >
            <div
              style={{
                fontFamily: 'inherit',
                fontSize: '1.25rem',
                fontWeight: 800,
                letterSpacing: '-0.05em',
                lineHeight: 1,
                color: 'var(--text-primary)',
                opacity: 0.1,
                userSelect: 'none',
                paddingTop: '0.15rem',
              }}
            >
              {concept.index}
            </div>

            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  marginBottom: '0.2rem',
                  flexWrap: 'wrap',
                }}
              >
                <span
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                  }}
                >
                  {concept.title}
                </span>
                <span
                  style={{
                    fontSize: '0.65rem',
                    fontWeight: 600,
                    letterSpacing: '0.05em',
                    color: 'var(--accent-primary)',
                    backgroundColor: 'rgba(var(--accent-primary-rgb), 0.08)',
                    border: '1px solid rgba(var(--accent-primary-rgb), 0.25)',
                    borderRadius: '4px',
                    padding: '0.05rem 0.35rem',
                  }}
                >
                  {concept.tag}
                </span>
              </div>

              <AnimatePresence initial={false}>
                {active === concept.id ? (
                  <m.div
                    key="open"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-secondary)',
                        opacity: 0.8,
                        lineHeight: 1.6,
                        paddingTop: '0.35rem',
                        maxWidth: '52ch',
                      }}
                    >
                      {concept.body}
                    </div>
                  </m.div>
                ) : (
                  <m.div
                    key="closed"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.1 }}
                  >
                    <div
                      style={{
                        fontSize: '0.7rem',
                        color: 'var(--text-secondary)',
                        opacity: 0.45,
                        fontWeight: 500,
                      }}
                    >
                      Click to expand
                    </div>
                  </m.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Step 5: Ready ─────────────────────────────────────────────────────────────

function StepReady({ workspacePath }: { workspacePath: string }) {
  const rows = [
    ['Workspace Root', workspacePath || 'System Home Directory'],
    ['System Checks', 'Passed'],
    ['Agent Registry', 'Pending Setup'],
    ['Startup Mode', 'Mode Selector'],
    ['Settings Path', `settings.${import.meta.env.DEV ? 'dev.' : ''}json`],
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div
          style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            letterSpacing: '0.05em',
            color: 'var(--ansi-green, #10B981)',
            opacity: 0.95,
            textTransform: 'uppercase' as const,
          }}
        >
          Step 5 of 5
        </div>

        <div
          style={{
            fontFamily: 'Geist Variable, sans-serif',
            fontSize: 'clamp(1.5rem, 4vw, 2rem)',
            fontWeight: 800,
            letterSpacing: '-0.04em',
            lineHeight: 1,
            textTransform: 'uppercase' as const,
            color: 'var(--text-primary)',
          }}
        >
          Initialization Complete
        </div>

        <div
          style={{
            fontSize: '0.8rem',
            color: 'var(--ansi-green, #10B981)',
            opacity: 0.9,
            fontWeight: 500,
          }}
        >
          All systems nominal. Workspace ready for activation.
        </div>
      </div>

      <div
        style={{
          width: '100%',
          height: '1px',
          backgroundColor: 'var(--border-color)',
          opacity: 0.35,
        }}
      />

      <div
        style={{
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {rows.map(([key, val]) => (
          <div
            key={key}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              padding: '0.75rem 0',
              borderBottom: '1px solid var(--border-color)',
              gap: '1rem',
            }}
          >
            <span
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                opacity: 0.65,
                fontWeight: 500,
              }}
            >
              {key}
            </span>
            <span
              style={{
                fontFamily: key === 'Settings Path' || key === 'Workspace Root' ? 'var(--terminal-font-family, monospace)' : 'inherit',
                fontSize: '0.75rem',
                color:
                  val === 'Passed'
                    ? 'var(--ansi-green, #10B981)'
                    : 'var(--text-primary)',
                wordBreak: 'break-all',
                fontWeight: val === 'Passed' ? 600 : 500,
              }}
            >
              {val}
            </span>
          </div>
        ))}
      </div>

      <div
        style={{
          fontSize: '0.75rem',
          color: 'var(--text-secondary)',
          opacity: 0.55,
          lineHeight: 1.6,
        }}
      >
        <div>All configuration is stored locally and can be modified at any time via the Settings Panel (Cmd+, / Ctrl+,).</div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

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

    const currentStep = STEPS[stepIndex];

    // Load existing workspace path if set
    useEffect(() => {
      getSetting<string>('workspace.defaultPath', '').then(setWorkspacePath);
    }, []);

    const canProceed = currentStep !== 'scan' || scanDone;

    const goNext = useCallback(async () => {
      if (!canProceed) return;
      if (stepIndex === STEPS.length - 1) {
        if (workspacePath) await setSetting('workspace.defaultPath', workspacePath);
        onComplete();
        return;
      }
      setDirection(1);
      setStepIndex((i) => i + 1);
    }, [stepIndex, workspacePath, onComplete, canProceed]);

    const goBack = useCallback(() => {
      if (stepIndex === 0) return;
      setDirection(-1);
      setStepIndex((i) => i - 1);
    }, [stepIndex]);

    // Keyboard navigation
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

    const xAmt = shouldReduceMotion ? 0 : 44;
    const slideVariants: Variants = {
      enter: (dir: number) => ({ opacity: 0, x: dir * xAmt }),
      center: { opacity: 1, x: 0 },
      exit: (dir: number) => ({ opacity: 0, x: dir * -xAmt }),
    };

    return (
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--bg-color)',
          overflow: 'hidden',
        }}
      >
        {/* ── Top header ─────────────────────────────────────── */}
        <div
          style={{
            flexShrink: 0,
            padding: '0.75rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--border-color)',
            zIndex: 60,
          }}
        >
          <div
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              letterSpacing: '0.05em',
              color: 'var(--text-secondary)',
              opacity: 0.6,
              textTransform: 'uppercase' as const,
            }}
          >
            Cortex Space Setup
          </div>
          <div
            style={{
              fontSize: '0.75rem',
              fontWeight: 500,
              color: 'var(--text-secondary)',
              opacity: 0.6,
            }}
          >
            Step {stepIndex + 1} of {STEPS.length}
          </div>
        </div>

        {/* ── Progress bar ───────────────────────────────────── */}
        <div
          style={{
            flexShrink: 0,
            height: '2px',
            backgroundColor: 'color-mix(in srgb, var(--border-color) 60%, transparent)',
            zIndex: 60,
          }}
        >
          <m.div
            style={{ height: '100%', backgroundColor: 'var(--accent-primary)' }}
            initial={false}
            animate={{
              width: `${((stepIndex + 1) / STEPS.length) * 100}%`,
            }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>

        {/* ── Main content area ───────────────────────────────── */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            padding: '2.5rem 2rem',
          }}
        >
          <div style={{ width: '100%', maxWidth: '520px' }}>
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
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                {currentStep === 'startup' && (
                  <StepStartup skip={shouldReduceMotion ?? false} />
                )}
                {currentStep === 'workspace' && (
                  <StepWorkspace
                    path={workspacePath}
                    setPath={setWorkspacePath}
                  />
                )}
                {currentStep === 'scan' && (
                  <StepScan onScanComplete={() => setScanDone(true)} />
                )}
                {currentStep === 'concepts' && <StepConcepts />}
                {currentStep === 'ready' && (
                  <StepReady workspacePath={workspacePath} />
                )}
              </m.div>
            </AnimatePresence>
          </div>
        </div>

        {/* ── Bottom action bar ───────────────────────────────── */}
        <div
          style={{
            flexShrink: 0,
            borderTop: '1px solid var(--border-color)',
            padding: '0.75rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg-color)',
            zIndex: 60,
          }}
        >
          {/* Back button */}
          <Button
            onClick={goBack}
            disabled={stepIndex === 0}
            variant="ghost"
            size="sm"
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
            }}
          >
            Back
          </Button>

          {/* Step pip indicators */}
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            {STEPS.map((_, i) => (
              <div
                key={i}
                style={{
                  width: i === stepIndex ? 18 : 4,
                  height: 3,
                  backgroundColor:
                    i === stepIndex
                      ? 'var(--accent-primary)'
                      : i < stepIndex
                      ? 'color-mix(in srgb, var(--accent-primary) 35%, transparent)'
                      : 'var(--border-color)',
                  transition: 'all 0.3s ease',
                }}
              />
            ))}
          </div>

          {/* Proceed button */}
          <Button
            onClick={goNext}
            disabled={!canProceed}
            variant={canProceed ? 'default' : 'outline'}
            size="sm"
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
            }}
          >
            {stepIndex === STEPS.length - 1 ? 'Enter Workspace' : 'Continue'}
          </Button>
        </div>

        {/* ── Keyframe injection ──────────────────────────────── */}
        <style>{`
          @keyframes cortex-blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0; }
          }
        `}</style>
      </div>
    );
  }
);

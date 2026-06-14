import { useState, useCallback, useEffect, useRef, memo } from 'react';
import { m, AnimatePresence, Variants, useReducedMotion } from 'framer-motion';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { getSetting, setSetting } from '@/lib/store';

// ── Types ─────────────────────────────────────────────────────────────────────

type Step = 'boot' | 'workspace' | 'scan' | 'concepts' | 'ready';

const STEPS: Step[] = ['boot', 'workspace', 'scan', 'concepts', 'ready'];

type CheckStatus = 'pending' | 'checking' | 'ok' | 'warn' | 'fail';

interface SysCheck {
  id: string;
  label: string;
  description: string;
  status: CheckStatus;
  detail: string;
}

// ── CRT Overlay ───────────────────────────────────────────────────────────────

const CRTOverlay = memo(function CRTOverlay() {
  return (
    <>
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 50,
          pointerEvents: 'none',
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.055) 2px, rgba(0,0,0,0.055) 4px)',
          willChange: 'transform',
        }}
      />
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 49,
          pointerEvents: 'none',
          opacity: 0.018,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '200px 200px',
        }}
      />
    </>
  );
});

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
  '> LOADING KERNEL INTERFACE...',
  '> MOUNTING WORKSPACE VOLUMES...',
  '> ALLOCATING SHELL CONTEXTS...',
  '> BINDING PROCESS NAMESPACES...',
  '> INITIALIZING AGENT REGISTRY...',
  '> SYSTEM READY',
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
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '0.65rem',
        letterSpacing: '0.05em',
        lineHeight: 1.85,
      }}
    >
      {BOOT_LINES.slice(0, visibleLines).map((line, i) => (
        <div
          key={i}
          style={{
            color:
              line === '> SYSTEM READY'
                ? '#4AF626'
                : 'var(--text-secondary)',
            opacity: line === '> SYSTEM READY' ? 1 : 0.65,
          }}
        >
          {line}
          {i === visibleLines - 1 && line !== '> SYSTEM READY' && (
            <span
              style={{
                animation: 'cortex-blink 1s step-end infinite',
                color: 'var(--accent-primary)',
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

// ── Step 1: Boot ──────────────────────────────────────────────────────────────

function StepBoot({ skip }: { skip: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.25rem' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
        <div
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.6rem',
            letterSpacing: '0.14em',
            color: 'var(--accent-primary)',
            opacity: 0.75,
          }}
        >
          [ STEP 01 / 05 ]
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
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.65rem',
            letterSpacing: '0.35em',
            textTransform: 'uppercase' as const,
            color: 'var(--accent-primary)',
            opacity: 0.7,
            paddingLeft: '0.35em',
          }}
        >
          WORKSPACE INITIALIZATION PROTOCOL
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
          gap: '2rem',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '0.57rem',
          letterSpacing: '0.1em',
          color: 'var(--text-secondary)',
          opacity: 0.38,
        }}
      >
        <span>BUILD v2.0.0</span>
        <span>TAURI v2</span>
        <span>REACT v19</span>
        <span>///</span>
        <span>FIRST RUN</span>
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
      setBrowseError('DIRECTORY PICKER UNAVAILABLE');
    }
  }, [setPath]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.6rem',
            letterSpacing: '0.14em',
            color: 'var(--accent-primary)',
            opacity: 0.75,
          }}
        >
          [ STEP 02 / 05 ]
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
          WORKSPACE ROOT
        </div>

        <div
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.63rem',
            letterSpacing: '0.07em',
            color: 'var(--text-secondary)',
            opacity: 0.65,
            maxWidth: '54ch',
            lineHeight: 1.7,
          }}
        >
          DEFINE THE PRIMARY FILESYSTEM PATH FROM WHICH ALL TERMINAL
          SESSIONS AND AGENT CONTEXTS WILL INHERIT THEIR WORKING DIRECTORY.
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
        <div
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.57rem',
            letterSpacing: '0.12em',
            color: 'var(--text-secondary)',
            opacity: 0.5,
          }}
        >
          [ WORKSPACE_ROOT_PATH ]
        </div>

        <div style={{ display: 'flex' }}>
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              border: '1px solid var(--border-color)',
              borderRight: 'none',
              padding: '0.65rem 0.75rem',
              backgroundColor: 'transparent',
            }}
          >
            <span
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '0.68rem',
                color: 'var(--accent-primary)',
                opacity: 0.55,
                flexShrink: 0,
              }}
            >
              ~/
            </span>
            <input
              type="text"
              value={path}
              onChange={(e) => {
                setPath(e.target.value);
                setBrowseError('');
              }}
              placeholder="/home/user/workspace"
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '0.72rem',
                color: 'var(--text-primary)',
                letterSpacing: '0.03em',
              }}
            />
          </div>

          <button
            onClick={handleBrowse}
            style={{
              padding: '0.65rem 1rem',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--surface-color)',
              color: 'var(--text-secondary)',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.58rem',
              letterSpacing: '0.1em',
              cursor: 'pointer',
              textTransform: 'uppercase' as const,
              transition: 'border-color 0.15s, color 0.15s',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor =
                'var(--accent-primary)';
              (e.currentTarget as HTMLElement).style.color =
                'var(--accent-primary)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor =
                'var(--border-color)';
              (e.currentTarget as HTMLElement).style.color =
                'var(--text-secondary)';
            }}
          >
            [ BROWSE ]
          </button>
        </div>

        {browseError && (
          <div
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.58rem',
              color: '#E61919',
              letterSpacing: '0.08em',
            }}
          >
            !! {browseError}
          </div>
        )}

        <div
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.56rem',
            letterSpacing: '0.06em',
            color: 'var(--text-secondary)',
            opacity: 0.38,
            lineHeight: 1.75,
          }}
        >
          <div>OPTIONAL — LEAVE BLANK TO USE SYSTEM HOME DIRECTORY.</div>
          <div>
            PATH IS STORED IN settings.json AND NEVER TRANSMITTED EXTERNALLY.
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
  ok: '#4AF626',
  warn: '#F5A623',
  fail: '#E61919',
};

const STATUS_LABEL: Record<CheckStatus, string> = {
  pending: '[ PENDING  ]',
  checking: '[ SCANNING ]',
  ok: '[ NOMINAL  ]',
  warn: '[ DEGRADED ]',
  fail: '[ FAILED   ]',
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
          detail: v ? v.trim().slice(0, 22) : 'v18.x DETECTED',
        });
      } catch {
        patch('node', { status: 'warn', detail: 'VERSION UNRESOLVED' });
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
          detail: v ? v.trim().slice(0, 22) : 'v2.x DETECTED',
        });
      } catch {
        patch('git', { status: 'warn', detail: 'VERSION UNRESOLVED' });
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
      patch('disk', { status: 'ok', detail: 'READ/WRITE VERIFIED' });

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
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.6rem',
            letterSpacing: '0.14em',
            color: 'var(--accent-primary)',
            opacity: 0.75,
          }}
        >
          [ STEP 03 / 05 ]
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
          SYSTEM PREREQUISITES
        </div>

        <div
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.63rem',
            letterSpacing: '0.07em',
            color: 'var(--text-secondary)',
            opacity: 0.65,
            maxWidth: '54ch',
            lineHeight: 1.7,
          }}
        >
          SCANNING ACTIVE SYSTEM PATHS FOR REQUIRED RUNTIME DEPENDENCIES
          AND TOOLCHAIN COMPONENTS.
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
          borderTop: '1px solid var(--border-color)',
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
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  color: 'var(--text-primary)',
                }}
              >
                {check.label}
              </div>
              <div
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '0.56rem',
                  letterSpacing: '0.04em',
                  color: 'var(--text-secondary)',
                  opacity: 0.5,
                  marginTop: '0.2rem',
                }}
              >
                {check.detail || check.description}
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
                    backgroundColor: '#4AF626',
                    boxShadow: '0 0 5px rgba(74,246,38,0.5)',
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
                    backgroundColor: '#F5A623',
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
                    backgroundColor: '#E61919',
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
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '0.57rem',
                  letterSpacing: '0.06em',
                  color: STATUS_COLOR[check.status],
                  fontWeight: 700,
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
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.6rem',
              letterSpacing: '0.1em',
              color: '#4AF626',
              opacity: 0.85,
            }}
          >
            SCAN COMPLETE // ALL CRITICAL SYSTEMS NOMINAL — PROCEED
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
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.6rem',
            letterSpacing: '0.14em',
            color: 'var(--accent-primary)',
            opacity: 0.75,
          }}
        >
          [ STEP 04 / 05 ]
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
          WORKSPACE ARCHITECTURE
        </div>

        <div
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.63rem',
            letterSpacing: '0.07em',
            color: 'var(--text-secondary)',
            opacity: 0.65,
            maxWidth: '54ch',
            lineHeight: 1.7,
          }}
        >
          THREE STRUCTURAL LAYERS GOVERN ALL CORTEX OPERATIONS. REVIEW
          EACH COMPONENT BEFORE PROCEEDING.
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
          gap: '1px',
          backgroundColor: 'var(--border-color)',
          border: '1px solid var(--border-color)',
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
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '1.5rem',
                fontWeight: 800,
                letterSpacing: '-0.05em',
                lineHeight: 1,
                color: 'var(--text-primary)',
                opacity: 0.07,
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
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    color: 'var(--text-primary)',
                  }}
                >
                  {concept.title}
                </span>
                <span
                  style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '0.52rem',
                    letterSpacing: '0.1em',
                    color: 'var(--accent-primary)',
                    border: '1px solid var(--accent-primary)',
                    padding: '0.05rem 0.35rem',
                    opacity: 0.55,
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
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: '0.62rem',
                        letterSpacing: '0.04em',
                        color: 'var(--text-secondary)',
                        opacity: 0.75,
                        lineHeight: 1.75,
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
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: '0.57rem',
                        letterSpacing: '0.05em',
                        color: 'var(--text-secondary)',
                        opacity: 0.38,
                      }}
                    >
                      CLICK TO EXPAND
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
    ['WORKSPACE_ROOT', workspacePath || 'SYSTEM_HOME'],
    ['SYSTEM_CHECKS', 'PASSED'],
    ['AGENT_REGISTRY', 'PENDING SETUP'],
    ['STARTUP_MODE', 'MODE_SELECTOR'],
    ['SETTINGS_PATH', '~/.config/cortex-space/settings.json'],
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.6rem',
            letterSpacing: '0.14em',
            color: '#4AF626',
            opacity: 0.85,
          }}
        >
          [ STEP 05 / 05 ]
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
          INITIALIZATION COMPLETE
        </div>

        <div
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.63rem',
            letterSpacing: '0.07em',
            color: '#4AF626',
            opacity: 0.8,
            lineHeight: 1.6,
          }}
        >
          ALL SYSTEMS NOMINAL // WORKSPACE READY FOR ACTIVATION
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
        {rows.map(([key, val], i) => (
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
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '0.58rem',
                letterSpacing: '0.08em',
                color: 'var(--text-secondary)',
                opacity: 0.5,
              }}
            >
              {key}
            </span>
            <span
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '0.58rem',
                letterSpacing: '0.05em',
                color:
                  val === 'PASSED'
                    ? '#4AF626'
                    : 'var(--text-primary)',
                wordBreak: 'break-all',
              }}
            >
              {val}
            </span>
          </div>
        ))}
      </div>

      <div
        style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '0.56rem',
          letterSpacing: '0.06em',
          color: 'var(--text-secondary)',
          opacity: 0.35,
          lineHeight: 1.8,
        }}
      >
        <div>ALL CONFIGURATION IS STORED LOCALLY AND CAN BE MODIFIED AT ANY TIME</div>
        <div>VIA THE SETTINGS PANEL (CMD+, / CTRL+,).</div>
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
        <CRTOverlay />

        {/* ── Top header ─────────────────────────────────────── */}
        <div
          style={{
            flexShrink: 0,
            padding: '0.55rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--border-color)',
            zIndex: 60,
          }}
        >
          <div
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.57rem',
              letterSpacing: '0.14em',
              color: 'var(--text-secondary)',
              opacity: 0.5,
              textTransform: 'uppercase' as const,
            }}
          >
            CORTEX SPACE // INIT PROTOCOL
          </div>
          <div
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.57rem',
              letterSpacing: '0.12em',
              color: 'var(--text-secondary)',
              opacity: 0.45,
            }}
          >
            {`${String(stepIndex + 1).padStart(2, '0')} / ${String(STEPS.length).padStart(2, '0')}`}
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
                {currentStep === 'boot' && (
                  <StepBoot skip={shouldReduceMotion ?? false} />
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
            padding: '0.65rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg-color)',
            zIndex: 60,
          }}
        >
          {/* Back button */}
          <button
            onClick={goBack}
            disabled={stepIndex === 0}
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.6rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase' as const,
              color: 'var(--text-secondary)',
              opacity: stepIndex === 0 ? 0.2 : 0.65,
              background: 'transparent',
              border: 'none',
              cursor: stepIndex === 0 ? 'default' : 'pointer',
              padding: '0.35rem 0',
              transition: 'opacity 0.15s',
              userSelect: 'none',
            }}
          >
            &lt;&lt; BACK
          </button>

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
          <button
            onClick={goNext}
            disabled={!canProceed}
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.6rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase' as const,
              color: canProceed ? 'var(--bg-color)' : 'var(--text-secondary)',
              backgroundColor: canProceed
                ? 'var(--accent-primary)'
                : 'transparent',
              border: '1px solid',
              borderColor: canProceed
                ? 'var(--accent-primary)'
                : 'var(--border-color)',
              cursor: canProceed ? 'pointer' : 'default',
              padding: '0.4rem 0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'all 0.15s',
              opacity: canProceed ? 1 : 0.35,
              userSelect: 'none',
            }}
            onMouseEnter={(e) => {
              if (!canProceed) return;
              (e.currentTarget as HTMLElement).style.opacity = '0.85';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.opacity = canProceed
                ? '1'
                : '0.35';
            }}
          >
            {stepIndex === STEPS.length - 1
              ? '[ ENTER WORKSPACE ] >>'
              : '[ PROCEED ] >>'}
          </button>
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

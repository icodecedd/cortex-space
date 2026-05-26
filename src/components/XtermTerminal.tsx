import { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { openUrl } from '@tauri-apps/plugin-opener';
import { useTheme, THEMES, ThemeName } from '../hooks/useTheme';
import { usePty } from '../hooks/usePty';
import { Button } from "@/components/ui/button";
import { getSetting, getSettingsGroup, TERMINAL_DEFAULTS, TerminalSettings, SHORTCUT_DEFAULTS, ShortcutSettings, DemoSettings } from '@/lib/store';
import { RotateCw } from "lucide-react";
import { Kbd } from "@/components/ui/kbd";
import { toast } from "sonner";
import '@xterm/xterm/css/xterm.css';

interface XtermTerminalProps {
  id: string;
  isFocused: boolean;
  command?: string;
  cwd?: string;
  isZenMode?: boolean;
}

export function XtermTerminal({ id, isFocused, command, cwd, isZenMode = false }: XtermTerminalProps) {
  const idParts = id.split('-');
  const paneId = idParts.pop() || '1';
  const workspaceId = idParts.join('-');
  const isMac = typeof window !== 'undefined' && navigator.userAgent.includes('Mac');
  const focusShortcut = isMac ? `⌘${paneId}` : `Ctrl+${paneId}`;
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const { theme } = useTheme();
  
  const [dimensions, setDimensions] = useState({ rows: 24, cols: 80 });
  const [defaultShell, setDefaultShell] = useState<string>('');
  const [shortcuts, setShortcuts] = useState<ShortcutSettings>(SHORTCUT_DEFAULTS);
  const [enableHighlight, setEnableHighlight] = useState(true);
  const [showShortcuts, setShowShortcuts] = useState(true);

  useEffect(() => {
    getSettingsGroup<TerminalSettings>('startup', { defaultShell: '' } as any).then((saved: any) => {
      setDefaultShell(saved.defaultShell || '');
    });
    getSettingsGroup<ShortcutSettings>('shortcuts', SHORTCUT_DEFAULTS).then(setShortcuts);
    getSetting('demo.enableTerminalButtonHighlight', true).then(setEnableHighlight);
    getSetting('demo.showTerminalShortcutHints', true).then(setShowShortcuts);
  }, []);

  function applyAnsiColors(themeName: string) {
    const themeDef = THEMES[themeName as ThemeName];
    if (!themeDef || !themeDef.ansi) return {};
    return themeDef.ansi;
  }

  // CHECKLIST ITEM 3: Single-Source Rendering
  // Confirm that data only appears in the terminal UI *after* it has made a full round trip from the backend process.
  // Data from Backend -> Frontend
  const handlePtyData = useCallback((data: Uint8Array) => {
    if (xtermRef.current) {
      xtermRef.current.write(data);
    }
  }, [id]);

  const ptyConfig = useMemo(() => ({ 
    command, 
    cwd, 
    rows: dimensions.rows, 
    cols: dimensions.cols,
    shell: defaultShell
  }), [command, cwd, dimensions.rows, dimensions.cols, defaultShell]);

  const { write: writeToPty, resize: resizePty, isReady, isTerminated, relaunch } = usePty(id, handlePtyData, ptyConfig);

  // Bridge for xterm.js event handlers to always use latest PTY callbacks
  const writeRef = useRef(writeToPty);
  const resizeRef = useRef(resizePty);
  
  useEffect(() => { writeRef.current = writeToPty; }, [writeToPty]);
  useEffect(() => { resizeRef.current = resizePty; }, [resizePty]);

  // Main Terminal Lifecycle
  useEffect(() => {
    if (!terminalRef.current) return;

    const root = document.documentElement;
    const initialFontSize = parseInt(getComputedStyle(root).getPropertyValue('--terminal-font-size').trim(), 10) || TERMINAL_DEFAULTS.fontSize;
    const initialFontFamily = getComputedStyle(root).getPropertyValue('--terminal-font-family').trim() || TERMINAL_DEFAULTS.fontFamily;
    const initialLineHeight = parseFloat(getComputedStyle(root).getPropertyValue('--terminal-line-height').trim()) || TERMINAL_DEFAULTS.lineHeight;
    const initialLetterSpacing = parseFloat(getComputedStyle(root).getPropertyValue('--terminal-letter-spacing').trim()) || TERMINAL_DEFAULTS.letterSpacing;

    // Load full settings from store for fields not covered by CSS vars
    let initialSettings = { ...TERMINAL_DEFAULTS };
    getSettingsGroup<TerminalSettings>('terminal', TERMINAL_DEFAULTS).then((saved) => {
      initialSettings = saved;
    });

    const term = new Terminal({
      cursorBlink: initialSettings.cursorBlink,
      cursorStyle: initialSettings.cursorStyle,
      fontSize: initialFontSize,
      fontFamily: initialFontFamily,
      lineHeight: initialLineHeight,
      letterSpacing: initialLetterSpacing,
      theme: {
        background: 'transparent',
        foreground: getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim() || '#ffffff',
        cursor: getComputedStyle(document.documentElement).getPropertyValue('--accent-primary').trim() || '#ffffff',
        selectionBackground: 'rgba(255, 255, 255, 0.3)',
        ...applyAnsiColors(theme)
      },
      allowTransparency: true,
      scrollback: initialSettings.scrollbackLines,
      convertEol: true,
      allowProposedApi: true,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.loadAddon(new WebLinksAddon((_event, uri) => {
      openUrl(uri).catch((err: unknown) => {
        console.error('Failed to open external link:', err);
      });
    }));
    term.open(terminalRef.current);

    // Centralized shortcut bubbling logic
    term.attachCustomKeyEventHandler((e) => {
      // Check if this key combo matches ANY of our global app shortcuts
      const isGlobalShortcut = Object.values(shortcuts).some(s => {
        if (!s) return false;
        const parts = s.split('+').map(p => p.trim().toLowerCase());
        const key = parts[parts.length - 1];
        const hasCtrl = parts.includes('ctrl') || parts.includes('cmd') || parts.includes('meta');
        const hasAlt = parts.includes('alt') || parts.includes('opt');
        const hasShift = parts.includes('shift');

        return e.key.toLowerCase() === key && 
               (e.ctrlKey || e.metaKey) === hasCtrl && 
               e.altKey === hasAlt && 
               e.shiftKey === hasShift;
      });

      const isEscape = e.key === 'Escape';
      const isNumKey = e.key >= '1' && e.key <= '9';
      const isArrowKey = e.key.startsWith('Arrow');
      const isDirectionalNav = (e.ctrlKey || e.metaKey) && e.altKey && isArrowKey;
      const isPaneFocus = (e.ctrlKey || e.metaKey) && isNumKey;
      const isMaximize = (e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'm';

      if (isGlobalShortcut || isEscape || isDirectionalNav || isPaneFocus || isMaximize) {
        return false; // Bubble up
      }
      return true;
    });
    
    term.onResize(({ rows, cols }) => {
      setDimensions({ rows, cols });
      resizeRef.current(rows, cols);
    });

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    const performInitialFit = () => {
      if (fitAddonRef.current && xtermRef.current) {
        try {
          fitAddonRef.current.fit();
          setDimensions({ rows: xtermRef.current.rows, cols: xtermRef.current.cols });
        } catch (e) {}
      }
    };

    if ('fonts' in document) {
      document.fonts.ready.then(() => performInitialFit());
    } else {
      performInitialFit();
    }

    const rafId = requestAnimationFrame(() => {
      if (fitAddonRef.current && xtermRef.current) {
        try { fitAddonRef.current.fit(); } catch (e) {}
        xtermRef.current.focus();
      }
    });

    term.onData((data) => writeRef.current(data));
    term.onBinary((data) => writeRef.current(data));

    let resizeTimeout: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (fitAddonRef.current) {
          try { fitAddonRef.current.fit(); } catch (e) {}
        }
      }, 50);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    if (terminalRef.current) resizeObserver.observe(terminalRef.current);
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(resizeTimeout);
      window.removeEventListener('resize', handleResize);
      term.dispose();
      resizeObserver.disconnect();
    };
  }, []);

  // Theme Sync
  useEffect(() => {
    if (xtermRef.current) {
      xtermRef.current.options.theme = {
        background: 'transparent',
        foreground: getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim() || '#ffffff',
        cursor: getComputedStyle(document.documentElement).getPropertyValue('--accent-primary').trim() || '#ffffff',
        selectionBackground: 'rgba(255, 255, 255, 0.3)',
      };
    }
  }, [theme]);

  // Settings Dynamic Sync
  useEffect(() => {
    const handleSettingsChange = (e: Event) => {
      const evt = e as CustomEvent<{ terminal?: TerminalSettings; startup?: any }>;
      const ts = evt.detail?.terminal;
      const ss = evt.detail?.startup;

      if (ss?.defaultShell !== undefined) {
        setDefaultShell(ss.defaultShell);
      }

      if (!xtermRef.current) return;

      if (ts) {
        xtermRef.current.options.fontSize = ts.fontSize;
        xtermRef.current.options.fontFamily = `"${ts.fontFamily}", monospace`;
        xtermRef.current.options.cursorBlink = ts.cursorBlink;
        xtermRef.current.options.cursorStyle = ts.cursorStyle as 'block' | 'underline' | 'bar';
        xtermRef.current.options.lineHeight = ts.lineHeight;
        xtermRef.current.options.letterSpacing = ts.letterSpacing;
      }

      if ('fonts' in document) {
        document.fonts.ready.then(() => {
          if (fitAddonRef.current) {
            try { fitAddonRef.current.fit(); } catch (e) {}
          }
        });
      }
    };

    window.addEventListener('cortex-settings-changed', handleSettingsChange);
    return () => window.removeEventListener('cortex-settings-changed', handleSettingsChange);
  }, []);

  useEffect(() => {
    const handleDemoSettingsChange = (e: Event) => {
      const evt = e as CustomEvent<Partial<DemoSettings>>;
      if (evt.detail?.enableTerminalButtonHighlight !== undefined) {
        setEnableHighlight(evt.detail.enableTerminalButtonHighlight);
      }
      if (evt.detail?.showTerminalShortcutHints !== undefined) {
        setShowShortcuts(evt.detail.showTerminalShortcutHints);
      }
    };

    window.addEventListener('cortex-demo-settings-changed', handleDemoSettingsChange);
    return () => window.removeEventListener('cortex-demo-settings-changed', handleDemoSettingsChange);
  }, []);

  useEffect(() => {
    const handlePurge = () => { if (xtermRef.current) xtermRef.current.clear(); };
    window.addEventListener('cortex-purge-scrollback', handlePurge);
    return () => window.removeEventListener('cortex-purge-scrollback', handlePurge);
  }, []);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.setAttribute('autocomplete', 'off');
      terminalRef.current.setAttribute('autocorrect', 'off');
      terminalRef.current.setAttribute('autocapitalize', 'off');
      terminalRef.current.setAttribute('spellcheck', 'false');
    }
  }, []);

  useEffect(() => {
    const handleFocus = () => { if (xtermRef.current && isFocused && isReady) xtermRef.current.focus(); };
    handleFocus();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [isFocused, isReady]);

  // Listen for the custom "cortex:write-to-terminal" event (Command Snippet injection)
  useEffect(() => {
    const handleWriteRequest = (e: any) => {
      const { workspaceId: targetWsId, command, execute } = e.detail;
      
      // We only respond if we are in the target workspace AND we are the currently focused pane
      if (targetWsId === workspaceId && isFocused && isReady) {
        // Write the command
        writeRef.current(command);
        
        // If execution is requested, send the Enter signal
        if (execute) {
          writeRef.current('\r');
        }
      }
    };

    window.addEventListener('cortex:write-to-terminal', handleWriteRequest);
    return () => window.removeEventListener('cortex:write-to-terminal', handleWriteRequest);
  }, [workspaceId, isFocused, isReady]);

  useEffect(() => {
    if (!isFocused || !isReady) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const isR = e.key.toLowerCase() === 'r';
      if ((e.ctrlKey || e.metaKey) && e.altKey && isR) {
        e.preventDefault();
        relaunch();
        toast.success(`Pane Execution Triggered`, { description: `Relaunching PANE ${paneId}...` });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFocused, isReady, relaunch, paneId]);

  const handleContainerClick = () => { if (xtermRef.current && isReady) xtermRef.current.focus(); };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      {!isZenMode && (
        <div 
          className="pane-header-overlay group/pane-header"
          style={{
            position: 'absolute',
            top: '8px',
            left: '8px',
            right: '8px',
            height: '36px',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 0.85rem',
            background: isFocused ? 'rgba(15, 15, 15, 0.85)' : 'rgba(15, 15, 15, 0.65)',
            backdropFilter: 'blur(16px)',
            border: isFocused ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: '9999px',
            opacity: isFocused ? 1 : 0.75,
            boxShadow: isFocused ? '0 8px 30px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)' : '0 4px 15px rgba(0, 0, 0, 0.3)',
            transition: 'all var(--duration-normal) var(--ease-out)',
            pointerEvents: 'auto'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
            <span style={{ 
              fontSize: '9px', fontFamily: 'JetBrains Mono', fontWeight: 700, 
              color: isFocused ? 'var(--accent-primary)' : 'var(--text-secondary)',
              background: 'rgba(255, 255, 255, 0.05)', padding: '2px 6px', borderRadius: '9999px',
              border: '1px solid rgba(255, 255, 255, 0.05)',
            }}>
              PANE {paneId}
            </span>
            {!isFocused && (
              <span style={{ 
                fontSize: '8px', fontFamily: 'JetBrains Mono', color: 'var(--text-secondary)',
                background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)',
                padding: '1px 5px', borderRadius: '9999px', opacity: 0.8
              }}>
                {focusShortcut}
              </span>
            )}
            <span style={{ 
              fontSize: '9px', fontFamily: 'JetBrains Mono', color: isFocused ? 'var(--text-primary)' : 'var(--text-secondary)',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px'
            }}>
              {command || 'bash'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {isReady && !isTerminated && (
              <Button
                onClick={() => {
                  relaunch();
                  toast.success(`Pane Execution Triggered`, { description: `Relaunching PANE ${paneId}...` });
                }}
                variant="ghost"
                size="icon-xs"
                className={`${enableHighlight ? 'btn-tactile' : ''} text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:bg-white/5 active:scale-97`}
                style={{
                  width: '20px', height: '20px', padding: 0, borderRadius: '9999px',
                  background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                <RotateCw size={10} className="transition-transform duration-300 hover:rotate-45" />
              </Button>
            )}
            {showShortcuts && (
              <Kbd style={{ 
                fontSize: '8px', height: '14px', padding: '0 5px', background: 'rgba(255, 255, 255, 0.03)', 
                borderColor: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-secondary)',
                fontFamily: 'JetBrains Mono', borderRadius: '9999px'
              }}>
                Ctrl+Alt+R
              </Kbd>
            )}
          </div>
        </div>
      )}
      <div 
        ref={terminalRef} 
        className="terminal-container"
        onClick={handleContainerClick}
        style={{ 
          width: '100%', height: '100%', padding: isZenMode ? '0' : '52px 8px 8px 8px', 
          margin: '0', background: '#000000', overflow: 'hidden'
        }} 
      />
      {isTerminated && (
        <div style={{
          position: 'absolute', inset: 0, background: 'rgba(5, 5, 5, 0.85)', backdropFilter: 'blur(8px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          zIndex: 100, gap: '0.75rem', fontFamily: 'JetBrains Mono, monospace'
        }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.15em' }}>
            SESSION TERMINATED
          </span>
          <Button 
            onClick={() => relaunch()}
            className={`primary ${enableHighlight ? 'btn-tactile' : ''}`}
            style={{ padding: '0.4rem 1rem', fontSize: '0.7rem', letterSpacing: '0.05em', borderRadius: 'var(--radius-sm)' }}
          >
            RELAUNCH SESSION
          </Button>
        </div>
      )}
    </div>
  );
}

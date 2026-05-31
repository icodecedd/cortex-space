import { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { openUrl } from '@tauri-apps/plugin-opener';
import { useTheme, THEMES, ThemeName } from '../hooks/useTheme';
import { usePty } from '../hooks/usePty';
import { Button } from "@/components/ui/button";
import { getSetting, getSettingsGroup, TERMINAL_DEFAULTS, TerminalSettings, SHORTCUT_DEFAULTS, ShortcutSettings, DemoSettings } from '@/lib/store';
import { MoreVertical, SquareSplitVertical, SquareSplitHorizontal, Trash2, BookmarkPlus, RefreshCw } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
} from "@/components/ui/dropdown-menu";
import { Kbd } from "@/components/ui/kbd";
import { toast } from "sonner";
import '@xterm/xterm/css/xterm.css';

interface XtermTerminalProps {
  id: string;
  paneId: string;
  isFocused: boolean;
  index: number;
  command?: string;
  cwd?: string;
  isZenMode?: boolean;
  name?: string;
  onSplit?: (id: string, direction: 'horizontal' | 'vertical') => void;
  onKill?: (id: string) => void;
  onRename?: (id: string, newName: string) => void;
  onSaveSnippet?: (command: string) => void;
}

export function XtermTerminal({ 
  id, 
  paneId,
  isFocused, 
  index,
  command, 
  cwd, 
  isZenMode = false,
  name,
  onSplit,
  onKill,
  onRename,
  onSaveSnippet
}: XtermTerminalProps) {
  const workspaceId = id.substring(0, id.lastIndexOf(`-${paneId}`));
  const isMac = typeof window !== 'undefined' && navigator.userAgent.includes('Mac');
  const focusShortcut = isMac ? `⌘${index + 1}` : `Ctrl+${index + 1}`;
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const { theme } = useTheme();
  
  const [dimensions, setDimensions] = useState({ rows: 24, cols: 80 });
  const [defaultShell, setDefaultShell] = useState<string>('');
  const [shortcuts, setShortcuts] = useState<ShortcutSettings>(SHORTCUT_DEFAULTS);
  const [showShortcuts, setShowShortcuts] = useState(true);
  const [showFloatingHeader, setShowFloatingHeader] = useState(true);
  const [isRenaming, setIsRenaming] = useState(false);
  const [tempName, setTempName] = useState(name || `PANE ${index + 1}`);

  useEffect(() => {
    if (isRenaming) {
      setTempName(name || `PANE ${index + 1}`);
    }
  }, [isRenaming, name, index]);

  useEffect(() => {
    getSettingsGroup<TerminalSettings>('startup', { defaultShell: '' } as any).then((saved: any) => {
      setDefaultShell(saved.defaultShell || '');
    });
    getSettingsGroup<ShortcutSettings>('shortcuts', SHORTCUT_DEFAULTS).then(setShortcuts);
    getSetting('demo.showTerminalShortcutHints', true).then(setShowShortcuts);
    getSetting('demo.showFloatingTerminalHeader', true).then(setShowFloatingHeader);
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
      const isRelaunch = (e.ctrlKey || e.metaKey) && e.altKey && e.key.toLowerCase() === 'r';

      if (isGlobalShortcut || isEscape || isDirectionalNav || isPaneFocus || isMaximize || isRelaunch) {
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
  }, [shortcuts]);

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
      const evt = e as CustomEvent<{ terminal?: TerminalSettings; startup?: any; shortcuts?: ShortcutSettings }>;
      const ts = evt.detail?.terminal;
      const ss = evt.detail?.startup;
      const sh = evt.detail?.shortcuts;

      if (ss?.defaultShell !== undefined) {
        setDefaultShell(ss.defaultShell);
      }

      if (sh) {
        setShortcuts(sh);
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
      if (evt.detail?.showTerminalShortcutHints !== undefined) {
        setShowShortcuts(evt.detail.showTerminalShortcutHints);
      }
      if (evt.detail?.showFloatingTerminalHeader !== undefined) {
        setShowFloatingHeader(evt.detail.showFloatingTerminalHeader);
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
      const isH = e.key.toLowerCase() === 'h';
      const isV = e.key.toLowerCase() === 'v';

      if ((e.ctrlKey || e.metaKey) && e.altKey) {
        if (isR) {
          e.preventDefault();
          relaunch();
          toast.success(`Pane Execution Triggered`, { description: `Relaunching PANE ${index + 1}...` });
        } else if (isH) {
          e.preventDefault();
          onSplit?.(paneId, 'horizontal');
          toast.success(`Pane Split`, { description: `Splitting PANE ${index + 1} horizontally...` });
        } else if (isV) {
          e.preventDefault();
          onSplit?.(paneId, 'vertical');
          toast.success(`Pane Split`, { description: `Splitting PANE ${index + 1} vertically...` });
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFocused, isReady, relaunch, index, onSplit, paneId]);

  const handleRenameSubmit = () => {
    const trimmed = tempName.trim();
    if (onRename && trimmed) {
      onRename(paneId, trimmed);
      toast.success("Pane Renamed", { description: `Pane updated to "${trimmed}"` });
    }
    setIsRenaming(false);
  };

  const handleContainerClick = () => { if (xtermRef.current && isReady) xtermRef.current.focus(); };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      {(showFloatingHeader && !isZenMode) && (
        <div 
          className="pane-header-overlay group/pane-header"
          style={{
            position: 'absolute',
            top: '12px',
            left: '50%',
            transform: `translateX(-50%) translateY(${isFocused ? '0' : '0px'}) scale(${isFocused ? 1 : 0.98})`,
            height: '32px',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            padding: '0 0.6rem 0 1.25rem',
            background: isFocused ? 'rgba(15, 15, 15, 0.6)' : 'rgba(15, 15, 15, 0.3)',
            backdropFilter: 'blur(20px) saturate(160%)',
            border: isFocused ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(255, 255, 255, 0.04)',
            borderRadius: '10px',
            opacity: isFocused ? 1 : 0.2,
            boxShadow: isFocused ? '0 12px 40px -12px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.05)' : 'none',
            transition: 'all 400ms cubic-bezier(0.23, 1, 0.32, 1)',
            pointerEvents: 'auto',
            minWidth: '160px',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', overflow: 'hidden', flex: 1 }}>
            {isRenaming ? (
              <input
                autoFocus
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onBlur={handleRenameSubmit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRenameSubmit();
                  if (e.key === 'Escape') setIsRenaming(false);
                  e.stopPropagation();
                }}
                className="bg-transparent border-none outline-none text-[11px] font-bold font-sans text-[var(--accent-primary)] w-full p-0"
                style={{ height: '18px', minWidth: '80px' }}
              />
            ) : (
              <span 
                onDoubleClick={() => setIsRenaming(true)}
                style={{ 
                  fontSize: '11px', fontFamily: 'Inter, sans-serif', fontWeight: 700, 
                  color: 'var(--text-primary)',
                  cursor: 'text',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '240px',
                  letterSpacing: '-0.01em'
                }}
              >
                {name || `Pane ${index + 1}`}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="text-[var(--text-secondary)] hover:text-white hover:bg-white/10 transition-colors"
                  style={{
                    width: '24px', height: '24px', borderRadius: '6px'
                  }}
                >
                  <MoreVertical size={12} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" side="bottom" sideOffset={8} className="w-56 bg-[var(--surface-color)] border-[var(--border-color)] text-[var(--text-primary)] shadow-2xl backdrop-blur-xl">
                <DropdownMenuItem onClick={() => {
                  relaunch();
                  toast.success(`Pane Reset`, { description: `Restarting session for ${name || `PANE ${index + 1}`}...` });
                }}>
                  <RefreshCw className="mr-2 h-3.5 w-3.5" />
                  <span>Reset Process</span>
                  <DropdownMenuShortcut className="text-[10px] opacity-50">Ctrl+Alt+R</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-[var(--border-color)]/50" />
                <DropdownMenuItem onClick={() => onSplit?.(paneId, 'horizontal')}>
                  <SquareSplitHorizontal className="mr-2 h-3.5 w-3.5" />
                  <span>Split Horizontally</span>
                  <DropdownMenuShortcut className="text-[10px] opacity-50">Ctrl+Alt+H</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSplit?.(paneId, 'vertical')}>
                  <SquareSplitVertical className="mr-2 h-3.5 w-3.5" />
                  <span>Split Vertically</span>
                  <DropdownMenuShortcut className="text-[10px] opacity-50">Ctrl+Alt+V</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-[var(--border-color)]/50" />
                <DropdownMenuItem onClick={() => {
                  if (onSaveSnippet && (command || '')) {
                    onSaveSnippet(command || '');
                    toast.success("Snippet Saved", { description: `Saved "${command}" to your library.` });
                  }
                }}>
                  <BookmarkPlus className="mr-2 h-3.5 w-3.5" />
                  <span>Save as Snippet</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-[var(--border-color)]/50" />
                <DropdownMenuItem 
                  className="text-red-400 focus:text-red-400 focus:bg-red-400/10"
                  onClick={() => onKill?.(paneId)}
                >
                  <Trash2 className="mr-2 h-3.5 w-3.5" />
                  <span>Kill Process</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}
      <div 
        ref={terminalRef} 
        className="terminal-container"
        onClick={handleContainerClick}
        style={{ 
          width: '100%', height: '100%', padding: (isZenMode || !showFloatingHeader) ? '0' : '52px 8px 8px 8px', 
          margin: '0', background: '#000000', overflow: 'hidden'
        }} 
      />
      <div style={{
        position: 'absolute', inset: 0, background: 'rgba(5, 5, 5, 0.85)', backdropFilter: 'blur(8px)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        zIndex: 100, gap: '0.75rem', fontFamily: 'JetBrains Mono, monospace',
        display: isTerminated ? 'flex' : 'none'
      }}>
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.15em' }}>
          SESSION TERMINATED
        </span>
        <Button 
          onClick={() => relaunch()}
          className="primary btn-tactile"
          style={{ padding: '0.4rem 1rem', fontSize: '0.7rem', letterSpacing: '0.05em', borderRadius: 'var(--radius-sm)' }}
        >
          RELAUNCH SESSION
        </Button>
      </div>
    </div>
  );
}

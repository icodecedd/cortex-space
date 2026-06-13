import { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { openUrl } from '@tauri-apps/plugin-opener';
import { invoke } from '@tauri-apps/api/core';
import { motion, AnimatePresence } from 'framer-motion';
import { CornerDownLeft, X } from '@/components/ui/icons';
import { useTheme } from '@/hooks/useTheme';
import { useColorScheme } from '@/hooks/useColorScheme';
import { usePty } from '@/hooks/usePty';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
import { getSetting, getSettingsGroup, TERMINAL_DEFAULTS, TerminalSettings, SHORTCUT_DEFAULTS, ShortcutSettings, DemoSettings } from '@/lib/store';
import { isGlobalShortcut, matchesShortcut } from '@/lib/shortcut-utils';
import { toast } from "sonner";
import { PaneElevator } from '@/features/space/components/PaneElevator';
import { terminalSessionManager } from '@/lib/terminalSessionManager';
import { extractVariables, resolveVariables } from '@/lib/snippet-utils';
import '@xterm/xterm/css/xterm.css';

export type PortState = 'detected' | 'gone';
export interface DetectedPort {
  port: number;
  url: string;
  state: PortState;
}

interface PendingSnippet {
  originalCommand: string;
  variables: string[];
  resolvedValues: Record<string, string>;
  currentIndex: number;
  execute: boolean;
}

const PORT_BLOCKLIST = new Set([5432, 3306, 6379, 27017, 5672, 9200, 2181, 25, 22, 21, 3307, 1433, 5433]);

interface XtermTerminalProps {
  id: string;
  paneId: string;
  isFocused: boolean;
  index: number;
  command?: string;
  cwd?: string;
  isZenMode?: boolean;
  isMaximized?: boolean;
  onMaximize?: () => void;
  name?: string;
  onSplit?: (id: string, direction: 'horizontal' | 'vertical') => void;
  onKill?: (id: string) => void;
  onRename?: (id: string, newName: string) => void;
}

export function XtermTerminal({
  id,
  paneId,
  isFocused,
  index,
  command,
  cwd,
  isZenMode = false,
  isMaximized = false,
  onMaximize,
  name,
  onSplit,
  onKill,
  onRename
}: XtermTerminalProps) {
  const workspaceId = id.substring(0, id.lastIndexOf(`-${paneId}`));
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

  const { theme, allThemes } = useTheme();
  const { resolvedScheme } = useColorScheme();

  const [dimensions, setDimensions] = useState({ rows: 24, cols: 80 });
  const [isMeasured, setIsMeasured] = useState(() => terminalSessionManager.hasSession(id));
  const [defaultShell, setDefaultShell] = useState<string>('');
  const [shortcuts, setShortcuts] = useState<ShortcutSettings>(SHORTCUT_DEFAULTS);
  const [showFloatingHeader, setShowFloatingHeader] = useState(true);
  const [headerVisibility, setHeaderVisibility] = useState<'hover' | 'always'>('hover');
  const [detectedPorts, setDetectedPorts] = useState<DetectedPort[]>([]);

  const [pendingSnippet, setPendingSnippet] = useState<PendingSnippet | null>(null);
  const [currentVarValue, setCurrentVarValue] = useState("");
  const [initialCommandProcessed, setInitialCommandProcessed] = useState(false);
  const promptInputRef = useRef<HTMLInputElement>(null);
  const [cursorBlinkSetting, setCursorBlinkSetting] = useState(true);

  const outputBufferRef = useRef<string>("");
  const checkPortRef = useRef<(() => void) | null>(null);
  const failuresMapRef = useRef<Map<number, number>>(new Map());
  const seenUrlsRef = useRef<Set<string>>(new Set());
  const promotingRef = useRef<Set<number>>(new Set());
  const notifiedPortsRef = useRef<Set<number>>(new Set());
  const activePortsRef = useRef<DetectedPort[]>([]);

  useEffect(() => {
    activePortsRef.current = detectedPorts;
  }, [detectedPorts]);

  const firePortToast = useCallback((dp: DetectedPort) => {
    if (notifiedPortsRef.current.has(dp.port)) return;
    notifiedPortsRef.current.add(dp.port);
    toast.success(`Port ${dp.port} initialized successfully`, {
      description: `You can now access ${dp.url} in your browser.`,
      duration: 6000,
      action: {
        label: 'Open Browser',
        onClick: () => openUrl(dp.url),
      },
    });
  }, []);

  useEffect(() => {
    const loadSettings = async () => {
      const [startup, sh, showHeader, visibility, terminal] = await Promise.all([
        getSettingsGroup<any>('startup', { defaultShell: '' }),
        getSettingsGroup<ShortcutSettings>('shortcuts', SHORTCUT_DEFAULTS),
        getSetting('demo.showFloatingTerminalHeader', true),
        getSetting<'hover' | 'always'>('demo.terminalHeaderVisibility', 'hover'),
        getSettingsGroup<TerminalSettings>('terminal', TERMINAL_DEFAULTS)
      ]);

      setDefaultShell(startup.defaultShell || '');
      setShortcuts(sh);
      setShowFloatingHeader(showHeader);
      setHeaderVisibility(visibility);
      setCursorBlinkSetting(terminal.cursorBlink);
    };
    loadSettings();
  }, []);

  const getThemePalette = useCallback((themeName: string, scheme: 'light' | 'dark') => {
    const themeDef = allThemes.find(t => t.id === themeName) || allThemes.find(t => t.id === 'cortex');
    if (!themeDef) {
      return {
        bg: scheme === 'dark' ? '#0A0A0A' : '#ffffff',
        headerBg: scheme === 'dark' ? '#111111' : '#f5f5f7',
        footerBg: scheme === 'dark' ? '#0A0A0A' : '#ffffff',
        surface: scheme === 'dark' ? '#161616' : '#ffffff',
        border: scheme === 'dark' ? '#262626' : '#d1d1d1',
        textPrimary: scheme === 'dark' ? '#ffffff' : '#000000',
        textSecondary: scheme === 'dark' ? '#A3A3A3' : '#525252',
        accent: '#ffffff',
        ansi: {}
      };
    }
    if (scheme === 'light') {
      return themeDef.light || {
        bg: "#FAFAFA",
        headerBg: "#FFFFFF",
        footerBg: "#F0F0F0",
        surface: "#FFFFFF",
        border: "#E5E7EB",
        textPrimary: "#111827",
        textSecondary: "#4B5563",
        accent: themeDef.dark.accent,
        ansi: {
          ...themeDef.dark.ansi,
          black: '#111827',
          white: '#FFFFFF'
        }
      };
    }
    return themeDef.dark;
  }, [allThemes]);

  const getActiveAnsiColors = useCallback((themeName: string, scheme: 'light' | 'dark') => {
    const palette = getThemePalette(themeName, scheme);
    return palette.ansi || {};
  }, [getThemePalette]);

  // ---------------------------------------------------------------------------
  // Port detection
  // ---------------------------------------------------------------------------

  const promotePort = useCallback(async (port: number, rawUrl: string) => {
    if (PORT_BLOCKLIST.has(port)) return;
    if (promotingRef.current.has(port)) return;
    promotingRef.current.add(port);

    // Normalize URL to http://localhost:PORT
    let url = rawUrl;
    if (!url.startsWith('http')) url = `http://${url}`;
    url = url.replace(/(?:127\.0\.0\.1|0\.0\.0\.0|\[::1\]|\[::\])/g, 'localhost');
    try { url = new URL(url).origin; } catch { /* keep as-is */ }

    // FIX: Check global port ownership.
    // If another terminal is already serving on this port, don't claim it.
    // This prevents cross-pane badge pollution when a terminal's output
    // merely *mentions* a URL that another pane is actually hosting.
    if (!terminalSessionManager.claimPort(id, port)) {
      // Undo seenUrlsRef so we can retry if the owning terminal later releases
      // the port (e.g., its process terminates or is killed).
      seenUrlsRef.current.delete(`http://localhost:${port}`);
      promotingRef.current.delete(port);
      return;
    }

    // Retry up to 3× with 500ms delay to verify the port is actually listening
    let open = false;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const status = await invoke<string>('check_port', { port });
        if (status === 'open') { open = true; break; }
      } catch { /* ignore */ }
      if (attempt < 2) await new Promise(r => setTimeout(r, 500));
    }

    if (open) {
      const newPort: DetectedPort = { port, url, state: 'detected' };
      setDetectedPorts(prev => {
        if (prev.some(p => p.port === port)) return prev;
        return [...prev, newPort];
      });
      firePortToast(newPort);
    } else {
      // Port didn't open — release the speculative claim and undo seenUrls
      // so the next output that mentions this port can try again.
      terminalSessionManager.releasePort(id, port);
      seenUrlsRef.current.delete(`http://localhost:${port}`);
    }

    promotingRef.current.delete(port);
  }, [firePortToast, id]);

  const lastPortCheckRef = useRef<number>(0);
  const portDetectionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runPortDetection = useCallback((text: string) => {
    const portRegex =
      /(?:https?:\/\/localhost:(\d+)|listening on[:\s]+(\d+)|ready on[:\s]+(\d+)|Local:\s+https?:\/\/localhost:(\d+)|server running.*:(\d+)|started on.*:(\d+)|running at.*:(\d+)|available at.*:(\d+)|((?:https?:\/\/)?(?:localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\]|\[::\]):(\d{2,5})))/gi;

    let match: RegExpExecArray | null;
    while ((match = portRegex.exec(text)) !== null) {
      const portStr = match.slice(1).find(g => g && /^\d+$/.test(g));
      if (!portStr) continue;
      const port = parseInt(portStr, 10);
      if (port < 1024 || PORT_BLOCKLIST.has(port)) continue;
      const urlKey = `http://localhost:${port}`;
      if (!seenUrlsRef.current.has(urlKey)) {
        seenUrlsRef.current.add(urlKey);
        promotePort(port, urlKey);
      }
    }
  }, [promotePort]);

  const handlePtyData = useCallback((data: string) => {
    if (xtermRef.current) {
      xtermRef.current.write(data);

      outputBufferRef.current = (outputBufferRef.current + data).slice(-600);

      const now = Date.now();
      if (now - lastPortCheckRef.current > 200) {
        lastPortCheckRef.current = now;
        if (portDetectionTimeoutRef.current) {
          clearTimeout(portDetectionTimeoutRef.current);
          portDetectionTimeoutRef.current = null;
        }
        const cleanText = outputBufferRef.current
          .replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
        runPortDetection(cleanText);
      } else if (!portDetectionTimeoutRef.current) {
        portDetectionTimeoutRef.current = setTimeout(() => {
          lastPortCheckRef.current = Date.now();
          portDetectionTimeoutRef.current = null;
          const cleanText = outputBufferRef.current
            .replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
          runPortDetection(cleanText);
        }, 200);
      }
    }
  }, [runPortDetection]);

  const ptyConfig = useMemo(() => ({
    command,
    cwd,
    rows: dimensions.rows,
    cols: dimensions.cols,
    shell: defaultShell,
    enabled: isMeasured
  }), [command, cwd, dimensions.rows, dimensions.cols, defaultShell, isMeasured]);

  const { write: writeToPty, resize: resizePty, isReady, isTerminated, relaunch: relaunchPty, status } = usePty(id, handlePtyData, ptyConfig);

  useEffect(() => {
    if (command && !initialCommandProcessed && isReady) {
      const varRegex = /\{\{([^}]+)\}\}/g;
      const variables: string[] = [];
      let match;

      const seenVars = new Set<string>();
      while ((match = varRegex.exec(command)) !== null) {
        const varName = match[1];
        if (!seenVars.has(varName)) {
          seenVars.add(varName);
          variables.push(varName);
        }
      }

      if (variables.length > 0) {
        setPendingSnippet({
          originalCommand: command,
          variables,
          resolvedValues: {},
          currentIndex: 0,
          execute: true
        });
        setCurrentVarValue("");
      }
      setInitialCommandProcessed(true);
    }
  }, [command, initialCommandProcessed, isReady]);

  const [relaunchKey, setRelaunchKey] = useState(0);

  const relaunch = useCallback(async () => {
    setDetectedPorts([]);
    failuresMapRef.current.clear();
    seenUrlsRef.current.clear();
    promotingRef.current.clear();
    notifiedPortsRef.current.clear();
    outputBufferRef.current = "";
    setInitialCommandProcessed(false);

    // Release all port ownership so other panes can detect these ports
    // after this terminal restarts.
    terminalSessionManager.releaseAllPortsForTerminal(id);

    await relaunchPty();
    setRelaunchKey(prev => prev + 1);
  }, [relaunchPty, id]);

  // Aggressive cleanup on process termination
  useEffect(() => {
    if (!isTerminated) return;

    // Release all port ownership immediately so other terminals can detect
    // ports that were previously served by this terminal's process.
    terminalSessionManager.releaseAllPortsForTerminal(id);

    if (checkPortRef.current) {
      checkPortRef.current = null;
    }

    const checkExitStatus = async () => {
      let activePorts = detectedPorts.filter(p => p.state === 'detected');
      if (activePorts.length === 0) return;

      const results = await Promise.all(activePorts.map(async (dp) => {
        try {
          const lsofStatus = await invoke<string>('check_port_lsof', { port: dp.port });
          if (lsofStatus === 'closed') return { port: dp.port, status: 'closed' };
          const connStatus = await invoke<string>('check_port', { port: dp.port });
          return { port: dp.port, status: connStatus === 'open' ? 'open' : 'closed' };
        } catch {
          return { port: dp.port, status: 'closed' };
        }
      }));

      let changed = false;
      setDetectedPorts(prev => {
        const next = prev.filter(dp => {
          if (dp.state === 'gone') return false;
          const res = results.find(r => r.port === dp.port);
          if (res && res.status === 'closed') {
            failuresMapRef.current.delete(dp.port);
            seenUrlsRef.current.delete(dp.url);
            changed = true;
            return false;
          }
          return true;
        });
        return changed ? next : prev;
      });

      if (results.some(r => r.status === 'open')) {
        setTimeout(checkExitStatus, 500);
      } else {
        promotingRef.current.clear();
      }
    };

    checkExitStatus();
  }, [isTerminated, detectedPorts, id]);

  // Port Liveness Polling
  useEffect(() => {
    const activePorts = detectedPorts.filter(p => p.state === 'detected');

    activePorts.forEach(dp => {
      terminalSessionManager.registerPortCheck(id, dp.port, dp.url, () => {
        // Release ownership so other terminals can detect this port if they start
        // serving on it after this one's process releases it.
        terminalSessionManager.releasePort(id, dp.port);
        setDetectedPorts(prev => prev.filter(p => p.port !== dp.port));
        seenUrlsRef.current.delete(dp.url);
      });
    });

    return () => {
      activePorts.forEach(dp => {
        terminalSessionManager.unregisterPortCheck(id, dp.port);
      });
    };
  }, [detectedPorts, id]);

  // Synchronize dynamic callbacks with session manager
  useEffect(() => {
    const writeCb = (data: string) => {
      writeToPty(data);
      if (data === '\x03') {
        setTimeout(async () => {
          const activePorts = activePortsRef.current.filter(p => p.state === 'detected');
          if (activePorts.length === 0) return;

          let anyKilled = false;
          for (const p of activePorts) {
            try {
              const status = await invoke<string>('check_port_lsof', { port: p.port });
              if (status === 'open') {
                await invoke('kill_port_process', { port: p.port });
                anyKilled = true;
              }
            } catch (e) {
              console.warn("Failed to kill port process:", e);
            }
          }
          if (anyKilled) {
            checkPortRef.current?.();
          }
        }, 1000);
      }
    };

    const resizeCb = (rows: number, cols: number) => {
      setDimensions({ rows, cols });
      resizePty(rows, cols);
    };

    const keyCb = (e: KeyboardEvent) => {
      const isNumKey = e.key >= '1' && e.key <= '9';
      const isArrowKey = e.key.startsWith('Arrow');
      const isDirectionalNav = e.altKey && isArrowKey;
      const isPaneFocus = (e.ctrlKey || e.metaKey) && isNumKey;
      const isMaximize = (e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'm';
      const isRelaunch = (e.ctrlKey || e.metaKey) && e.altKey && e.key.toLowerCase() === 'r';

      // We no longer block 'Escape' here. This allows it to reach the terminal process
      // (crucial for AI agent CLIs and vim). useAppShortcuts still handles Escape 
      // globally, but focus precedence will now favor the PTY.
      if (isGlobalShortcut(e, shortcuts) || isDirectionalNav || isPaneFocus || isMaximize || isRelaunch) {
        return false;
      }
      return true;
    };

    terminalSessionManager.setWriteDelegate(id, writeCb);
    terminalSessionManager.setResizeDelegate(id, resizeCb);
    terminalSessionManager.setKeyEventHandlerDelegate(id, keyCb);

    return () => {
      if (terminalSessionManager.getWriteDelegate(id) === writeCb) {
        terminalSessionManager.setWriteDelegate(id, undefined);
      }
      if (terminalSessionManager.getResizeDelegate(id) === resizeCb) {
        terminalSessionManager.setResizeDelegate(id, undefined);
      }
      if (terminalSessionManager.getKeyEventHandlerDelegate(id) === keyCb) {
        terminalSessionManager.setKeyEventHandlerDelegate(id, undefined);
      }
    };
  }, [id, writeToPty, resizePty, shortcuts]);

  // Main Terminal Lifecycle
  useEffect(() => {
    if (!terminalRef.current) return;

    let term = terminalSessionManager.getXterm(id) as Terminal | undefined;
    let fitAddon = terminalSessionManager.getFitAddon(id) as FitAddon | undefined;
    let isNew = false;

    if (!term || !fitAddon) {
      isNew = true;

      const root = document.documentElement;
      const initialFontSize = parseInt(getComputedStyle(root).getPropertyValue('--terminal-font-size').trim(), 10) || TERMINAL_DEFAULTS.fontSize;
      const initialFontFamily = getComputedStyle(root).getPropertyValue('--terminal-font-family').trim() || TERMINAL_DEFAULTS.fontFamily;
      const initialLineHeight = parseFloat(getComputedStyle(root).getPropertyValue('--terminal-line-height').trim()) || TERMINAL_DEFAULTS.lineHeight;
      const initialLetterSpacing = parseFloat(getComputedStyle(root).getPropertyValue('--terminal-letter-spacing').trim()) || TERMINAL_DEFAULTS.letterSpacing;

      let initialSettings = { ...TERMINAL_DEFAULTS };
      getSettingsGroup<TerminalSettings>('terminal', TERMINAL_DEFAULTS).then((saved) => {
        initialSettings = saved;
        setCursorBlinkSetting(saved.cursorBlink);
      });

      term = new Terminal({
        cursorBlink: false,
        cursorStyle: initialSettings.cursorStyle,
        fontSize: initialFontSize,
        fontFamily: initialFontFamily,
        lineHeight: initialLineHeight,
        letterSpacing: initialLetterSpacing,
        theme: {
          background: getThemePalette(theme, resolvedScheme).bg || '#000000',
          foreground: getThemePalette(theme, resolvedScheme).textPrimary || '#ffffff',
          cursor: getThemePalette(theme, resolvedScheme).accent || '#ffffff',
          selectionBackground: resolvedScheme === 'dark' ? 'rgba(var(--text-primary-rgb), 0.3)' : 'rgba(0, 0, 0, 0.2)',
          ...getActiveAnsiColors(theme, resolvedScheme)
        },
        allowTransparency: true,
        scrollback: initialSettings.scrollbackLines,
        convertEol: true,
        allowProposedApi: true,
      });

      fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      term.loadAddon(new WebLinksAddon((_event, uri) => {
        openUrl(uri).catch((err: unknown) => {
          console.error('Failed to open external link:', err);
        });
      }));

      terminalSessionManager.setXterm(id, term);
      terminalSessionManager.setFitAddon(id, fitAddon);
    }

    const activeTerm = term;
    const activeFit = fitAddon;

    if (activeTerm.element) {
      if (terminalRef.current && !terminalRef.current.contains(activeTerm.element)) {
        terminalRef.current.innerHTML = '';
        terminalRef.current.appendChild(activeTerm.element);
      }
      activeTerm.refresh(0, activeTerm.rows - 1);
    } else {
      if (terminalRef.current) {
        terminalRef.current.innerHTML = '';
      }
      activeTerm.open(terminalRef.current);
    }

    if (isNew) {
      activeTerm.attachCustomKeyEventHandler((e: KeyboardEvent) => {
        // --- 1. COPY: Ctrl+Shift+C ---
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'c') {
          if (activeTerm.hasSelection()) {
            const text = activeTerm.getSelection();
            navigator.clipboard.writeText(text);
            return false;
          }
        }

        // --- 2. PASTE: Ctrl+Shift+V ---
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'v') {
          navigator.clipboard.readText().then(text => {
            if (text) {
              const delegate = terminalSessionManager.getWriteDelegate(id);
              if (delegate) delegate(text);
            }
          });
          return false;
        }

        const delegate = terminalSessionManager.getKeyEventHandlerDelegate(id);
        if (delegate) return delegate(e);
        return true;
      });

      activeTerm.onResize(({ rows, cols }: { rows: number; cols: number }) => {
        if (rows <= 0 || cols <= 0) return;
        const delegate = terminalSessionManager.getResizeDelegate(id);
        if (delegate) delegate(rows, cols);
      });

      activeTerm.onData((data: string) => {
        const delegate = terminalSessionManager.getWriteDelegate(id);
        if (delegate) delegate(data);
      });
      activeTerm.onBinary((data: string) => {
        const delegate = terminalSessionManager.getWriteDelegate(id);
        if (delegate) delegate(data);
      });
    }

    xtermRef.current = activeTerm;
    fitAddonRef.current = activeFit;

    // -----------------------------------------------------------------------
    // Reconnect dimension handshake: when re-mounting an existing terminal,
    // the container may have changed size while it was detached (tab switch,
    // panel resize). Force a fit + PTY sync to prevent stale dimensions.
    // -----------------------------------------------------------------------
    if (!isNew) {
      requestAnimationFrame(() => {
        if (fitAddonRef.current && terminalRef.current &&
            terminalRef.current.offsetWidth > 0 && terminalRef.current.offsetHeight > 0) {
          try {
            fitAddonRef.current.fit();
            if (xtermRef.current) {
              const { cols, rows } = xtermRef.current;
              if (cols > 0 && rows > 0) {
                setDimensions({ rows, cols });
                const delegate = terminalSessionManager.getResizeDelegate(id);
                if (delegate) delegate(rows, cols);
              }
            }
          } catch {}
        }
      });
    }

    // -----------------------------------------------------------------------
    // Initial measurement gate: use a one-shot ResizeObserver to detect when
    // the container first achieves non-zero dimensions. This replaces the old
    // dual fonts.ready + rAF pattern that caused race conditions.
    // -----------------------------------------------------------------------
    let measureObserver: ResizeObserver | null = null;
    if (isNew || !isMeasured) {
      measureObserver = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (!entry) return;
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0 && fitAddonRef.current && xtermRef.current) {
          // Container is ready — perform the authoritative initial fit
          measureObserver?.disconnect();
          measureObserver = null;

          const doFit = () => {
            try {
              fitAddonRef.current!.fit();
              const { cols, rows } = xtermRef.current!;
              if (cols > 0 && rows > 0) {
                setDimensions({ rows, cols });
                setIsMeasured(true);
              }
            } catch {}
            // Focus the terminal after initial measurement
            xtermRef.current?.focus();
          };

          // Wait for fonts to be ready before measuring character dimensions
          if ('fonts' in document) {
            document.fonts.ready.then(doFit);
          } else {
            doFit();
          }
        }
      });
      if (terminalRef.current) measureObserver.observe(terminalRef.current);
    }

    // -----------------------------------------------------------------------
    // Production-grade ResizeObserver: fires on every container dimension
    // change (pane splits, panel drags, window resizes). Propagates new
    // dimensions to the PTY backend with dedup tracking.
    // -----------------------------------------------------------------------
    let resizeTimeout: ReturnType<typeof setTimeout>;
    let lastSyncCols = 0;
    let lastSyncRows = 0;

    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (!fitAddonRef.current || !terminalRef.current) return;
        const { offsetWidth, offsetHeight } = terminalRef.current;
        // Guard against zero-dimension containers (hidden tabs, animating panes)
        if (offsetWidth === 0 || offsetHeight === 0) return;
        try {
          fitAddonRef.current.fit();
        } catch {
          return; // Terminal may have been disposed
        }
        const term = xtermRef.current;
        if (!term) return;
        const { cols, rows } = term;
        // Only propagate if dimensions actually changed — prevents redundant IPC
        if (cols > 0 && rows > 0 && (cols !== lastSyncCols || rows !== lastSyncRows)) {
          lastSyncCols = cols;
          lastSyncRows = rows;
          const delegate = terminalSessionManager.getResizeDelegate(id);
          if (delegate) delegate(rows, cols);
        }
      }, 50);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    if (terminalRef.current) resizeObserver.observe(terminalRef.current);
    // window.addEventListener('resize') is NOT needed — ResizeObserver on the
    // container element already fires for window resizes, pane splits, and
    // panel drags. Adding it would cause double-fire on every window resize.

    return () => {
      clearTimeout(resizeTimeout);
      resizeObserver.disconnect();
      measureObserver?.disconnect();
    };
  }, [id, relaunchKey]);

  // Theme Sync
  useEffect(() => {
    if (xtermRef.current) {
      const palette = getThemePalette(theme, resolvedScheme);
      xtermRef.current.options.theme = {
        background: palette.bg || '#000000',
        foreground: palette.textPrimary || (resolvedScheme === 'dark' ? '#ffffff' : '#000000'),
        cursor: palette.accent || '#ffffff',
        selectionBackground: resolvedScheme === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.2)',
        ...getActiveAnsiColors(theme, resolvedScheme)
      };
    }
  }, [theme, resolvedScheme, getThemePalette, getActiveAnsiColors]);

  // Settings Dynamic Sync
  useEffect(() => {
    const handleSettingsChange = (e: Event) => {
      const evt = e as CustomEvent<{ terminal?: TerminalSettings; startup?: any; shortcuts?: ShortcutSettings }>;
      const ts = evt.detail?.terminal;
      const ss = evt.detail?.startup;
      const sh = evt.detail?.shortcuts;

      if (ss?.defaultShell !== undefined) setDefaultShell(ss.defaultShell);
      if (sh) setShortcuts(sh);
      if (!xtermRef.current) return;

      if (ts) {
        xtermRef.current.options.fontSize = ts.fontSize;
        xtermRef.current.options.fontFamily = `"${ts.fontFamily}", monospace`;
        xtermRef.current.options.cursorBlink = false;
        xtermRef.current.options.cursorStyle = ts.cursorStyle as 'block' | 'underline' | 'bar';
        xtermRef.current.options.lineHeight = ts.lineHeight;
        xtermRef.current.options.letterSpacing = ts.letterSpacing;
        setCursorBlinkSetting(ts.cursorBlink);
      }

      if ('fonts' in document) {
        document.fonts.ready.then(() => {
          if (fitAddonRef.current && terminalRef.current &&
              terminalRef.current.offsetWidth > 0 && terminalRef.current.offsetHeight > 0) {
            try {
              fitAddonRef.current.fit();
              // Font changes alter character cell size → cols/rows change → sync PTY
              if (xtermRef.current) {
                const { cols, rows } = xtermRef.current;
                if (cols > 0 && rows > 0) {
                  const delegate = terminalSessionManager.getResizeDelegate(id);
                  if (delegate) delegate(rows, cols);
                }
              }
            } catch {}
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
      if (evt.detail?.showFloatingTerminalHeader !== undefined) {
        setShowFloatingHeader(evt.detail.showFloatingTerminalHeader);
      }
      if (evt.detail?.terminalHeaderVisibility !== undefined) {
        setHeaderVisibility(evt.detail.terminalHeaderVisibility as 'hover' | 'always');
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
    // The ResizeObserver already handles dimension changes from layout shifts.
    // We only need one extra fit after CSS transitions complete to catch
    // animations that the ResizeObserver might miss or fire early on.
    const el = terminalRef.current;
    if (!el) return;

    const fitAfterTransition = () => {
      requestAnimationFrame(() => {
        if (fitAddonRef.current && el.offsetWidth > 0 && el.offsetHeight > 0) {
          try { fitAddonRef.current.fit(); } catch {}
        }
      });
    };

    // Immediate fit for the new layout
    fitAfterTransition();

    // Catch CSS transitions on ancestor elements (maximize/zen mode animations)
    const onTransitionEnd = (e: TransitionEvent) => {
      if (e.propertyName === 'width' || e.propertyName === 'height' ||
          e.propertyName === 'flex' || e.propertyName === 'flex-basis' ||
          e.propertyName === 'padding' || e.propertyName === 'inset') {
        fitAfterTransition();
      }
    };
    el.addEventListener('transitionend', onTransitionEnd);

    // Safety fallback: one delayed fit to catch edge cases where transitionend
    // doesn't fire (e.g., no CSS transition defined, instant layout change)
    const fallbackTimer = setTimeout(fitAfterTransition, 300);

    return () => {
      el.removeEventListener('transitionend', onTransitionEnd);
      clearTimeout(fallbackTimer);
    };
  }, [isMaximized, isZenMode, showFloatingHeader, headerVisibility]);

  useEffect(() => {
    const handleFocus = () => { if (xtermRef.current && isFocused && isReady) xtermRef.current.focus(); };
    handleFocus();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [isFocused, isReady]);

  const handleVariableSubmit = useCallback(() => {
    if (!pendingSnippet) return;
    const currentVar = pendingSnippet.variables[pendingSnippet.currentIndex];
    const newResolved = { ...pendingSnippet.resolvedValues, [currentVar]: currentVarValue };
    const nextIndex = pendingSnippet.currentIndex + 1;

    if (nextIndex < pendingSnippet.variables.length) {
      setPendingSnippet({ ...pendingSnippet, resolvedValues: newResolved, currentIndex: nextIndex });
      setCurrentVarValue("");
      setTimeout(() => promptInputRef.current?.focus(), 10);
    } else {
      const finalCommand = resolveVariables(pendingSnippet.originalCommand, newResolved);
      writeToPty(finalCommand);
      if (pendingSnippet.execute) writeToPty('\r');
      setPendingSnippet(null);
      setCurrentVarValue("");
      xtermRef.current?.focus();
    }
  }, [pendingSnippet, currentVarValue, writeToPty]);

  const handleVariableCancel = useCallback(() => {
    setPendingSnippet(null);
    setCurrentVarValue("");
    xtermRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleWriteRequest = (e: any) => {
      const { workspaceId: targetWsId, command, execute } = e.detail;
      if (targetWsId === workspaceId && isFocused && isReady) {
        const variables = extractVariables(command);
        if (variables.length > 0) {
          setPendingSnippet({ originalCommand: command, variables, resolvedValues: {}, currentIndex: 0, execute });
          setCurrentVarValue("");
        } else {
          writeToPty(command);
          if (execute) writeToPty('\r');
        }
      }
    };
    window.addEventListener('cortex:write-to-terminal', handleWriteRequest);
    return () => window.removeEventListener('cortex:write-to-terminal', handleWriteRequest);
  }, [workspaceId, isFocused, isReady, writeToPty]);

  useEffect(() => {
    if (!isFocused || !isReady) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (pendingSnippet) return;
      if (matchesShortcut(e, shortcuts.resetPane)) {
        e.preventDefault();
        relaunch();
        toast.success(`Pane ${index + 1} relaunching...`, { description: "The session is being restarted." });
      } else if (matchesShortcut(e, shortcuts.splitHorizontal)) {
        e.preventDefault();
        onSplit?.(paneId, 'horizontal');
        toast.success(`Pane ${index + 1} splitting...`, { description: "Creating a new horizontal split." });
      } else if (matchesShortcut(e, shortcuts.splitVertical)) {
        e.preventDefault();
        onSplit?.(paneId, 'vertical');
        toast.success(`Pane ${index + 1} splitting...`, { description: "Creating a new vertical split." });
      } else if (matchesShortcut(e, shortcuts.closePane)) {
        e.preventDefault();
        onKill?.(paneId);
        toast.success(`Pane ${index + 1} closing...`, { description: "The pane is being removed from the layout." });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFocused, isReady, relaunch, index, onSplit, onKill, paneId, shortcuts, pendingSnippet]);

  const handleContainerClick = () => {
    if (pendingSnippet) {
      promptInputRef.current?.focus();
    } else if (xtermRef.current && isReady) {
      xtermRef.current.focus();
    }
  };

  const getTerminalPaddingTop = () => {
    if (isZenMode || !showFloatingHeader) return '0px';
    return headerVisibility === 'always' ? '40px' : '0px';
  };

  return (
    <div
      className="group"
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-color)'
      }}
    >
      {showFloatingHeader && (
        <PaneElevator
          paneId={paneId}
          name={name}
          index={index}
          isFocused={isFocused}
          isMaximized={isMaximized}
          isZenMode={isZenMode}
          onMaximize={onMaximize}
          onSplit={(direction) => onSplit?.(paneId, direction)}
          onKill={() => onKill?.(paneId)}
          onRename={(newName) => onRename?.(paneId, newName)}
          onRelaunch={relaunch}
          detectedPorts={detectedPorts}
          headerVisibility={headerVisibility}
        />
      )}

      {getTerminalPaddingTop() !== '0px' && (
        <div style={{
          height: getTerminalPaddingTop(),
          width: '100%',
          flexShrink: 0,
          transition: 'height 0.3s ease'
        }} />
      )}

      <div
        className="terminal-viewport"
        data-cursor-status={status}
        data-cursor-blink={cursorBlinkSetting}
        style={{
          flex: 1,
          width: '100%',
          padding: '0px',
          boxSizing: 'border-box',
          overflow: 'hidden',
          background: 'transparent',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div
          ref={terminalRef}
          className="terminal-container"
          onClick={handleContainerClick}
          style={{
            flex: 1,
            width: '100%',
            height: '100%',
            margin: '0',
            background: 'transparent',
            overflow: 'hidden'
          }}
        />
      </div>

      <AnimatePresence>
        {pendingSnippet && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.98 }}
            className="absolute inset-0 z-[100] flex items-center justify-center p-6 bg-black/20 backdrop-blur-sm"
          >
            <div
              className="w-full max-w-md bg-[var(--surface-color)]/80 backdrop-blur-xl border border-[var(--border-color)] rounded-xl shadow-2xl overflow-hidden"
              style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}
            >
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[var(--accent-primary)] animate-pulse" />
                    <span className="text-[10px] font-bold text-[var(--accent-primary)]">Fill Snippet Variables</span>
                  </div>
                  <button
                    onClick={handleVariableCancel}
                    className="p-1 hover:bg-[var(--text-primary)]/5 rounded-md text-[var(--text-secondary)] transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">
                    Enter value for <span className="text-[var(--accent-primary)] font-mono">
                      {pendingSnippet.variables[pendingSnippet.currentIndex]}
                    </span>
                  </h3>
                  <p className="text-[11px] text-[var(--text-secondary)] font-medium leading-relaxed opacity-80">
                    Snippet: <span className="font-mono bg-[var(--text-primary)]/[0.03] px-1 rounded">{pendingSnippet.originalCommand}</span>
                  </p>
                </div>

                <div className="relative pt-1">
                  <Input
                    ref={promptInputRef}
                    autoFocus
                    value={currentVarValue}
                    onChange={(e) => setCurrentVarValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.stopPropagation();
                        handleVariableSubmit();
                      }
                      if (e.key === 'Escape') {
                        e.stopPropagation();
                        handleVariableCancel();
                      }
                    }}
                    placeholder={`Type ${pendingSnippet.variables[pendingSnippet.currentIndex].toLowerCase()}...`}
                    className="h-11 bg-[var(--text-primary)]/[0.03] border-[var(--border-color)] focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] text-sm font-mono transition-all pr-12"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 mt-0.5 pointer-events-none opacity-40">
                    <CornerDownLeft size={16} />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <Kbd className="text-[9px] px-1 py-0.5">Enter</Kbd>
                      <span className="text-[10px] font-bold text-[var(--text-secondary)]">Submit</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Kbd className="text-[9px] px-1 py-0.5">Esc</Kbd>
                      <span className="text-[10px] font-bold text-[var(--text-secondary)]">Cancel</span>
                    </div>
                  </div>
                  <div className="text-[10px] font-mono text-[var(--text-secondary)] font-bold">
                    {pendingSnippet.currentIndex + 1} / {pendingSnippet.variables.length}
                  </div>
                </div>
              </div>

              <div className="h-1 w-full bg-[var(--text-primary)]/5">
                <motion.div
                  className="h-full bg-[var(--accent-primary)]"
                  initial={{ width: 0 }}
                  animate={{ width: `${((pendingSnippet.currentIndex) / pendingSnippet.variables.length) * 100}%` }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{
        position: 'absolute', inset: 0, background: 'var(--bg-color)', opacity: 0.85, backdropFilter: 'blur(8px)',
        flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        zIndex: 100, gap: '0.75rem', fontFamily: 'JetBrains Mono, monospace',
        display: isTerminated ? 'flex' : 'none'
      }}>
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.15em' }}>
          Terminal Stopped
        </span>
        <Button
          onClick={() => relaunch()}
          className="primary btn-tactile"
          style={{ padding: '0.4rem 1rem', fontSize: '0.7rem', letterSpacing: '0.05em', borderRadius: 'var(--radius-sm)' }}
        >
          Restart Session
        </Button>
      </div>
    </div>
  );
}

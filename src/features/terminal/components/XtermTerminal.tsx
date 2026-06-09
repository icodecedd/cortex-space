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

// Port state machine types
// ... (rest of imports remains same, just adding snippet-utils)
export type PortState = 'detected' | 'gone';
export interface DetectedPort {
  port: number;
  url: string;
  state: PortState;
}

// Variable Snippet types
interface PendingSnippet {
  originalCommand: string;
  variables: string[];
  resolvedValues: Record<string, string>;
  currentIndex: number;
  execute: boolean;
}

// Well-known non-browser ports blocklist (mirrors Rust side)
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
  isMaximized = false,
  onMaximize,
  name,
  onSplit,
  onKill,
  onRename,
  onSaveSnippet
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
  
  // Snippet Variable State
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

  // Keep ref in sync with state for callbacks
  useEffect(() => {
    activePortsRef.current = detectedPorts;
  }, [detectedPorts]);


  // Show one-time toast per newly detected port
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

  // Centralized Settings Fetching
  useEffect(() => {
    const loadSettings = async () => {
      const [startup, sh, showHeader, visibility, terminal] = await Promise.all([
        getSettingsGroup<TerminalSettings>('startup', { defaultShell: '' } as any),
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

  // Port Promotion: verify a candidate port before adding it to state
  const promotePort = useCallback(async (port: number, rawUrl: string) => {
    if (PORT_BLOCKLIST.has(port)) return;
    if (promotingRef.current.has(port)) return;
    promotingRef.current.add(port);

    // Normalize URL to http://localhost:PORT
    let url = rawUrl;
    if (!url.startsWith('http')) url = `http://${url}`;
    url = url.replace(/(?:127\.0\.0\.1|0\.0\.0\.0|\[::1\]|\[::\])/g, 'localhost');
    // Strip path — we only need the origin for browser opening
    try { url = new URL(url).origin; } catch { /* keep as-is */ }

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
        if (prev.some(p => p.port === port)) return prev; // already tracked
        return [...prev, newPort];
      });
      firePortToast(newPort);
    }

    promotingRef.current.delete(port);
  }, [firePortToast]);

  const lastPortCheckRef = useRef<number>(0);
  const portDetectionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runPortDetection = useCallback((text: string) => {
    // Spec regex: covers Vite, Next.js, Express, Remix, Astro, Nuxt, Rails, Django, etc.
    const portRegex =
      /(?:https?:\/\/localhost:(\d+)|listening on[:\s]+(\d+)|ready on[:\s]+(\d+)|Local:\s+https?:\/\/localhost:(\d+)|server running.*:(\d+)|started on.*:(\d+)|running at.*:(\d+)|available at.*:(\d+)|((?:https?:\/\/)?(?:localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\]|\[::\]):(\d{2,5})))/gi;

    let match: RegExpExecArray | null;
    while ((match = portRegex.exec(text)) !== null) {
      // Find first non-undefined capture group that is a pure port number
      const portStr = match.slice(1).find(g => g && /^\d+$/.test(g));
      if (!portStr) continue;
      const port = parseInt(portStr, 10);
      // Ignore ports < 1024 (system ports) and blocklisted ones
      if (port < 1024 || PORT_BLOCKLIST.has(port)) continue;
      // Build a canonical URL key for dedup
      const urlKey = `http://localhost:${port}`;
      if (!seenUrlsRef.current.has(urlKey)) {
        seenUrlsRef.current.add(urlKey);
        promotePort(port, urlKey);
      }
    }
  }, [promotePort]);

  // CHECKLIST ITEM 3: Single-Source Rendering — string data from backend
  const handlePtyData = useCallback((data: string) => {
    if (xtermRef.current) {
      xtermRef.current.write(data);

      // Maintain rolling context buffer (last 600 chars)
      outputBufferRef.current = (outputBufferRef.current + data).slice(-600);

      // Throttled port detection: run at most once every 200ms
      const now = Date.now();
      if (now - lastPortCheckRef.current > 200) {
        lastPortCheckRef.current = now;
        if (portDetectionTimeoutRef.current) {
          clearTimeout(portDetectionTimeoutRef.current);
          portDetectionTimeoutRef.current = null;
        }

        // Strip ANSI escape codes before regex matching
        const cleanText = outputBufferRef.current
          .replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');

        runPortDetection(cleanText);
      } else if (!portDetectionTimeoutRef.current) {
        // Ensure the last few characters are eventually checked
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

  // Handle initial command prop for variable detection
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


  const relaunch = useCallback(() => {
    setDetectedPorts([]);
    failuresMapRef.current.clear();
    seenUrlsRef.current.clear();
    promotingRef.current.clear();
    notifiedPortsRef.current.clear();
    outputBufferRef.current = "";
    relaunchPty();
  }, [relaunchPty]);

  // Aggressive cleanup on process termination
  // We do not instantly remove the badges. Instead, we aggressively poll the ports
  // to confirm they have been released by the OS. This prevents premature badge removal
  // and race conditions where a killed node process lingers in TIME_WAIT.
  useEffect(() => {
    if (!isTerminated) return;

    // Cancel regular liveness polling immediately
    if (checkPortRef.current) {
      checkPortRef.current = null;
    }

    const checkExitStatus = async () => {
      let activePorts = detectedPorts.filter(p => p.state === 'detected');
      if (activePorts.length === 0) return;

      const results = await Promise.all(activePorts.map(async (dp) => {
        try {
          // check_port_lsof provides a definitive "is it listening" system check
          const lsofStatus = await invoke<string>('check_port_lsof', { port: dp.port });
          if (lsofStatus === 'closed') return { port: dp.port, status: 'closed' };

          // Fallback to connection test if lsof is inconclusive
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

      // If there are still active ports, continue aggressive polling
      if (results.some(r => r.status === 'open')) {
        setTimeout(checkExitStatus, 500); // 500ms aggressive poll
      } else {
        promotingRef.current.clear();
      }
    };

    checkExitStatus();

    // Note: keep notifiedPortsRef — we still want toast dedup across restarts
  }, [isTerminated, detectedPorts]);

  // Port Liveness Polling — periodically verify detected ports are still listening
  useEffect(() => {
    const activePorts = detectedPorts.filter(p => p.state === 'detected');
    
    activePorts.forEach(dp => {
      terminalSessionManager.registerPortCheck(id, dp.port, dp.url, () => {
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

  // Synchronize dynamic callbacks (write, resize, shortcuts) with session manager
  useEffect(() => {
    const writeCb = (data: string) => {
      writeToPty(data);
      if (data === '\x03') { // Ctrl+C keypress
        // On Windows, child processes like node.exe are often orphaned when Ctrl+C is sent to npm.cmd.
        // We wait 1 second for graceful shutdown. If the port is still bound, we forcefully kill it.
        setTimeout(async () => {
          const activePorts = activePortsRef.current.filter(p => p.state === 'detected');
          if (activePorts.length === 0) return;
          
          let anyKilled = false;
          for (const p of activePorts) {
            try {
              const status = await invoke<string>('check_port_lsof', { port: p.port });
              if (status === 'open') {
                console.log(`[PTY ${id}] Port ${p.port} still open after Ctrl+C, forcefully killing process.`);
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
      const isEscape = e.key === 'Escape';
      const isNumKey = e.key >= '1' && e.key <= '9';
      const isArrowKey = e.key.startsWith('Arrow');
      const isDirectionalNav = e.altKey && isArrowKey;
      const isPaneFocus = (e.ctrlKey || e.metaKey) && isNumKey;
      const isMaximize = (e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'm';
      const isRelaunch = (e.ctrlKey || e.metaKey) && e.altKey && e.key.toLowerCase() === 'r';

      if (isGlobalShortcut(e, shortcuts) || isEscape || isDirectionalNav || isPaneFocus || isMaximize || isRelaunch) {
        return false; // Bubble up
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

      // Load full settings from store for fields not covered by CSS vars
      let initialSettings = { ...TERMINAL_DEFAULTS };
      getSettingsGroup<TerminalSettings>('terminal', TERMINAL_DEFAULTS).then((saved) => {
        initialSettings = saved;
        setCursorBlinkSetting(saved.cursorBlink);
      });

      term = new Terminal({
        cursorBlink: false, // Always false - we handle blinking ourselves in CSS!
        cursorStyle: initialSettings.cursorStyle,
        fontSize: initialFontSize,
        fontFamily: initialFontFamily,
        lineHeight: initialLineHeight,
        letterSpacing: initialLetterSpacing,
        theme: {
          background: getThemePalette(theme, resolvedScheme).bg || '#000000',
          foreground: getThemePalette(theme, resolvedScheme).textPrimary || '#ffffff',
          cursor: getThemePalette(theme, resolvedScheme).accent || '#ffffff',
          selectionBackground: resolvedScheme === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.2)',
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
      terminalRef.current.appendChild(activeTerm.element);
      activeTerm.refresh(0, activeTerm.rows - 1);
    } else {
      activeTerm.open(terminalRef.current);
    }

    if (isNew) {
      // Centralized shortcut bubbling logic via dynamic delegate lookup
      activeTerm.attachCustomKeyEventHandler((e: KeyboardEvent) => {
        const delegate = terminalSessionManager.getKeyEventHandlerDelegate(id);
        if (delegate) {
          return delegate(e);
        }
        return true; // default: do not bubble
      });

      activeTerm.onResize(({ rows, cols }: { rows: number; cols: number }) => {
        if (rows <= 0 || cols <= 0) return;
        const delegate = terminalSessionManager.getResizeDelegate(id);
        if (delegate) {
          delegate(rows, cols);
        }
      });

      activeTerm.onData((data: string) => {
        const delegate = terminalSessionManager.getWriteDelegate(id);
        if (delegate) {
          delegate(data);
        }
      });
      activeTerm.onBinary((data: string) => {
        const delegate = terminalSessionManager.getWriteDelegate(id);
        if (delegate) {
          delegate(data);
        }
      });
    }

    xtermRef.current = activeTerm;
    fitAddonRef.current = activeFit;

    const performInitialFit = () => {
      if (fitAddonRef.current && xtermRef.current && terminalRef.current && terminalRef.current.offsetWidth > 0) {
        try {
          fitAddonRef.current.fit();
          setDimensions({ rows: xtermRef.current.rows, cols: xtermRef.current.cols });
          setIsMeasured(true);
        } catch (e) {}
      }
    };

    if ('fonts' in document) {
      document.fonts.ready.then(() => performInitialFit());
    } else {
      performInitialFit();
    }

    const rafId = requestAnimationFrame(() => {
      if (fitAddonRef.current && xtermRef.current && terminalRef.current && terminalRef.current.offsetWidth > 0) {
        try {
          fitAddonRef.current.fit();
          setDimensions({ rows: xtermRef.current.rows, cols: xtermRef.current.cols });
          setIsMeasured(true);
        } catch (e) {}
        xtermRef.current.focus();
      }
    });

    let resizeTimeout: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (fitAddonRef.current && terminalRef.current && terminalRef.current.offsetWidth > 0) {
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
      resizeObserver.disconnect();
    };
  }, [id]);

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
        xtermRef.current.options.cursorBlink = false; // Always false - we handle blinking ourselves in CSS!
        xtermRef.current.options.cursorStyle = ts.cursorStyle as 'block' | 'underline' | 'bar';
        xtermRef.current.options.lineHeight = ts.lineHeight;
        xtermRef.current.options.letterSpacing = ts.letterSpacing;
        setCursorBlinkSetting(ts.cursorBlink);
      }

      if ('fonts' in document) {
        document.fonts.ready.then(() => {
          if (fitAddonRef.current && terminalRef.current && terminalRef.current.offsetWidth > 0) {
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
    const fit = () => {
      if (fitAddonRef.current && terminalRef.current && terminalRef.current.offsetWidth > 0) {
        try { fitAddonRef.current.fit(); } catch (e) {}
      }
    };

    fit();
    const t1 = setTimeout(fit, 50);
    const t2 = setTimeout(fit, 150);
    const t3 = setTimeout(fit, 350);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [isMaximized, isZenMode, showFloatingHeader, headerVisibility]);

  useEffect(() => {
    const handleFocus = () => { if (xtermRef.current && isFocused && isReady) xtermRef.current.focus(); };
    handleFocus();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [isFocused, isReady]);

  // Handle Variable Prompt Logic
  const handleVariableSubmit = useCallback(() => {
    if (!pendingSnippet) return;

    const currentVar = pendingSnippet.variables[pendingSnippet.currentIndex];
    const newResolved = { ...pendingSnippet.resolvedValues, [currentVar]: currentVarValue };
    const nextIndex = pendingSnippet.currentIndex + 1;

    if (nextIndex < pendingSnippet.variables.length) {
      // More variables to fill
      setPendingSnippet({
        ...pendingSnippet,
        resolvedValues: newResolved,
        currentIndex: nextIndex
      });
      setCurrentVarValue("");
      // Refocus input
      setTimeout(() => promptInputRef.current?.focus(), 10);
    } else {
      // All variables resolved, construct final command
      const finalCommand = resolveVariables(pendingSnippet.originalCommand, newResolved);

      // Write to PTY
      writeToPty(finalCommand);
      if (pendingSnippet.execute) {
        writeToPty('\r');
      }

      // Cleanup
      setPendingSnippet(null);
      setCurrentVarValue("");
      // Return focus to terminal
      xtermRef.current?.focus();
    }
  }, [pendingSnippet, currentVarValue, writeToPty]);

  const handleVariableCancel = useCallback(() => {
    setPendingSnippet(null);
    setCurrentVarValue("");
    xtermRef.current?.focus();
  }, []);

  // Listen for the custom "cortex:write-to-terminal" event (Command Snippet injection)
  useEffect(() => {
    const handleWriteRequest = (e: any) => {
      const { workspaceId: targetWsId, command, execute } = e.detail;

      // We only respond if we are in the target workspace AND we are the currently focused pane
      if (targetWsId === workspaceId && isFocused && isReady) {
        const variables = extractVariables(command);

        if (variables.length > 0) {
          // Enter interactive prompting mode
          setPendingSnippet({
            originalCommand: command,
            variables,
            resolvedValues: {},
            currentIndex: 0,
            execute
          });
          setCurrentVarValue("");
        } else {
          // No variables, write directly
          writeToPty(command);
          if (execute) {
            writeToPty('\r');
          }
        }
      }
    };

    window.addEventListener('cortex:write-to-terminal', handleWriteRequest);
    return () => window.removeEventListener('cortex:write-to-terminal', handleWriteRequest);
  }, [workspaceId, isFocused, isReady, writeToPty]);

  useEffect(() => {
    if (!isFocused || !isReady) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      // If we are in variable prompting mode, ignore these shortcuts
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
          onSaveSnippet={onSaveSnippet}
          terminalInstance={xtermRef.current}
          detectedPorts={detectedPorts}
          headerVisibility={headerVisibility}
        />
      )}

      {/* Spacer for the floating header in 'always' mode */}
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
                    <span className="text-[10px] font-bold text-[var(--accent-primary)] uppercase tracking-widest">Fill Snippet Variables</span>
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
                      if (e.key === 'Enter') handleVariableSubmit();
                      if (e.key === 'Escape') handleVariableCancel();
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
                      <Kbd className="text-[9px] px-1 py-0.5">ENTER</Kbd>
                      <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase">Submit</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Kbd className="text-[9px] px-1 py-0.5">ESC</Kbd>
                      <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase">Cancel</span>
                    </div>
                  </div>
                  <div className="text-[10px] font-mono text-[var(--text-secondary)] font-bold">
                    {pendingSnippet.currentIndex + 1} / {pendingSnippet.variables.length}
                  </div>
                </div>
              </div>
              
              {/* Progress Bar */}
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
          TERMINAL STOPPED
        </span>
        <Button
          onClick={() => relaunch()}
          className="primary btn-tactile"
          style={{ padding: '0.4rem 1rem', fontSize: '0.7rem', letterSpacing: '0.05em', borderRadius: 'var(--radius-sm)' }}
        >
          RESTART SESSION
        </Button>
      </div>
    </div>
  );
}

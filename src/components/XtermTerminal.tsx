import { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { openUrl } from '@tauri-apps/plugin-opener';
import { invoke } from '@tauri-apps/api/core';
import { useTheme } from '../hooks/useTheme';
import { useColorScheme } from '../hooks/useColorScheme';
import { usePty } from '../hooks/usePty';
import { Button } from "@/components/ui/button";
import { getSetting, getSettingsGroup, TERMINAL_DEFAULTS, TerminalSettings, SHORTCUT_DEFAULTS, ShortcutSettings, DemoSettings } from '@/lib/store';
import { isGlobalShortcut, matchesShortcut } from '@/lib/shortcut-utils';
import { toast } from "sonner";
import { PaneElevator } from './space/PaneElevator';
import { terminalSessionManager } from '../lib/terminalSessionManager';
import '@xterm/xterm/css/xterm.css';

// Port state machine types
export type PortState = 'detected' | 'gone';
export interface DetectedPort {
  port: number;
  url: string;
  state: PortState;
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
    toast.success(`Port ${dp.port} is ready`, {
      description: dp.url,
      duration: 6000,
      action: {
        label: 'Open Browser',
        onClick: () => openUrl(dp.url),
      },
    });
  }, []);


  useEffect(() => {
    getSettingsGroup<TerminalSettings>('startup', { defaultShell: '' } as any).then((saved: any) => {
      setDefaultShell(saved.defaultShell || '');
    });
    getSettingsGroup<ShortcutSettings>('shortcuts', SHORTCUT_DEFAULTS).then(setShortcuts);
    getSetting('demo.showFloatingTerminalHeader', true).then(setShowFloatingHeader);
    getSetting<'hover' | 'always'>('demo.terminalHeaderVisibility', 'hover').then(setHeaderVisibility);
  }, []);

  const getThemePalette = useCallback((themeName: string, scheme: 'light' | 'dark') => {
    const themeDef = allThemes.find(t => t.id === themeName) || allThemes.find(t => t.id === 'soft-monochrome');
    if (!themeDef) {
      return {
        bg: scheme === 'dark' ? '#050505' : '#ffffff',
        headerBg: scheme === 'dark' ? '#0c0c0c' : '#f5f5f7',
        footerBg: scheme === 'dark' ? '#050505' : '#ffffff',
        surface: scheme === 'dark' ? '#0c0c0c' : '#ffffff',
        border: scheme === 'dark' ? '#1a1a1a' : '#d1d1d1',
        textPrimary: scheme === 'dark' ? '#ffffff' : '#000000',
        textSecondary: scheme === 'dark' ? '#737373' : '#525252',
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

  // CHECKLIST ITEM 3: Single-Source Rendering — string data from backend
  const handlePtyData = useCallback((data: string) => {
    if (xtermRef.current) {
      xtermRef.current.write(data);

      // Maintain rolling context buffer (last 600 chars)
      outputBufferRef.current = (outputBufferRef.current + data).slice(-600);

      // Strip ANSI escape codes before regex matching
      const cleanText = outputBufferRef.current
        .replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');

      // Spec regex: covers Vite, Next.js, Express, Remix, Astro, Nuxt, Rails, Django, etc.
      const portRegex =
        /(?:https?:\/\/localhost:(\d+)|listening on[:\s]+(\d+)|ready on[:\s]+(\d+)|Local:\s+https?:\/\/localhost:(\d+)|server running.*:(\d+)|started on.*:(\d+)|running at.*:(\d+)|available at.*:(\d+)|((?:https?:\/\/)?(?:localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\]|\[::\]):(\d{2,5})))/gi;

      let match: RegExpExecArray | null;
      while ((match = portRegex.exec(cleanText)) !== null) {
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
    }
  }, [promotePort]);


  const ptyConfig = useMemo(() => ({
    command,
    cwd,
    rows: dimensions.rows,
    cols: dimensions.cols,
    shell: defaultShell,
    enabled: isMeasured
  }), [command, cwd, dimensions.rows, dimensions.cols, defaultShell, isMeasured]);

  const { write: writeToPty, resize: resizePty, isReady, isTerminated, relaunch: relaunchPty } = usePty(id, handlePtyData, ptyConfig);


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
    if (detectedPorts.filter(p => p.state === 'detected').length === 0) {
      failuresMapRef.current.clear();
      return;
    }

    const maxFailures = 3;
    let isChecking = false;

    const checkAll = async () => {
      if (isChecking) return;
      isChecking = true;

      const activePorts = detectedPorts.filter(p => p.state === 'detected');
      const results = await Promise.all(activePorts.map(async (dp) => {
        try {
          const status = await invoke<string>('check_port', { port: dp.port });
          return { port: dp.port, status };
        } catch {
          return { port: dp.port, status: 'error' };
        }
      }));

      let changed = false;
      setDetectedPorts(prev => {
        const next = prev.filter(dp => {
          if (dp.state === 'gone') return false; // already gone, prune
          const res = results.find(r => r.port === dp.port);
          if (!res) return true;
          if (res.status === 'open') {
            failuresMapRef.current.set(dp.port, 0);
            return true;
          }
          // Connection refused — remove immediately
          if (res.status === 'refused') {
            failuresMapRef.current.delete(dp.port);
            seenUrlsRef.current.delete(dp.url);
            changed = true;
            return false;
          }
          // Timeout / error — increment failure count
          const failures = (failuresMapRef.current.get(dp.port) || 0) + 1;
          failuresMapRef.current.set(dp.port, failures);
          if (failures >= maxFailures) {
            failuresMapRef.current.delete(dp.port);
            seenUrlsRef.current.delete(dp.url);
            changed = true;
            return false;
          }
          return true;
        });
        return changed ? next : prev;
      });

      isChecking = false;
    };

    checkPortRef.current = checkAll;
    const checkInterval = setInterval(checkAll, 5000);
    return () => {
      clearInterval(checkInterval);
      checkPortRef.current = null;
    };
  }, [detectedPorts.length, id]);

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
      });

      term = new Terminal({
        cursorBlink: initialSettings.cursorBlink,
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
        xtermRef.current.options.cursorBlink = ts.cursorBlink;
        xtermRef.current.options.cursorStyle = ts.cursorStyle as 'block' | 'underline' | 'bar';
        xtermRef.current.options.lineHeight = ts.lineHeight;
        xtermRef.current.options.letterSpacing = ts.letterSpacing;
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

  // Listen for the custom "cortex:write-to-terminal" event (Command Snippet injection)
  useEffect(() => {
    const handleWriteRequest = (e: any) => {
      const { workspaceId: targetWsId, command, execute } = e.detail;

      // We only respond if we are in the target workspace AND we are the currently focused pane
      if (targetWsId === workspaceId && isFocused && isReady) {
        // Write the command directly
        writeToPty(command);

        // If execution is requested, send the Enter signal
        if (execute) {
          writeToPty('\r');
        }
      }
    };

    window.addEventListener('cortex:write-to-terminal', handleWriteRequest);
    return () => window.removeEventListener('cortex:write-to-terminal', handleWriteRequest);
  }, [workspaceId, isFocused, isReady, writeToPty]);

  useEffect(() => {
    if (!isFocused || !isReady) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (matchesShortcut(e, shortcuts.resetPane)) {
        e.preventDefault();
        relaunch();
        toast.success(`Pane Execution Triggered`, { description: `Relaunching PANE ${index + 1}...` });
      } else if (matchesShortcut(e, shortcuts.splitHorizontal)) {
        e.preventDefault();
        onSplit?.(paneId, 'horizontal');
        toast.success(`Pane Split`, { description: `Splitting PANE ${index + 1} horizontally...` });
      } else if (matchesShortcut(e, shortcuts.splitVertical)) {
        e.preventDefault();
        onSplit?.(paneId, 'vertical');
        toast.success(`Pane Split`, { description: `Splitting PANE ${index + 1} vertically...` });
      } else if (matchesShortcut(e, shortcuts.closePane)) {
        e.preventDefault();
        onKill?.(paneId);
        toast.success(`Pane Closed`, { description: `Closing PANE ${index + 1}...` });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFocused, isReady, relaunch, index, onSplit, onKill, paneId, shortcuts]);

  const handleContainerClick = () => { if (xtermRef.current && isReady) xtermRef.current.focus(); };

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
          name={name}
          index={index}
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
      <div style={{
        position: 'absolute', inset: 0, background: 'var(--bg-color)', opacity: 0.85, backdropFilter: 'blur(8px)',
        flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
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

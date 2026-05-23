import { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { openUrl } from '@tauri-apps/plugin-opener';
import { useTheme } from '../hooks/useTheme';
import { usePty } from '../hooks/usePty';
import '@xterm/xterm/css/xterm.css';

interface XtermTerminalProps {
  id: string;
  isFocused: boolean;
  command?: string;
  cwd?: string;
}

export function XtermTerminal({ id, isFocused, command, cwd }: XtermTerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const { theme } = useTheme();
  
  const [dimensions, setDimensions] = useState({ rows: 24, cols: 80 });

  // CHECKLIST ITEM 3: Single-Source Rendering
  // Confirm that data only appears in the terminal UI *after* it has made a full round trip from the backend process.
  // Data from Backend -> Frontend
  const handlePtyData = useCallback((data: Uint8Array) => {
    // Optional debug logging can go here:
    // console.log(`[XtermTerminal ${id}] Received data length: ${data.length}`);
    if (xtermRef.current) {
      xtermRef.current.write(data);
    }
  }, [id]);

  const ptyConfig = useMemo(() => ({ 
    command, 
    cwd, 
    rows: dimensions.rows, 
    cols: dimensions.cols 
  }), [command, cwd, dimensions.rows, dimensions.cols]);

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
    const initialFontSize = parseInt(getComputedStyle(root).getPropertyValue('--terminal-font-size').trim(), 10) || 12;
    const initialFontFamily = getComputedStyle(root).getPropertyValue('--terminal-font-family').trim() || '"JetBrains Mono", monospace';

    const term = new Terminal({
      cursorBlink: true,
      fontSize: initialFontSize,
      fontFamily: initialFontFamily,
      theme: {
        background: 'transparent',
        foreground: getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim() || '#ffffff',
        cursor: getComputedStyle(document.documentElement).getPropertyValue('--accent-primary').trim() || '#ffffff',
        selectionBackground: 'rgba(255, 255, 255, 0.3)',
      },
      allowTransparency: true,
      scrollback: 10000,
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
    
    // Register resize listener BEFORE initial fit
    term.onResize(({ rows, cols }) => {
      setDimensions({ rows, cols });
      resizeRef.current(rows, cols);
    });

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    // Initial size sync & font guard
    const performInitialFit = () => {
      if (fitAddonRef.current && xtermRef.current) {
        try {
          fitAddonRef.current.fit();
          setDimensions({ rows: xtermRef.current.rows, cols: xtermRef.current.cols });
        } catch (e) {
          // fit() can sometimes throw if container is 0x0
        }
      }
    };

    if ('fonts' in document) {
      document.fonts.ready.then(() => {
        performInitialFit();
      });
    } else {
      performInitialFit();
    }

    // Give xterm focus immediately after mount
    const rafId = requestAnimationFrame(() => {
      if (fitAddonRef.current && xtermRef.current) {
        try {
          fitAddonRef.current.fit();
        } catch (e) {}
        xtermRef.current.focus();
      }
    });

    // CHECKLIST ITEM 1: Verify Input Event Handling
    // CHECKLIST ITEM 2: Check for Local Echo Elimination
    // Ensure terminal.onData or terminal.onKey only forwards data down the IPC / WebSocket bridge.
    // Confirm there are NO instances of terminal.write() inside input event listeners.
    term.onData((data) => {
      writeRef.current(data);
    });

    // Forward binary data (required for some CLIs)
    term.onBinary((data) => {
      writeRef.current(data);
    });

    // Dynamic UI Resize Handling
    let resizeTimeout: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (fitAddonRef.current) {
          try {
            fitAddonRef.current.fit();
          } catch (e) {
            // fit() can sometimes throw if container is 0x0
          }
        }
      }, 50);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    if (terminalRef.current) {
      resizeObserver.observe(terminalRef.current);
    }
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

  // Settings Dynamic Sync (Font Size & Family)
  useEffect(() => {
    const handleSettingsChange = () => {
      if (xtermRef.current) {
        const root = document.documentElement;
        const fontSizeStr = getComputedStyle(root).getPropertyValue('--terminal-font-size').trim();
        const fontFamilyStr = getComputedStyle(root).getPropertyValue('--terminal-font-family').trim();
        
        if (fontSizeStr) {
          xtermRef.current.options.fontSize = parseInt(fontSizeStr, 10);
        }
        if (fontFamilyStr) {
          xtermRef.current.options.fontFamily = fontFamilyStr;
        }
        
        // Wait for font loading to ensure accurate character width measurements
        if ('fonts' in document) {
          document.fonts.ready.then(() => {
            if (fitAddonRef.current) {
              try {
                fitAddonRef.current.fit();
              } catch (e) {}
            }
          });
        }
      }
    };

    window.addEventListener('cortex-settings-changed', handleSettingsChange);
    return () => {
      window.removeEventListener('cortex-settings-changed', handleSettingsChange);
    };
  }, []);

  // Purge Scrollback listener
  useEffect(() => {
    const handlePurge = () => {
      if (xtermRef.current) {
        xtermRef.current.clear();
      }
    };
    window.addEventListener('cortex-purge-scrollback', handlePurge);
    return () => {
      window.removeEventListener('cortex-purge-scrollback', handlePurge);
    };
  }, []);

  // Disable native suggestions/autocorrect on the DOM container
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.setAttribute('autocomplete', 'off');
      terminalRef.current.setAttribute('autocorrect', 'off');
      terminalRef.current.setAttribute('autocapitalize', 'off');
      terminalRef.current.setAttribute('spellcheck', 'false');
    }
  }, []);

  // Focus Handling (Tab focus & Window focus restoration)
  useEffect(() => {
    const handleFocus = () => {
      if (xtermRef.current && isFocused && isReady) {
        xtermRef.current.focus();
      }
    };

    // Trigger immediately on prop changes
    handleFocus();

    // Restore focus when window/app regains OS focus
    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [isFocused, isReady]);

  const handleContainerClick = () => {
    if (xtermRef.current && isReady) {
      xtermRef.current.focus();
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      <div 
        ref={terminalRef} 
        className="terminal-container"
        onClick={handleContainerClick}
        style={{ 
          width: '100%', 
          height: '100%', 
          padding: '0',
          margin: '0',
          background: '#000000',
          overflow: 'hidden' // Critical to prevent scrollbar layout breakage
        }} 
      />
      {isTerminated && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(5, 5, 5, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          gap: '0.75rem',
          fontFamily: 'JetBrains Mono, monospace'
        }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.15em' }}>
            SESSION TERMINATED
          </span>
          <button 
            onClick={() => relaunch()}
            className="btn-tactile primary"
            style={{
              padding: '0.4rem 1rem',
              fontSize: '0.7rem',
              letterSpacing: '0.05em'
            }}
          >
            RELAUNCH SESSION
          </button>
        </div>
      )}
    </div>
  );
}

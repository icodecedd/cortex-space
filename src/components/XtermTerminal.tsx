import { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
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

  // Data from Backend -> Frontend
  const handlePtyData = useCallback((data: string) => {
    console.log(`[XtermTerminal ${id}] Received data length: ${data.length}`, { preview: data.slice(0, 100) });
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

  const { write: writeToPty, resize: resizePty, isReady } = usePty(id, handlePtyData, ptyConfig);

  // Bridge for xterm.js event handlers to always use latest PTY callbacks
  const writeRef = useRef(writeToPty);
  const resizeRef = useRef(resizePty);
  
  useEffect(() => { writeRef.current = writeToPty; }, [writeToPty]);
  useEffect(() => { resizeRef.current = resizePty; }, [resizePty]);

  // Main Terminal Lifecycle
  useEffect(() => {
    if (!terminalRef.current) return;

    const term = new Terminal({
      cursorBlink: true,
      fontSize: 12,
      fontFamily: '"JetBrains Mono", monospace',
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
    term.open(terminalRef.current);
    
    // Initial size sync
    fitAddon.fit();
    setDimensions({ rows: term.rows, cols: term.cols });

    // Give xterm focus immediately after mount
    requestAnimationFrame(() => {
      fitAddon.fit();
      term.focus();
    });

    // Keystrokes -> PTY
    term.onData((data) => {
      writeRef.current(data);
    });

    // Forward binary data (required for some CLIs)
    term.onBinary((data) => {
      writeRef.current(data);
    });

    // xterm resize -> PTY resize
    term.onResize(({ rows, cols }) => {
      resizeRef.current(rows, cols);
    });

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    // Dynamic UI Resize Handling
    const resizeObserver = new ResizeObserver(() => {
      if (fitAddonRef.current) {
        fitAddonRef.current.fit();
      }
    });
    resizeObserver.observe(terminalRef.current);

    return () => {
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

  // Focus Handling
  useEffect(() => {
    if (xtermRef.current && isFocused && isReady) {
      xtermRef.current.focus();
    }
  }, [isFocused, isReady]);

  return (
    <div 
      ref={terminalRef} 
      className="terminal-container"
      style={{ 
        width: '100%', 
        height: '100%', 
        padding: '0.25rem'
      }} 
    />
  );
}

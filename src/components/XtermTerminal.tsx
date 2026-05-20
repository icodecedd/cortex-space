import { useEffect, useRef, useCallback } from 'react';
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

  // Handle data coming from the PTY
  const handlePtyData = useCallback((data: string) => {
    if (xtermRef.current) {
      xtermRef.current.write(data);
    }
  }, []);

  const { write: writeToPty, resize: resizePty } = usePty(id, handlePtyData, { command, cwd });

  useEffect(() => {
    if (!terminalRef.current) return;

    // Initialize xterm.js
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
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    term.open(terminalRef.current);
    fitAddon.fit();

    // Send user input to the PTY
    term.onData((data) => {
      writeToPty(data);
    });

    // Handle terminal resizing
    term.onResize(({ rows, cols }) => {
      resizePty(rows, cols);
    });

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    // Handle container resize
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
  }, [writeToPty, resizePty]);

  // Update theme dynamically
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

  useEffect(() => {
    if (xtermRef.current && isFocused) {
      xtermRef.current.focus();
    }
  }, [isFocused]);

  return (
    <div 
      ref={terminalRef} 
      style={{ 
        width: '100%', 
        height: '100%', 
        padding: '0.25rem'
      }} 
    />
  );
}

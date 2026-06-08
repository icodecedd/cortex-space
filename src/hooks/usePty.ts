import { useEffect, useCallback, useState, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { terminalSessionManager } from '../lib/terminalSessionManager';

export type PtyStatus = 'idle' | 'thinking' | 'finished';

export function usePty(
  id: string, 
  onData: (data: string) => void, 
  config?: { command?: string; cwd?: string; rows?: number; cols?: number; shell?: string; enabled?: boolean }
) {
  const [isReady, setIsReady] = useState(false);
  const [isTerminated, setIsTerminated] = useState(false);
  const [status, setStatus] = useState<PtyStatus>('idle');
  const isMountedRef = useRef(true);
  const inputQueueRef = useRef<string[]>([]);
  const pendingResizeRef = useRef<{ rows: number; cols: number } | null>(null);
  const onDataRef = useRef(onData);
  const statusTimersRef = useRef<{ finish: any; idle: any }>({ finish: null, idle: null });

  // Keep onData fresh without triggering effects
  useEffect(() => {
    onDataRef.current = onData;
  }, [onData]);

  // Handle data stream for status monitoring
  const updateStatusOnData = useCallback(() => {
    setStatus('thinking');
    
    // Clear existing timers
    if (statusTimersRef.current.finish) clearTimeout(statusTimersRef.current.finish);
    if (statusTimersRef.current.idle) clearTimeout(statusTimersRef.current.idle);

    // Set "finished" state after 1.5s of inactivity
    statusTimersRef.current.finish = setTimeout(() => {
      setStatus('finished');
      
      // Removed: Automatic revert to "idle". 
      // Status remains "finished" until new data sets it to "thinking" again.
    }, 1500);
  }, []);

  const spawn = useCallback(async (spawnConfig: { command?: string; cwd?: string; rows?: number; cols?: number; shell?: string }) => {
    try {
      if (!isMountedRef.current) return;
      setIsReady(false);
      
      console.log(`[usePty ${id}] Spawning PTY with config:`, { id, ...spawnConfig });
      await invoke('spawn_pty', { 
        id, 
        command: spawnConfig.command || null, 
        cwd: spawnConfig.cwd || null,
        rows: spawnConfig.rows || 24,
        cols: spawnConfig.cols || 80,
        shell: spawnConfig.shell || null
      });
      console.log(`[usePty ${id}] PTY spawn succeeded.`);
      
      if (isMountedRef.current) {
        setIsReady(true);
        setIsTerminated(false);
        // Flush queue
        if (inputQueueRef.current.length > 0) {
          const combined = inputQueueRef.current.join('');
          inputQueueRef.current = [];
          await invoke('write_pty', { id, data: combined });
        }
        // Flush pending resize
        if (pendingResizeRef.current) {
          try {
            await invoke('resize_pty', { id, ...pendingResizeRef.current });
          } catch (e) {
            console.warn(`[PTY ${id}] Pending resize failed:`, e);
          }
          pendingResizeRef.current = null;
        }
      }
    } catch (error) {
      console.error(`[PTY ${id}] Spawn failed:`, error);
    }
  }, [id]);

  const write = useCallback(async (data: string) => {
    if (!isReady) {
      inputQueueRef.current.push(data);
      return;
    }
    // Set status to thinking immediately on keypress/write to ensure instant cursor response
    updateStatusOnData();
    try {
      await invoke('write_pty', { id, data });
    } catch (error) {
      console.error(`[PTY ${id}] Write failed:`, error);
    }
  }, [id, isReady, updateStatusOnData]);

  const resize = useCallback(async (rows: number, cols: number) => {
    if (!isReady) {
      pendingResizeRef.current = { rows, cols };
    }
    try {
      await invoke('resize_pty', { id, rows, cols });
    } catch (error) {
      // It's common for resize to fail if called too early or during teardown
      console.warn(`[PTY ${id}] Resize ignored:`, error);
    }
  }, [id, isReady]);

  const relaunch = useCallback(async () => {
    setIsTerminated(false);
    await terminalSessionManager.forceKill(id);
    await spawn({
      command: config?.command,
      cwd: config?.cwd,
      rows: config?.rows,
      cols: config?.cols,
      shell: config?.shell
    });
  }, [spawn, config, id]);

  useEffect(() => {
    isMountedRef.current = true;
    let active = true;

    const handleNewData = (data: string) => {
      if (active && isMountedRef.current) {
        updateStatusOnData();
        onDataRef.current(data);
      }
    };

    const handleExit = () => {
      if (active && isMountedRef.current) {
        setIsTerminated(true);
        setIsReady(false);
      }
    };

    const setup = async () => {
      if (config?.enabled === false) return;

      const isAlreadyRunning = terminalSessionManager.hasSession(id);
      const { isTerminated: termVal } = terminalSessionManager.register(id, handleNewData, handleExit);
      
      if (active && isMountedRef.current) {
        setIsTerminated(termVal);
      }

      if (isAlreadyRunning) {
        if (active && isMountedRef.current) {
          setIsReady(true);
        }
      } else {
        await spawn({
          command: config?.command,
          cwd: config?.cwd,
          rows: config?.rows,
          cols: config?.cols,
          shell: config?.shell
        });
      }
    };

    setup();

    return () => {
      active = false;
      isMountedRef.current = false;
      setIsReady(false);
      
      if (statusTimersRef.current.finish) clearTimeout(statusTimersRef.current.finish);
      if (statusTimersRef.current.idle) clearTimeout(statusTimersRef.current.idle);
      
      terminalSessionManager.unregister(id, handleNewData, handleExit);
    };
    // ONLY restart if the core process definition changes.
    // Dimensions (rows/cols) changes must be handled by resize() to keep session alive.
  }, [id, config?.command, config?.cwd, config?.shell, config?.enabled, spawn, updateStatusOnData]);

  return { write, resize, isReady, isTerminated, relaunch, status };
}

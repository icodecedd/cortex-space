import { useEffect, useCallback, useState, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen, UnlistenFn } from '@tauri-apps/api/event';

interface PtyOutputPayload {
  id: string;
  data: number[];
}

export function usePty(
  id: string, 
  onData: (data: Uint8Array) => void, 
  config?: { command?: string; cwd?: string; rows?: number; cols?: number }
) {
  const [isReady, setIsReady] = useState(false);
  const [isTerminated, setIsTerminated] = useState(false);
  const isMountedRef = useRef(true);
  const inputQueueRef = useRef<string[]>([]);
  const pendingResizeRef = useRef<{ rows: number; cols: number } | null>(null);
  const onDataRef = useRef(onData);

  // Keep onData fresh without triggering effects
  useEffect(() => {
    onDataRef.current = onData;
  }, [onData]);

  const spawn = useCallback(async (spawnConfig: { command?: string; cwd?: string; rows?: number; cols?: number }) => {
    try {
      if (!isMountedRef.current) return;
      setIsReady(false);
      
      console.log(`[usePty ${id}] Spawning PTY with config:`, { id, ...spawnConfig });
      await invoke('spawn_pty', { 
        id, 
        command: spawnConfig.command || null, 
        cwd: spawnConfig.cwd || null,
        rows: spawnConfig.rows || 24,
        cols: spawnConfig.cols || 80
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
    try {
      await invoke('write_pty', { id, data });
    } catch (error) {
      console.error(`[PTY ${id}] Write failed:`, error);
    }
  }, [id, isReady]);

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
    await spawn({
      command: config?.command,
      cwd: config?.cwd,
      rows: config?.rows,
      cols: config?.cols
    });
  }, [spawn, config]);

  useEffect(() => {
    isMountedRef.current = true;
    let active = true;
    let unlisten: UnlistenFn | null = null;
    let unlistenExit: UnlistenFn | null = null;

    const setup = async () => {
      const ul = await listen<PtyOutputPayload>('pty-output', (event) => {
        if (active && isMountedRef.current && event.payload.id === id) {
          // Log only length for binary data to avoid console flooding
          // console.log(`[usePty ${id}] Received pty-output length: ${event.payload.data.length}`);
          const uint8Array = new Uint8Array(event.payload.data);
          onDataRef.current(uint8Array);
        }
      });

      if (!active) {
        ul();
        return;
      }
      unlisten = ul;

      const ulExit = await listen<string>('pty-exit', (event) => {
        if (active && event.payload === id) {
          setIsTerminated(true);
          setIsReady(false);
        }
      });

      if (!active) {
        ulExit();
        return;
      }
      unlistenExit = ulExit;

      await spawn({
        command: config?.command,
        cwd: config?.cwd,
        rows: config?.rows,
        cols: config?.cols
      });
    };

    setup();

    return () => {
      active = false;
      isMountedRef.current = false;
      setIsReady(false);
      if (unlisten) {
        unlisten();
      }
      if (unlistenExit) {
        unlistenExit();
      }
      invoke('kill_pty', { id }).catch(() => {}); // Silent fail on cleanup
    };
    // ONLY restart if the core process definition changes.
    // Dimensions (rows/cols) changes must be handled by resize() to keep session alive.
  }, [id, config?.command, config?.cwd, spawn]);

  return { write, resize, isReady, isTerminated, relaunch };
}

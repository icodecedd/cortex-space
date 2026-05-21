import { useEffect, useCallback, useState, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen, UnlistenFn } from '@tauri-apps/api/event';

interface PtyOutputPayload {
  id: string;
  data: string;
}

export function usePty(
  id: string, 
  onData: (data: string) => void, 
  config?: { command?: string; cwd?: string; rows?: number; cols?: number }
) {
  const [isReady, setIsReady] = useState(false);
  const isMountedRef = useRef(true);
  const inputQueueRef = useRef<string[]>([]);
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
        // Flush queue
        if (inputQueueRef.current.length > 0) {
          const combined = inputQueueRef.current.join('');
          inputQueueRef.current = [];
          await invoke('write_pty', { id, data: combined });
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
    try {
      await invoke('resize_pty', { id, rows, cols });
    } catch (error) {
      // It's common for resize to fail if called too early or during teardown
      console.warn(`[PTY ${id}] Resize ignored:`, error);
    }
  }, [id]);

  useEffect(() => {
    isMountedRef.current = true;
    let unlisten: UnlistenFn | null = null;

    const setup = async () => {
      unlisten = await listen<PtyOutputPayload>('pty-output', (event) => {
        if (isMountedRef.current && event.payload.id === id) {
          console.log(`[usePty ${id}] Received pty-output:`, { length: event.payload.data.length, preview: event.payload.data.slice(0, 100) });
          onDataRef.current(event.payload.data);
        }
      });

      await spawn({
        command: config?.command,
        cwd: config?.cwd,
        rows: config?.rows,
        cols: config?.cols
      });
    };

    setup();

    return () => {
      isMountedRef.current = false;
      setIsReady(false);
      if (unlisten) unlisten();
      invoke('kill_pty', { id }).catch(() => {}); // Silent fail on cleanup
    };
    // ONLY restart if the core process definition changes.
    // Dimensions (rows/cols) changes must be handled by resize() to keep session alive.
  }, [id, config?.command, config?.cwd, spawn]);

  return { write, resize, isReady };
}

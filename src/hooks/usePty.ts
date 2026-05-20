import { useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

interface PtyOutputPayload {
  id: string;
  data: string;
}

export function usePty(id: string, onData: (data: string) => void, config?: { command?: string; cwd?: string }) {
  
  const spawn = useCallback(async () => {
    try {
      await invoke('spawn_pty', { 
        id, 
        command: config?.command || null, 
        cwd: config?.cwd || null 
      });
    } catch (error) {
      console.error('Failed to spawn PTY:', error);
    }
  }, [id, config]);

  const write = useCallback(async (data: string) => {
    try {
      await invoke('write_pty', { id, data });
    } catch (error) {
      console.error('Failed to write to PTY:', error);
    }
  }, [id]);

  const resize = useCallback(async (rows: number, cols: number) => {
    try {
      await invoke('resize_pty', { id, rows, cols });
    } catch (error) {
      console.error('Failed to resize PTY:', error);
    }
  }, [id]);

  useEffect(() => {
    let unlisten: (() => void) | null = null;

    const setup = async () => {
      // Listen for output from the backend
      unlisten = await listen<PtyOutputPayload>('pty-output', (event) => {
        if (event.payload.id === id) {
          onData(event.payload.data);
        }
      });

      // Spawn the process
      await spawn();
    };

    setup();

    return () => {
      if (unlisten) unlisten();
      invoke('kill_pty', { id }).catch(console.error);
    };
  }, [id, spawn, onData]);

  return { write, resize };
}

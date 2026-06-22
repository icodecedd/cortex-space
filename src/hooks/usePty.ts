import { useEffect, useCallback, useState, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { terminalSessionManager } from "../lib/terminalSessionManager";

// Dev-only logging helpers — compiled away entirely in production builds
const devLog = (...args: unknown[]) => {
  if (import.meta.env.DEV) console.log(...args);
};
const devWarn = (...args: unknown[]) => {
  if (import.meta.env.DEV) console.warn(...args);
};
const devError = (...args: unknown[]) => {
  if (import.meta.env.DEV) console.error(...args);
};

export type PtyStatus = "idle" | "thinking" | "finished";

export function usePty(
  id: string,
  onData: (data: string) => void,
  config?: {
    command?: string;
    cwd?: string;
    rows?: number;
    cols?: number;
    shell?: string;
    enabled?: boolean;
  }
) {
  const [isReady, setIsReady] = useState(false);
  const [isTerminated, setIsTerminated] = useState(false);
  const [status, setStatus] = useState<PtyStatus>("idle");
  const isMountedRef = useRef(true);
  const inputQueueRef = useRef<string[]>([]);
  const pendingResizeRef = useRef<{ rows: number; cols: number } | null>(null);
  const onDataRef = useRef(onData);
  const statusTimersRef = useRef<{ finish: any; idle: any }>({
    finish: null,
    idle: null,
  });

  useEffect(() => {
    onDataRef.current = onData;
  }, [onData]);

  const lastStatusUpdateRef = useRef<number>(0);

  const updateStatusOnData = useCallback(() => {
    const now = Date.now();
    if (now - lastStatusUpdateRef.current < 100) return;
    lastStatusUpdateRef.current = now;

    setStatus("thinking");

    if (statusTimersRef.current.finish)
      clearTimeout(statusTimersRef.current.finish);
    if (statusTimersRef.current.idle)
      clearTimeout(statusTimersRef.current.idle);

    statusTimersRef.current.finish = setTimeout(() => {
      setStatus("finished");
    }, 1500);
  }, []);

  const spawn = useCallback(
    async (spawnConfig: {
      command?: string;
      cwd?: string;
      rows?: number;
      cols?: number;
      shell?: string;
    }) => {
      try {
        if (!isMountedRef.current) return;
        setIsReady(false);

        // Clamp dimensions to minimum 1×1 — ConPTY crashes on 0 cols/rows
        const rows = Math.max(1, spawnConfig.rows || 24);
        const cols = Math.max(1, spawnConfig.cols || 80);

        devLog(`[usePty ${id}] Spawning PTY with config:`, {
          id,
          ...spawnConfig,
          rows,
          cols,
        });
        await invoke("spawn_pty", {
          id,
          command: spawnConfig.command || null,
          cwd: spawnConfig.cwd || null,
          rows,
          cols,
          shell: spawnConfig.shell || null,
        });
        devLog(`[usePty ${id}] PTY spawn succeeded.`);

        if (isMountedRef.current) {
          setIsReady(true);
          setIsTerminated(false);
          if (inputQueueRef.current.length > 0) {
            const combined = inputQueueRef.current.join("");
            inputQueueRef.current = [];
            await invoke("write_pty", { id, data: combined });
          }
          if (pendingResizeRef.current) {
            try {
              await invoke("resize_pty", {
                id,
                ...pendingResizeRef.current,
              });
            } catch (e) {
              devWarn(`[PTY ${id}] Pending resize failed:`, e);
            }
            pendingResizeRef.current = null;
          }
        }
      } catch (error) {
        devError(`[PTY ${id}] Spawn failed:`, error);
      }
    },
    [id]
  );

  const write = useCallback(
    async (data: string) => {
      if (!isReady) {
        inputQueueRef.current.push(data);
        return;
      }
      updateStatusOnData();
      try {
        await invoke("write_pty", { id, data });
      } catch (error) {
        devError(`[PTY ${id}] Write failed:`, error);
      }
    },
    [id, isReady, updateStatusOnData]
  );

  const resize = useCallback(
    async (rows: number, cols: number) => {
      // Guard against zero or invalid dimensions — ConPTY crashes on 0×0
      if (rows < 1 || cols < 1 || !Number.isFinite(rows) || !Number.isFinite(cols)) return;
      if (!isReady) {
        pendingResizeRef.current = { rows, cols };
        return; // Don't send resize IPC to a non-existent PTY
      }
      try {
        await invoke("resize_pty", { id, rows, cols });
      } catch (error) {
        devWarn(`[PTY ${id}] Resize ignored:`, error);
      }
    },
    [id, isReady]
  );

  const relaunch = useCallback(async () => {
    setIsTerminated(false);
    await terminalSessionManager.killForRelaunch(id);
    await spawn({
      command: config?.command,
      cwd: config?.cwd,
      rows: config?.rows,
      cols: config?.cols,
      shell: config?.shell,
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
      const { isTerminated: termVal } = terminalSessionManager.register(
        id,
        handleNewData,
        handleExit
      );

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
          shell: config?.shell,
        });
      }
    };

    setup();

    return () => {
      active = false;
      isMountedRef.current = false;
      setIsReady(false);

      if (statusTimersRef.current.finish)
        clearTimeout(statusTimersRef.current.finish);
      if (statusTimersRef.current.idle)
        clearTimeout(statusTimersRef.current.idle);

      terminalSessionManager.unregister(id, handleNewData, handleExit);
    };
    // ONLY restart if the core process definition changes.
    // Dimensions (rows/cols) changes must be handled by resize() to keep session alive.
  }, [
    id,
    config?.command,
    config?.cwd,
    config?.shell,
    config?.enabled,
    spawn,
    updateStatusOnData,
  ]);

  return { write, resize, isReady, isTerminated, relaunch, status };
}

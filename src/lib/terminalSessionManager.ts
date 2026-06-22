import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

interface PtyOutputPayload {
  id: string;
  data: string;
}

interface Session {
  id: string;
  buffer: string[];
  bufferLength: number;
  onDataCallbacks: Set<(data: string) => void>;
  onExitCallbacks: Set<() => void>;
  cleanupTimeout: any | null;
  isTerminated: boolean;
}

interface PortCheck {
  port: number;
  url: string;
  onGone: () => void;
}

class SessionManager {
  private sessions = new Map<string, Session>();
  private initialized = false;
  private xtermInstances = new Map<string, any>();
  private fitAddons = new Map<string, any>();
  private writeDelegates = new Map<string, (data: string) => void>();
  private resizeDelegates = new Map<string, (rows: number, cols: number) => void>();
  private keyEventHandlerDelegates = new Map<string, (e: KeyboardEvent) => boolean>();

  // Port Monitoring state
  private activePortChecks = new Map<string, Set<PortCheck>>();
  private portCheckInterval: any | null = null;
  private isCheckingPorts = false;
  private portFailures = new Map<string, number>();

  /**
   * Global port-ownership registry.
   *
   * Maps port number -> terminalId that detected and "owns" that port.
   * Prevents a second terminal whose output merely mentions a URL from
   * claiming a port that is actually being served by a different pane.
   */
  private portOwners = new Map<number, string>();

  // ---------------------------------------------------------------------------
  // Port ownership API
  // ---------------------------------------------------------------------------

  /**
   * Attempt to claim a port for the given terminal.
   * Returns true if the claim succeeds (port was unclaimed or already owned
   * by this terminal), false if a *different* terminal already owns it.
   */
  claimPort(terminalId: string, port: number): boolean {
    const existingOwner = this.portOwners.get(port);
    if (existingOwner && existingOwner !== terminalId) {
      // Already owned by a different terminal
      return false;
    }
    this.portOwners.set(port, terminalId);
    return true;
  }

  /**
   * Release a specific port claim for the given terminal.
   * No-op if the terminal doesn't own that port.
   */
  releasePort(terminalId: string, port: number): void {
    if (this.portOwners.get(port) === terminalId) {
      this.portOwners.delete(port);
    }
  }

  /**
   * Release ALL port claims held by the given terminal.
   * Call on terminal relaunch, kill, or unmount.
   */
  releaseAllPortsForTerminal(terminalId: string): void {
    for (const [port, owner] of this.portOwners.entries()) {
      if (owner === terminalId) {
        this.portOwners.delete(port);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Delegate management
  // ---------------------------------------------------------------------------

  setWriteDelegate(id: string, cb: ((data: string) => void) | undefined) {
    if (cb === undefined) {
      this.writeDelegates.delete(id);
    } else {
      this.writeDelegates.set(id, cb);
    }
  }

  getWriteDelegate(id: string): ((data: string) => void) | undefined {
    return this.writeDelegates.get(id);
  }

  setResizeDelegate(id: string, cb: ((rows: number, cols: number) => void) | undefined) {
    if (cb === undefined) {
      this.resizeDelegates.delete(id);
    } else {
      this.resizeDelegates.set(id, cb);
    }
  }

  getResizeDelegate(id: string): ((rows: number, cols: number) => void) | undefined {
    return this.resizeDelegates.get(id);
  }

  setKeyEventHandlerDelegate(id: string, cb: ((e: KeyboardEvent) => boolean) | undefined) {
    if (cb === undefined) {
      this.keyEventHandlerDelegates.delete(id);
    } else {
      this.keyEventHandlerDelegates.set(id, cb);
    }
  }

  getKeyEventHandlerDelegate(id: string): ((e: KeyboardEvent) => boolean) | undefined {
    return this.keyEventHandlerDelegates.get(id);
  }

  getXterm(id: string): any {
    return this.xtermInstances.get(id);
  }

  setXterm(id: string, term: any) {
    this.xtermInstances.set(id, term);
  }

  getFitAddon(id: string): any {
    return this.fitAddons.get(id);
  }

  setFitAddon(id: string, fitAddon: any) {
    this.fitAddons.set(id, fitAddon);
  }

  removeXterm(id: string) {
    const term = this.xtermInstances.get(id);
    if (term) {
      try {
        term.dispose();
      } catch (e) {}
      this.xtermInstances.delete(id);
    }
    this.fitAddons.delete(id);
    this.writeDelegates.delete(id);
    this.resizeDelegates.delete(id);
    this.keyEventHandlerDelegates.delete(id);
    this.activePortChecks.delete(id);
    // Release any port claims so other terminals can detect those ports
    this.releaseAllPortsForTerminal(id);
  }

  // ---------------------------------------------------------------------------
  // Initialization
  // ---------------------------------------------------------------------------

  async init() {
    if (this.initialized) return;
    this.initialized = true;

    // Listen to pty-output globally
    await listen<PtyOutputPayload>('pty-output', (event) => {
      const { id, data } = event.payload;
      let session = this.sessions.get(id);
      if (!session) {
        session = this.createSessionRecord(id);
      }

      session.buffer.push(data);
      session.bufferLength += data.length;
      if (session.bufferLength > 250000) {
        while (session.bufferLength > 200000 && session.buffer.length > 0) {
          const removed = session.buffer.shift();
          if (removed) {
            session.bufferLength -= removed.length;
          }
        }
      }

      session.onDataCallbacks.forEach(cb => cb(data));
    });

    // Listen to pty-exit globally
    await listen<string>('pty-exit', (event) => {
      const id = event.payload;
      const session = this.sessions.get(id);
      if (session) {
        session.isTerminated = true;
        session.onExitCallbacks.forEach(cb => cb());
      }
    });
  }

  private createSessionRecord(id: string): Session {
    const session: Session = {
      id,
      buffer: [],
      bufferLength: 0,
      onDataCallbacks: new Set(),
      onExitCallbacks: new Set(),
      cleanupTimeout: null,
      isTerminated: false
    };
    this.sessions.set(id, session);
    return session;
  }

  // ---------------------------------------------------------------------------
  // Port Monitoring System
  // ---------------------------------------------------------------------------

  registerPortCheck(terminalId: string, port: number, url: string, onGone: () => void) {
    let checks = this.activePortChecks.get(terminalId);
    if (!checks) {
      checks = new Set();
      this.activePortChecks.set(terminalId, checks);
    }
    for (const c of checks) { if (c.port === port) checks.delete(c); }
    checks.add({ port, url, onGone });
    this.startGlobalPortCheck();
  }

  unregisterPortCheck(terminalId: string, port: number) {
    const checks = this.activePortChecks.get(terminalId);
    if (checks) {
      for (const c of checks) {
        if (c.port === port) {
          checks.delete(c);
          this.portFailures.delete(`${terminalId}:${port}`);
        }
      }
      if (checks.size === 0) this.activePortChecks.delete(terminalId);
    }
    if (this.activePortChecks.size === 0) this.stopGlobalPortCheck();
  }

  private startGlobalPortCheck() {
    if (this.portCheckInterval) return;
    this.portCheckInterval = setInterval(() => this.pollActivePorts(), 5000);
  }

  private stopGlobalPortCheck() {
    if (this.portCheckInterval) {
      clearInterval(this.portCheckInterval);
      this.portCheckInterval = null;
    }
  }

  private async pollActivePorts() {
    if (this.isCheckingPorts || this.activePortChecks.size === 0) return;
    this.isCheckingPorts = true;

    const allChecks: { terminalId: string, check: PortCheck }[] = [];
    this.activePortChecks.forEach((checks, tid) => {
      checks.forEach(c => allChecks.push({ terminalId: tid, check: c }));
    });

    const maxFailures = 3;
    await Promise.all(allChecks.map(async ({ terminalId, check }) => {
      const key = `${terminalId}:${check.port}`;
      try {
        const status = await invoke<string>('check_port', { port: check.port });
        if (status === 'open') {
          this.portFailures.set(key, 0);
        } else if (status === 'refused') {
          this.handlePortGone(terminalId, check);
        } else {
          const failures = (this.portFailures.get(key) || 0) + 1;
          if (failures >= maxFailures) {
            this.handlePortGone(terminalId, check);
          } else {
            this.portFailures.set(key, failures);
          }
        }
      } catch {
        const failures = (this.portFailures.get(key) || 0) + 1;
        if (failures >= maxFailures) this.handlePortGone(terminalId, check);
        else this.portFailures.set(key, failures);
      }
    }));

    this.isCheckingPorts = false;
  }

  private handlePortGone(terminalId: string, check: PortCheck) {
    this.unregisterPortCheck(terminalId, check.port);
    check.onGone();
  }

  // ---------------------------------------------------------------------------
  // Session history
  // ---------------------------------------------------------------------------

  getHistory(id: string): Uint8Array {
    const session = this.sessions.get(id);
    if (!session) return new Uint8Array();
    const encoder = new TextEncoder();
    return encoder.encode(session.buffer.join(''));
  }

  // ---------------------------------------------------------------------------
  // Session lifecycle
  // ---------------------------------------------------------------------------

  register(
    id: string,
    onData: (data: string) => void,
    onExit: () => void
  ) {
    this.init();
    let session = this.sessions.get(id);
    if (!session) {
      session = this.createSessionRecord(id);
    }

    if (session.cleanupTimeout) {
      clearTimeout(session.cleanupTimeout);
      session.cleanupTimeout = null;
    }

    session.onDataCallbacks.add(onData);
    session.onExitCallbacks.add(onExit);

    return {
      isTerminated: session.isTerminated
    };
  }

  unregister(id: string, onData: (data: string) => void, onExit: () => void) {
    const session = this.sessions.get(id);
    if (!session) return;

    session.onDataCallbacks.delete(onData);
    session.onExitCallbacks.delete(onExit);

    if (session.onDataCallbacks.size === 0) {
      if (session.cleanupTimeout) {
        clearTimeout(session.cleanupTimeout);
      }
      session.cleanupTimeout = setTimeout(async () => {
        this.sessions.delete(id);
        this.removeXterm(id);
        try {
          await invoke('kill_pty', { id });
        } catch (e) {
          console.warn(`Failed to kill PTY ${id}:`, e);
        }
      }, 10000);
    }
  }

  async forceKill(id: string) {
    const session = this.sessions.get(id);
    if (session) {
      if (session.cleanupTimeout) {
        clearTimeout(session.cleanupTimeout);
      }
      session.onDataCallbacks.clear();
      session.onExitCallbacks.clear();
    }
    this.sessions.delete(id);
    this.removeXterm(id);
    try {
      await invoke('kill_pty', { id });
    } catch (e) {
      console.warn(`Failed to force kill PTY ${id}:`, e);
    }
  }

  /**
   * Kill the PTY process and dispose the xterm instance, but preserve the
   * session record and its data/exit callbacks so that `usePty` can
   * continue to receive data after re-spawn without needing to re-register.
   */
  async killForRelaunch(id: string) {
    const session = this.sessions.get(id);
    if (session) {
      if (session.cleanupTimeout) {
        clearTimeout(session.cleanupTimeout);
      }
      // Reset buffer so old output doesn't replay
      session.buffer = [];
      session.bufferLength = 0;
      session.isTerminated = false;
    }
    // Dispose xterm so the lifecycle effect creates a fresh one
    const term = this.xtermInstances.get(id);
    if (term) {
      try { term.dispose(); } catch {}
      this.xtermInstances.delete(id);
    }
    this.fitAddons.delete(id);
    // Clear delegates — they will be re-set by the XtermTerminal effect
    this.writeDelegates.delete(id);
    this.resizeDelegates.delete(id);
    this.keyEventHandlerDelegates.delete(id);
    this.activePortChecks.delete(id);
    this.releaseAllPortsForTerminal(id);
    try {
      await invoke('kill_pty', { id });
    } catch (e) {
      console.warn(`Failed to kill PTY ${id} for relaunch:`, e);
    }
  }

  hasSession(id: string): boolean {
    return this.sessions.has(id) && !this.sessions.get(id)?.isTerminated;
  }
}

export const terminalSessionManager = new SessionManager();

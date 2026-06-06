import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

interface PtyOutputPayload {
  id: string;
  data: string;
}

interface Session {
  id: string;
  buffer: string[]; // Store output strings
  bufferLength: number; // Keep track of characters
  onDataCallbacks: Set<(data: string) => void>;
  onExitCallbacks: Set<() => void>;
  cleanupTimeout: any | null;
  isTerminated: boolean;
}

class SessionManager {
  private sessions = new Map<string, Session>();
  private initialized = false;
  private xtermInstances = new Map<string, any>();
  private fitAddons = new Map<string, any>();
  private writeDelegates = new Map<string, (data: string) => void>();
  private resizeDelegates = new Map<string, (rows: number, cols: number) => void>();
  private keyEventHandlerDelegates = new Map<string, (e: KeyboardEvent) => boolean>();

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
  }

  async init() {
    if (this.initialized) return;
    this.initialized = true;

    console.log('[SessionManager] Initializing global PTY event listeners');

    // Listen to pty-output globally
    await listen<PtyOutputPayload>('pty-output', (event) => {
      const { id, data } = event.payload;
      let session = this.sessions.get(id);
      if (!session) {
        session = this.createSessionRecord(id);
      }
      
      // Append to buffer, keeping a limit (e.g. 200,000 characters)
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

      // Route data to active callbacks
      session.onDataCallbacks.forEach(cb => cb(data));
    });

    // Listen to pty-exit globally
    await listen<string>('pty-exit', (event) => {
      const id = event.payload;
      console.log(`[SessionManager] PTY exited event received for ${id}`);
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

  // Get session history buffer
  getHistory(id: string): Uint8Array {
    const session = this.sessions.get(id);
    if (!session) return new Uint8Array();
    const encoder = new TextEncoder();
    return encoder.encode(session.buffer.join(''));
  }

  // Register active component callbacks
  register(
    id: string, 
    onData: (data: string) => void, 
    onExit: () => void
  ) {
    this.init(); // Ensure initialized
    let session = this.sessions.get(id);
    if (!session) {
      session = this.createSessionRecord(id);
    }

    if (session.cleanupTimeout) {
      console.log(`[SessionManager] Cancelling deferred cleanup for session ${id}`);
      clearTimeout(session.cleanupTimeout);
      session.cleanupTimeout = null;
    }

    session.onDataCallbacks.add(onData);
    session.onExitCallbacks.add(onExit);

    const encoder = new TextEncoder();
    return {
      isTerminated: session.isTerminated,
      history: encoder.encode(session.buffer.join(''))
    };
  }

  // Unregister active component callbacks (mark inactive)
  unregister(id: string, onData: (data: string) => void, onExit: () => void) {
    const session = this.sessions.get(id);
    if (!session) return;

    session.onDataCallbacks.delete(onData);
    session.onExitCallbacks.delete(onExit);

    // If no more components are listening to this PTY, set cleanup timeout
    if (session.onDataCallbacks.size === 0) {
      if (session.cleanupTimeout) {
        clearTimeout(session.cleanupTimeout);
      }
      session.cleanupTimeout = setTimeout(async () => {
        console.log(`[SessionManager] Cleaning up PTY session ${id} (no reconnects received within timeout)`);
        this.sessions.delete(id);
        this.removeXterm(id);
        try {
          await invoke('kill_pty', { id });
        } catch (e) {
          console.warn(`Failed to kill PTY ${id}:`, e);
        }
      }, 10000); // Wait 10 seconds for potential layout remounts
    }
  }

  // Force kill (when user explicitly kills process)
  async forceKill(id: string) {
    console.log(`[SessionManager] Force killing PTY session ${id}`);
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

  // Check if PTY session is already running
  hasSession(id: string): boolean {
    return this.sessions.has(id) && !this.sessions.get(id)?.isTerminated;
  }
}

export const terminalSessionManager = new SessionManager();

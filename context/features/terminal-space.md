# ADR-002: Terminal & Space System

## Status
Approved

## Context
A primary requirement for Cortex Space is rendering multiple concurrently executing terminal sessions inside a single window.
A naive approach would utilize child processes managed in webviews or spawn heavy Node process shells. However, this causes significant performance degradation and lag, especially when rendering dense command-line outputs (e.g., compile logs, git animations).

---

## Decisions Made

### 1. High-Performance GPU Rendering (Xterm.js)
We integrated `xterm.js` with the standard canvas renderer. 
- WebGL or high-performance canvas layers are leveraged for GPU acceleration, avoiding DOM-based line rendering which causes stutter.
- Scrollback buffer size is optimized to balance memory footprint and terminal history.

### 2. Rust-Native PTY Spawning (Tauri Backend)
Instead of launching command processes directly in JS, Tauri spawns platform-native PTY (Pseudo-Terminal) sessions:
- On Windows, it binds to `conpty.dll`.
- On Unix (macOS/Linux), it forks a terminal session using `/dev/ptmx`.
- Spawning, input writing, and resizing are invoked asynchronously via Tauri commands.

### 3. Events-Based Session Streaming
To prevent React from re-rendering on every incoming character stream (which would freeze the UI):
- We decouple the state. We use a non-React `terminalSessionManager` class to act as a central event broadcaster.
- Output streams are direct binary/UTF-8 pipe bindings to Xterm.js via event listeners, bypassing React state loops completely.

---

## Consequences

### Positive (Pros)
* **Zero Input Lag**: Interactive command execution is instantaneous.
* **Low Memory Profile**: Running 4-9 terminals simultaneously has a minimal memory overhead.
* **Resizing Robustness**: Changing layouts triggers Rust PTY resize commands (`cols` and `rows`), ensuring shell output formats correctly.

### Trade-offs & Negatives (Cons)
* **Input Interception**: Xterm.js captures all keystrokes. To trigger global application shortcuts (like opening Settings with `Ctrl + ,`), we must explicitly intercept and bubble up key events before Xterm processes them.

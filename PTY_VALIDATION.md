# PTY Validation & Verification Guide

This document outlines the procedure to verify that the integrated `xterm.js` terminals are correctly communicating with the Rust backend and respecting the directory context selected during setup.

## 1. Verifying Directory Synchronization (CWD)

To confirm that a pane is correctly "listening" to the directory selected in the **Setup View**:

1.  **Launch a Space:** Select a specific directory in the Setup View (e.g., `C:\Users\Chaoscedd\Programming`).
2.  **Execute a Location Check:** In any active terminal pane, type the following command:
    *   **Windows:** `pwd` or `(Get-Location).Path`
    *   **macOS/Linux:** `pwd`
3.  **Expected Result:** The terminal should return the exact path you selected in the UI.

### Technical Implementation Note
The path travels through three layers:
1.  **React (SetupView):** Captures the `rootPath` from the input.
2.  **React (SpaceView -> TerminalPane):** Passes `rootPath` as a prop to the `usePty` hook.
3.  **Rust (spawn_pty):** The `CommandBuilder` in `src-tauri/src/lib.rs` receives the `cwd` argument and calls `.cwd(path)` before spawning the process.

## 2. Verifying Interactive Input/Output

To confirm the PTY bridge is fully functional (Read/Write):

1.  **Command Execution:** Type `ls` (macOS/Linux) or `dir` (Windows). 
    *   *Verification:* If files appear, the **Read (Rust -> React)** bridge is working.
2.  **Interactive Programs:** Launch a CLI tool that requires raw input, such as `vim`, `nano`, or `python`.
    *   *Verification:* If you can navigate or exit these programs, the **Write (React -> Rust)** bridge is correctly passing keystrokes through the PTY.

## 3. Verifying Lifecycle Management

1.  **Termination:** Click "TERMINATE SPACE."
2.  **Backend Check:** Check your system's process manager (Task Manager or `top`).
    *   *Verification:* The `powershell.exe` or `bash` processes spawned by Cortex Space should disappear. Our `kill_pty` command in Rust handles this cleanup to prevent zombie processes.

## 4. Future Enhancements

*   **Shell Selection:** Currently, the system defaults to `powershell.exe` on Windows and `bash` on Unix. We can add a "Shell Type" dropdown in the Setup View.
*   **Path Normalization:** Adding more robust handling for relative paths and home directory shortcuts (`~`).
*   **Persisted History:** Implementing a mechanism to save and reload terminal buffers between sessions.

# Project Roadmap & Progress Tracker

This document tracks the features, completed development milestones, and target deliverables for **Cortex Space**.

---

## 1. ✅ Completed Features & Milestones

- [x] **Tauri v2 Migration & Core Engine:** High-performance desktop foundations with sandboxed file-system access and custom system protocols.
- [x] **Hugeicons Iconography Migration:**
  - Migrated the complete icon pack from `lucide-react` to `@hugeicons/react` and `@hugeicons/core-free-icons` for a premium, clean aesthetic.
  - Implemented the wrapper abstraction layer ([icons.tsx](file:///c:/Users/Chaoscedd/Programming/web-development/cortex-space/src/components/ui/icons.tsx)) to standardize sizes, classes, and colors.
  - Custom icon replacements: `ComputerTerminal02Icon` (workspace tabs), `PencilEdit01Icon` (context menus), `SquareArrowExpand01Icon` (maximize in floating terminal bar), `SquareArrowShrink02Icon` (minimize in floating terminal bar), `ReloadIcon` (settings reset), `DistributeHorizontalCenterIcon` (split vertical/y-axis), and `DistributeVerticalCenterIcon` (split horizontal/x-axis).
  - App title bar controls: standard square control `Square` (`SquareIcon`) for maximize and duplicate icon `Copy` (`Copy01Icon`) for window restore.
- [x] **Multi-Pane Terminal PTY Engine:** High-performance integration of Xterm.js with Rust-spawned OS shell processes.
- [x] **Dynamic Resizable Layouts:** Nested split-pane layout manager (horizontal/vertical coordinates) with drag handles and flex ratios.
- [x] **Command Snippet Library:** Reusable script templates with variable parsing. Supports `{{VAR}}` placeholder prompts in a glassmorphic modal overlay.
- [x] **Workspace Setup Wizard:** Streamlined 3-step configuration flow (Directory Selection → Grid Layout Design → Commands Configuration).
- [x] **Workspace Templates:** Capture, name, store, and launch complex multi-pane environments.
- [x] **TCP Port Auto-Discovery:** Monitors terminal stdout for network port bindings (e.g. `localhost:3000`), performs background TCP connectivity checks, and injects header badge links.
- [x] **Scan & Choose Onboarding:** Automatically scans the user's system path to check for existing AI agent CLIs (Claude, Gemini, Antigravity) and allows on-demand background installations.
- [x] **Tactile Motion System:** Snell-curved spring transitions, backdrop glassmorphic modals, and tab drag reordering.
- [x] **Persistent Settings Store:** Thread-safe settings store utilizing Tauri's local JSON configuration plugin.

---

## 2. 🚀 Production Readiness (Next Steps)

- [ ] **State Restoration (Deep Persistence):**
  - Serialize all active workspace panes, PTY terminal histories (if allowed), layout trees, and directory roots.
  - Automatically restore these sessions upon application restart.
- [ ] **Shell Environment Optimization:**
  - Auto-configure native PATH variable inheritance across Windows (PowerShell/cmd), macOS (zsh), and Linux (bash).
- [ ] **Binary Size & Performance Optimization:**
  - Audit built bundle outputs to separate heavy dependencies and optimize asset packaging.

---

## 3. 📈 Upcoming Enhancements ("Should-Have")

- [ ] **Contextual Pane Actions:**
  - Dropdown context menu in each terminal pane to split, rename, clear scrollback, or restart the PTY shell process.
- [ ] **Resource Sparklines:**
  - Tiny CPU and Memory utilization monitors embedded directly into terminal pane headers.
- [ ] **Offline Agent Sidecars:**
  - Package common agentic CLI runners as precompiled Tauri sidecar binaries to run 100% offline.
- [ ] **Embedded Documentation Viewer:**
  - Webview-based documentation panels to display markdown files (like these context docs!) directly inside the grid layout next to shell terminals.

---

## 4. 🚫 Deferred Scope ("Won't-Have Now")

- **Process Hibernation:** Keeping PTY backend sessions alive after the UI window is terminated.
- **Cloud Settings Sync:** Local-first privacy and storage design does not utilize external database accounts.
- **Multi-User Real-time Collaboration:** Shared terminals or terminal mirroring.

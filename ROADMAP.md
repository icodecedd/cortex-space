# 🗺️ Cortex Space: Project Roadmap

This document outlines the development trajectory for **Cortex Space**, prioritizing speed, execution, and professional-grade workspace management.

---

## 1. ✅ Completed Features

_Core engine and architectural foundations._

- [x] **Multi-Pane Terminal Engine:** High-performance integration of Xterm.js with Tauri-based PTY processes.
- [x] **Dynamic Resizable Layouts:** Flexible split-pane engine (horizontal/vertical) with recursive nesting and ratio-based resizing.
- [x] **Global Command Palette (`Ctrl/Cmd + K`):** Lightning-fast "Omni-search" for switching workspaces, launching templates, or executing UI actions.
- [x] **Command Snippet Repository:** Lightweight library for storing and injecting frequently used multi-step commands into focused terminals.
- [x] **Workspace Setup Wizard:** Streamlined 3-step configuration flow (Directory → Layout → Commands).
- [x] **Workspace Templates:** Save and load complex workspace configurations with a single click.
- [x] **Template Library:** Ability to capture, name, and reuse complex workspace configurations.
- [x] **Preset Management:** Quick-launch presets optimized for specific directory structures.
- [x] **Concurrent Workspaces:** Multiple isolated environments running simultaneously with fast switching.
- [x] **Global Settings Store:** Persistent configuration for typography, themes, and UI scaling.
- [x] **Enhanced Focus & Navigation:** High-fidelity visual focus states and robust pane focus management.
- [x] **Advanced Directional Shortcuts:** Directional focus shifting via `Cmd/Ctrl + Opt + Arrows` for complex layouts.
- [x] **Design-Eng UI:** High-fidelity aesthetics following modern productivity standards.
- [x] **Bulk Library Management:** Bulk selection and deletion capabilities for managing large collections of snippets.
- [x] **Contextual Notifications:** Rich toast notification system (Title + Description) with formal styling documentation for clear user feedback.

---

## 2. 🔒 MUST HAVE

_Critical path items for the next release cycle._

- [ ] **State Restoration (Deep Persistence):**
  - Automatically serialize and restore all active workspaces, pane trees, and directory paths upon application restart.

---

## 3. 📈 SHOULD HAVE

_High-value improvements and advanced tooling._

- [ ] **Contextual Pane Actions:**
  - Hover/Shortcut menus for renaming, splitting, or restarting individual terminal instances.
- [ ] **Resource Sparklines:**
  - Lightweight CPU/Memory monitors integrated into pane headers for real-time process tracking.
- [ ] **Embedded Documentation Pane:**
  - A specialized web-view pane for rendering local documentation or reference sites alongside terminal workflows.

---

## 4. 🚫 WON'T HAVE (NOW)

_Explicitly deferred to prevent scope creep._

- [ ] **Process Hibernation:** Keeping PTY processes active via a background daemon after the main application is closed.
- [ ] **Cloud Synchronization:** Centralized settings or workspace sharing (Local-First privacy focus).
- [ ] **Multi-User Collaboration:** Real-time remote terminal sharing or shared workspace environments.

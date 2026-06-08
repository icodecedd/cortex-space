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
- [x] **Unified Component Architecture:** Refactored Combobox and Input systems to eliminate "box-within-a-box" artifacts and focus ring inconsistencies.
- [x] **Reactive Workspace Engine:** Verified isolation between active workspaces and seamless library-to-workspace template injections.
- [x] **Physics-Based Motion System:** Implementation of snappy spring animations and workspace "pushback" (Z-axis scaling + blur) for high-context navigation.
- [x] **Tiered Modal Transitions:** Consistent, depth-aware entrance/exit animations for all dialogs.
- [x] **Bulk Library Management:** Bulk selection and deletion capabilities for managing large collections of snippets.
- [x] **Contextual Notifications:** Rich toast notification system (Title + Description) for clear user feedback.
- [x] **Snippet Variable Placeholders:** Support for dynamic `{{VAR}}` placeholders in commands with a glassmorphic interactive prompt system for pre-execution resolution.
- [x] **Automatic Port Detection:** Real-time terminal output parsing for local ports (e.g., localhost:3000) with verified TCP-liveness checks and pane-header link injection.
- [x] **Environment-Aware Onboarding & Custom Agent Registries:** An onboarding screen that scans and detects existing global agent CLI tools and lets the user dynamically configure/install custom ones directly from settings.
- [x] **Dynamic Pane Drag-and-Drop (UX Elevator):** Re-partition layout trees on the fly by dragging terminal headers, featuring quadrant-based ghost overlays and high-fidelity motion feedback.

---

## 2. 🚀 PRODUCTION READINESS

_Final stability and persistence requirements for v1.0._

- [ ] **State Restoration (Deep Persistence):**
  - Automatically serialize and restore all active workspaces, pane trees, and directory paths upon application restart.
- [ ] **Shell Environment Optimization:**
  - Automated detection and configuration of default shells (Zsh, Bash, PowerShell) with robust PATH inheritance.
- [ ] **Binary Size & Performance Audit:**
  - Final pass on asset optimization and bundle size reduction for production delivery.

---

## 3. 📈 SHOULD HAVE

_High-value improvements and advanced tooling._

- [ ] **Dynamic Settings Architecture:**
  - Revalidate and refactor the settings modal into a dynamic, data-driven architecture (referencing the implementation patterns in the `terax` application).
- [ ] **Contextual Pane Actions:**
  - Hover/Shortcut menus for renaming, splitting, or restarting individual terminal instances.
- [ ] **Resource Sparklines:**
  - Lightweight CPU/Memory monitors integrated into pane headers for real-time process tracking.
- [ ] **Hybrid Agent Architecture (Tauri Sidecars):**
  - Bundle core default AI agent CLIs as local Tauri sidecars to ensure 100% offline, zero-click accessibility out-of-the-box.
- [ ] **Built-in Kanban Task Management:**
  - Integrated task tracking system to manage workflow directly within the app, with the ability to assign tasks to specific terminal panes.
- [ ] **Embedded Documentation Pane:**
  - A specialized web-view pane for rendering local documentation or reference sites alongside terminal workflows.

---

## 4. 🚫 WON'T HAVE (NOW)

_Explicitly deferred to prevent scope creep._

- [ ] **Process Hibernation:** Keeping PTY processes active via a background daemon after the main application is closed.
- [ ] **Cloud Synchronization:** Centralized settings or workspace sharing (Local-First privacy focus).
- [ ] **Multi-User Collaboration:** Real-time remote terminal sharing or shared workspace environments.

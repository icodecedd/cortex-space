<p align="center">
  <img src="public/cortex-new-logo.png" alt="Cortex Space Logo" width="120">
</p>

<h1 align="center">Cortex Space</h1>
<p align="center"><em>Local-First Multi-Pane Terminal Manager for Developers</em></p>
<p align="center"><strong>Native performance. Dynamic layouts. Keyboard-driven workflows.</strong></p>

---

<!-- Badges -->
<p align="center">
  <div align="center">
    <img src="https://img.shields.io/badge/Desktop-Tauri-24C8DB?logo=tauri&logoColor=white" alt="Tauri">
    <img src="https://img.shields.io/badge/Frontend-React-61DAFB?logo=react&logoColor=black" alt="React">
    <img src="https://img.shields.io/badge/UI-Tailwind%20CSS-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS">
    <img src="https://img.shields.io/badge/Bundler-Vite-646CFF?logo=vite&logoColor=white" alt="Vite">
    <img src="https://img.shields.io/badge/Language-TypeScript-3178C6?logo=typescript&logoColor=white" alt="TypeScript">
  </div>
  <div align="center">
    <img src="https://img.shields.io/badge/Terminal-Xterm.js-4EAA25?logo=gnuterminal&logoColor=white" alt="Xterm.js">
    <img src="https://img.shields.io/badge/Animation-Framer%20Motion-0055FF?logo=framer&logoColor=white" alt="Framer Motion">
    <img src="https://img.shields.io/badge/Storage-Tauri%20Store-FF5733?logo=jsonwebtokens&logoColor=white" alt="Tauri Store">
    <img src="https://img.shields.io/badge/License-MIT-lightgrey" alt="License">
  </div>
</p>


---

<p align="center">
  <img src="public/cortex-terminal-mockup.webp" alt="Cortex Space Terminal Mockup" width="800">
</p>

<p align="center">
  <a href="https://cortex-space.vercel.app">
    <img src="https://img.shields.io/badge/Website-cortex--space.vercel.app-8B5CF6?style=for-the-badge&logo=vercel&logoColor=white" alt="Website">
  </a>
  &nbsp;
  <a href="https://github.com/icodecedd/cortex-website">
    <img src="https://img.shields.io/badge/Source%20Code-cortex--website-181717?style=for-the-badge&logo=github&logoColor=white" alt="Source Code">
  </a>
</p>

---

## Project Status

<div align="center">
  <img src="https://img.shields.io/badge/Status-Active%20Development-brightgreen?style=for-the-badge" alt="Active Development">
  <a href="https://github.com/icodecedd/cortex-space/releases"><img src="https://img.shields.io/badge/Version-0.1.3-blue?style=for-the-badge" alt="Version 0.1.3"></a>
</div>

**Under Development** -- Cortex Space is a native desktop terminal manager that replaces static terminal configurations with a dynamic, keyboard-driven multi-pane workspace. Built with Tauri and React, it provides a high-performance terminal experience with recursive split layouts, session persistence, and a plugin-free tool registry.

---

## Overview

Cortex Space unifies terminal instances, workspaces, and developer tooling into a single cohesive desktop application.

### Key Features
- **Multi-Pane Terminal Engine** -- Split, resize, and manage terminal panels powered by Xterm.js and Tauri-based PTY processes with full shell support (PowerShell, Bash, Zsh)
- **Dynamic Recursive Layouts** -- Horizontal and vertical splits with ratio-based resizing, drag-and-drop pane reordering, and quadrant-based repartitioning
- **Global Command Palette** -- Triggered via `Ctrl/Cmd + K` for switching workspaces, executing commands, and launching templates
- **Command Snippets** -- Save, organize, and execute reusable shell commands with dynamic `{{VAR}}` placeholder resolution
- **Workspace & Tab Management** -- Multiple isolated workspaces, each containing sub-tabs with independent terminal layouts
- **CLI Tool Registry** -- Discover and verify installation status of developer CLI tools (AI agents, language servers, build tools) with one-click install commands
- **Automatic Port Detection** -- Live parsing of terminal output for localhost URLs with TCP-liveness checking
- **Zen Mode** -- Full-screen focused terminal view, hiding all chrome
- **Theme System** -- 14 bundled themes (Catppuccin, Dracula, Nord, Tokyo Night, Gruvbox, and more) with dark/light/system scheme support and custom theme creation

---

## Tech Stack

<br>
<div align="center">

| Layer | Technology | Purpose |
|:-----:|:----------:|:--------:|
| **Desktop Core** | Tauri v2, Rust | Native window management, PTY process isolation, OS integration |
| **Frontend** | React 19, TypeScript, Vite | Interactive GUI, layout rendering, component lifecycle |
| **Terminal Engine** | Xterm.js | Low-latency terminal rendering with fit and weblinks addons |
| **PTY Backend** | portable-pty (Rust) | Shell process spawning and I/O management |
| **Styling & UI** | Tailwind CSS, Radix UI, Base UI | Unified design system with accessible controls |
| **Animation** | Framer Motion | Spring-physics transitions, Z-axis scaling, drag gestures |
| **Drag & Drop** | dnd-kit | Pane header drag reordering with live quadrant previews |
| **Persistence** | Tauri Store Plugin | Local JSON-based storage for settings, workspaces, snippets |

</div>

---

## Features

### Completed
- Multi-pane terminal with real PTY shell sessions
- Dynamic recursive split layouts (horizontal/vertical) with resize handles
- Pane drag-and-drop repartitioning with animated ghost overlays
- Global command palette for workspace switching and template launching
- Command snippet repository with `{{VAR}}` placeholder resolution
- Multiple workspace support with sidebar, pinning, and renaming
- Sub-tab system for multiple layouts per workspace
- CLI tool agent registry with install-status detection
- Automatic localhost port detection and TCP-liveness checking
- 14 bundled themes with dark/light/system scheme support
- Custom theme creation and management
- Zen Mode for distraction-free terminal work
- Settings persistence for terminal font, size, shortcuts, and appearance
- Onboarding flow with profile selection and tool scanning
- Pane keyboard navigation (`Alt+Arrows`, `Ctrl+1-9`)
- State restoration across app launches
- Custom titlebar with minimize/maximize/close controls
- Self-updater via GitHub Releases

### In Progress
- Sidebar style tabbing
- Project-based workspaces
- Drag and drop skills to AI agents
- Auto-PR (automated pull request workflows)
- Session management
- Enhanced command snippets with advanced variable resolution

---

## Star History

<a href="https://www.star-history.com/?repos=icodecedd%2Fcortex-space&type=date&legend=top-left">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/chart?repos=icodecedd/cortex-space&type=date&theme=dark&legend=top-left" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/chart?repos=icodecedd/cortex-space&type=date&legend=top-left" />
   <img alt="Star History Chart" src="https://api.star-history.com/chart?repos=icodecedd/cortex-space&type=date&legend=top-left" />
 </picture>
</a>

---

## Contributing

We welcome contributions. See [CONTRIBUTING.md](CONTRIBUTING.md) for setup instructions, development workflow, and pull request guidelines.

---

<p align="center">
  <img src="public/footer.png" alt="Cortex Space Footer" width="800">
</p>

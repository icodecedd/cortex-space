<h1 align="center">Cortex Space</h1>
<p align="center"><em>High-Performance Developer Workspace & Terminal Manager</em></p>
<p align="center"><strong>Instant Terminals. Dynamic Layouts. Keyboard-Driven Workflow.</strong></p>

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

## 📊 Project Status  

<div align="center">
  <!-- Status Badge -->
  <img src="https://img.shields.io/badge/Status-Active%20Development-brightgreen?style=for-the-badge" alt="Active Development">
  <!-- Version Badge -->
  <img src="https://img.shields.io/badge/Version-0.1.0-blue?style=for-the-badge" alt="Version 0.1.0">
</div>

**Under Development** — Cortex Space is a **local-first, high-fidelity developer workspace and terminal manager** designed to replace outdated static terminal configurations with an intuitive, keyboard-driven layout.


---

## 📖 Overview  
**Cortex Space** is built for developers to unify their terminal instances, environments, and custom AI agent tools into a fast, fluid, and cohesive workspace.  

### Key Benefits  
- **🖥️ Advanced Multi-Pane Terminal** – Split, resize, and manage infinite terminal panels powered by Xterm.js and Tauri PTY.
- **⚡ Keyboard-Driven Command Palette** – Trigger settings, switch layouts, and search commands with `Ctrl/Cmd + K`.
- **🔄 Drag-and-Drop Organization** – Rearrange and re-partition terminal trees on the fly using quadrants and ghost previews.
- **📦 Command Snippets & Placeholders** – Save, run, and resolve dynamic parameters in your custom scripts before execution.
- **🔌 Local Agent Registry** – Discover, install, and run AI developer agents directly within custom terminal environments.
- **🌊 Spring-Physics UI** – Fluid animations and spatial cues (Z-axis scale, focus pushback) make window navigation feel extremely premium.

---

## ✨ Features by Subsystem

| 🛠️ Terminal & Workspace Navigation | ⚡ Automation & Agent Workflows |
|-------------------------------------|---------------------------------|
| Split terminals horizontally/vertically in recursive layouts | Create, organize, and reuse multi-step Command Snippets |
| Drag-and-drop terminal headers (`UX Elevator`) with live quadrant previews | Dynamic `{{VAR}}` prompt resolver for customizable variables |
| Directional keyboard shortcuts (`Cmd/Ctrl + Opt + Arrows`) for fast navigation | Real-time Local Port Detection with automatic TCP-liveness checking |
| Persistent state restoration across app launches (Workspaces, paths, layouts) | Environment-Aware Onboarding to scan and configure global CLI agent tools |
| Settings system for themes, fonts, font-size, and global UI scaling | Integration of local and custom AI agents directly in workspace environments |

> **💡 UX Design Note:**  
> Cortex Space is built around keyboard-first, lightning-fast workflows. The entire interface supports directional hotkeys and features tactile micro-interactions (spring physics, Z-axis scaling, and focus pushback) to keep developers in their flow state without losing contextual focus.

---

## 🛠 Tech Stack  

<div align="center">
  <!-- General descriptive badge -->
  <img src="https://img.shields.io/badge/Tech-Stack%20Overview-blue?style=for-the-badge" alt="Tech Stack Overview">
  <img src="https://img.shields.io/badge/Includes-Tauri%2FReact%2FTypeScript%2FLocal--Store-green?style=for-the-badge" alt="Includes Tauri/React/TypeScript/Local-Store">
</div>

<br>
<!-- Tech Stack Table -->
<div align="center">

| Layer       | Technology                     | Description |
|:------------:|:------------:|:------------:|
| **Desktop Core** | Tauri v2, Rust | Binds terminal backend execution with OS native APIs and isolates PTY instances. |
| **Frontend** | React, TypeScript, Vite        | Drives the interactive GUI, layout rendering, and component lifecycle. |
| **Terminal Engine** | Xterm.js                     | Renders low-latency, high-performance terminal views with addon support. |
| **Styling & UI** | Tailwind CSS, Radix UI, Base UI | Powers a fluid, unified design system with robust focus states and styling. |
| **Animation** | Framer Motion                  | Animates transitions, drag gestures, and physics-based spatial interactions. |
| **Storage** | Tauri Store Plugin             | Persists user preferences, layouts, snippets, and app states locally. |

</div>

---

## 🚀 Features  

### ✅ Completed  
- **Multi-Pane Terminal Engine** – High-performance integration of Xterm.js with Tauri-based PTY processes
- **Dynamic Resizable Layouts** – Flexible split-pane engine (horizontal/vertical) with recursive nesting and ratio-based resizing
- **Global Command Palette (`Ctrl/Cmd + K`)** – Lightning-fast "Omni-search" for switching workspaces, templates, or executing UI actions
- **Command Snippet Repository** – Store, reuse, and bulk-manage commands to execute instantly in focused terminals
- **Snippet Variable Placeholders** – Dynamic `{{VAR}}` placeholders with glassmorphic prompt resolution before execution
- **Automatic Port Detection** – Live terminal output parsing for localhost links with TCP-liveness checks
- **Pane Drag-and-Drop (UX Elevator)** – Quadrant-based layout re-partitioning with animated ghost overlays
- **Global Settings & Onboarding** – Persistent configuration for typography/themes, plus onboarding tool scan for developer agents

### 🔄 In Progress  
- **State Restoration (Deep Persistence)** – Auto-serialize and restore all active workspaces, pane trees, and directory paths upon restart
- **Shell Environment Optimization** – Auto-detection of default shells (Zsh, Bash, PowerShell) with PATH inheritance
- **Contextual Pane Actions** – Hover and shortcut menus to rename, split, or restart terminal instances
- **Resource Sparklines** – Integrated CPU/Memory monitors inside pane headers for real-time tracking
- **Hybrid Agent Architecture (Tauri Sidecars)** – Bundle default AI agent CLIs as local Tauri sidecars for 100% offline access

---

## 🤝 Contributing  

<p align="center">
  <img src="https://img.shields.io/badge/We%20Welcome-Contributions-brightgreen?style=for-the-badge" alt="We Welcome Contributions">
</p>

We love collaboration! Here’s how you can contribute:  

1. **Fork** the repository  
2. **Create** a feature branch (`git checkout -b feature-name`)  
3. **Commit** your changes (`git commit -m 'Add new feature'`)  
4. **Push** to your branch (`git push origin feature-name`)  
5. **Open** a Pull Request  

---

<div align="center">
  <h3>📢 Support the project and help improve developer productivity! 📢</h3>
  
  <p>
    <img src="https://img.shields.io/badge/Built for-Developer%20Velocity-blue?style=for-the-badge" alt="Built for Developer Velocity">
  </p>
  
  <p>
    <a href="https://github.com/icodecedd/cortex-space/stargazers">
      <img alt="GitHub Repo stars" src="https://img.shields.io/github/stars/icodecedd/cortex-space?style=social">
    </a>
    <a href="https://github.com/icodecedd/cortex-space/network/members">
      <img alt="GitHub forks" src="https://img.shields.io/github/forks/icodecedd/cortex-space?style=social">
    </a>
  </p>
  
  <sub>© 2026 Cortex Space - Built for Next-Generation Workspaces</sub>
</div>

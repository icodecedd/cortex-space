# Design Specification: Modern & Vibrant Onboarding Screen Overhaul

This specification outlines the redesign of the First-Run Onboarding wizard (`FirstRunOnboardingScreen.tsx`) for Cortex Space. The goal is to replace the brutalist layout with a modern, high-energy, glassmorphic, and bento-inspired setup experience.

---

## 1. Overall Theme & Foundations

We transition the onboarding screen from inline absolute sizing to a responsive container styled with Tailwind CSS, leveraging the project's CSS variables and design guidelines.

### A. Dynamic Background Mesh (`<AuroraGlow />`)
* **Visuals**: A set of three absolute-positioned, floating radial gradient circles that drift in the background with keyframe animations.
* **Theme Sync**: The background gradients dynamically transition between palettes when the user selects a personalization theme:
  * **Neon Pink** (default): Purple/Rose glow.
  * **Hacker Green**: Emerald/Cyan glow.
  * **Cyberpunk Yellow**: Gold/Amber glow.
  * **Obsidian**: Deep grey/slate monochrome glow.
* **Transition**: A `1s` transition using ease-out ensures color switching feels organic.

### B. Glassmorphic Wizard Card
* Centered main wizard container card using a frosted glass aesthetic:
  * Background: `rgba(15, 15, 17, 0.7)`
  * Blur: `backdrop-filter: blur(16px)`
  * Border: `1px solid rgba(255, 255, 255, 0.08)`
  * Shadow highlight: `box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 24px 48px -12px rgba(0, 0, 0, 0.5)`
  * Corner Radii: `var(--radius-lg)` (14px)

---

## 2. Onboarding Steps Breakdown

The onboarding flow is restructured into a streamlined 5-step sequence, blending diagnostics and workspace selection while introducing personalization choices.

### Step 1: Boot (Neural Wake)
* **Title**: "CORTEX SPACE" rendered with scrambling glyph effects and a premium white-to-slate gradient mask.
* **Visuals**: A clean mini-console sub-card mounting logs (`BootLog` component) with a blinking cursor.

### Step 2: Environment & Diagnostics (Workspace & System checks)
* **Layout**: Two-column layout on desktop, stacking on mobile.
* **Left Column (Workspace Paths)**:
  * A text input labeled "Workspace Root Path" with a leading folder icon.
  * Browse button with custom spring-press animation scaling (`scale(0.97)` on `:active`).
* **Right Column (Diagnostics)**:
  * Check cards showing live status of Node.js, Git, Shell, and Filesystem access.
  * Animated indicators:
    * **Checking**: Pulse animation using the active theme color.
    * **Nominal**: Glowing emerald green dot.
    * **Failed**: Glowing red dot.
    * **Degraded/Warn**: Glowing amber dot.
  * मोनोस्पेस type output (e.g. `v18.16.0`) is shown beneath labels once resolved.

### Step 3: Visual Persona (Setup Style & Layout Preset)
* **Theme selector**:
  * 4 circular options: Neon Pink (`#FF66B2`), Hacker Green (`#10B981`), Cyberpunk Yellow (`#F59E0B`), and Obsidian (`#E5E5E5`).
  * Selected theme card grows slightly (`scale(1.02)`) with a glowing neon border.
  * Updates global accent state variables in real-time, modifying the background Aurora color instantly.
* **Layout Preset selector**:
  * Options: **Single Pane**, **Split Panes**, and **Quad Grid**.
  * Previews: Miniature layouts represented in CSS grid blocks. Hovering or selecting makes the panes inside highlight and scale with spring physics.

### Step 4: Architecture Bento (Concepts)
* **Layout**: A 3-cell Bento Grid representing Workspaces, Panes, and Agents.
  * Grid arrangement:
    * Workspaces: Col-span 1
    * Panes: Col-span 1
    * Agents: Col-span 2
* **Interactions**:
  * Hovering cells scales them up slightly and lights up a technical diagram overlay.
  * Clicking cells opens details containing micro-documentation with smooth spring layout transitions.

### Step 5: Ready to Launch (Summary & Activation)
* **Layout**: Receipt layout listing:
  * Workspace path (`~/workspace`)
  * System Checks Status (`Passed`)
  * Selected Theme (`Pink/Green/Yellow/Slate`)
  * Layout Preset (`Single/Split/Quad`)
* **Launch Button**: A prominent CTA styled with:
  * Continuous ambient border glow matching selected theme.
  * Mouse spotlight overlay tracking the cursor across the button's surface.
  * Scale-on-press tactile animation (`scale(0.97)`).
  * Plays a satisfying fade-out fade-in loading state on click.

---

## 3. Tech Stack & Implementation Details

* **Language**: TypeScript (TSX)
* **Animations**: Framer Motion (`framer-motion`) and CSS variables transitions.
* **Styling**: Tailwind CSS classes coupled with standard local theme variables.
* **Accessibility**: Contrast checking (>4.5:1), keyboard triggers (Enter for next, Escape for back), focus states, and checking `useReducedMotion()` to skip/degrade translations to simple fades.

---

## 4. Verification Plan

### Automated Checks
* Execute Tailwind/React typescript compilation baseline to verify zero compilation errors:
  ```bash
  npm run build --noEmit or pnpm tsc
  ```

### Manual Verification
* Navigate through all 5 steps in the Tauri development window.
* Toggle between Neon Pink, Hacker Green, Cyberpunk Yellow, and Obsidian themes to verify real-time color variable overrides and Aurora Background gradient shift.
* Hover and click bento cells to check expand animations and layout previews.
* Test responsiveness by reducing window dimensions.

# UI Rules & Styling Design System

Cortex Space is engineered to feel premium, tactile, and highly responsive. We combine TailwindCSS utilities with local CSS variables and custom micro-animations to achieve a high-fidelity visual experience.

---

## 1. Design Token Specifications

All components must consume styling values defined in [src/index.css](file:///c:/Users/Chaoscedd/Programming/web-development/cortex-space/src/index.css):

### A. Color Palette (Dark Theme Focus)
- **Background (`--bg-color` / `#0A0A0A`):** Deep, pure black to avoid standard muddy grey AI themes.
- **Surface (`--surface-color` / `#161616`):** Sleek slate-black for cards, panels, and tab containers.
- **Border (`--border-color` / `#262626`):** High-contrast thin divider line for grid separations.
- **Accent Primary (`--accent-primary` / `#FF66B2`):** Premium vibrant pink accent color for highlights, focus markers, and selected states.
- **Text Primary (`--text-primary` / `#ffffff`):** Stark white for maximum legibility.
- **Text Secondary (`--text-secondary` / `#A3A3A3`):** Neutral grey for hints, tooltips, and non-focused text.

### B. Geometry & Radii
- **Hierarchy:** We use an 8px base for micro-elements and 12px for layout wrappers.
  - `--radius-sm`: `8px` (Atomic UI elements like buttons, inputs, context items)
  - `--radius-md` & `--radius-lg`: `12px` (Cards, panels, tabs, and workspace grids)

---

## 2. Prevents "Box-within-a-Box" & Focus Ring Inconsistencies

Double-borders and nested boxes degrade the visual hierarchy. Apply these rules:
- **No Double Borders:** Do not place a bordered component directly inside another bordered card unless there is inset padding and a clear surface color contrast.
- **Single Focus Ring:** Ensure focus outlines do not overlap with borders. Interactive elements should use:
  ```css
  *:focus-visible {
    outline: 2px solid var(--accent-primary);
    outline-offset: 2px;
  }
  ```
- **Ghost Button Alignment:** Ensure ghost buttons align text exactly with adjacent borders.

---

## 3. Micro-Animations & Motion Design

We employ snapping spring physics and smooth curves to keep the UI interactive and tactile:

### A. Easing & Timing Constants
- **Standard Curve:** `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)` (snappy entry, smooth deceleration).
- **Fast Duration:** `--duration-fast: 160ms` (hover states, micro-interactions).
- **Normal Duration:** `--duration-normal: 250ms` (page fades, panel resizing, sliders).

### B. Tactile Feedback (`.btn-tactile`)
All clickable elements (buttons, layout cards) should shrink slightly when clicked:
```css
.btn-tactile:active {
  transform: scale(0.97);
}
```

### C. Glassmorphic Modal & Card Entrances
Dialogs and modals should slide up and fade in from a blurred starting state using CSS starting styles:
```css
.animate-in {
  opacity: 1;
  transform: translateY(0);
  filter: blur(0px);
  transition: opacity 250ms var(--ease-out),
              transform 250ms var(--ease-out),
              filter 250ms var(--ease-out);

  @starting-style {
    opacity: 0;
    transform: translateY(8px);
    filter: blur(4px);
  }
}
```

### D. Accessibility & Reduced Motion
Always check the user's reduced-motion setting. If `AppearanceSettings.reducedMotion` is true, disable scale and translate animations, falling back to instant opacity fades.

---

## 4. Typography Rules

- **Sans-serif Font Stack:** `Inter Variable`, `-apple-system`, `system-ui`. Used for control labels, menus, sidebar actions, and dialog text.
- **Monospace Font Stack:** `JetBrains Mono`, `monospace`. Reserved for terminal grids, variables prompting, and code snippet editors.

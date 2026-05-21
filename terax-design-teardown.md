# Terax — Design Teardown
> Reference document for replicating the Terax terminal emulator UI in Cortex

---

## 1. Structural Design Blueprint

### Container Specifications

| Property | Value |
|----------|-------|
| App shell | `100vw × 100vh` |
| Outer background | `#09090E` |
| Sidebar width | `~190px` fixed |
| Tab bar height | `~36px` |
| Title bar height | `~28px` |
| Bottom bar height | `~32px` |
| Border radius | `0px` — flush edges throughout |
| Outer border | none |

---

### Layout Structure & Flow

```
┌─────────────────────────────────────────────────────┐
│           native titlebar + traffic lights + tabs    │  h-7 + h-9
├───────────────────┬─────────────────────────────────┤
│                   │                                 │
│   sidebar         │   terminal content area         │
│   file tree       │   #09090E                       │
│   #141418         │                                 │
│   w-[190px]       │   flex-1                        │
│                   │                                 │
├───────────────────┴─────────────────────────────────┤
│           status bar + AI input                      │  h-8
└─────────────────────────────────────────────────────┘
```

Three distinct surface layers:
- `#1C1C22` — all chrome surfaces (title bar, tab bar, status bar)
- `#141418` — sidebar
- `#09090E` — terminal content only (the darkest layer)

---

### Spacing System

| Zone | Rule |
|------|------|
| Sidebar item padding | `px-3 py-0.5` |
| Sidebar indent per depth level | `12px × depth + 8px base` |
| Sidebar icon gap | `6px` |
| Tab item padding | `px-3 h-[36px]` |
| Tab gap | `0px` — flush |
| Active tab indicator | `2px border-bottom` |
| Terminal padding | `px-3 pt-2` |
| Terminal line height | `1.55rem` |
| Bottom bar padding | `px-4 py-1.5` |

---

## 2. Global Aesthetics Token Sheet

### Color System

#### Backgrounds

| Token | Hex | Usage |
|-------|-----|-------|
| Terminal bg | `#09090E` | Main content area — the darkest surface |
| Sidebar bg | `#141418` | File tree panel |
| Chrome bg | `#1C1C22` | Title bar, tab bar, status bar |
| Active tab bg | `#09090E` | Matches terminal — creates "open into" illusion |
| Elevated surface | `#1F1F28` | Badges, hover states, model pill |
| Border / divider | `#2A2A35` | All `0.5px` separators |
| Selection highlight | `#264F7866` | ~40% opacity |

#### Text

| Token | Hex | Usage |
|-------|-----|-------|
| Foreground / body | `#C9C9D4` | Default terminal text |
| Command text | `#E2E2EC` | Off-white — typed commands |
| Muted / secondary | `#6B6B80` | Sidebar icons, status bar, placeholders |

#### ANSI / Accent Colors

| Token | Hex | Usage |
|-------|-----|-------|
| Prompt arrow / success | `#3FB950` | Active prompt, active tab indicator |
| Blue / path | `#58A6FF` | Directory segments, key labels in output |
| Yellow / warning | `#E5A50A` | Warning values, disk percentage |
| Red / error | `#F85149` | Error states, high usage values |
| Purple / accent | `#C792EA` | Secondary accent in output |

#### Full Swatch Reference

```
#09090E  #141418  #1C1C22  #2A2A35
#3FB950  #58A6FF  #E5A50A  #F85149  #C792EA
#C9C9D4  #E2E2EC  #6B6B80
```

---

### Typography Scale

| Element | Size | Weight | Leading | Notes |
|---------|------|--------|---------|-------|
| Terminal body | `13px` | `400` | `1.55` | JetBrains Mono / SF Mono |
| Sidebar file name | `12px` | `400` | `1.4` | system-ui sans-serif |
| Sidebar section label | `11px` | `500` | — | uppercase, tracking `.06em` |
| Tab label | `12px` | `400` | — | truncated with ellipsis |
| Git branch badge | `11px` | `400` | — | font-mono, inline |
| Bottom bar / status | `12px` | `400` | — | muted `#6B6B80` |
| AI input placeholder | `13px` | `400` | — | muted `#6B6B80` |
| Model badge | `11px` | `400` | — | font-mono, rounded pill |

Font stack:
```css
/* Terminal */
font-family: 'JetBrains Mono', 'SF Mono', 'Fira Code', monospace;

/* UI chrome */
font-family: -apple-system, system-ui, sans-serif;
```

---

## 3. Component Architecture

### Native Title Bar
```
h-[28px] bg-[#1C1C22] flex items-center px-3 gap-1.5 border-b border-[#2A2A35]
Traffic lights: w-2.5 h-2.5 rounded-full — red #F85149, yellow #D29922, green #3FB950
```

### Tab Bar
```
h-[36px] bg-[#1C1C22] flex items-end border-b border-[#2A2A35]

Active tab:
  px-3 h-full flex items-center gap-2 text-[12px]
  bg-[#09090E] border-b-2 border-[#3FB950] text-[#E2E2EC]

Inactive tab:
  px-3 h-[calc(100%-4px)] flex items-center gap-2 text-[12px]
  text-[#6B6B80] hover:text-[#C9C9D4]
```

### Sidebar File Tree
```
w-[190px] bg-[#141418] border-r border-[#2A2A35] overflow-y-auto py-1

Tree item:
  h-[22px] flex items-center gap-1.5 text-[12px] text-[#C9C9D4]
  hover:bg-[#1C1C22] cursor-pointer select-none
  paddingLeft: depth * 12 + 8  ← dynamic indent formula

Icon: ti-folder / ti-file at 14px, color #6B6B80
```

### Terminal Pane
```
flex-1 bg-[#09090E] overflow-hidden
font-mono text-[13px] leading-[1.55] text-[#C9C9D4]
px-3 pt-2
```

### Prompt Line
```jsx
<div className="flex items-center gap-1.5 flex-wrap">
  <span className="text-[#3FB950]">→</span>
  <span className="text-[#58A6FF]">~/project</span>
  <span className="text-[11px] bg-[#1C1C22] text-[#C9C9D4] rounded px-1.5 font-mono">
    git:(main)
  </span>
  <span className="text-[#E2E2EC]">command here</span>
  <span className="w-[2px] h-[14px] bg-[#E2E2EC] animate-pulse" /> {/* cursor */}
</div>
```

### Bottom Status Bar
```
h-8 bg-[#1C1C22] border-t border-[#2A2A35]
flex items-center px-4 justify-between flex-shrink-0

Left:  text-[12px] text-[#6B6B80]  →  "Ask anything"
Right: text-[11px] bg-[#1F1F28] text-[#C9C9D4] rounded-md px-2 py-0.5 font-mono
       →  "GPT-4.1 mini" / model badge
```

### Git Branch Badge (inline in prompt)
```
bg-[#1C1C22] text-[#C9C9D4] text-[11px]
rounded px-1.5 font-mono
No border. Inline in prompt line.
```

### ANSI Color Strip (inline terminal output)
```
flex row of 8 equal squares
Each: w-[18px] h-[18px] rounded-[2px] no gap, no border
Rendered inline in terminal output
```

---

## 4. High-Fidelity Tailwind CSS Specification

Complete shell structure for direct use in Cortex:

```tsx
<div className="w-screen h-screen flex flex-col bg-[#09090E] overflow-hidden font-sans">

  {/* Native title bar */}
  <div className="h-7 bg-[#1C1C22] flex items-center px-3 gap-1.5 flex-shrink-0 border-b border-[#2A2A35]">
    <div className="w-2.5 h-2.5 rounded-full bg-[#F85149]" />
    <div className="w-2.5 h-2.5 rounded-full bg-[#D29922]" />
    <div className="w-2.5 h-2.5 rounded-full bg-[#3FB950]" />
  </div>

  {/* Tab bar */}
  <div className="h-9 bg-[#1C1C22] flex items-end flex-shrink-0 border-b border-[#2A2A35]">
    {/* Active tab */}
    <div className="px-3 h-full flex items-center gap-2 text-[12px] text-[#E2E2EC]
                    bg-[#09090E] border-b-2 border-[#3FB950] cursor-pointer">
      page.tsx
    </div>
    {/* Inactive tab */}
    <div className="px-3 h-[calc(100%-4px)] flex items-center gap-2 text-[12px]
                    text-[#6B6B80] hover:text-[#C9C9D4] cursor-pointer">
      lib.rs
    </div>
  </div>

  {/* Main content */}
  <div className="flex flex-1 overflow-hidden">

    {/* Sidebar */}
    <div className="w-[190px] flex-shrink-0 bg-[#141418] border-r border-[#2A2A35]
                    overflow-y-auto text-[12px] text-[#C9C9D4] py-1">
      {/* Tree item — depth controls paddingLeft */}
      <div
        className="flex items-center h-[22px] gap-1.5 text-[#C9C9D4]
                   hover:bg-[#1C1C22] cursor-pointer select-none"
        style={{ paddingLeft: depth * 12 + 8 }}
      >
        <i className="ti ti-folder text-[14px] text-[#6B6B80]" aria-hidden="true" />
        src
      </div>
    </div>

    {/* Terminal pane */}
    <div className="flex-1 bg-[#09090E] overflow-hidden font-mono
                    text-[13px] leading-[1.55] text-[#C9C9D4] px-3 pt-2">
      {/* Prompt line */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[#3FB950]">→</span>
        <span className="text-[#58A6FF]">~/project</span>
        <span className="text-[11px] bg-[#1C1C22] text-[#C9C9D4] rounded px-1.5 font-mono">
          git:(main)
        </span>
        <span className="text-[#E2E2EC]">gemini --model pro</span>
      </div>
      {/* Output line */}
      <div className="text-[#C9C9D4] mt-0.5">
        <span className="text-[#3FB950]">●</span> agent spawned · pid 8421
      </div>
    </div>

  </div>

  {/* Bottom status bar */}
  <div className="h-8 bg-[#1C1C22] border-t border-[#2A2A35] flex items-center
                  px-4 justify-between flex-shrink-0">
    <span className="text-[12px] text-[#6B6B80]">Ask Cortex anything</span>
    <span className="text-[11px] bg-[#1F1F28] text-[#C9C9D4] rounded-md px-2 py-0.5 font-mono">
      Cortex · Spawn Dark
    </span>
  </div>

</div>
```

---

## 5. Key Design Decisions to Apply to Cortex

### The "open into" tab illusion
The active tab uses `bg-[#09090E]` — identical to the terminal background. This makes the tab appear to open directly into the content with no visual gap. Only the `border-b-2 border-[#3FB950]` indicator marks it as active.

### Three-layer surface hierarchy
Never use more than three background values for the main shell:
1. `#1C1C22` — chrome (bars, rails)
2. `#141418` — sidebar panels
3. `#09090E` — content (terminal)

This alone creates the depth without shadows or gradients.

### Sidebar depth formula
```js
paddingLeft: depth * 12 + 8
```
Simple, scalable, works for any nesting level.

### Status dot colors
Map directly to the Spawn Dark theme palette:
- Idle → `#6B6B80`
- Running → `#3FB950`
- Error → `#F85149`
- Exited → `#D29922`

### Agent badge in pane title bar
```tsx
<span className="text-[11px] bg-[#1F1F28] text-[#C9C9D4] rounded px-1.5 font-mono">
  gemini
</span>
```

---

*Generated for Cortex by Cursiv — teardown based on Terax terminal emulator screenshot*

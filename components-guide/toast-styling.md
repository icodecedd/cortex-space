# Toast Styling & Notification System

Cortex uses [Sonner](https://sonner.emilkowal.ski/) for a lightweight, aesthetically refined notification system. To maintain the "Premium Terminal" feel, follow these guidelines.

## 1. Visual Specification

Toasts are configured globally in `App.tsx` via the `<Toaster />` component.

```tsx
<Toaster 
  position="bottom-right" 
  theme="dark" 
  closeButton 
  richColors 
/>
```

### Aesthetic Rules:
- **Background:** Should match `var(--surface-color)` with high backdrop blur.
- **Border:** `1px solid var(--border-color)`.
- **Typography:**
  - **Title:** `font-semibold text-[13px] tracking-tight`
  - **Description:** `text-[12px] opacity-70 leading-relaxed`
- **Animation:** Use the default Sonner "stacking" behavior (Emil Kowalski style) with subtle entry/exit transitions.

## 2. Notification Patterns

Always provide context. Avoid naked toasts (titles without descriptions).

### Success (Accent / Green)
Used for positive outcomes like saving or launching.
```tsx
toast.success("Workspace Activated", {
  description: "Loaded successfuly in NORMAL mode."
});
```

### Info (Blue / Slate)
Used for neutral actions like deletions or minor settings changes.
```tsx
toast.info("Snippet Removed", {
  description: `"Git Flush" has been deleted from your library.`
});
```

### Warning (Amber)
Used for non-fatal closures or state changes.
```tsx
toast.warning("Workspace Closed", {
  description: "PTY process connections terminated cleanly."
});
```

### Error (Red)
Used for fatal failures or invalid user input.
```tsx
toast.error("Invalid Directory", {
  description: "The path provided does not exist or is inaccessible."
});
```

## 3. Bulk Action Guidelines
When performing batch operations, use a summary toast instead of multiple individual toasts to avoid "notification fatigue."

**Correct:**
```tsx
toast.info("Bulk Deletion Complete", {
  description: `Successfully removed ${ids.length} snippets.`
});
```

**Avoid:**
*Firing 10 separate toasts for 10 deleted items.*

## 4. Hierarchy & Context
The **Title** should state the *Result* (what happened).
The **Description** should provide the *Context* (which item or details).

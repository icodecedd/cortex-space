# Dialog Styling Guide

When creating or modifying dialogs (modals) in this application, follow these spacing and styling rules to match the established rich, structural aesthetic. The design relies heavily on distinct content areas, generous padding, and a separated footer with full-width action buttons.

You can apply these via inline `style` objects (preferred for highly custom structural CSS like negative margins and grid layouts) or Tailwind utility classes.

## 1. Container (DialogContent)
The main dialog container must be deeply shadowed and have generous internal padding, especially at the top.

**Tailwind equivalents:** `bg-[var(--surface-color)] border-[var(--border-color)] shadow-2xl`
**Inline Style:**
```jsx
<DialogContent
  showCloseButton={true}
  className="bg-[var(--surface-color)] border-[var(--border-color)] shadow-2xl"
  style={{
    padding: '2rem 1.5rem 1.5rem', // Generous top padding (2rem)
    maxWidth: '400px',
    width: 'calc(100% - 2rem)'
  }}
>
```

## 2. Header and Typography
Headers should be clearly structured with tight tracking on titles and relaxed line height on descriptions. Ensure text is explicitly aligned to the left.

**Header:**
```jsx
<DialogHeader className="gap-2 text-left sm:text-left">
```

**Title:**
```jsx
<DialogTitle className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
  Title Text
</DialogTitle>
```

**Description:**
```jsx
<DialogDescription
  className="text-sm leading-relaxed"
  style={{ color: 'rgba(255, 255, 255, 0.7)' }} // Or use var(--text-secondary)
>
  Description text goes here...
</DialogDescription>
```

## 3. Footer (The Structural Base)
The footer is the most distinct structural element. It uses negative margins to pull it flush against the edges of the parent container, essentially creating a solid "bar" at the bottom of the dialog. It uses a CSS grid to split the buttons equally.

**Inline Style:**
```jsx
<DialogFooter
  style={{
    display: 'grid',
    gridTemplateColumns: '1fr 1fr', // Equal width buttons
    gap: '0.75rem',
    margin: '1.5rem -1.5rem -1.5rem -1.5rem', // Pull to edges of DialogContent
    padding: '1.25rem 1.5rem',
    borderTop: '1px solid var(--border-color)',
    background: 'rgba(255, 255, 255, 0.015)' // Subtle background differentiation
  }}
>
```

## 4. Action Buttons
Buttons inside the footer should be thick (`40px`), have slightly larger font size (`0.85rem`), and bold font weight (`600`).

**Cancel / Stay (Ghost Button):**
```jsx
<Button
  variant="ghost"
  className="btn-tactile"
  style={{
    fontSize: '0.85rem',
    fontWeight: 600,
    height: '40px',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-secondary)'
  }}
>
  Cancel
</Button>
```

**Confirm / Action (Primary Button):**
```jsx
<Button
  className="primary btn-tactile"
  style={{
    fontSize: '0.85rem',
    fontWeight: 600,
    height: '40px',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--accent-contrast)'
  }}
>
  Confirm
</Button>
```

## Summary Checklist for AI Agents
1. Does the `DialogContent` have a `shadow-2xl` and a generous padding, especially on top (`2rem`)?
2. Are the `DialogTitle` and `DialogDescription` left-aligned with appropriate tracking and leading?
3. Does the `DialogFooter` use negative margins (`margin: '1.5rem -1.5rem -1.5rem -1.5rem'`) to span the full width of the dialog bottom?
4. Does the `DialogFooter` have a subtle top border and background color?
5. Are the footer buttons arranged in a grid (`grid-template-columns: 1fr 1fr`)?
6. Are the action buttons thick (`40px` height) with a bold weight (`600`)?

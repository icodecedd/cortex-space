# Dropdown & Popover Styling Guide

When generating or modifying dropdown menus, select menus, and popovers, the default component library styles often appear too "compacted" or cramped. To match the application's rich, un-compacted aesthetic (as seen in the Theme Selector), apply the following spacing and styling rules. 

You can apply these via inline `style` objects (preferred for highly custom precision) or Tailwind utility classes.

## General Principles
- **Add outer container padding** so items do not touch the edges.
- **Increase item padding** so click targets are comfortable.
- **Add vertical margin between items** so they aren't squished together.
- **Use generous padding for section labels**, prioritizing top padding to separate sections.
- **Use deep shadows** to elevate the popup off the background.

## 1. Container (Content)
Give the popup container a slight inner padding and a deep shadow.

**Tailwind:** `p-1.5 shadow-[0_10px_40px_rgba(0,0,0,0.6)] w-56 bg-[var(--surface-color)] border-[var(--border-color)]`
**Inline Style:**
```jsx
<DropdownMenuContent 
  className="w-56 bg-[var(--surface-color)] border-[var(--border-color)] animate-in p-1.5"
  style={{ boxShadow: '0 10px 40px rgba(0,0,0,0.6)' }}
>
```

## 2. Labels
Labels should be small, muted, slightly bold, and have generous padding—especially on top—to space out groups.

**Tailwind equivalents:** `text-[0.65rem] text-[var(--text-secondary)] font-semibold pt-3 px-[0.85rem] pb-2`
**Inline Style:**
```jsx
<DropdownMenuLabel style={{
  fontSize: '0.65rem',
  color: 'var(--text-secondary)',
  fontWeight: 600,
  padding: '0.75rem 0.85rem 0.5rem',
}}>
  Section Name
</DropdownMenuLabel>
```

## 3. Separators
Separators should not span edge-to-edge. Give them horizontal margins and lower opacity.

**Tailwind:** `bg-[var(--border-color)] opacity-50 mx-2 mb-1`
**JSX:**
```jsx
<DropdownMenuSeparator className="bg-[var(--border-color)] opacity-50 mx-2 mb-1" />
```

## 4. Items (The critical part to avoid compactness)
Menu items must have ample internal padding and a small vertical margin to separate them from adjacent items. 

**Tailwind equivalents:** `text-[0.75rem] px-[0.85rem] py-[0.6rem] my-[0.15rem] rounded-[var(--radius-sm)] transition-all duration-150`
**Inline Style (Reference from Theme Selector):**
```jsx
<DropdownMenuItem
  style={{
    fontSize: '0.75rem',
    color: isActive ? 'var(--accent-primary)' : 'var(--text-primary)',
    background: isActive ? 'rgba(255,255,255,0.04)' : 'transparent',
    cursor: 'pointer',
    padding: '0.6rem 0.85rem',
    margin: '0.15rem 0',
    borderRadius: 'var(--radius-sm)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    transition: 'all 150ms ease'
  }}
>
  Item Text
</DropdownMenuItem>
```

## Summary Checklist for AI Agents
1. Did you override the default `p-1` on the container to `p-1.5`?
2. Did you increase the item padding to roughly `padding: '0.6rem 0.85rem'`?
3. Did you add vertical spacing between items (`margin: '0.15rem 0'`)?
4. Is the font sizing proportional (`0.75rem` for items, `0.65rem` for labels)?
5. Is there a prominent shadow (`boxShadow: '0 10px 40px rgba(0,0,0,0.6)'`) on the popup?

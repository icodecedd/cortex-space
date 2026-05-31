"use client"

import * as React from "react"
import { X, Terminal, Ban } from "lucide-react"
import { Popover, PopoverAnchor, PopoverContent, PopoverTitle } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export type TabColor = 'slate' | 'emerald' | 'cobalt' | 'crimson' | 'amber'

export interface InteractiveTabProps {
  id: string
  name: string
  customName?: string
  isActive: boolean
  isDraft: boolean
  color?: TabColor
  icon?: React.ReactNode
  onSelect: () => void
  onClose: () => void
  onRename: (newName: string) => void
  onColorChange: (newColor: TabColor) => void
  onCloseOthers?: () => void
  onCloseToRight?: () => void
}

export const COLOR_MAP: Record<
  TabColor,
  {
    hex: string
    border: string
    bg: string
    text: string
    ring: string
    label: string
  }
> = {
  slate: {
    hex: "#64748b",
    border: "border-slate-500/60",
    bg: "from-slate-500/10",
    text: "text-slate-400",
    ring: "ring-slate-500",
    label: "Slate",
  },
  emerald: {
    hex: "#10b981",
    border: "border-emerald-500/60",
    bg: "from-emerald-500/10",
    text: "text-emerald-400",
    ring: "ring-emerald-500",
    label: "Emerald",
  },
  cobalt: {
    hex: "#3b82f6",
    border: "border-blue-500/60",
    bg: "from-blue-500/10",
    text: "text-blue-400",
    ring: "ring-blue-500",
    label: "Cobalt",
  },
  crimson: {
    hex: "#ef4444",
    border: "border-red-500/60",
    bg: "from-red-500/10",
    text: "text-red-400",
    ring: "ring-red-500",
    label: "Crimson",
  },
  amber: {
    hex: "#f59e0b",
    border: "border-amber-500/60",
    bg: "from-amber-500/10",
    text: "text-amber-400",
    ring: "ring-amber-500",
    label: "Amber",
  },
}

export function InteractiveTab({
  id: _id,
  name,
  customName,
  isActive,
  isDraft,
  color,
  icon,
  onSelect,
  onClose,
  onRename,
  onColorChange,
  onCloseOthers,
  onCloseToRight,
}: InteractiveTabProps) {
  const [popoverOpen, setPopoverOpen] = React.useState(false)
  const [isRenaming, setIsRenaming] = React.useState(false)
  const [tempName, setTempName] = React.useState(customName || name)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const displayName = customName || name || "New Workspace"

  // Sync tempName when name changes externally
  React.useEffect(() => {
    setTempName(customName || name)
  }, [name, customName])

  // Focus input when renaming starts
  React.useEffect(() => {
    if (isRenaming) {
      setTimeout(() => {
        inputRef.current?.focus()
        inputRef.current?.select()
      }, 50)
    }
  }, [isRenaming])

  // Reset renaming state when popover closes
  React.useEffect(() => {
    if (!popoverOpen) {
      setIsRenaming(false)
    }
  }, [popoverOpen])

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    setPopoverOpen(true)
  }

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onRename(tempName.trim())
    setPopoverOpen(false)
  }

  const activeColorConfig = color ? COLOR_MAP[color] : null

  return (
    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
      <PopoverAnchor asChild>
        <div
          onClick={onSelect}
          onContextMenu={handleContextMenu}
          title={`${displayName}${customName && name ? ` (${name})` : ""}\nRight-click to rename or change color`}
          className={cn(
            "group relative h-8 px-3 rounded-t-lg flex items-center gap-2 text-[11px] font-sans font-medium cursor-pointer transition-all duration-200 select-none shrink-0 min-w-[120px] max-w-[200px] overflow-hidden [-webkit-app-region:no-drag]",
            isActive
              ? "bg-[var(--surface-color)] text-[var(--text-primary)] shadow-[0_-1px_0_rgba(255,255,255,0.05)_inset]"
              : "bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5",
            isDraft && !isActive && "opacity-60",
            // Apply color border adjustments
            color && "border-b-2",
            color && activeColorConfig?.border
          )}
        >
          {/* Active Tab Indicator Top Line (Browser Style) */}
          {isActive && (
            <div className={cn(
              "absolute top-0 left-0 right-0 h-[2px] bg-[var(--accent-primary)] opacity-80"
            )} />
          )}

          {/* Left Slot: Mode Indicator / Icon */}
          <div className="flex items-center justify-center shrink-0 z-10">
            {icon ? (
              <div className={cn(
                "transition-all duration-200",
                isActive ? "opacity-100 scale-110" : "opacity-50 group-hover:opacity-100"
              )}>
                {icon}
              </div>
            ) : (
              <Terminal
                size={12}
                className={cn(
                  "transition-all duration-200",
                  isActive
                    ? "text-[var(--accent-primary)] scale-110"
                    : "text-[var(--text-secondary)] opacity-50 group-hover:opacity-100",
                  color && activeColorConfig?.text
                )}
              />
            )}
          </div>

          {/* Workspace Title (Truncated) */}
          <span
            className={cn(
              "truncate text-left flex-1 block z-10 transition-colors duration-200",
              isActive ? "font-semibold" : "font-medium"
            )}
          >
            {displayName}
          </span>

          {/* Far Right Close ('X') Button */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onClose()
            }}
            className={cn(
              "ml-auto p-0.5 rounded-sm transition-all flex items-center justify-center w-4 h-4 text-[var(--text-secondary)] cursor-pointer shrink-0 z-10 active:scale-90",
              isActive ? "opacity-40 hover:opacity-100 hover:bg-white/10" : "opacity-0 group-hover:opacity-60 hover:opacity-100 hover:bg-white/10"
            )}
            title="Close Workspace"
          >
            <X size={10} strokeWidth={2.5} />
          </button>
        </div>
      </PopoverAnchor>

      <PopoverContent
        align="start"
        side="bottom"
        sideOffset={8}
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="w-56 bg-[var(--surface-color)] border-[var(--border-color)] p-1 text-[var(--text-primary)]"
        style={{ boxShadow: '0 10px 40px rgba(0,0,0,0.6)', zIndex: 1100 }}
      >
        <PopoverTitle
          style={{
            fontSize: '0.65rem',
            color: 'var(--text-secondary)',
            fontWeight: 600,
            padding: '0.5rem 0.85rem 0.35rem',
            letterSpacing: '0.05em'
          }}
          className="uppercase select-none border-b border-[var(--border-color)]/50 mb-0.5"
        >
          Workspace Settings
        </PopoverTitle>

        {!isRenaming ? (
          <div className="px-1 py-0.5">
            <button
              type="button"
              onClick={() => setIsRenaming(true)}
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                padding: '0.4rem 0.75rem',
                margin: '0.1rem 0',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                transition: 'all 150ms ease'
              }}
              className="hover:bg-white/5 w-full text-left font-sans font-medium"
            >
              Rename Tab
            </button>
          </div>
        ) : (
          <form onSubmit={handleRenameSubmit} className="flex flex-col gap-1 py-0.5">
            <label
              style={{
                fontSize: '0.65rem',
                color: 'var(--text-secondary)',
                fontWeight: 600,
                padding: '0.3rem 0.75rem 0.15rem',
              }}
              className="block font-sans select-none uppercase tracking-wider"
            >
              Rename Tab
            </label>
            <div className="px-[0.75rem] pb-1">
              <input
                ref={inputRef}
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                className="w-full h-7 px-2.5 bg-black/25 border border-[var(--border-color)] rounded text-[11px] text-[var(--text-primary)] placeholder-zinc-600 focus:outline-none focus:border-[var(--accent-primary)] transition-colors font-sans"
                placeholder="Workspace Name"
              />
            </div>
          </form>
        )}

        <div className="bg-[var(--border-color)] opacity-50 mx-2 mt-0.5 h-px" />

        <div className="flex flex-col gap-1 py-0.5">
          <span
            style={{
              fontSize: '0.65rem',
              color: 'var(--text-secondary)',
              fontWeight: 600,
              padding: '0.3rem 0.75rem 0.15rem',
            }}
            className="block font-sans select-none uppercase tracking-wider"
          >
            Tab Color
          </span>
          <div className="flex items-center justify-center gap-3 px-[0.75rem] pb-1.5 pt-0.5">
            {/* Clear Color option */}
            <button
              onClick={() => {
                onColorChange(undefined as any)
                setPopoverOpen(false)
              }}
              className={cn(
                "w-4 h-4 rounded-full bg-zinc-800 border border-zinc-700/50 flex items-center justify-center text-zinc-400 cursor-pointer transition-all duration-150 hover:bg-zinc-700 hover:text-white active:scale-90",
                !color && "ring-2 ring-offset-2 ring-offset-zinc-950 ring-zinc-400"
              )}
              title="Default Slate"
            >
              <Ban size={10} strokeWidth={2.5} />
            </button>

            {/* Horizontal Color Swatches */}
            {(Object.keys(COLOR_MAP) as TabColor[]).map((c) => {
              const item = COLOR_MAP[c]
              const isSelected = color === c

              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    onColorChange(c)
                    setPopoverOpen(false)
                  }}
                  style={{ backgroundColor: item.hex }}
                  className={cn(
                    "w-4 h-4 rounded-full cursor-pointer transition-all duration-150 hover:scale-110 active:scale-90 border border-black/20",
                    isSelected && cn("ring-2 ring-offset-2 ring-offset-zinc-950", item.ring)
                  )}
                  title={item.label}
                />
              )
            })}
          </div>
        </div>

        {(onCloseOthers || onCloseToRight) && (
          <>
            <div className="bg-[var(--border-color)] opacity-50 mx-2 mb-0.5 h-px" />
            <div className="flex flex-col gap-0.5 py-0.5">
              <span
                style={{
                  fontSize: '0.65rem',
                  color: 'var(--text-secondary)',
                  fontWeight: 600,
                  padding: '0.3rem 0.75rem 0.15rem',
                }}
                className="block font-sans select-none uppercase tracking-wider"
              >
                Workspace Actions
              </span>
              <div className="px-1">
                {onCloseOthers && (
                  <button
                    type="button"
                    onClick={() => {
                      onCloseOthers()
                      setPopoverOpen(false)
                    }}
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      padding: '0.4rem 0.75rem',
                      margin: '0.1rem 0',
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      alignItems: 'center',
                      transition: 'all 150ms ease'
                    }}
                    className="hover:bg-white/5 w-full text-left font-sans font-medium"
                  >
                    Close Other Tabs
                  </button>
                )}
                {onCloseToRight && (
                  <button
                    type="button"
                    onClick={() => {
                      onCloseToRight()
                      setPopoverOpen(false)
                    }}
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      padding: '0.4rem 0.75rem',
                      margin: '0.1rem 0',
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      alignItems: 'center',
                      transition: 'all 150ms ease'
                    }}
                    className="hover:bg-white/5 w-full text-left font-sans font-medium"
                  >
                    Close Tabs to the Right
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  )
}

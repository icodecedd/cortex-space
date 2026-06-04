"use client"

import * as React from "react"
import { X, Terminal, Ban } from "lucide-react"
import { Popover, PopoverAnchor, PopoverContent, PopoverTitle } from "@/components/ui/popover"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
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
  terminalCount?: number
  onSelect: () => void
  onClose: () => void
  onRename: (newName: string) => void
  onColorChange: (newColor: TabColor) => void
  onCloseOthers?: () => void
  onCloseToRight?: () => void
  canClose?: boolean
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
    activeBg: string
    hoverBg: string
  }
> = {
  slate: {
    hex: "var(--ansi-bright-black)",
    border: "border-ansi-bright-black/60",
    bg: "bg-ansi-bright-black/10",
    activeBg: "bg-ansi-bright-black/20",
    hoverBg: "hover:bg-ansi-bright-black/15",
    text: "text-ansi-bright-black",
    ring: "ring-ansi-bright-black",
    label: "Slate",
  },
  emerald: {
    hex: "var(--ansi-green)",
    border: "border-ansi-green/60",
    bg: "bg-ansi-green/10",
    activeBg: "bg-ansi-green/20",
    hoverBg: "hover:bg-ansi-green/15",
    text: "text-ansi-green",
    ring: "ring-ansi-green",
    label: "Emerald",
  },
  cobalt: {
    hex: "var(--ansi-blue)",
    border: "border-ansi-blue/60",
    bg: "bg-ansi-blue/10",
    activeBg: "bg-ansi-blue/20",
    hoverBg: "hover:bg-ansi-blue/15",
    text: "text-ansi-blue",
    ring: "ring-ansi-blue",
    label: "Cobalt",
  },
  crimson: {
    hex: "var(--ansi-red)",
    border: "border-ansi-red/60",
    bg: "bg-ansi-red/10",
    activeBg: "bg-ansi-red/20",
    hoverBg: "hover:bg-ansi-red/15",
    text: "text-ansi-red",
    ring: "ring-ansi-red",
    label: "Crimson",
  },
  amber: {
    hex: "var(--ansi-yellow)",
    border: "border-ansi-yellow/60",
    bg: "bg-ansi-yellow/10",
    activeBg: "bg-ansi-yellow/20",
    hoverBg: "hover:bg-ansi-yellow/15",
    text: "text-ansi-yellow",
    ring: "ring-ansi-yellow",
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
  terminalCount,
  onSelect,
  onClose,
  onRename,
  onColorChange,
  onCloseOthers,
  onCloseToRight,
  canClose = true,
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
        <div>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                onClick={onSelect}
                onContextMenu={handleContextMenu}
                className={cn(
                  "group relative h-[28px] px-2.5 rounded-md flex items-center gap-2 text-[11px] font-sans font-bold cursor-pointer transition-all duration-200 select-none shrink-0 min-w-[110px] max-w-[180px] overflow-hidden [-webkit-app-region:no-drag]",
                  isActive
                    ? (!color ? "bg-[var(--text-primary)]/10 text-[var(--text-primary)]" : cn(activeColorConfig?.activeBg, "text-[var(--text-primary)]"))
                    : (!color ? "bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--text-primary)]/5" : cn(activeColorConfig?.bg, activeColorConfig?.hoverBg, activeColorConfig?.text)),
                  isDraft && !isActive && "opacity-80"
                )}
              >
                {/* Active Tab Accent Indicator (Left Line) */}
                {isActive && (
                  <div className={cn(
                    "absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-full opacity-100",
                    color ? cn("bg-current opacity-70") : "bg-[var(--accent-primary)]"
                  )} />
                )}

                {/* Left Slot: Mode Indicator / Icon */}
                <div className="flex items-center justify-center shrink-0 z-10 ml-0.5">
                  {icon ? (
                    <div className={cn(
                      "transition-all duration-200",
                      isActive ? "opacity-100 scale-105" : "opacity-60 group-hover:opacity-100"
                    )}>
                      {icon}
                    </div>
                  ) : (
                    <Terminal
                      size={12}
                      className={cn(
                        "transition-all duration-200",
                        isActive
                          ? "text-[var(--accent-primary)] scale-105"
                          : "text-[var(--text-secondary)] opacity-60 group-hover:opacity-100",
                        color && activeColorConfig?.text
                      )}
                    />
                  )}
                </div>

                {/* Workspace Title (Truncated) */}
                <div
                  className={cn(
                    "truncate text-left flex-1 flex items-center gap-1.5 z-10 transition-colors duration-200",
                    isActive ? "font-bold" : "font-bold"
                  )}
                >
                  <span className="truncate">{displayName}</span>
                  {terminalCount !== undefined && terminalCount > 0 && (
                    <span className={cn(
                      "text-[9px] px-1 rounded-sm font-mono opacity-50 bg-black/20",
                      isActive && "opacity-80"
                    )}>
                      {terminalCount}
                    </span>
                  )}
                </div>

                {/* Far Right Close ('X') Button */}
                {canClose && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onClose()
                    }}
                    className={cn(
                      "ml-auto p-0.5 rounded-sm transition-all flex items-center justify-center w-4 h-4 text-[var(--text-secondary)] cursor-pointer shrink-0 z-10 active:scale-90",
                      isActive ? "opacity-60 hover:opacity-100 hover:bg-white/10" : "opacity-0 group-hover:opacity-80 hover:opacity-100 hover:bg-white/10"
                    )}
                  >
                    <X size={10} strokeWidth={2.5} />
                  </button>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={4} className="text-xs bg-[var(--surface-color)] border-[var(--border-color)] text-[var(--text-primary)]">
              {`${displayName}${customName && name ? ` (${name})` : ""}`}
              <div className="text-[10px] opacity-80 font-bold mt-0.5">Right-click to rename or change color</div>
            </TooltipContent>
          </Tooltip>
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
            fontWeight: 700,
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
              className="hover:bg-[var(--text-primary)]/5 w-full text-left font-sans font-bold"
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
                fontWeight: 700,
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
                className="w-full h-7 px-2.5 bg-[var(--bg-color)]/25 border border-[var(--border-color)] rounded text-[11px] text-[var(--text-primary)] placeholder:[var(--text-secondary)]/50 focus:outline-none focus:border-[var(--accent-primary)] transition-colors font-sans font-bold"
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
              fontWeight: 700,
              padding: '0.3rem 0.75rem 0.15rem',
            }}
            className="block font-sans select-none uppercase tracking-wider"
          >
            Tab Color
          </span>
          <div className="flex items-center justify-center gap-3 px-[0.75rem] pb-1.5 pt-0.5">
            {/* Clear Color option */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => {
                    onColorChange(undefined as any)
                    setPopoverOpen(false)
                  }}
                  className={cn(
                    "w-4 h-4 rounded-full bg-[var(--text-secondary)]/40 border border-[var(--border-color)] flex items-center justify-center text-[var(--text-secondary)] cursor-pointer transition-all duration-150 hover:bg-[var(--text-secondary)]/60 hover:text-[var(--text-primary)] active:scale-90",
                    !color && "ring-2 ring-offset-2 ring-offset-[var(--bg-color)] ring-[var(--accent-primary)]"
                  )}
                >
                  <Ban size={10} strokeWidth={2.5} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={4} className="text-xs bg-[var(--surface-color)] border-[var(--border-color)] text-[var(--text-primary)] z-[2000]">
                Default Slate
              </TooltipContent>
            </Tooltip>

            {/* Horizontal Color Swatches */}
            {(Object.keys(COLOR_MAP) as TabColor[]).map((c) => {
              const item = COLOR_MAP[c]
              const isSelected = color === c

              return (
                <Tooltip key={c}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => {
                        onColorChange(c)
                        setPopoverOpen(false)
                      }}
                      style={{ backgroundColor: item.hex }}
                      className={cn(
                        "w-4 h-4 rounded-full cursor-pointer transition-all duration-150 hover:scale-110 active:scale-90 border border-black/20",
                        isSelected && cn("ring-2 ring-offset-2 ring-offset-[var(--bg-color)]", item.ring)
                      )}
                    />
                  </TooltipTrigger>
                  <TooltipContent side="bottom" sideOffset={4} className="text-xs bg-[var(--surface-color)] border-[var(--border-color)] text-[var(--text-primary)] z-[2000]">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
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
                  fontWeight: 700,
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
                    className="hover:bg-[var(--text-primary)]/5 w-full text-left font-sans font-bold"
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
                    className="hover:bg-[var(--text-primary)]/5 w-full text-left font-sans font-bold"
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

"use client"

import * as React from "react"
import { X, Terminal, Ban, Edit2, Palette, Layers, ArrowRight, RotateCcw, Pin, PinOff, Plus } from "@/components/ui/icons"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
} from "@/components/ui/context-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export type TabColor = 'slate' | 'emerald' | 'cobalt' | 'crimson' | 'amber'

export interface InteractiveTabProps {
  id: string
  name: string
  customName?: string
  isActive: boolean
  isDraft: boolean
  color?: TabColor
  isPinned?: boolean
  icon?: React.ReactNode
  terminalCount?: number
  onSelect: () => void
  onClose: () => void
  onRename: (newName: string) => void
  onColorChange: (newColor: TabColor) => void
  onPin?: (pinned: boolean) => void
  onNewToRight?: () => void
  onCloseOthers?: () => void
  onCloseToRight?: () => void
  canClose?: boolean
  canCloseOthers?: boolean
  isLast?: boolean
  disableTooltip?: boolean
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
  isPinned,
  icon,
  terminalCount,
  onSelect,
  onClose,
  onRename,
  onColorChange,
  onPin,
  onNewToRight,
  onCloseOthers,
  onCloseToRight,
  canClose = true,
  canCloseOthers = true,
  isLast = false,
  disableTooltip = false,
}: InteractiveTabProps) {
  const [isRenameDialogOpen, setIsRenameDialogOpen] = React.useState(false)
  const [tempName, setTempName] = React.useState(customName || name)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const displayName = customName || name || "New Workspace"

  // Sync tempName when name changes externally
  React.useEffect(() => {
    setTempName(customName || name)
  }, [name, customName])

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onRename(tempName.trim())
    setIsRenameDialogOpen(false)
  }

  const activeColorConfig = color ? COLOR_MAP[color] : null

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div className="relative">
            <Tooltip open={disableTooltip ? false : undefined}>
              <TooltipTrigger asChild>
                <div
                  onClick={onSelect}
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
                    {isPinned ? (
                      <Pin size={11} className={cn(
                        "transition-all duration-200",
                        isActive ? "text-[var(--accent-primary)]" : "text-[var(--text-secondary)] opacity-60"
                      )} />
                    ) : (
                      icon ? (
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
                      )
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
                <div className="text-[10px] opacity-80 font-bold mt-0.5">Right-click for workspace actions</div>
              </TooltipContent>
            </Tooltip>
          </div>
        </ContextMenuTrigger>

        <ContextMenuContent className="w-56 bg-[var(--surface-color)] border-[var(--border-color)] p-1 text-[var(--text-primary)]">
          <ContextMenuItem 
            onClick={() => setIsRenameDialogOpen(true)}
            className="flex items-center gap-2 focus:bg-[var(--text-primary)]/5 focus:text-[var(--text-primary)]"
          >
            <Edit2 size={14} className="text-[var(--text-secondary)]" />
            <span className="font-bold">Rename</span>
          </ContextMenuItem>

          <ContextMenuItem 
            onClick={() => onPin?.(!isPinned)}
            className="flex items-center gap-2 focus:bg-[var(--text-primary)]/5 focus:text-[var(--text-primary)]"
          >
            {isPinned ? (
              <>
                <PinOff size={14} className="text-[var(--text-secondary)]" />
                <span className="font-bold">Unpin</span>
              </>
            ) : (
              <>
                <Pin size={14} className="text-[var(--text-secondary)]" />
                <span className="font-bold">Pin</span>
              </>
            )}
          </ContextMenuItem>

          <ContextMenuSub>
            <ContextMenuSubTrigger className="flex items-center gap-2 focus:bg-[var(--text-primary)]/5 focus:text-[var(--text-primary)]">
              <Palette size={14} className="text-[var(--text-secondary)]" />
              <span className="font-bold">Color</span>
            </ContextMenuSubTrigger>
            <ContextMenuSubContent className="w-48 bg-[var(--surface-color)] border-[var(--border-color)] p-1 text-[var(--text-primary)]">
              <ContextMenuItem
                onClick={() => onColorChange(undefined as any)}
                className="flex items-center gap-2 focus:bg-[var(--text-primary)]/5 focus:text-[var(--text-primary)]"
              >
                <Ban size={14} className="text-[var(--text-secondary)]" />
                <span>Default Slate</span>
              </ContextMenuItem>
              <ContextMenuSeparator className="bg-[var(--border-color)]/50" />
              {(Object.keys(COLOR_MAP) as TabColor[]).map((c) => {
                const item = COLOR_MAP[c]
                return (
                  <ContextMenuItem
                    key={c}
                    onClick={() => onColorChange(c)}
                    className="flex items-center gap-2 focus:bg-[var(--text-primary)]/5 focus:text-[var(--text-primary)]"
                  >
                    <div 
                      className="w-3 h-3 rounded-full border border-black/20" 
                      style={{ backgroundColor: item.hex }} 
                    />
                    <span>{item.label}</span>
                  </ContextMenuItem>
                )
              })}
            </ContextMenuSubContent>
          </ContextMenuSub>

          <ContextMenuSeparator className="bg-[var(--border-color)]/50" />

          {onNewToRight && (
            <ContextMenuItem
              onClick={onNewToRight}
              className="flex items-center gap-2 focus:bg-[var(--text-primary)]/5 focus:text-[var(--text-primary)]"
            >
              <Plus size={14} className="text-[var(--text-secondary)]" />
              <span className="font-bold">New to Right</span>
            </ContextMenuItem>
          )}

          {(onCloseOthers || onCloseToRight) && (
            <>
              {onCloseOthers && (
                <ContextMenuItem
                  onClick={onCloseOthers}
                  disabled={!canCloseOthers}
                  className="flex items-center gap-2 focus:bg-[var(--text-primary)]/5 focus:text-[var(--text-primary)]"
                >
                  <Layers size={14} className={cn("text-[var(--text-secondary)]", !canCloseOthers && "opacity-50")} />
                  <span className="font-bold">Close Others</span>
                </ContextMenuItem>
              )}
              {onCloseToRight && (
                <ContextMenuItem
                  onClick={onCloseToRight}
                  disabled={isLast}
                  className="flex items-center gap-2 focus:bg-[var(--text-primary)]/5 focus:text-[var(--text-primary)]"
                >
                  <ArrowRight size={14} className={cn("text-[var(--text-secondary)]", isLast && "opacity-50")} />
                  <span className="font-bold">Close to Right</span>
                </ContextMenuItem>
              )}
            </>
          )}

          <ContextMenuSeparator className="bg-[var(--border-color)]/50" />
          <ContextMenuItem 
            onClick={onClose}
            disabled={!canClose}
            className="flex items-center justify-between gap-2 text-destructive focus:bg-destructive/10 focus:text-destructive"
          >
            <div className="flex items-center gap-2">
              <X size={14} />
              <span className="font-bold">Close</span>
            </div>
            <span className="text-[10px] opacity-50 font-mono">Ctrl+W</span>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent 
          open={isRenameDialogOpen}
          className="sm:max-w-[425px] bg-[var(--surface-color)] border-[var(--border-color)] text-[var(--text-primary)]"
        >
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Rename Workspace</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRenameSubmit}>
            <div className="grid gap-4 py-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <label htmlFor="name" className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                    Workspace Name
                  </label>
                  <button
                    type="button"
                    onClick={() => setTempName("")}
                    className="flex items-center gap-1 text-[10px] font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors uppercase tracking-tight"
                  >
                    <RotateCcw size={10} />
                    Reset to Default
                  </button>
                </div>
                <Input
                  id="name"
                  ref={inputRef}
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  className="bg-[var(--bg-color)]/25 border-[var(--border-color)] focus:border-[var(--accent-primary)]"
                  placeholder={name}
                  autoFocus
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setIsRenameDialogOpen(false)}
                className="hover:bg-[var(--text-primary)]/5"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                className="bg-[var(--accent-primary)] text-[var(--accent-contrast)] hover:brightness-110"
              >
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

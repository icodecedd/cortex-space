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
  id,
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
  canClose = true,
  disableTooltip = false,
}: InteractiveTabProps) {
  const displayName = customName || name || "New Workspace"
  const activeColorConfig = color ? COLOR_MAP[color] : null

  return (
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
  )
}

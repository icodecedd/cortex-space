"use client"

import * as React from "react"
import { X, Terminal, Pin } from "@/components/ui/icons"
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
  isPinned?: boolean
  icon?: React.ReactNode
  terminalCount?: number
  onSelect: () => void
  onClose: () => void
  onRename: () => void
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
    label: string
  }
> = {
  slate: {
    hex: "var(--ansi-bright-black)",
    label: "Slate",
  },
  emerald: {
    hex: "var(--ansi-green)",
    label: "Emerald",
  },
  cobalt: {
    hex: "var(--ansi-blue)",
    label: "Cobalt",
  },
  crimson: {
    hex: "var(--ansi-red)",
    label: "Crimson",
  },
  amber: {
    hex: "var(--ansi-yellow)",
    label: "Amber",
  },
}

export function InteractiveTab({
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
  canClose = true,
  disableTooltip = false,
}: InteractiveTabProps) {
  const displayName = customName || name || "New Workspace"
  const colorHex = color ? COLOR_MAP[color].hex : null

  return (
    <div className="relative h-full flex items-center group/tab-container">
      <Tooltip open={disableTooltip ? false : undefined}>
        <TooltipTrigger asChild>
          <div
            onClick={onSelect}
            onDoubleClick={(e) => {
              e.stopPropagation()
              onRename()
            }}
            className={cn(
              "group relative h-[34px] px-3 flex items-center gap-2 text-[11px] font-sans font-bold cursor-default transition-all duration-200 select-none shrink-0 min-w-[140px] max-w-[220px] overflow-hidden [-webkit-app-region:no-drag]",
              "rounded-t-lg mx-[1px]",
              isActive
                ? "bg-[var(--surface-color)] text-[var(--text-primary)] shadow-[0_-1px_3px_rgba(0,0,0,0.2)] z-20"
                : "bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--text-primary)]/5 z-10",
              isDraft && !isActive && "opacity-60"
            )}
            style={isActive ? {
              borderLeft: '1px solid var(--border-color)',
              borderRight: '1px solid var(--border-color)',
              borderTop: '1px solid var(--border-color)',
              marginBottom: '-1px', // Connect with the header border
            } : {}}
          >
            {/* Background Color Indicator (Top Bar) */}
            {color && (
              <div 
                className={cn(
                  "absolute top-0 left-0 right-0 h-[2px] transition-opacity duration-300",
                  isActive ? "opacity-100" : "opacity-40 group-hover:opacity-70"
                )}
                style={{ backgroundColor: colorHex || 'transparent' }}
              />
            )}

            {/* Left Slot: Mode Indicator / Icon */}
            <div className="flex items-center justify-center shrink-0 z-10">
              {isPinned ? (
                <Pin size={12} className={cn(
                  "transition-all duration-300",
                  isActive ? "text-[var(--accent-primary)]" : "text-[var(--text-secondary)] opacity-50"
                )} 
                style={color && isActive ? { color: colorHex || undefined } : {}}
                />
              ) : (
                icon ? (
                  <div 
                    className={cn(
                      "transition-all duration-300",
                      isActive ? "opacity-100 scale-105" : "opacity-50 group-hover:opacity-100"
                    )}
                    style={color && isActive ? { color: colorHex || undefined } : {}}
                  >
                    {icon}
                  </div>
                ) : (
                  <Terminal
                    size={12}
                    className={cn(
                      "transition-all duration-300",
                      isActive
                        ? "text-[var(--accent-primary)] scale-105"
                        : "text-[var(--text-secondary)] opacity-50 group-hover:opacity-100"
                    )}
                    style={color && isActive ? { color: colorHex || undefined } : {}}
                  />
                )
              )}
            </div>

            {/* Workspace Title (Truncated) */}
            <div
              className={cn(
                "truncate text-left flex-1 flex items-center gap-2 z-10 transition-colors duration-200",
                isActive ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"
              )}
              style={color && isActive ? { color: colorHex || undefined } : {}}
            >
              <span className="truncate tracking-tight">{displayName}</span>
              {terminalCount !== undefined && terminalCount > 0 && (
                <span className={cn(
                  "text-[9px] px-1 py-0 rounded flex items-center justify-center font-mono opacity-40 bg-[var(--text-primary)]/10 min-w-[14px]",
                  isActive && "opacity-80"
                )}>
                  {terminalCount}
                </span>
              )}
            </div>

            {/* Close Button */}
            {canClose && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onClose()
                }}
                className={cn(
                  "ml-auto p-1 rounded-full transition-all flex items-center justify-center w-5 h-5 text-[var(--text-secondary)] cursor-pointer shrink-0 z-10",
                  isActive 
                    ? "opacity-60 hover:opacity-100 hover:bg-[var(--text-primary)]/10 hover:text-[var(--text-primary)]" 
                    : "opacity-0 group-hover:opacity-60 hover:!opacity-100 hover:bg-[var(--text-primary)]/10 hover:text-[var(--text-primary)]"
                )}
              >
                <X size={12} strokeWidth={2.5} />
              </button>
            )}

            {/* Active Tab Accent (Bottom Line Glow) */}
            {isActive && !color && (
              <div className="absolute left-3 right-3 bottom-0 h-[2px] bg-[var(--accent-primary)] rounded-t-full shadow-[0_-2px_6px_rgba(var(--accent-primary-rgb),0.4)]" />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" sideOffset={8} className="text-xs font-bold tracking-tight bg-[var(--surface-color)] border-[var(--border-color)] text-[var(--text-primary)] shadow-xl z-[100]">
          <div className="flex flex-col gap-0.5">
            <span>{displayName}</span>
            {customName && name && <span className="text-[10px] opacity-50 font-medium">Original: {name}</span>}
            <div className="text-[9px] opacity-40 font-bold mt-1 uppercase tracking-widest">Double-click to rename • Right-click for options</div>
          </div>
        </TooltipContent>
      </Tooltip>
      
      {/* Inactive Tab Separator */}
      {!isActive && (
        <div className="absolute right-0 h-4 w-[1px] bg-[var(--border-color)] opacity-50 group-hover/tab-container:opacity-0 transition-opacity" />
      )}
    </div>
  )
}

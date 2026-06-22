import { useState, useEffect } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { 
  MoreVertical, 
  SquareSplitVertical, 
  SquareSplitHorizontal, 
  Trash2, 
  RefreshCw, 
  ArrowExpand01Icon,
  ArrowShrink01Icon,
  ExternalLink,
  Globe
} from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { openUrl } from '@tauri-apps/plugin-opener';
import { m } from "framer-motion";
import type { DetectedPort } from '../../terminal/components/XtermTerminal';
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { parseShortcutToKeys } from "@/lib/shortcut-utils";

interface PaneElevatorProps {
  paneId: string;
  isFocused: boolean;
  name?: string;
  index: number;
  isMaximized: boolean;
  isZenMode: boolean;
  onMaximize?: () => void;
  onSplit?: (direction: 'horizontal' | 'vertical') => void;
  onKill?: () => void;
  onRename?: (newName: string) => void;
  onRelaunch: () => void;
  detectedPorts?: DetectedPort[];
  headerVisibility?: 'hover' | 'always';
}

export function PaneElevator({
  paneId,
  name,
  index,
  isMaximized,
  isZenMode,
  onMaximize,
  onSplit,
  onKill,
  onRename,
  onRelaunch,
  detectedPorts = [],
  headerVisibility = 'hover'
}: PaneElevatorProps) {
  const isMac = typeof window !== 'undefined' && navigator.userAgent.includes('Mac');

  const renderShortcut = (shortcut: string) => {
    return (
      <KbdGroup className="gap-0.5 flex items-center justify-end">
        {parseShortcutToKeys(shortcut, isMac).map((key, idx) => (
          <Kbd
            key={idx}
            className="min-w-4 h-4 px-1 text-[8px] flex items-center justify-center font-mono bg-[var(--text-primary)]/[0.04] border border-[var(--border-color)]/20"
          >
            {key}
          </Kbd>
        ))}
      </KbdGroup>
    );
  };

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: paneId,
  });

  const [isRenaming, setIsRenaming] = useState(false);
  const [tempName, setTempName] = useState(name || `Pane ${index + 1}`);
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  useEffect(() => {
    setTempName(name || `Pane ${index + 1}`);
  }, [name, index]);

  // Reset UI states when dragging ends to ensure cursor and visibility reset correctly
  useEffect(() => {
    if (!isDragging) {
      setIsPressed(false);
      setIsHovered(false);
    }
  }, [isDragging]);

  const handleRenameSubmit = () => {
    const trimmed = tempName.trim();
    if (onRename && trimmed) {
      onRename(trimmed);
      toast.success("Pane renamed successfully", { description: `The pane is now named ${trimmed}.` });
    }
    setIsRenaming(false);
  };

  if (isZenMode) return null;

  const activePorts = detectedPorts.filter(p => p.state === 'detected');
  const isAlwaysVisible = headerVisibility === 'always';
  const isVisible = isHovered || isRenaming || isAlwaysVisible || activePorts.length > 0;

  const MAX_VISIBLE = 2;
  const visiblePorts = activePorts.slice(0, MAX_VISIBLE);
  const overflowPorts = activePorts.slice(MAX_VISIBLE);

  const dragStyle = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 1000,
  } : undefined;

  return (
    <div 
      className="pane-elevator-trigger-zone"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '45px',
        zIndex: 50,
        display: 'flex',
        justifyContent: 'center',
        padding: '8px 12px',
        pointerEvents: isAlwaysVisible ? 'auto' : 'auto',
      }}
    >
      <m.div 
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        layout
        onPointerDown={(e) => {
          setIsPressed(true);
          listeners?.onPointerDown?.(e);
        }}
        onPointerUp={(e) => {
          setIsPressed(false);
          listeners?.onPointerUp?.(e);
        }}
        onPointerCancel={() => {
          setIsPressed(false);
        }}
        className={`pane-elevator-toolbar transition-all duration-500 ease-[var(--ease-out)] flex items-center justify-between px-4 py-1.5 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 scale-95'
        }`}
        style={{
          background: isDragging ? 'rgba(var(--accent-primary-rgb), 0.25)' : 'rgba(var(--surface-color-rgb), 0.85)',
          backdropFilter: 'blur(16px) saturate(200%)',
          border: isDragging ? '1px solid var(--accent-primary)' : '1px solid rgba(255,255,255,0.1)',
          borderRadius: '9999px',
          position: 'relative',
          boxShadow: isDragging 
            ? '0 30px 60px -12px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 0 20px rgba(var(--accent-primary-rgb), 0.3)' 
            : '0 12px 40px -8px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          height: '36px',
          width: '100%',
          pointerEvents: isVisible ? 'auto' : 'none',
          cursor: isDragging || isPressed ? 'pointer' : 'default',
          ...dragStyle
        }}
      >
        {/* Subtle Inner Border Shimmer */}
        <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
          <m.div 
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear", delay: index * 0.5 }}
            className="absolute inset-y-0 w-20 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12"
          />
        </div>

        <div className="flex items-center gap-3 overflow-hidden flex-1 min-w-0 relative z-10">
          {/* Pane Index Counter (Stylized) */}
          <div 
            className="flex items-center justify-center w-5 h-5 rounded-lg bg-white/5 text-[10px] font-black font-mono text-[var(--accent-primary)] shrink-0 select-none border border-white/5 shadow-inner"
          >
            0{index + 1}
          </div>

          <div className="flex items-center gap-2 overflow-hidden flex-1 min-w-0">
            {isRenaming ? (
              <input
                autoFocus
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onBlur={handleRenameSubmit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRenameSubmit();
                  if (e.key === 'Escape') setIsRenaming(false);
                  e.stopPropagation();
                }}
                className="bg-transparent border-none outline-none text-xs font-black font-sans text-[var(--accent-primary)] w-full p-0 tracking-tight"
              />
            ) : (
              <div className="flex items-center gap-2 overflow-hidden flex-1 min-w-0">
                <span 
                  onDoubleClick={() => setIsRenaming(true)}
                  className="text-xs font-black text-[var(--text-primary)] cursor-text truncate select-none shrink-0 tracking-tighter"
                >
                  {name || `Window ${index + 1}`}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-4 relative z-10">
          {/* Port Badges — premium styling */}
          {visiblePorts.map((dp) => (
            <Tooltip key={dp.port}>
              <TooltipTrigger asChild>
                <m.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => openUrl(dp.url)}
                  aria-label={`Connect to localhost:${dp.port}`}
                  className="flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--accent-primary)]/30 text-[10px] font-black cursor-pointer color-[var(--accent-primary)] bg-[var(--accent-primary)]/5 hover:bg-[var(--accent-primary)]/10 transition-all font-mono tracking-tight"
                >
                  <m.span
                    animate={{ opacity: [1, 0.4, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-1.5 h-1.5 rounded-full bg-ansi-green shadow-[0_0_8px_rgba(16,185,129,0.5)] flex-shrink-0"
                  />
                  <ExternalLink size={10} className="opacity-60" />
                  <span>:{dp.port}</span>
                </m.button>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={8} className="text-[10px] font-bold bg-[var(--surface-color)] border-white/10 text-[var(--text-primary)] px-3 py-2 rounded-xl shadow-2xl backdrop-blur-xl">
                Bridge connection to {dp.url}
              </TooltipContent>
            </Tooltip>
          ))}

          {/* Overflow pill */}
          {overflowPorts.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 text-[10px] font-black cursor-pointer text-[var(--text-secondary)] bg-white/5 hover:bg-white/10 transition-all font-mono"
                >
                  <Globe size={10} />
                  <span>+{overflowPorts.length}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-[var(--surface-color)]/90 backdrop-blur-2xl border-white/10 rounded-2xl p-2 shadow-2xl">
                {overflowPorts.map((dp) => (
                  <DropdownMenuItem key={dp.port} onClick={() => openUrl(dp.url)} className="rounded-xl px-3 py-2 text-[11px] font-bold font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-ansi-green mr-3" />
                    <ExternalLink className="mr-3 h-3 w-3 opacity-50" />
                    <span>localhost:{dp.port}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <div className="w-px h-4 bg-white/10 mx-1" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={onMaximize}
                className="h-7 w-7 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5 rounded-lg transition-all"
              >
                {isMaximized ? <ArrowShrink01Icon size={16} /> : <ArrowExpand01Icon size={16} />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={8} className="text-[10px] font-bold bg-[var(--surface-color)] border-white/10 text-[var(--text-primary)] px-3 py-2 rounded-xl shadow-2xl">
              {isMaximized ? "Restore Window" : "Maximize Window"}
            </TooltipContent>
          </Tooltip>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-xs"
                className="h-7 w-7 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5 rounded-lg transition-all"
              >
                <MoreVertical size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 bg-[var(--surface-color)]/95 backdrop-blur-xl border-[var(--border-color)] p-1 text-[var(--text-primary)] shadow-2xl rounded-lg">
              <DropdownMenuItem onClick={onRelaunch} className="flex items-center gap-2 focus:bg-[var(--text-primary)]/5 rounded-md cursor-pointer text-xs font-bold px-3 py-2">
                <RefreshCw className="h-3.5 w-3.5 opacity-60" />
                <span>Reload Terminal</span>
                <DropdownMenuShortcut className="ml-auto flex items-center">{renderShortcut("Ctrl+Alt+R")}</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[var(--text-primary)]/10 my-1" />
              <DropdownMenuItem onClick={() => onSplit?.('horizontal')} className="flex items-center gap-2 focus:bg-[var(--text-primary)]/5 rounded-md cursor-pointer text-xs font-bold px-3 py-2">
                <SquareSplitHorizontal className="h-3.5 w-3.5 opacity-60" />
                <span>Split Horizontally</span>
                <DropdownMenuShortcut className="ml-auto flex items-center">{renderShortcut("Ctrl+Alt+H")}</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSplit?.('vertical')} className="flex items-center gap-2 focus:bg-[var(--text-primary)]/5 rounded-md cursor-pointer text-xs font-bold px-3 py-2">
                <SquareSplitVertical className="h-3.5 w-3.5 opacity-60" />
                <span>Split Vertically</span>
                <DropdownMenuShortcut className="ml-auto flex items-center">{renderShortcut("Ctrl+Alt+V")}</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[var(--text-primary)]/10 my-1" />
              <DropdownMenuItem 
                variant="destructive"
                className="flex items-center gap-2 text-xs font-bold px-3 py-2 cursor-pointer text-red-400 focus:bg-red-400/10 focus:text-red-400 rounded-md"
                onClick={onKill}
              >
                <Trash2 className="h-3.5 w-3.5 opacity-60" />
                <span>Close Window</span>
                <DropdownMenuShortcut className="ml-auto flex items-center">{renderShortcut("Ctrl+Alt+W")}</DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </m.div>
    </div>
  );
}

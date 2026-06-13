import { useState, useEffect } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { 
  MoreVertical, 
  SquareSplitVertical, 
  SquareSplitHorizontal, 
  Trash2, 
  RefreshCw, 
  Maximize2, 
  Minimize2,
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
import type { DetectedPort } from '../../terminal/components/XtermTerminal';

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

  const style = transform ? {
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
        pointerEvents: isAlwaysVisible ? 'auto' : 'auto', // Ensure both can catch events/hover
      }}
    >


      <div 
        ref={setNodeRef}
        {...listeners}
        {...attributes}
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
        className={`pane-elevator-toolbar transition-all duration-300 ease-out flex items-center justify-between px-3 py-1 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1'
        }`}
        style={{
          background: isDragging ? 'rgba(var(--accent-primary-rgb), 0.2)' : 'rgba(var(--surface-color-rgb), 0.9)',
          backdropFilter: 'blur(12px) saturate(180%)',
          border: isDragging ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
          borderRadius: '8px',
          boxShadow: isDragging 
            ? '0 20px 40px -12px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.1)' 
            : '0 8px 32px -8px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
          height: '32px',
          width: '100%',
          pointerEvents: isVisible ? 'auto' : 'none',
          cursor: isDragging || isPressed ? 'pointer' : 'default',
          ...style
        }}
      >
        <div className="flex items-center gap-2 overflow-hidden flex-1 min-w-0">
          {/* Pane Index Counter (Monochromatic Badge) */}
          <div 
            className="flex items-center justify-center w-4 h-4 rounded-sm bg-[var(--text-primary)]/10 text-[9px] font-mono font-bold text-[var(--text-secondary)] shrink-0 select-none border border-[var(--border-color)]/50"
          >
            {index + 1}
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
                className="bg-transparent border-none outline-none text-[11px] font-bold font-sans text-[var(--accent-primary)] w-full p-0"
              />
            ) : (
              <div className="flex items-center gap-2 overflow-hidden flex-1 min-w-0">
                <span 
                  onDoubleClick={() => setIsRenaming(true)}
                  className="text-[11px] font-bold text-[var(--text-primary)] cursor-text truncate select-none shrink-0"
                  style={{ letterSpacing: '-0.01em' }}
                >
                  {name || `Pane ${index + 1}`}
                </span>
                

              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-4">
          {/* Port Badges — up to 2 visible, rest in overflow pill */}
          {visiblePorts.map((dp) => (
            <Tooltip key={dp.port}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => openUrl(dp.url)}
                  aria-label={`Open localhost:${dp.port} in browser`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '3px 8px 3px 6px',
                    borderRadius: '9999px',
                    border: '0.5px solid rgba(var(--accent-primary-rgb), 0.35)',
                    fontSize: '10px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    color: 'var(--accent-primary)',
                    background: 'rgba(var(--accent-primary-rgb), 0.08)',
                    animation: 'portBadgeIn 0.2s ease',
                    letterSpacing: '0.02em',
                    fontFamily: 'monospace',
                    whiteSpace: 'nowrap',
                    outline: 'none',
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: '#1D9E75',
                      display: 'inline-block',
                      flexShrink: 0,
                      animation: 'portDotPulse 2s ease-in-out infinite',
                    }}
                    aria-hidden="true"
                  />
                  <ExternalLink size={9} aria-hidden="true" style={{ opacity: 0.7 }} />
                  :{dp.port}
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={4} className="text-xs bg-[var(--surface-color)] border-[var(--border-color)] text-[var(--text-primary)]">
                Open {dp.url} in browser
              </TooltipContent>
            </Tooltip>
          ))}

          {/* Overflow pill for 3+ ports */}
          {overflowPorts.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '3px 8px',
                    borderRadius: '9999px',
                    border: '0.5px solid var(--border-color)',
                    fontSize: '10px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    color: 'var(--text-secondary)',
                    background: 'rgba(var(--surface-color-rgb), 0.8)',
                    outline: 'none',
                    fontFamily: 'monospace',
                    letterSpacing: '0.02em',
                  }}
                >
                  <Globe size={9} />
                  +{overflowPorts.length}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 bg-[var(--surface-color)] border-[var(--border-color)]">
                {overflowPorts.map((dp) => (
                  <DropdownMenuItem key={dp.port} onClick={() => openUrl(dp.url)}>
                    <span
                      style={{ width: 6, height: 6, borderRadius: '50%', background: '#1D9E75', display: 'inline-block', marginRight: 6, flexShrink: 0 }}
                    />
                    <ExternalLink className="mr-2 h-3 w-3" />
                    <span className="text-xs truncate font-mono">localhost:{dp.port}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={onMaximize}
                className="h-6 w-6 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                {isMaximized ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={4} className="text-xs bg-[var(--surface-color)] border-[var(--border-color)] text-[var(--text-primary)]">
              {isMaximized ? "Restore" : "Maximize"}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="h-6 w-6 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  >
                    <MoreVertical size={14} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-[var(--surface-color)] border-[var(--border-color)]">
                  <DropdownMenuItem onClick={onRelaunch}>
                    <RefreshCw className="mr-2 h-3 w-3" />
                    <span className="text-xs">Reset Pane</span>
                    <DropdownMenuShortcut className="text-[9px]">Ctrl+Alt+R</DropdownMenuShortcut>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onSplit?.('horizontal')}>
                    <SquareSplitHorizontal className="mr-2 h-3 w-3" />
                    <span className="text-xs">Split Horizontal</span>
                    <DropdownMenuShortcut className="text-[9px]">Ctrl+Alt+H</DropdownMenuShortcut>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onSplit?.('vertical')}>
                    <SquareSplitVertical className="mr-2 h-3 w-3" />
                    <span className="text-xs">Split Vertical</span>
                    <DropdownMenuShortcut className="text-[9px]">Ctrl+Alt+V</DropdownMenuShortcut>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    variant="destructive"
                    className="cursor-pointer"
                    onClick={onKill}
                  >
                    <Trash2 className="mr-2 h-3 w-3 text-inherit hover:text-red-400 transition-colors" />
                    <span className="text-xs">Close Pane</span>
                    <DropdownMenuShortcut className="text-[9px]">Ctrl+Alt+W</DropdownMenuShortcut>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={4} className="text-xs bg-[var(--surface-color)] border-[var(--border-color)] text-[var(--text-primary)]">
              Pane Options
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}

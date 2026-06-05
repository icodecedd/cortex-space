import { useState, useEffect } from 'react';
import { 
  MoreVertical, 
  SquareSplitVertical, 
  SquareSplitHorizontal, 
  Trash2, 
  BookmarkPlus, 
  RefreshCw, 
  Maximize2, 
  Minimize2,
  ExternalLink
} from "lucide-react";
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
import { Terminal } from '@xterm/xterm';
import { openUrl } from '@tauri-apps/plugin-opener';

interface PaneElevatorProps {
  name?: string;
  index: number;
  isMaximized: boolean;
  isZenMode: boolean;
  onMaximize?: () => void;
  onSplit?: (direction: 'horizontal' | 'vertical') => void;
  onKill?: () => void;
  onRename?: (newName: string) => void;
  onRelaunch: () => void;
  onSaveSnippet?: (command: string) => void;
  terminalInstance: Terminal | null;
  detectedUrl?: string | null;
  headerVisibility?: 'hover' | 'always';
}

export function PaneElevator({
  name,
  index,
  isMaximized,
  isZenMode,
  onMaximize,
  onSplit,
  onKill,
  onRename,
  onRelaunch,
  onSaveSnippet,
  terminalInstance,
  detectedUrl,
  headerVisibility = 'hover'
}: PaneElevatorProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [tempName, setTempName] = useState(name || `Pane ${index + 1}`);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    setTempName(name || `Pane ${index + 1}`);
  }, [name, index]);

  const handleRenameSubmit = () => {
    const trimmed = tempName.trim();
    if (onRename && trimmed) {
      onRename(trimmed);
      toast.success("Pane Renamed", { description: `Pane updated to "${trimmed}"` });
    }
    setIsRenaming(false);
  };

  const handleSaveSnippet = () => {
    if (onSaveSnippet && terminalInstance) {
      const term = terminalInstance;
      let cmd = term.getSelection();
      
      if (!cmd) {
        // Get current line if no selection
        const buffer = term.buffer.active;
        const line = buffer.getLine(buffer.cursorY + buffer.baseY);
        if (line) {
          cmd = line.translateToString(true).trim();
        }
      }
      
      if (cmd) {
        onSaveSnippet(cmd);
      } else {
        toast.error("No command found", { 
          description: "Type a command or select text to save as a snippet." 
        });
      }
    }
  };

  if (isZenMode) return null;

  const isAlwaysVisible = headerVisibility === 'always';
  const isVisible = isHovered || isRenaming || isAlwaysVisible || !!detectedUrl;

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
        className={`pane-elevator-toolbar transition-all duration-300 ease-out flex items-center justify-between px-3 py-1 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1'
        }`}
        style={{
          background: 'rgba(var(--surface-color-rgb), 0.9)',
          backdropFilter: 'blur(12px) saturate(180%)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          boxShadow: '0 8px 32px -8px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
          height: '32px',
          width: '100%',
          pointerEvents: isVisible ? 'auto' : 'none',
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
          {detectedUrl && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => openUrl(detectedUrl)}
                  className="h-6 px-2 gap-1.5 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 animate-pulse border border-[var(--accent-primary)]/20 rounded-md"
                >
                  <ExternalLink size={10} />
                  <span className="text-[9px] font-bold uppercase tracking-wider">Open Browser</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-[10px]">
                Open {detectedUrl}
              </TooltipContent>
            </Tooltip>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={onMaximize}
                className="h-6 w-6 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                {isMaximized ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-[10px]">
              {isMaximized ? "Restore" : "Maximize"}
            </TooltipContent>
          </Tooltip>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-xs"
                className="h-6 w-6 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                <MoreVertical size={12} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-[var(--surface-color)] border-[var(--border-color)]">
              <DropdownMenuItem onClick={onRelaunch}>
                <RefreshCw className="mr-2 h-3 w-3" />
                <span className="text-xs">Reset Process</span>
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
              <DropdownMenuItem onClick={handleSaveSnippet}>
                <BookmarkPlus className="mr-2 h-3 w-3" />
                <span className="text-xs">Save as Snippet</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-red-400 focus:text-red-400"
                onClick={onKill}
              >
                <Trash2 className="mr-2 h-3 w-3" />
                <span className="text-xs">Kill Process</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}

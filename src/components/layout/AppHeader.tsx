import * as React from "react";
import { SquareTerminal, Bot, Keyboard, Settings, Minus, Square, X, Plus, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Workspace } from "@/types";
import { InteractiveTab } from "@/components/ui/interactive-tab";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { countPanes } from "@/lib/setup-utils";

interface AppHeaderProps {
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  isWindowMaximized: boolean;
  onSwitchWorkspace: (id: string) => void;
  onCloseWorkspace: (id: string) => void;
  onCloseWorkspaces: (ids: string[]) => void;
  onNewWorkspaceFlow: () => void;
  onRenameWorkspace: (id: string, name: string) => void;
  onColorWorkspace: (id: string, color: any) => void;
  onOpenShortcuts: () => void;
  onOpenSettings: () => void;
  onOpenTemplates: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  onClose: () => void;
  showWorkspacesTab?: boolean;
  showTemplatesButton?: boolean;
  showShortcutsButton?: boolean;
}

export function AppHeader({
  workspaces,
  activeWorkspaceId,
  isWindowMaximized,
  onSwitchWorkspace,
  onCloseWorkspace,
  onCloseWorkspaces,
  onNewWorkspaceFlow,
  onRenameWorkspace,
  onColorWorkspace,
  onOpenShortcuts,
  onOpenSettings,
  onOpenTemplates,
  onMinimize,
  onMaximize,
  onClose,
  showWorkspacesTab = true,
  showTemplatesButton = true,
  showShortcutsButton = true
}: AppHeaderProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Allow horizontal scrolling with mouse wheel
  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY !== 0) {
        e.preventDefault();
        // Reverse: scroll down (positive deltaY) moves right, scroll up (negative deltaY) moves left
        el.scrollLeft += e.deltaY;
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, []);

  // Auto-scroll to active tab
  React.useEffect(() => {
    if (activeWorkspaceId) {
      const activeEl = scrollRef.current?.querySelector(`[data-active="true"]`);
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [activeWorkspaceId]);

  const handleCloseOthers = (id: string) => {
    const idsToClose = workspaces.filter(ws => ws.id !== id).map(ws => ws.id);
    if (idsToClose.length > 0) {
      onCloseWorkspaces(idsToClose);
    }
  };

  const handleCloseToRight = (id: string) => {
    const index = workspaces.findIndex(ws => ws.id === id);
    if (index === -1) return;
    const toClose = workspaces.slice(index + 1);
    const idsToClose = toClose.map(ws => ws.id);
    if (idsToClose.length > 0) {
      onCloseWorkspaces(idsToClose);
    }
  };

  return (
    <div
      data-tauri-drag-region
      className="h-9 bg-[var(--header-bg)] flex items-center justify-between border-b border-[var(--border-color)]/30 select-none flex-shrink-0 z-50 cursor-default [-webkit-app-region:drag]"
      style={{
        paddingLeft: "8px",
        paddingRight: "8px",
      }}
    >
      {/* Left Area: Workspace Tabs */}
      <div className="flex items-center gap-1 overflow-hidden flex-1 h-full mr-2">
        {showWorkspacesTab && (
          <div
            ref={scrollRef}
            className="flex items-center h-full gap-0.5 overflow-x-auto scrollbar-none flex-1 [mask-image:linear-gradient(to_right,black,95%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_right,black,95%,transparent_100%)]"
          >
            <div className="flex items-center gap-0.5 px-1">
                {workspaces.map((ws, idx) => {
                  const isActive = activeWorkspaceId === ws.id;
                  const isDraft = ws.status !== 'active';
                  const terminalCount = ws.config?.layout ? countPanes(ws.config.layout) : 0;

                  return (
                    <div key={ws.id} data-active={isActive}>
                      <InteractiveTab
                        id={ws.id}
                        name={ws.name ? ws.name : `WS ${idx + 1}`}
                        customName={ws.customName}
                        isActive={isActive}
                        isDraft={isDraft}
                        color={ws.color}
                        terminalCount={terminalCount}
                        icon={
                          ws.mode === 'agents' ? (
                            <Bot size={11} className={isActive ? "text-[var(--accent-primary)] shrink-0" : "text-[var(--text-secondary)] shrink-0 opacity-70 group-hover:opacity-100"} />
                          ) : (
                            <SquareTerminal size={11} className={isActive ? "text-[var(--accent-primary)] shrink-0" : "text-[var(--text-secondary)] shrink-0 opacity-70 group-hover:opacity-100"} />
                          )
                        }
                        onSelect={() => onSwitchWorkspace(ws.id)}
                        onClose={() => onCloseWorkspace(ws.id)}
                        onRename={(newName) => onRenameWorkspace(ws.id, newName)}
                        onColorChange={(newColor) => onColorWorkspace(ws.id, newColor)}
                        onCloseOthers={() => handleCloseOthers(ws.id)}
                        onCloseToRight={() => handleCloseToRight(ws.id)}
                        canClose={workspaces.length > 1}
                      />
                    </div>
                  );
                })}

                {/* Inline New Workspace Button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={onNewWorkspaceFlow}
                      className="w-7 h-7 flex-shrink-0 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--text-primary)]/5 rounded-md transition-all cursor-pointer [-webkit-app-region:no-drag] ml-0.5"
                    >
                      <Plus size={14} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" sideOffset={4} className="text-xs bg-[var(--surface-color)] border-[var(--border-color)] text-[var(--text-primary)]">
                    New Workspace (Ctrl+T)
                  </TooltipContent>
                </Tooltip>
            </div>
          </div>
        )}

        {/* Global Separator */}
        {showWorkspacesTab && <div className="w-[1px] h-4 bg-[var(--border-color)]/30 mx-2" />}
      </div>

      {/* Right Area: Workspace Configuration, Settings & OS Window Buttons */}
      <div className="flex items-center gap-1 flex-shrink-0 h-full [-webkit-app-region:no-drag] ml-1">

        {/* Space Templates Dialog Trigger */}
        {showTemplatesButton && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onOpenTemplates}
                className="w-7 h-7 flex items-center justify-center text-[var(--text-secondary)] hover:text-ansi-green hover:bg-ansi-green/10 rounded transition-all cursor-pointer"
              >
                <Rocket size={13} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={4} className="text-xs bg-[var(--surface-color)] border-[var(--border-color)] text-[var(--text-primary)]">
              Space Templates (Ctrl+Shift+T)
            </TooltipContent>
          </Tooltip>
        )}

        {/* Keyboard Shortcuts Dialog Trigger */}
        {showShortcutsButton && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onOpenShortcuts}
                className="w-7 h-7 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--text-primary)]/5 rounded transition-all cursor-pointer"
              >
                <Keyboard size={13} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={4} className="text-xs bg-[var(--surface-color)] border-[var(--border-color)] text-[var(--text-primary)]">
              Keyboard Shortcuts (Ctrl+/)
            </TooltipContent>
          </Tooltip>
        )}

        {/* Global Settings Dialog Trigger */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onOpenSettings}
              className="w-7 h-7 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--text-primary)]/5 rounded transition-all cursor-pointer"
            >
              <Settings size={13} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={4} className="text-xs bg-[var(--surface-color)] border-[var(--border-color)] text-[var(--text-primary)]">
            Preferences
          </TooltipContent>
        </Tooltip>

        {/* Global Separator */}
        <div className="w-[1px] h-4 bg-[var(--border-color)]/30 mx-1.5" />

        {/* Standard Window controls */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onMinimize}
                className="w-7 h-7 flex items-center justify-center hover:bg-[var(--text-primary)]/5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded transition-all cursor-pointer"
              >
                <Minus size={13} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={4} className="text-xs bg-[var(--surface-color)] border-[var(--border-color)] text-[var(--text-primary)]">
              Minimize
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onMaximize}
                className="w-7 h-7 flex items-center justify-center hover:bg-[var(--text-primary)]/5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded transition-all cursor-pointer"
              >
                {isWindowMaximized ? (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.2">
                    <path d="M2.5 1.5h6v6" />
                    <rect x="1.5" y="2.5" width="6" height="6" />
                  </svg>
                ) : (
                  <Square size={11} />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={4} className="text-xs bg-[var(--surface-color)] border-[var(--border-color)] text-[var(--text-primary)]">
              {isWindowMaximized ? "Restore" : "Maximize"}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onClose}
                className="w-7 h-7 flex items-center justify-center hover:bg-[#E81123] hover:text-white text-[var(--text-secondary)] rounded transition-all cursor-pointer"
              >
                <X size={13} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={4} className="text-xs bg-[var(--surface-color)] border-[var(--border-color)] text-[var(--text-primary)]">
              Close
            </TooltipContent>
          </Tooltip>
        </div>

      </div>

    </div>
  );
}

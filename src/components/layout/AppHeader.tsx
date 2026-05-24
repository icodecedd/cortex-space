import * as React from "react";
import { SquareTerminal, Bot, Keyboard, Settings, Minus, Square, X, Plus, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Workspace } from "@/types";
import { InteractiveTab } from "@/components/ui/interactive-tab";
import { TooltipProvider } from "@/components/ui/tooltip";

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
  onClose
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
      className="h-9 bg-[var(--header-bg)] flex items-center justify-between border-b border-[var(--border-color)] select-none flex-shrink-0 z-50 cursor-default shadow-[0_1px_3px_rgba(0,0,0,0.3)] [-webkit-app-region:drag]"
      style={{
        paddingLeft: "8px",
        paddingRight: "8px",
      }}
    >
      {/* Left Area: Workspace Tabs */}
      <div className="flex items-center gap-1 overflow-hidden flex-1 h-full mr-2">
        <div
          ref={scrollRef}
          className="flex items-center h-full gap-0.5 overflow-x-auto scrollbar-none flex-1 [mask-image:linear-gradient(to_right,black_95%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_right,black_95%,transparent_100%)]"
        >
          <TooltipProvider>
            {workspaces.map((ws, idx) => {
              const isActive = activeWorkspaceId === ws.id;
              const isDraft = ws.status !== 'active';

              return (
                <div key={ws.id} data-active={isActive}>
                  <InteractiveTab
                    id={ws.id}
                    name={ws.name ? ws.name : `WS ${idx + 1}`}
                    customName={ws.customName}
                    isActive={isActive}
                    isDraft={isDraft}
                    color={ws.color}
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
                  />
                </div>
              );
            })}
          </TooltipProvider>
        </div>

        {/* Fixed New Workspace Button */}
        <div className="flex-shrink-0 flex items-center h-6 ml-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onNewWorkspaceFlow}
            className="w-7 h-7 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-color)] rounded-md transition-all cursor-pointer [-webkit-app-region:no-drag]"
            title="Configure New Workspace (Ctrl+Alt+N)"
          >
            <Plus size={14} />
          </Button>
        </div>

        {/* Global Separator */}
        <div className="w-[1px] h-4 bg-[var(--border-color)] mx-2 opacity-60" />
      </div>

      {/* Right Area: Workspace Configuration, Settings & OS Window Buttons */}
      <div className="flex items-center gap-1 flex-shrink-0 h-full [-webkit-app-region:no-drag] ml-1">

        {/* Space Templates Dialog Trigger */}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onOpenTemplates}
          className="w-7 h-7 flex items-center justify-center text-[var(--text-secondary)] hover:text-emerald-400 hover:bg-emerald-400/10 rounded transition-all cursor-pointer"
          title="Space Templates (Ctrl+T)"
        >
          <Rocket size={13} />
        </Button>

        {/* Keyboard Shortcuts Dialog Trigger */}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onOpenShortcuts}
          className="w-7 h-7 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-color)] rounded transition-all cursor-pointer"
          title="Keyboard Shortcuts (Ctrl+/)"
        >
          <Keyboard size={13} />
        </Button>

        {/* Global Settings Dialog Trigger */}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onOpenSettings}
          className="w-7 h-7 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-color)] rounded transition-all cursor-pointer"
          title="Preferences"
        >
          <Settings size={13} />
        </Button>

        {/* Global Separator */}
        <div className="w-[1px] h-4 bg-[var(--border-color)] mx-1.5 opacity-60" />

        {/* Standard Window controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={onMinimize}
            className="w-7 h-7 flex items-center justify-center hover:bg-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded transition-all cursor-pointer"
            title="Minimize"
          >
            <Minus size={13} />
          </button>
          <button
            onClick={onMaximize}
            className="w-7 h-7 flex items-center justify-center hover:bg-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded transition-all cursor-pointer"
            title={isWindowMaximized ? "Restore" : "Maximize"}
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
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center hover:bg-[#E81123] hover:text-white text-[var(--text-secondary)] rounded transition-all cursor-pointer"
            title="Close"
          >
            <X size={13} />
          </button>
        </div>

      </div>

    </div>
  );
}

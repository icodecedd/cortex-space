import * as React from "react";
import {
  SquareTerminal,
  Bot,
  Keyboard,
  Settings,
  Minus,
  Square,
  Copy,
  X,
  Plus,
  Rocket,
  Edit2,
  Pin,
  PinOff,
  Palette,
  Ban,
  Layers,
  ArrowRight,
  RotateCcw,
} from "@/components/ui/icons";
import { Reorder } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Workspace } from "@/types";
import {
  InteractiveTab,
  COLOR_MAP,
  TabColor,
} from "@/components/ui/interactive-tab";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { countPanes } from "@/lib/setup-utils";
import { getWorkspacePlaceholder } from "@/lib/utils";
import { HEADER_CONTENT } from "@/lib/content";
import { cn } from "@/lib/utils";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { parseShortcutToKeys } from "@/lib/shortcut-utils";

interface AppHeaderProps {
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  isWindowMaximized: boolean;
  onSwitchWorkspace: (id: string) => void;
  onCloseWorkspace: (id: string) => void;
  onCloseWorkspaces: (ids: string[]) => void;
  onReorderWorkspaces: (newOrder: Workspace[]) => void;
  onNewWorkspaceFlow: () => void;
  onNewWorkspaceToRight: (id: string) => void;
  onRenameWorkspace: (id: string, name: string) => void;
  onColorWorkspace: (id: string, color: any) => void;
  onPinWorkspace: (id: string, isPinned: boolean) => void;
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

export const AppHeader = React.memo(
  ({
    workspaces,
    activeWorkspaceId,
    isWindowMaximized,
    onSwitchWorkspace,
    onCloseWorkspace,
    onCloseWorkspaces,
    onReorderWorkspaces,
    onNewWorkspaceFlow,
    onNewWorkspaceToRight,
    onRenameWorkspace,
    onColorWorkspace,
    onPinWorkspace,
    onOpenShortcuts,
    onOpenSettings,
    onOpenTemplates,
    onMinimize,
    onMaximize,
    onClose,
    showWorkspacesTab = true,
    showTemplatesButton = true,
    showShortcutsButton = true,
  }: AppHeaderProps) => {
    const scrollRef = React.useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = React.useState(false);
    const isMac =
      typeof window !== "undefined" && navigator.userAgent.includes("Mac");

    const renderShortcut = React.useCallback(
      (shortcut: string) => {
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
      },
      [isMac],
    );

    const formatShortcut = React.useCallback(
      (val: string) => {
        if (isMac) {
          return val
            .replace(/Ctrl/g, "⌘")
            .replace(/Shift/g, "⇧")
            .replace(/Alt/g, "⌥")
            .replace(/\+/g, "");
        }
        return val;
      },
      [isMac],
    );

    // Shared Context Menu & Rename Dialog State
    const [contextWorkspaceId, setContextWorkspaceId] = React.useState<
      string | null
    >(null);
    const [isRenameDialogOpen, setIsRenameDialogOpen] = React.useState(false);
    const [tempName, setTempName] = React.useState("");
    const renameInputRef = React.useRef<HTMLInputElement>(null);

    const contextWorkspace = React.useMemo(
      () => workspaces.find((ws) => ws.id === contextWorkspaceId),
      [workspaces, contextWorkspaceId],
    );

    // Allow horizontal scrolling with mouse wheel
    React.useEffect(() => {
      const el = scrollRef.current;
      if (!el) return;

      const handleWheel = (e: WheelEvent) => {
        if (e.deltaY !== 0) {
          e.preventDefault();
          el.scrollLeft += e.deltaY;
        }
      };

      el.addEventListener("wheel", handleWheel, { passive: false });
      return () => el.removeEventListener("wheel", handleWheel);
    }, []);

    // Auto-scroll to active tab
    React.useEffect(() => {
      if (activeWorkspaceId) {
        const activeEl =
          scrollRef.current?.querySelector(`[data-active="true"]`);
        if (activeEl) {
          activeEl.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
            inline: "center",
          });
        }
      }
    }, [activeWorkspaceId]);

    const handleCloseOthers = (id: string) => {
      const idsToClose = workspaces
        .filter((ws) => ws.id !== id && !ws.isPinned)
        .map((ws) => ws.id);
      if (idsToClose.length > 0) {
        onCloseWorkspaces(idsToClose);
      }
    };

    const handleCloseToRight = (id: string) => {
      const index = workspaces.findIndex((ws) => ws.id === id);
      if (index === -1) return;
      const toClose = workspaces.slice(index + 1);
      const idsToClose = toClose.map((ws) => ws.id);
      if (idsToClose.length > 0) {
        onCloseWorkspaces(idsToClose);
      }
    };

    const handleRenameClick = (ws: Workspace) => {
      setContextWorkspaceId(ws.id);
      const initialName =
        ws.customName ||
        ws.name ||
        getWorkspacePlaceholder(workspaces.indexOf(ws));
      setTempName(initialName);
      setIsRenameDialogOpen(true);

      // Use a small timeout to ensure the dialog is mounted before focusing
      setTimeout(() => {
        renameInputRef.current?.focus();
        renameInputRef.current?.select();
      }, 50);
    };

    const handleRenameSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (contextWorkspaceId) {
        onRenameWorkspace(contextWorkspaceId, tempName.trim());
      }
      setIsRenameDialogOpen(false);
    };

    return (
      <div
        data-tauri-drag-region
        className="h-10 bg-[var(--bg-color)] flex items-center justify-between border-b border-[var(--border-color)] select-none flex-shrink-0 z-50 cursor-default [-webkit-app-region:drag]"
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
              <Reorder.Group
                axis="x"
                values={workspaces}
                onReorder={onReorderWorkspaces}
                className="flex items-center gap-1 px-1 h-full"
              >
                {workspaces.map((ws, idx) => {
                  const isActive = activeWorkspaceId === ws.id;
                  const isDraft = ws.status !== "active";
                  const terminalCount = ws.config?.layout
                    ? countPanes(ws.config.layout)
                    : 0;
                  const isLast = idx === workspaces.length - 1;
                  const canCloseOthers = workspaces.some(
                    (w) => w.id !== ws.id && !w.isPinned,
                  );

                  return (
                    <Reorder.Item
                      key={ws.id}
                      value={ws}
                      data-active={isActive}
                      className="h-full flex items-end pb-[1px]"
                      onDragStart={() => setIsDragging(true)}
                      onDragEnd={() => setIsDragging(false)}
                    >
                      <DropdownMenu
                        open={contextWorkspaceId === ws.id}
                        onOpenChange={(open) => {
                          if (!open) setContextWorkspaceId(null);
                        }}
                      >
                        <DropdownMenuTrigger asChild>
                          <div
                            className="h-full flex items-end"
                            onContextMenu={(e) => {
                              e.preventDefault();
                              setContextWorkspaceId(ws.id);
                            }}
                          >
                            <InteractiveTab
                              id={ws.id}
                              name={
                                ws.name ? ws.name : getWorkspacePlaceholder(idx)
                              }
                              customName={ws.customName}
                              isActive={isActive}
                              isDraft={isDraft}
                              color={ws.color}
                              isPinned={ws.isPinned}
                              terminalCount={terminalCount}
                              icon={
                                ws.mode === "agents" ? (
                                  <Bot size={13} className="shrink-0" />
                                ) : (
                                  <SquareTerminal
                                    size={13}
                                    className="shrink-0"
                                  />
                                )
                              }
                              onSelect={() => onSwitchWorkspace(ws.id)}
                              onClose={() => onCloseWorkspace(ws.id)}
                              onRename={() => handleRenameClick(ws)}
                              onColorChange={(newColor) =>
                                onColorWorkspace(ws.id, newColor)
                              }
                              onPin={(pinned) => onPinWorkspace(ws.id, pinned)}
                              onNewToRight={() => onNewWorkspaceToRight(ws.id)}
                              onCloseOthers={() => handleCloseOthers(ws.id)}
                              onCloseToRight={() => handleCloseToRight(ws.id)}
                              canClose={workspaces.length > 1}
                              canCloseOthers={canCloseOthers}
                              isLast={isLast}
                              disableTooltip={isDragging}
                            />
                          </div>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent
                          align="start"
                          sideOffset={2}
                          className="w-64 bg-[var(--surface-color)]/95 backdrop-blur-xl border-[var(--border-color)] p-1 text-[var(--text-primary)] shadow-2xl rounded-lg"
                        >
                          <DropdownMenuItem
                            onClick={() => handleRenameClick(ws)}
                            className="flex items-center gap-2 focus:bg-[var(--text-primary)]/5 rounded-md cursor-pointer px-3 py-2"
                          >
                            <Edit2
                              size={14}
                              className="text-[var(--text-secondary)]"
                            />
                            <span className="font-bold text-xs tracking-tight">
                              Rename
                            </span>
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => onPinWorkspace(ws.id, !ws.isPinned)}
                            className="flex items-center gap-2 focus:bg-[var(--text-primary)]/5 rounded-md cursor-pointer px-3 py-2"
                          >
                            {ws.isPinned ? (
                              <>
                                <PinOff
                                  size={14}
                                  className="text-[var(--text-secondary)]"
                                />
                                <span className="font-bold text-xs tracking-tight">
                                  Unpin
                                </span>
                              </>
                            ) : (
                              <>
                                <Pin
                                  size={14}
                                  className="text-[var(--text-secondary)]"
                                />
                                <span className="font-bold text-xs tracking-tight">
                                  Pin
                                </span>
                              </>
                            )}
                          </DropdownMenuItem>

                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger className="flex items-center gap-2 focus:bg-[var(--text-primary)]/5 rounded-md cursor-pointer px-3 py-2">
                              <Palette
                                size={14}
                                className="text-[var(--text-secondary)]"
                              />
                              <span className="font-bold text-xs tracking-tight">
                                Color Label
                              </span>
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent className="w-48 bg-[var(--surface-color)]/95 backdrop-blur-xl border-[var(--border-color)] p-1 text-[var(--text-primary)] shadow-2xl rounded-lg">
                              <DropdownMenuItem
                                onClick={() =>
                                  onColorWorkspace(ws.id, undefined)
                                }
                                className="flex items-center gap-2 focus:bg-[var(--text-primary)]/5 rounded-md cursor-pointer px-3 py-2"
                              >
                                <Ban
                                  size={14}
                                  className="text-[var(--text-secondary)]"
                                />
                                <span className="text-xs font-bold tracking-tight">
                                  Default Slate
                                </span>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-[var(--text-primary)]/10 my-1" />
                              {(Object.keys(COLOR_MAP) as TabColor[]).map(
                                (c) => {
                                  const item = COLOR_MAP[c];
                                  return (
                                    <DropdownMenuItem
                                      key={c}
                                      onClick={() => onColorWorkspace(ws.id, c)}
                                      className="flex items-center gap-2 focus:bg-[var(--text-primary)]/5 rounded-md cursor-pointer px-3 py-2"
                                    >
                                      <div
                                        className="w-3 h-3 rounded-full shadow-inner"
                                        style={{ backgroundColor: item.hex }}
                                      />
                                      <span className="text-xs font-bold tracking-tight">
                                        {item.label}
                                      </span>
                                    </DropdownMenuItem>
                                  );
                                },
                              )}
                            </DropdownMenuSubContent>
                          </DropdownMenuSub>

                          <DropdownMenuSeparator className="bg-[var(--text-primary)]/10 my-1" />

                          <DropdownMenuItem
                            onClick={() => onNewWorkspaceToRight(ws.id)}
                            className="flex items-center gap-2 focus:bg-[var(--text-primary)]/5 rounded-md cursor-pointer px-3 py-2"
                          >
                            <Plus
                              size={14}
                              className="text-[var(--text-secondary)]"
                            />
                            <span className="font-bold text-xs tracking-tight">
                              New Space to Right
                            </span>
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => handleCloseOthers(ws.id)}
                            disabled={!canCloseOthers}
                            className="flex items-center gap-2 focus:bg-[var(--text-primary)]/5 rounded-md cursor-pointer px-3 py-2"
                          >
                            <Layers
                              size={14}
                              className={cn(
                                "text-[var(--text-secondary)]",
                                !canCloseOthers && "opacity-50",
                              )}
                            />
                            <span className="font-bold text-xs tracking-tight">
                              Close Others
                            </span>
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => handleCloseToRight(ws.id)}
                            disabled={isLast}
                            className="flex items-center gap-2 focus:bg-[var(--text-primary)]/5 rounded-md cursor-pointer px-3 py-2"
                          >
                            <ArrowRight
                              size={14}
                              className={cn(
                                "text-[var(--text-secondary)]",
                                isLast && "opacity-50",
                              )}
                            />
                            <span className="font-bold text-xs tracking-tight">
                              Close to Right
                            </span>
                          </DropdownMenuItem>

                          <DropdownMenuSeparator className="bg-[var(--text-primary)]/10 my-1" />
                          <DropdownMenuItem
                            onClick={() => onCloseWorkspace(ws.id)}
                            disabled={workspaces.length <= 1}
                            className="flex items-center justify-between gap-2 text-red-400 focus:bg-red-500/10 focus:text-red-400 rounded-md cursor-pointer px-3 py-2"
                          >
                            <div className="flex items-center gap-2">
                              <X size={14} />
                              <span className="font-bold text-xs tracking-tight">
                                Close Space
                              </span>
                            </div>
                            {renderShortcut("Ctrl+W")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </Reorder.Item>
                  );
                })}

                {/* Inline New Workspace Button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={onNewWorkspaceFlow}
                      className="w-7 h-7 flex-shrink-0 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--text-primary)]/5 rounded-md transition-all cursor-pointer [-webkit-app-region:no-drag] ml-1"
                    >
                      <Plus size={14} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="bottom"
                    sideOffset={4}
                    className="text-[10px] font-bold tracking-tight uppercase bg-[var(--surface-color)] border-[var(--border-color)] text-[var(--text-secondary)]"
                  >
                    {HEADER_CONTENT.NEW_WORKSPACE}{" "}
                    {formatShortcut(HEADER_CONTENT.NEW_WORKSPACE_SHORTCUT)}
                  </TooltipContent>
                </Tooltip>
              </Reorder.Group>
            </div>
          )}

          {/* Global Separator */}
          {showWorkspacesTab && (
            <div className="w-px h-5 bg-[var(--text-primary)]/10 mx-2" />
          )}
        </div>

        {/* Right Area: Workspace Configuration, Settings & OS Window Buttons */}
        <div className="flex items-center gap-1.5 flex-shrink-0 h-full [-webkit-app-region:no-drag] ml-1">
          {/* Space Templates Dialog Trigger */}
          {showTemplatesButton && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={onOpenTemplates}
                  className="w-7 h-7 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 rounded-md transition-all cursor-pointer"
                >
                  <Rocket size={14} />
                </Button>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                sideOffset={4}
                className="text-[10px] font-bold tracking-tight uppercase bg-[var(--surface-color)] border-[var(--border-color)] text-[var(--text-secondary)]"
              >
                {HEADER_CONTENT.TEMPLATES}{" "}
                {formatShortcut(HEADER_CONTENT.TEMPLATES_SHORTCUT)}
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
                  className="w-7 h-7 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--text-primary)]/5 rounded-md transition-all cursor-pointer"
                >
                  <Keyboard size={14} />
                </Button>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                sideOffset={4}
                className="text-[10px] font-bold tracking-tight uppercase bg-[var(--surface-color)] border-[var(--border-color)] text-[var(--text-secondary)]"
              >
                {HEADER_CONTENT.SHORTCUTS}{" "}
                {formatShortcut(HEADER_CONTENT.SHORTCUTS_SHORTCUT)}
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
                className="w-7 h-7 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--text-primary)]/5 rounded-md transition-all cursor-pointer"
              >
                <Settings size={14} />
              </Button>
            </TooltipTrigger>
            <TooltipContent
              side="bottom"
              sideOffset={4}
              className="text-[10px] font-bold tracking-tight uppercase bg-[var(--surface-color)] border-[var(--border-color)] text-[var(--text-secondary)]"
            >
              {HEADER_CONTENT.PREFERENCES}
            </TooltipContent>
          </Tooltip>

          {/* Global Separator */}
          <div className="w-px h-5 bg-[var(--text-primary)]/10 mx-2" />

          {/* Standard Window controls */}
          <div className="flex items-center gap-0.5 pr-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onMinimize}
                  className="w-8 h-8 flex items-center justify-center hover:bg-[var(--text-primary)]/5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-md transition-all cursor-pointer"
                >
                  <Minus size={14} />
                </button>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                sideOffset={4}
                className="text-[10px] font-bold tracking-tight uppercase bg-[var(--surface-color)] border-[var(--border-color)] text-[var(--text-secondary)]"
              >
                {HEADER_CONTENT.MINIMIZE}
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onMaximize}
                  className="w-8 h-8 flex items-center justify-center hover:bg-[var(--text-primary)]/5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-md transition-all cursor-pointer"
                >
                  {isWindowMaximized ? (
                    <Copy size={12} />
                  ) : (
                    <Square size={12} />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                sideOffset={4}
                className="text-[10px] font-bold tracking-tight uppercase bg-[var(--surface-color)] border-[var(--border-color)] text-[var(--text-secondary)]"
              >
                {isWindowMaximized
                  ? HEADER_CONTENT.RESTORE
                  : HEADER_CONTENT.MAXIMIZE}
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center hover:bg-red-500 hover:text-[var(--text-primary)] text-[var(--text-secondary)] rounded-md transition-all cursor-pointer"
                >
                  <X size={14} />
                </button>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                sideOffset={4}
                className="text-[10px] font-bold tracking-tight uppercase bg-[var(--surface-color)] border-[var(--border-color)] text-red-400"
              >
                {HEADER_CONTENT.CLOSE}
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Shared Rename Dialog */}
        <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
          <DialogContent
            open={isRenameDialogOpen}
            className="sm:max-w-[425px] bg-[var(--surface-color)] border-[var(--border-color)] text-[var(--text-primary)]"
          >
            <DialogHeader>
              <DialogTitle className="text-lg font-bold tracking-tight">
                Rename Workspace
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleRenameSubmit}>
              <div className="grid gap-4 py-6">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-2">
                    <label
                      htmlFor="name"
                      className="text-[10px] font-bold text-[var(--text-secondary)] tracking-widest uppercase"
                    >
                      Workspace Name
                    </label>
                    <button
                      type="button"
                      onClick={() => setTempName("")}
                      className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors"
                    >
                      <RotateCcw size={10} />
                      Reset to Default
                    </button>
                  </div>
                  <Input
                    id="name"
                    ref={renameInputRef}
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    className="h-10 bg-[var(--text-primary)]/5 border-[var(--border-color)] focus:border-[var(--accent-primary)]/50 rounded-lg text-sm font-bold"
                    placeholder={contextWorkspace?.name || "New Workspace"}
                    autoFocus
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsRenameDialogOpen(false)}
                  className="hover:bg-[var(--text-primary)]/5 text-xs font-bold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-[var(--accent-primary)] text-[var(--accent-contrast)] hover:brightness-110 text-xs font-bold px-6 shadow-[0_0_15px_rgba(var(--accent-primary-rgb),0.3)]"
                >
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    );
  },
);

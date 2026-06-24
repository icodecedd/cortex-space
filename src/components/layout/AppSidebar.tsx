import * as React from "react";
import {
  SquareTerminal,
  Bot,
  Plus,
  X,
  Pin,
  PinOff,
  Edit2,
  Palette,
  Trash2,
  FolderAdd,
  Folder,
  Search,
  MoreHorizontal,
  ChevronDown,
  ChevronRight,
  Settings,
} from "@/components/ui/icons";
import { Reorder, m } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Workspace } from "@/lib";
import { COLOR_MAP } from "@/components/ui/interactive-tab";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn, getWorkspacePlaceholder } from "@/lib/utils";
import { useProjectIcon } from "@/hooks/useProjectIcon";
import { toast } from "sonner";
import { open as openTauriDialog } from "@tauri-apps/plugin-dialog";

interface AppSidebarProps {
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  onSwitchWorkspace: (id: string) => void;
  onCloseWorkspace: (id: string) => void;
  onReorderWorkspaces: (newOrder: Workspace[]) => void;
  onNewProjectModal: () => void;
  onCreateSubTab: (mode?: any, workspaceId?: string) => void;
  onSearchWorkspace: () => void;
  onRenameWorkspace: (id: string, name: string) => void;
  onPinWorkspace: (id: string, isPinned: boolean) => void;
  onUpdateWorkspace: (id: string, updates: Partial<Omit<Workspace, "id" | "subTabs" | "activeSubTabId">>) => void;
  onOpenProjectSettings: (id: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  sidebarWidth: number;
  setSidebarWidth: (width: number) => void;
  isResizing: boolean;
  setIsResizing: (isResizing: boolean) => void;
  onSwitchSubTab: (workspaceId: string, subTabId: string) => void;
  onCloseSubTab: (workspaceId: string, subTabId: string) => void;
}

function WorkspaceTabIcon({
  rootPath,
  customIconPath,
  colorHex,
  isActive,
  isPinned,
  isCollapsed,
}: {
  rootPath?: string | null;
  customIconPath?: string | null;
  colorHex?: string | null;
  isActive: boolean;
  isPinned?: boolean;
  isCollapsed: boolean;
}) {
  const iconUrl = useProjectIcon(customIconPath || rootPath);
  const [imgError, setImgError] = React.useState(false);

  React.useEffect(() => {
    setImgError(false);
  }, [iconUrl]);

  return (
    <div className="relative flex items-center justify-center shrink-0 w-[14px] h-[14px]">
      {iconUrl && !imgError ? (
        <img
          src={iconUrl}
          alt=""
          className="w-full h-full object-contain rounded-[2px]"
          onError={() => setImgError(true)}
        />
      ) : (
        <Folder
          size={14}
          style={{ color: colorHex || "currentColor" }}
          className={cn(
            isActive
              ? "text-[var(--accent-primary)]"
              : "text-[var(--text-secondary)] group-hover/item:text-[var(--text-primary)]",
          )}
        />
      )}
      {isPinned && !isCollapsed && (
        <div className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-sky-500 rounded-full" />
      )}
    </div>
  );
}

export const AppSidebar = React.memo(
  ({
    workspaces,
    activeWorkspaceId,
    onSwitchWorkspace,
    onCloseWorkspace,
    onReorderWorkspaces,
    onNewProjectModal,
    onCreateSubTab,
    onSearchWorkspace,
    onRenameWorkspace,
    onPinWorkspace,
    onUpdateWorkspace,
    onOpenProjectSettings,
    isCollapsed,
    sidebarWidth,
    setSidebarWidth,
    isResizing,
    setIsResizing,
    onSwitchSubTab,
    onCloseSubTab,
  }: AppSidebarProps) => {
    const [contextWorkspaceId, setContextWorkspaceId] = React.useState<string | null>(null);
    const [isRenameDialogOpen, setIsRenameDialogOpen] = React.useState(false);
    const [tempName, setTempName] = React.useState("");
    const renameInputRef = React.useRef<HTMLInputElement>(null);

    const [collapsedWorkspaces, setCollapsedWorkspaces] = React.useState<Record<string, boolean>>(() => {
      try {
        const saved = localStorage.getItem("cortex_collapsed_workspaces");
        return saved ? JSON.parse(saved) : {};
      } catch {
        return {};
      }
    });

    const toggleCollapseWorkspace = React.useCallback((id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setCollapsedWorkspaces((prev) => {
        const next = { ...prev, [id]: !prev[id] };
        localStorage.setItem("cortex_collapsed_workspaces", JSON.stringify(next));
        return next;
      });
    }, []);

    const startResizing = React.useCallback((mouseDownEvent: React.MouseEvent) => {
      mouseDownEvent.preventDefault();
      setIsResizing(true);
    }, [setIsResizing]);

    React.useEffect(() => {
      if (!isResizing) return;

      const handleMouseMove = (e: MouseEvent) => {
        const newWidth = Math.max(180, Math.min(360, e.clientX));
        setSidebarWidth(newWidth);
        localStorage.setItem("cortex_left_sidebar_width", newWidth.toString());
      };

      const handleMouseUp = () => {
        setIsResizing(false);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };
    }, [isResizing, setSidebarWidth, setIsResizing]);

    const handleRenameClick = (ws: Workspace) => {
      setContextWorkspaceId(ws.id);
      const initialName =
        ws.customName ||
        ws.name ||
        getWorkspacePlaceholder(workspaces.indexOf(ws));
      setTempName(initialName);
      setIsRenameDialogOpen(true);

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
      <m.div
        animate={{ width: isCollapsed ? 0 : sidebarWidth }}
        transition={
          isResizing
            ? { duration: 0 }
            : { type: "spring", stiffness: 350, damping: 30 }
        }
        className={cn(
          "h-full bg-[var(--surface-color)]/70 backdrop-blur-xl flex flex-col flex-shrink-0 z-40 select-none overflow-hidden relative",
          isCollapsed
            ? "border-r-0"
            : "border-r border-[var(--border-color)]/50",
        )}
      >
        {/* Resize Handle */}
        {!isCollapsed && (
          <div
            onMouseDown={startResizing}
            className={cn(
              "absolute right-0 top-0 bottom-0 w-1 cursor-col-resize z-50 transition-all",
              isResizing
                ? "bg-[var(--accent-primary)]/50"
                : "hover:bg-[var(--accent-primary)]/20",
            )}
          />
        )}

        {/* No header: title & toggle have been moved to AppHeader */}

        {/* Workspace Section */}
        <div className="flex flex-col flex-1 border-b border-[var(--border-color)]/40 py-2 overflow-y-auto scrollbar-none">
          {!isCollapsed && (
            <div className="px-3 pb-1 flex items-center justify-between">
              <span className="text-[10px] font-bold text-[var(--text-secondary)] tracking-wider uppercase">
                Workspaces
              </span>
              <div className="flex items-center gap-1">
                <Tooltip delayDuration={300}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={onNewProjectModal}
                      className="w-6 h-6 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--text-primary)]/5 rounded"
                    >
                      <FolderAdd size={16} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="bottom"
                    className="text-[10px] font-bold tracking-tight uppercase bg-[var(--surface-color)] border-[var(--border-color)] text-[var(--text-secondary)]"
                  >
                    New Project
                  </TooltipContent>
                </Tooltip>

                <Tooltip delayDuration={300}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={onCreateSubTab}
                      disabled={!activeWorkspaceId}
                      className="w-6 h-6 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--text-primary)]/5 rounded disabled:opacity-30 disabled:pointer-events-none"
                    >
                      <Plus size={16} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="bottom"
                    className="text-[10px] font-bold tracking-tight uppercase bg-[var(--surface-color)] border-[var(--border-color)] text-[var(--text-secondary)]"
                  >
                    New Tab
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          )}

          {!isCollapsed && (
            <div className="px-3 mb-2 mt-1 shrink-0">
              <Button
                variant="ghost"
                onClick={onSearchWorkspace}
                className="w-full h-8 justify-start text-[11px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--text-primary)]/[0.04] border border-[var(--border-color)]/30 bg-[var(--text-primary)]/[0.01] rounded-md gap-2 px-2.5 transition-all cursor-pointer shadow-2xs"
              >
                <Search size={13} className="opacity-70" />
                <span>Search workspaces...</span>
              </Button>
            </div>
          )}

          {workspaces.length === 0 ? (
            !isCollapsed ? (
              <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 text-center text-[var(--text-secondary)]">
                <Folder className="w-8 h-8 opacity-20 mb-2.5" />
                <p className="text-[11px] font-medium text-[var(--text-primary)]">No workspaces open</p>
                <p className="text-[10px] opacity-60 max-w-[150px] mt-1 leading-normal">
                  Click the project icon above to open a local folder.
                </p>
              </div>
            ) : null
          ) : (
            <Reorder.Group
              axis="y"
              values={workspaces}
              onReorder={onReorderWorkspaces}
              className="flex flex-col gap-0.5 px-1.5 overflow-y-auto scrollbar-none"
            >
              {workspaces.map((ws, idx) => {
                const isActiveWorkspace = activeWorkspaceId === ws.id;
                const hasSubTabs = ws.subTabs && ws.subTabs.length > 0;
                const isActive = !hasSubTabs && isActiveWorkspace;
                const isDraft = ws.status !== "active";
                const colorHex = ws.color ? COLOR_MAP[ws.color].hex : null;
                const displayName =
                  ws.customName || ws.name || getWorkspacePlaceholder(idx);

                const content = (
                  <DropdownMenu
                    open={contextWorkspaceId === ws.id}
                    onOpenChange={(open) => {
                      if (!open) setContextWorkspaceId(null);
                    }}
                  >
                    <DropdownMenuTrigger asChild>
                      <div
                        onContextMenu={(e) => {
                          e.preventDefault();
                          setContextWorkspaceId(ws.id);
                        }}
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          handleRenameClick(ws);
                        }}
                        onClick={() => onSwitchWorkspace(ws.id)}
                        className={cn(
                          "w-full h-8 flex items-center rounded-lg cursor-default select-none relative group/item transition-all",
                          isActive
                            ? "bg-[var(--accent-primary)]/10 text-[var(--text-primary)] font-semibold shadow-sm"
                            : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
                          isDraft && !isActiveWorkspace && "opacity-60",
                          isCollapsed ? "justify-center px-0" : "px-2.5 gap-2",
                        )}
                        style={
                          isActive && colorHex
                            ? {
                                borderLeft: `3px solid ${colorHex}`,
                                paddingLeft: "7px",
                              }
                            : isActive
                              ? {
                                  borderLeft: `3px solid var(--accent-primary)`,
                                  paddingLeft: "7px",
                                }
                              : undefined
                        }
                      >
                        {/* Collapse/Expand Toggle (Spacer if no subtabs) */}
                        {!isCollapsed && (
                          hasSubTabs ? (
                            <button
                              onClick={(e) => toggleCollapseWorkspace(ws.id, e)}
                              className="w-4 h-4 rounded hover:bg-[var(--text-primary)]/10 flex items-center justify-center text-[var(--text-secondary)]/50 hover:text-[var(--text-primary)] transition-all shrink-0 cursor-pointer"
                            >
                              {collapsedWorkspaces[ws.id] ? (
                                <ChevronRight size={10} />
                              ) : (
                                <ChevronDown size={10} />
                              )}
                            </button>
                          ) : (
                            <div className="w-4 shrink-0" />
                          )
                        )}

                        <WorkspaceTabIcon
                          rootPath={ws.config?.rootPath}
                          customIconPath={ws.customIconPath}
                          colorHex={colorHex}
                          isActive={isActive}
                          isPinned={ws.isPinned}
                          isCollapsed={isCollapsed}
                        />

                        {/* Name (hidden when collapsed) */}
                        {!isCollapsed && (
                          <span className="text-[11px] font-medium truncate flex-1 tracking-tight">
                            {displayName}
                          </span>
                        )}

                        {/* Pinned / Hover Actions */}
                        {!isCollapsed && (
                          <div className="flex items-center gap-1 shrink-0">
                            {ws.isPinned && (
                              <div className="group-hover/item:hidden flex items-center justify-center w-5 h-5">
                                <Pin size={10} className="text-sky-500 fill-sky-500/20" />
                              </div>
                            )}
                            <div className="hidden group-hover/item:flex items-center gap-0.5">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onCreateSubTab(undefined, ws.id);
                                }}
                                className="w-5 h-5 rounded hover:bg-[var(--text-primary)]/10 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
                                title="Add Subtab"
                              >
                                <Plus size={11} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  setContextWorkspaceId(ws.id);
                                }}
                                className="w-5 h-5 rounded hover:bg-[var(--text-primary)]/10 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
                                title="Actions"
                              >
                                <MoreHorizontal size={11} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onCloseWorkspace(ws.id);
                                }}
                                className="w-5 h-5 rounded hover:bg-[var(--text-primary)]/10 flex items-center justify-center text-[var(--text-secondary)] hover:text-red-400 transition-all cursor-pointer"
                                title="Close Workspace"
                              >
                                <X size={11} />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent
                      align={isCollapsed ? "center" : "start"}
                      side={isCollapsed ? "right" : "bottom"}
                      className="w-48 bg-[var(--surface-color)]/95 backdrop-blur-xl border-[var(--border-color)] p-1 text-[var(--text-primary)] shadow-2xl rounded-lg z-[100]"
                    >
                      <DropdownMenuItem
                        onClick={() => onOpenProjectSettings(ws.id)}
                        className="flex items-center gap-2 focus:bg-[var(--text-primary)]/5 rounded-md cursor-pointer px-3 py-1.5 text-xs font-bold"
                      >
                        <Settings size={13} className="text-[var(--text-secondary)]" />
                        <span>Project Settings</span>
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={async () => {
                          try {
                            const selected = await openTauriDialog({
                              directory: false,
                              multiple: false,
                              filters: [{ name: "Images", extensions: ["png", "jpg", "jpeg", "svg", "ico", "webp"] }],
                              title: "Select Project Icon",
                            });
                            if (selected && typeof selected === "string") {
                              onUpdateWorkspace(ws.id, { customIconPath: selected });
                              toast.success("Project icon updated");
                            }
                          } catch (err) {
                            console.error("Failed to select icon:", err);
                          }
                        }}
                        className="flex items-center gap-2 focus:bg-[var(--text-primary)]/5 rounded-md cursor-pointer px-3 py-1.5 text-xs font-bold"
                      >
                        <Palette size={13} className="text-[var(--text-secondary)]" />
                        <span>Change Project Icon</span>
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={() => handleRenameClick(ws)}
                        className="flex items-center gap-2 focus:bg-[var(--text-primary)]/5 rounded-md cursor-pointer px-3 py-1.5 text-xs font-bold"
                      >
                        <Edit2 size={13} className="text-[var(--text-secondary)]" />
                        <span>Rename</span>
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={() => onPinWorkspace(ws.id, !ws.isPinned)}
                        className="flex items-center gap-2 focus:bg-[var(--text-primary)]/5 rounded-md cursor-pointer px-3 py-1.5 text-xs font-bold"
                      >
                        {ws.isPinned ? (
                          <>
                            <PinOff size={13} className="text-[var(--text-secondary)]" />
                            <span>Unpin Workspace</span>
                          </>
                        ) : (
                          <>
                            <Pin size={13} className="text-[var(--text-secondary)]" />
                            <span>Pin Workspace</span>
                          </>
                        )}
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={() => onCreateSubTab(undefined, ws.id)}
                        className="flex items-center gap-2 focus:bg-[var(--text-primary)]/5 rounded-md cursor-pointer px-3 py-1.5 text-xs font-bold"
                      >
                        <Plus size={13} className="text-[var(--text-secondary)]" />
                        <span>New Subtab</span>
                      </DropdownMenuItem>

                      <DropdownMenuSeparator className="bg-[var(--text-primary)]/10 my-1" />

                      <DropdownMenuItem
                        onClick={() => onCloseWorkspace(ws.id)}
                        className="flex items-center gap-2 text-red-400 focus:bg-red-500/10 focus:text-red-400 rounded-md cursor-pointer px-3 py-1.5 text-xs font-bold"
                      >
                        <Trash2 size={13} />
                        <span>Remove</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                );

                return (
                  <Reorder.Item
                    key={ws.id}
                    value={ws}
                    className="w-full flex flex-col"
                  >
                    {isCollapsed ? (
                      <Tooltip delayDuration={300}>
                        <TooltipTrigger asChild>
                          <div className="w-full">{content}</div>
                        </TooltipTrigger>
                        <TooltipContent
                          side="right"
                          sideOffset={10}
                          className="text-[10px] font-bold tracking-tight uppercase bg-[var(--surface-color)] border-[var(--border-color)] text-[var(--text-secondary)] flex flex-col gap-1 p-2 rounded-lg"
                        >
                          <div className="font-bold">{displayName}</div>
                          {ws.subTabs && ws.subTabs.length > 0 && (
                            <div className="text-[9px] text-[var(--text-secondary)]/80 normal-case border-t border-[var(--border-color)]/25 mt-1 pt-1 font-normal flex flex-col gap-0.5 min-w-[70px]">
                              {ws.subTabs.map((t) => {
                                const isCurrentTab = ws.activeSubTabId === t.id;
                                return (
                                  <div
                                    key={t.id}
                                    className={cn(
                                      "flex items-center gap-1",
                                      isCurrentTab &&
                                        "text-[var(--accent-primary)] font-semibold",
                                    )}
                                  >
                                    <span>•</span>
                                    <span className="truncate">{t.name}</span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <>
                        {content}
                        {ws.subTabs && ws.subTabs.length > 0 && !collapsedWorkspaces[ws.id] && (
                          <div className="flex flex-col gap-0.5 mt-1 pl-6 pr-1.5 w-full">
                            {ws.subTabs.map((tab) => {
                              const isTabActive =
                                ws.id === activeWorkspaceId &&
                                tab.id === ws.activeSubTabId;
                              const TabIcon =
                                tab.mode === "agents" ? Bot : SquareTerminal;
                              const tabDisplayName = tab.name || "Tab";

                              return (
                                <div
                                  key={tab.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onSwitchSubTab(ws.id, tab.id);
                                  }}
                                  className={cn(
                                    "w-full h-7 flex items-center rounded-md px-2 gap-2 cursor-default select-none group/subitem transition-all text-[11px] font-medium",
                                    isTabActive
                                      ? "bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] font-semibold shadow-xs"
                                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--text-primary)]/[0.04]",
                                  )}
                                >
                                  <TabIcon
                                    size={12}
                                    className="shrink-0 opacity-70"
                                  />
                                  <span className="truncate flex-1 tracking-tight">
                                    {tabDisplayName}
                                  </span>
                                  {ws.subTabs.length > 1 && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onCloseSubTab(ws.id, tab.id);
                                      }}
                                      className="hidden group-hover/subitem:flex w-4 h-4 rounded hover:bg-[var(--text-primary)]/10 items-center justify-center text-[var(--text-secondary)] hover:text-red-400 cursor-pointer"
                                    >
                                      <X size={8} />
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </>
                    )}
                  </Reorder.Item>
                );
              })}
            </Reorder.Group>
          )}

          {isCollapsed && (
            <div className="flex flex-col items-center gap-1.5 mt-2">
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={onSearchWorkspace}
                    className="w-10 h-10 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--text-primary)]/5 rounded-md flex items-center justify-center"
                  >
                    <Search size={20} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  className="text-[10px] font-bold tracking-tight uppercase bg-[var(--surface-color)] border-[var(--border-color)] text-[var(--text-secondary)]"
                >
                  Search Projects
                </TooltipContent>
              </Tooltip>

              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={onNewProjectModal}
                    className="w-10 h-10 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--text-primary)]/5 rounded-md flex items-center justify-center"
                  >
                    <FolderAdd size={22} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  className="text-[10px] font-bold tracking-tight uppercase bg-[var(--surface-color)] border-[var(--border-color)] text-[var(--text-secondary)]"
                >
                  New Project
                </TooltipContent>
              </Tooltip>

              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={onCreateSubTab}
                    disabled={!activeWorkspaceId}
                    className="w-10 h-10 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--text-primary)]/5 rounded-md flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none"
                  >
                    <Plus size={22} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  className="text-[10px] font-bold tracking-tight uppercase bg-[var(--surface-color)] border-[var(--border-color)] text-[var(--text-secondary)]"
                >
                  New Tab
                </TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>

        {/* Rename Workspace Dialog */}
        <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
          <DialogContent className="max-w-xs bg-[var(--surface-color)]/95 backdrop-blur-xl border-[var(--border-color)] text-[var(--text-primary)] p-4 rounded-xl shadow-2xl">
            <DialogHeader className="p-0">
              <DialogTitle className="text-xs font-black tracking-wider uppercase">
                Rename Space
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleRenameSubmit} className="space-y-3.5 mt-2">
              <Input
                ref={renameInputRef}
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                placeholder="Enter workspace name..."
                className="h-8 text-xs font-bold bg-white/[0.02] border-[var(--border-color)]/25 focus:border-[var(--accent-primary)]/40 rounded-lg px-2.5"
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={() => setIsRenameDialogOpen(false)}
                  className="h-7 text-[10px] font-bold rounded-lg"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="default"
                  size="xs"
                  className="h-7 text-[10px] font-bold rounded-lg px-3 bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90 text-white"
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </m.div>
    );
  }
);

AppSidebar.displayName = "AppSidebar";

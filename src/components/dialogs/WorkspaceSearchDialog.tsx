import { useState, useMemo, useEffect, useCallback } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Workspace, SubTab } from "@/lib";
import { LayoutPreviewIcon } from "@/components/ui/layout-preview-icon";
import { useProjectIcon } from "@/hooks/useProjectIcon";
import {
  Search,
  Folder,
  SquareTerminal,
  Bot,
  X,
} from "@/components/ui/icons";
import { cn, getWorkspacePlaceholder } from "@/lib/utils";
import { Kbd } from "@/components/ui/kbd";
import { EmptyState } from "@/components/ui/empty-state";

interface WorkspaceSearchDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  onSwitchWorkspace: (workspaceId: string) => void;
  onSwitchSubTab: (workspaceId: string, subTabId: string) => void;
}

type SearchItem =
  | {
      type: "workspace";
      id: string;
      workspace: Workspace;
      displayName: string;
      rootPath: string;
    }
  | {
      type: "subtab";
      id: string;
      workspace: Workspace;
      subTab: SubTab;
      displayName: string;
      parentName: string;
    };

function ProjectIconWrapper({
  rootPath,
  isActive,
}: {
  rootPath?: string | null;
  isActive: boolean;
}) {
  const iconUrl = useProjectIcon(rootPath);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [iconUrl]);

  if (iconUrl && !imgError) {
    return (
      <img
        src={iconUrl}
        alt=""
        className="w-12 h-9 object-contain rounded-md border border-[var(--border-color)] bg-[var(--text-primary)]/[0.01]"
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div
      className={cn(
        "w-12 h-9 border rounded-md flex items-center justify-center transition-colors",
        isActive
          ? "border-[var(--accent-primary)]/40 bg-[var(--accent-primary)]/10"
          : "border-[var(--border-color)] bg-[var(--text-primary)]/[0.02]"
      )}
    >
      <Folder
        size={18}
        className={isActive ? "text-[var(--accent-primary)]" : "text-[var(--text-secondary)]"}
      />
    </div>
  );
}

export function WorkspaceSearchDialog({
  isOpen,
  onOpenChange,
  workspaces,
  activeWorkspaceId,
  onSwitchWorkspace,
  onSwitchSubTab,
}: WorkspaceSearchDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Flatten workspaces and sub-tabs into a single searchable list
  const searchItems = useMemo((): SearchItem[] => {
    const items: SearchItem[] = [];

    workspaces.forEach((ws, wsIdx) => {
      const wsName = ws.customName || ws.name || getWorkspacePlaceholder(wsIdx);
      const rootPath = ws.config?.rootPath || "";

      // 1. Add the workspace itself
      items.push({
        type: "workspace",
        id: ws.id,
        workspace: ws,
        displayName: wsName,
        rootPath,
      });

      // 2. Add each of its subtabs
      if (ws.subTabs && ws.subTabs.length > 0) {
        ws.subTabs.forEach((tab) => {
          items.push({
            type: "subtab",
            id: `${ws.id}-${tab.id}`,
            workspace: ws,
            subTab: tab,
            displayName: tab.name || "Tab",
            parentName: wsName,
          });
        });
      }
    });

    return items;
  }, [workspaces]);

  // Filter items based on the search query
  const filteredItems = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return searchItems;

    return searchItems.filter((item) => {
      if (item.type === "workspace") {
        return (
          item.displayName.toLowerCase().includes(query) ||
          item.rootPath.toLowerCase().includes(query)
        );
      } else {
        return (
          item.displayName.toLowerCase().includes(query) ||
          item.parentName.toLowerCase().includes(query)
        );
      }
    });
  }, [searchItems, searchQuery]);

  // Reset selected index when search changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  const handleExecuteItem = useCallback(
    (item: SearchItem) => {
      if (item.type === "workspace") {
        onSwitchWorkspace(item.id);
      } else {
        onSwitchSubTab(item.workspace.id, item.subTab.id);
      }
      onOpenChange(false);
    },
    [onSwitchWorkspace, onSwitchSubTab, onOpenChange]
  );

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (filteredItems.length || 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(
          (prev) => (prev - 1 + filteredItems.length) % (filteredItems.length || 1)
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        const selected = filteredItems[selectedIndex];
        if (selected) {
          handleExecuteItem(selected);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex, handleExecuteItem]);

  // Scroll active item into view
  useEffect(() => {
    const activeEl = document.getElementById(`ws-search-item-${selectedIndex}`);
    if (activeEl) {
      activeEl.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [selectedIndex]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        isDeep={true}
        open={isOpen}
        className="fixed inset-0 m-auto bg-[var(--surface-color)]/80 border-[var(--border-color)] flex flex-col p-0 gap-0 overflow-hidden backdrop-blur-xl z-[150]"
        style={{
          maxWidth: "600px",
          width: "calc(100% - 2rem)",
          height: "400px",
          maxHeight: "70vh",
          borderRadius: "12px",
          boxShadow:
            "0 30px 60px rgba(0, 0, 0, 0.4), 0 0 20px rgba(var(--accent-primary-rgb), 0.1)",
        }}
      >
        <div className="relative border-b border-[var(--border-color)] bg-[var(--text-primary)]/[0.02] shrink-0">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
          <Input
            autoFocus
            placeholder="Search project workspaces or sub-tabs..."
            className="pl-11 pr-20 py-8 text-[15px] bg-transparent border-none focus-visible:ring-0 placeholder:text-[var(--text-secondary)]/70 font-semibold text-[var(--text-primary)]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="w-5 h-5 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--text-primary)]/5 rounded-full transition-all"
              >
                <X size={12} strokeWidth={3} />
              </button>
            )}
            <div className="flex items-center gap-1.5 pointer-events-none">
              <Kbd className="bg-[var(--text-primary)]/5 border-[var(--border-color)] text-[var(--text-secondary)] px-1.5 py-0.5 text-[10px] font-bold">
                ESC
              </Kbd>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="p-2 space-y-0.5">
            {filteredItems.length === 0 ? (
              <EmptyState
                icon={Search}
                title="No Projects Found"
                description={`We couldn't find any workspaces or sub-tabs matching "${searchQuery}".`}
                iconColor="text-[var(--text-secondary)]/40"
              />
            ) : (
              filteredItems.map((item, index) => {
                const isSelected = selectedIndex === index;

                // Determine active status
                const isCurrent =
                  item.type === "workspace"
                    ? item.id === activeWorkspaceId
                    : item.workspace.id === activeWorkspaceId &&
                      item.subTab.id === item.workspace.activeSubTabId;

                return (
                  <div
                    key={item.id}
                    id={`ws-search-item-${index}`}
                    onClick={() => handleExecuteItem(item)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={cn(
                      "group flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-all duration-150",
                      isSelected
                        ? "bg-[var(--text-primary)]/[0.07]"
                        : "hover:bg-[var(--text-primary)]/[0.03]"
                    )}
                  >
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <div className="relative shrink-0">
                        {item.type === "workspace" ? (
                          <ProjectIconWrapper
                            rootPath={item.rootPath}
                            isActive={isSelected}
                          />
                        ) : (
                          // Render layout preview for active sub-tabs, otherwise mode icons
                          (() => {
                            const TabIcon =
                              item.subTab.mode === "agents" ? Bot : SquareTerminal;

                            return item.subTab.config?.layout ? (
                              <LayoutPreviewIcon
                                layout={item.subTab.config.layout}
                                className={cn(
                                  "w-12 h-9 border bg-[var(--bg-color)]",
                                  isSelected
                                    ? "border-[var(--accent-primary)]/40"
                                    : "border-[var(--border-color)]"
                                )}
                              />
                            ) : (
                              <div
                                className={cn(
                                  "w-12 h-9 border rounded-md flex items-center justify-center transition-colors",
                                  isSelected
                                    ? "border-[var(--accent-primary)]/40 bg-[var(--accent-primary)]/10"
                                    : "border-[var(--border-color)] bg-[var(--text-primary)]/[0.02]"
                                )}
                              >
                                <TabIcon
                                  size={16}
                                  className={
                                    isSelected
                                      ? "text-[var(--accent-primary)]"
                                      : "text-[var(--text-secondary)]"
                                  }
                                />
                              </div>
                            );
                          })()
                        )}
                        {isCurrent && (
                          <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[var(--accent-primary)] rounded-full border-2 border-[var(--surface-color)]" />
                        )}
                      </div>

                      <div className="space-y-0.5 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "text-[13px] font-bold truncate",
                              isSelected
                                ? "text-[var(--text-primary)]"
                                : "text-[var(--text-primary)]/90"
                            )}
                          >
                            {item.displayName}
                          </span>
                          <span className="text-[10px] bg-[var(--text-primary)]/[0.05] border border-[var(--border-color)]/20 px-1.5 py-0.2 rounded font-bold uppercase tracking-wider text-[var(--text-secondary)] opacity-70">
                            {item.type}
                          </span>
                        </div>
                        <div className="text-[11px] text-[var(--text-secondary)]/80 truncate">
                          {item.type === "workspace" ? (
                            item.rootPath
                          ) : (
                            <>
                              Project: <span className="font-semibold text-[var(--text-secondary)]">{item.parentName}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity pl-2">
                      <span className="text-[10px] text-[var(--text-secondary)] font-bold uppercase">
                        Select
                      </span>
                      <Kbd className="bg-[var(--text-primary)]/5 border-[var(--border-color)] text-[var(--text-secondary)] px-1.5 py-0.5 text-[9px] font-bold">
                        ↵
                      </Kbd>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>

        <div className="p-3 border-t border-[var(--border-color)] bg-[var(--text-primary)]/[0.01] flex items-center justify-between text-[10px] text-[var(--text-secondary)] font-bold shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Kbd className="bg-[var(--text-primary)]/5 border-[var(--border-color)] text-[var(--text-secondary)] font-bold">
                ↑↓
              </Kbd>
              <span>Navigate</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Kbd className="bg-[var(--text-primary)]/5 border-[var(--border-color)] text-[var(--text-secondary)] font-bold">
                Enter
              </Kbd>
              <span>Select</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span>{filteredItems.length} {filteredItems.length === 1 ? "Result" : "Results"}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

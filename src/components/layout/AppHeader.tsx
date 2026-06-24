
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
  RotateCcw,
  PanelRight,
  PanelLeft,
} from "@/components/ui/icons";
import { m } from "framer-motion";
import { Button } from "@/components/ui/button";
import { SubTab, Mode } from "@/lib";
import { InteractiveTab } from "@/components/ui/interactive-tab";
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
import { HEADER_CONTENT } from "@/lib/content";
import { cn } from "@/lib/utils";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { parseShortcutToKeys } from "@/lib/shortcut-utils";

interface AppHeaderProps {
  subTabs: SubTab[];
  activeSubTabId: string | null;
  isWindowMaximized: boolean;
  onSwitchSubTab: (id: string) => void;
  onCloseSubTab: (id: string) => void;
  onCreateSubTab: (mode?: Mode) => void;
  onRenameSubTab: (id: string, name: string) => void;
  onOpenShortcuts: () => void;
  onOpenSettings: () => void;
  onOpenTemplates: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  onClose: () => void;
  showSubTabs?: boolean;
  showTemplatesButton?: boolean;
  showShortcutsButton?: boolean;
  rightSidebarVisible?: boolean;
  onToggleRightSidebar?: () => void;
  leftSidebarWidth: number;
  isLeftSidebarResizing: boolean;
  isLeftSidebarCollapsed: boolean;
  onToggleLeftSidebarCollapse: () => void;
}

export const AppHeader = React.memo(
  ({
    subTabs,
    activeSubTabId,
    isWindowMaximized,
    onSwitchSubTab,
    onCloseSubTab,
    onCreateSubTab,
    onRenameSubTab,
    onOpenShortcuts,
    onOpenSettings,
    onOpenTemplates,
    onMinimize,
    onMaximize,
    onClose,
    showSubTabs = true,
    showTemplatesButton = true,
    showShortcutsButton = true,
    rightSidebarVisible = false,
    onToggleRightSidebar = () => {},
    leftSidebarWidth,
    isLeftSidebarResizing,
    isLeftSidebarCollapsed,
    onToggleLeftSidebarCollapse,
  }: AppHeaderProps) => {
    const scrollRef = React.useRef<HTMLDivElement>(null);
    const isMac =
      typeof window !== "undefined" && navigator.userAgent.includes("Mac");

    const renderShortcut = React.useCallback(
      (shortcut: string) => {
        return (
          <KbdGroup className="gap-0.5 flex items-center justify-end">
            {parseShortcutToKeys(shortcut, isMac).map((key, idx) => (
              <Kbd
                key={idx}
                className="min-w-4 h-4 px-1 text-[8px] flex items-center justify-center bg-[var(--text-primary)]/[0.04] border border-[var(--border-color)]/20"
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
    const [contextSubTabId, setContextSubTabId] = React.useState<
      string | null
    >(null);
    const [isRenameDialogOpen, setIsRenameDialogOpen] = React.useState(false);
    const [tempName, setTempName] = React.useState("");
    const renameInputRef = React.useRef<HTMLInputElement>(null);

    const contextSubTab = React.useMemo(
      () => subTabs.find((t) => t.id === contextSubTabId),
      [subTabs, contextSubTabId],
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
      if (activeSubTabId) {
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
    }, [activeSubTabId]);

    const handleRenameClick = (t: SubTab) => {
      setContextSubTabId(t.id);
      setTempName(t.name);
      setIsRenameDialogOpen(true);

      // Use a small timeout to ensure the dialog is mounted before focusing
      setTimeout(() => {
        renameInputRef.current?.focus();
        renameInputRef.current?.select();
      }, 50);
    };

    const handleRenameSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (contextSubTabId) {
        onRenameSubTab(contextSubTabId, tempName.trim());
      }
      setIsRenameDialogOpen(false);
    };

    return (
      <div
        data-tauri-drag-region
        className="h-10 bg-[var(--bg-color)] flex items-center justify-between border-b border-[var(--border-color)] select-none flex-shrink-0 z-50 cursor-default [-webkit-app-region:drag]"
        style={{
          paddingRight: "8px",
        }}
      >
        {/* Left Area: Logo, Title & Toggle, aligned to Left Sidebar */}
        <m.div
          animate={{ width: leftSidebarWidth }}
          transition={isLeftSidebarResizing ? { duration: 0 } : { type: "spring", stiffness: 350, damping: 30 }}
          className="h-full border-r border-[var(--border-color)]/50 flex items-center shrink-0 overflow-hidden [-webkit-app-region:no-drag] bg-[var(--surface-color)]/70 backdrop-blur-xl justify-between px-3.5"
        >
          <div className="flex items-center gap-2.5 font-sans font-black tracking-wider text-[var(--text-primary)] select-none">
            <div className="w-7 h-7 flex items-center justify-center overflow-hidden">
              <img
                src="/cortex-new-logo.png"
                alt="Cortex Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-xs font-sans font-black tracking-wider text-[var(--text-primary)] select-none">
              CORTEX SPACE
            </span>
          </div>

          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onToggleLeftSidebarCollapse}
            className="w-7 h-7 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--text-primary)]/5 rounded-md flex-shrink-0 flex items-center justify-center"
          >
            {isLeftSidebarCollapsed ? <PanelLeft size={14} className="rotate-180" /> : <PanelLeft size={14} />}
          </Button>
        </m.div>

        {/* Middle Area: Breadcrumbs / Sub-Tabs */}
        <div className="flex items-center gap-1 overflow-hidden flex-1 h-full mx-2 [-webkit-app-region:no-drag]">
          {!showSubTabs && (
            <div className="flex items-center gap-2 pl-3 text-[11px] font-bold text-[var(--text-secondary)]">
              <span className="text-[var(--text-primary)]/40 font-medium">Spaces</span>
              <span className="text-[var(--text-primary)]/30 font-medium">/</span>
              <span className="text-[var(--text-primary)] font-semibold">
                {subTabs.find((t) => t.id === activeSubTabId)?.name ||
                  "Setup Tab"}
              </span>
            </div>
          )}
          {showSubTabs && (
            <div
              ref={scrollRef}
              className="flex items-center h-full gap-0.5 overflow-x-auto scrollbar-none flex-1 [mask-image:linear-gradient(to_right,black,95%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_right,black,95%,transparent_100%)]"
            >
              <div className="flex items-center gap-1 px-1 h-full">
                {subTabs.map((t, idx) => {
                  const isActive = activeSubTabId === t.id;
                  const isDraft = t.status !== "active";
                  const terminalCount = t.config?.layout
                    ? countPanes(t.config.layout)
                    : 0;
                  const isLast = idx === subTabs.length - 1;

                  return (
                    <div
                      key={t.id}
                      data-active={isActive}
                      className="h-full flex items-end pb-[1px]"
                    >
                      <DropdownMenu
                        open={contextSubTabId === t.id}
                        onOpenChange={(open) => {
                          if (!open) setContextSubTabId(null);
                        }}
                      >
                        <DropdownMenuTrigger asChild>
                          <div
                            className="h-full flex items-end"
                            onContextMenu={(e) => {
                              e.preventDefault();
                              setContextSubTabId(t.id);
                            }}
                          >
                            <InteractiveTab
                              id={t.id}
                              name={t.name}
                              isActive={isActive}
                              isDraft={isDraft}
                              terminalCount={terminalCount}
                              icon={
                                t.mode === "agents" ? (
                                  <Bot size={13} className="shrink-0" />
                                ) : (
                                  <SquareTerminal
                                    size={13}
                                    className="shrink-0"
                                  />
                                )
                              }
                              onSelect={() => onSwitchSubTab(t.id)}
                              onClose={() => onCloseSubTab(t.id)}
                              onRename={() => handleRenameClick(t)}
                              canClose={subTabs.length > 1}
                              isLast={isLast}
                            />
                          </div>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent
                          align="start"
                          sideOffset={2}
                          className="w-48 bg-[var(--surface-color)]/95 backdrop-blur-xl border-[var(--border-color)] p-1 text-[var(--text-primary)] shadow-2xl rounded-lg"
                        >
                          <DropdownMenuItem
                            onClick={() => handleRenameClick(t)}
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

                          <DropdownMenuSeparator className="bg-[var(--text-primary)]/10 my-1" />
                          <DropdownMenuItem
                            onClick={() => onCloseSubTab(t.id)}
                            disabled={subTabs.length <= 1}
                            className="flex items-center justify-between gap-2 text-red-400 focus:bg-red-500/10 focus:text-red-400 rounded-md cursor-pointer px-3 py-2"
                          >
                            <div className="flex items-center gap-2">
                              <X size={14} />
                              <span className="font-bold text-xs tracking-tight">
                                Close Tab
                              </span>
                            </div>
                            {renderShortcut("Ctrl+W")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  );
                })}

                {/* Inline New Tab Button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onCreateSubTab()}
                      className="w-7 h-7 flex-shrink-0 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--text-primary)]/5 rounded-md transition-all cursor-pointer ml-1"
                    >
                      <Plus size={14} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="bottom"
                    sideOffset={4}
                    className="text-[10px] font-bold tracking-tight uppercase bg-[var(--surface-color)] border-[var(--border-color)] text-[var(--text-secondary)]"
                  >
                    New Tab {formatShortcut("Ctrl+T")}
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          )}

          {/* Global Separator */}
          {showSubTabs && (
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

          {/* Right Sidebar Toggle Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onToggleRightSidebar}
                className={cn(
                  "w-7 h-7 flex items-center justify-center rounded-md transition-all cursor-pointer",
                  rightSidebarVisible
                    ? "text-[var(--accent-primary)] bg-[var(--accent-primary)]/10"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--text-primary)]/5"
                )}
              >
                {!rightSidebarVisible ? <PanelRight size={14} className="rotate-180" /> : <PanelRight size={14} />}
              </Button>
            </TooltipTrigger>
            <TooltipContent
              side="bottom"
              sideOffset={4}
              className="text-[10px] font-bold tracking-tight uppercase bg-[var(--surface-color)] border-[var(--border-color)] text-[var(--text-secondary)]"
            >
              Toggle Right Sidebar
            </TooltipContent>
          </Tooltip>

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
                <Button
                  onClick={onMinimize}
                  variant="ghost"
                  size="icon-sm"
                  className="w-8 h-8 flex items-center justify-center hover:bg-[var(--text-primary)]/5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-md transition-all cursor-pointer"
                >
                  <Minus size={14} />
                </Button>
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
                <Button
                  onClick={onMaximize}
                  variant="ghost"
                  size="icon-sm"
                  className="w-8 h-8 flex items-center justify-center hover:bg-[var(--text-primary)]/5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-md transition-all cursor-pointer"
                >
                  {isWindowMaximized ? (
                    <Copy size={12} />
                  ) : (
                    <Square size={12} />
                  )}
                </Button>
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
                <Button
                  onClick={onClose}
                  variant="ghost"
                  size="icon-sm"
                  className="w-8 h-8 flex items-center justify-center hover:!bg-red-500 text-[var(--text-secondary)] hover:!text-white rounded-md transition-all cursor-pointer"
                >
                  <X size={14} />
                </Button>
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
                Rename Tab
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
                      Tab Name
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
                    placeholder={contextSubTab?.name || "New Tab"}
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

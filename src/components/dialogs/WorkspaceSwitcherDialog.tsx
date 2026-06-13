import { useState, useMemo, useEffect, useCallback } from "react";
import { 
  Dialog, 
  DialogContent,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Workspace, SpaceTemplate, Snippet } from "@/types";
import { ThemeDefinition } from "@/hooks/useTheme";
import { LayoutPreviewIcon } from "@/components/ui/layout-preview-icon";
import { Search, Folder, Terminal, Bot, Zap, Rocket, Settings, Keyboard, Maximize, Palette, ChevronRightSquare, Code, Play, Command, X } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import { Kbd } from "@/components/ui/kbd";
import { EmptyState } from "@/components/ui/empty-state";

type PaletteItem = 
  | { type: 'workspace'; data: Workspace; shortcut?: string }
  | { type: 'template'; data: SpaceTemplate; shortcut?: string }
  | { type: 'action'; id: string; label: string; icon: any; action: () => void; shortcut?: string }
  | { type: 'snippet'; data: Snippet; shortcut?: string };

interface WorkspaceSwitcherDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  templates: SpaceTemplate[];
  snippets: Snippet[];
  allThemes: ThemeDefinition[];
  onSwitchWorkspace: (id: string) => void;
  onLaunchTemplate: (template: SpaceTemplate) => void;
  onSnippetExecute: (snippet: Snippet, execute: boolean) => void;
  onToggleZenMode: () => void;
  onOpenSettings: () => void;
  onOpenShortcuts: () => void;
  onOpenTemplates: () => void;
  onSetTheme: (theme: any) => void;
}

export function WorkspaceSwitcherDialog({
  isOpen,
  onOpenChange,
  workspaces,
  activeWorkspaceId,
  templates,
  snippets,
  allThemes,
  onSwitchWorkspace,
  onLaunchTemplate,
  onSnippetExecute,
  onToggleZenMode,
  onOpenSettings,
  onOpenShortcuts,
  onOpenTemplates,
  onSetTheme
}: WorkspaceSwitcherDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const isMac = typeof window !== 'undefined' && navigator.userAgent.includes('Mac');
  const modKey = isMac ? "⌘" : "Ctrl";

  const actions = useMemo((): PaletteItem[] => {
    const baseActions: PaletteItem[] = [
      { type: 'action', id: 'toggle-zen', label: 'Toggle Zen Mode', icon: Maximize, action: onToggleZenMode, shortcut: `${modKey}+Shift+Z` },
      { type: 'action', id: 'open-settings', label: 'Open Preferences', icon: Settings, action: onOpenSettings, shortcut: `${modKey}+,` },
      { type: 'action', id: 'open-shortcuts', label: 'View Keyboard Shortcuts', icon: Keyboard, action: onOpenShortcuts, shortcut: `${modKey}+/` },
      { type: 'action', id: 'open-templates', label: 'Manage Cortex Library', icon: Rocket, action: onOpenTemplates, shortcut: `${modKey}+T` },
    ];

    const themeActions: PaletteItem[] = allThemes.map(t => ({
      type: 'action',
      id: `theme-${t.id}`,
      label: `Theme: ${t.name}`,
      icon: Palette,
      action: () => onSetTheme(t.id)
    }));

    return [...baseActions, ...themeActions];
  }, [allThemes, onToggleZenMode, onOpenSettings, onOpenShortcuts, onOpenTemplates, onSetTheme, modKey]);

  const filteredItems = useMemo(() => {
    const query = searchQuery.toLowerCase();
    
    const wsItems: PaletteItem[] = workspaces
      .filter(ws => (ws.name || "").toLowerCase().includes(query) || (ws.customName || "").toLowerCase().includes(query) || (ws.config?.rootPath || "").toLowerCase().includes(query))
      .map(ws => ({ type: 'workspace', data: ws }));

    const templateItems: PaletteItem[] = templates
      .filter(t => t.name.toLowerCase().includes(query) || (t.description || "").toLowerCase().includes(query) || t.rootPath.toLowerCase().includes(query))
      .map(t => ({ type: 'template', data: t, shortcut: `${modKey}+T` }));

    const snippetItems: PaletteItem[] = snippets
      .filter(s => s.label.toLowerCase().includes(query) || s.command.toLowerCase().includes(query))
      .map(s => ({ type: 'snippet', data: s, shortcut: `Shift+Enter` }));

    const actionItems: PaletteItem[] = actions.filter(a => 
      a.type === 'action' && a.label.toLowerCase().includes(query)
    );

    return [...wsItems, ...templateItems, ...snippetItems, ...actionItems];
  }, [workspaces, templates, snippets, actions, searchQuery, modKey]);

  // Reset selected index when search changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  const handleExecuteItem = useCallback((item: PaletteItem, isShiftPressed: boolean = false) => {
    if (item.type === 'workspace') onSwitchWorkspace(item.data.id);
    else if (item.type === 'template') onLaunchTemplate(item.data);
    else if (item.type === 'snippet') onSnippetExecute(item.data, isShiftPressed);
    else if (item.type === 'action') item.action();
    onOpenChange(false);
  }, [onSwitchWorkspace, onLaunchTemplate, onSnippetExecute, onOpenChange]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % (filteredItems.length || 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredItems.length) % (filteredItems.length || 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const selected = filteredItems[selectedIndex];
        if (selected) {
          handleExecuteItem(selected, e.shiftKey);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex, handleExecuteItem]);

  // Scroll active item into view
  useEffect(() => {
    const activeEl = document.getElementById(`palette-item-${selectedIndex}`);
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
        className="fixed inset-0 m-auto bg-[var(--surface-color)]/80 border-[var(--border-color)] flex flex-col p-0 gap-0 overflow-hidden backdrop-blur-xl"
        style={{
          maxWidth: "640px",
          width: "calc(100% - 2rem)",
          height: "480px",
          maxHeight: "80vh",
          borderRadius: "12px",
          boxShadow: '0 30px 60px rgba(0, 0, 0, 0.4), 0 0 20px rgba(var(--accent-primary-rgb), 0.1)'
        }}
      >
        <div className="relative border-b border-[var(--border-color)] bg-[var(--text-primary)]/[0.02] shrink-0">
          <Search 
            className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]"
          />
          <Input 
            autoFocus
            placeholder="Search workspaces, snippets, or actions..." 
            className="pl-11 pr-20 py-8 text-[16px] bg-transparent border-none focus-visible:ring-0 placeholder:text-[var(--text-secondary)] font-bold text-[var(--text-primary)]"
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
              <Kbd className="bg-[var(--text-primary)]/5 border-[var(--border-color)] text-[var(--text-secondary)] px-1.5 py-0.5 text-[10px] font-mono font-bold">ESC</Kbd>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="p-2 space-y-0.5">
            {filteredItems.length === 0 ? (
              <EmptyState 
                icon={Command}
                title="No Results Found"
                description={`We couldn't find any workspaces, snippets, or actions matching "${searchQuery}".`}
                iconColor="text-[var(--text-secondary)]/40"
              />
            ) : (
              filteredItems.map((item, index) => {
                const isSelected = selectedIndex === index;
                
                return (
                  <div
                    key={`${item.type}-${index}`}
                    id={`palette-item-${index}`}
                    onClick={(e) => {
                      handleExecuteItem(item, e.shiftKey);
                    }}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={cn(
                      "group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-150",
                      isSelected ? "bg-[var(--text-primary)]/[0.07]" : "hover:bg-[var(--text-primary)]/[0.03]"
                    )}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="relative shrink-0">
                        {item.type === 'workspace' && (
                          <div className="relative">
                            {item.data.config?.layout ? (
                                <LayoutPreviewIcon 
                                  layout={item.data.config.layout} 
                                  className={cn("w-12 h-9 border bg-[var(--bg-color)]", isSelected ? "border-[var(--accent-primary)]/40" : "border-[var(--border-color)]")} 
                                />
                            ) : (
                                <div className="w-12 h-9 border border-[var(--border-color)] bg-[var(--text-primary)]/[0.03] rounded-md flex items-center justify-center">
                                  {item.data.mode === 'agents' ? <Bot size={18} className="opacity-40" /> : <Terminal size={18} className="opacity-40" />}
                                </div>
                            )}
                            {activeWorkspaceId === item.data.id && (
                                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[var(--accent-primary)] rounded-full border-2 border-[var(--surface-color)]" />
                            )}
                          </div>
                        )}
                        {item.type === 'template' && (
                          <LayoutPreviewIcon 
                            layout={item.data.layout} 
                            className={cn("w-12 h-9 border bg-ansi-green/5", isSelected ? "border-ansi-green/40" : "border-ansi-green/20")} 
                          />
                        )}
                        {item.type === 'snippet' && (
                          <div className={cn(
                            "w-12 h-9 border rounded-md flex items-center justify-center transition-colors",
                            isSelected ? "border-ansi-yellow/60 bg-ansi-yellow/10" : "border-[var(--border-color)] bg-[var(--text-primary)]/[0.02]"
                          )}>
                            <Code size={16} className={isSelected ? "text-ansi-yellow" : "text-[var(--text-secondary)]"} />
                          </div>
                        )}
                        {item.type === 'action' && (
                          <div className={cn(
                            "w-12 h-9 border rounded-md flex items-center justify-center",
                            isSelected ? "border-[var(--accent-primary)]/40 bg-[var(--accent-primary)]/10" : "border-[var(--border-color)] bg-[var(--text-primary)]/[0.02]"
                          )}>
                            <item.icon size={18} className={isSelected ? "text-[var(--accent-primary)]" : "text-[var(--text-secondary)]"} />
                          </div>
                        )}
                      </div>

                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "text-[14px] font-bold truncate",
                            isSelected ? "text-[var(--text-primary)]" : "text-[var(--text-primary)]/90"
                          )}>
                            {item.type === 'workspace' ? (item.data.customName || item.data.name || "Unnamed Workspace") : 
                            item.type === 'template' ? item.data.name : 
                            item.type === 'snippet' ? item.data.label :
                            item.label}
                          </span>
                          <span className={cn(
                            "text-[9px] font-bold px-1.5 py-0.5 rounded border transition-colors",
                            item.type === 'workspace' ? "bg-ansi-blue/5 text-ansi-blue border-ansi-blue/20" :
                            item.type === 'template' ? "bg-ansi-green/5 text-green-600 dark:text-ansi-green border-ansi-green/20" :
                            item.type === 'snippet' ? "bg-ansi-yellow/5 text-yellow-600 dark:text-ansi-yellow border-ansi-yellow/20" :
                            "bg-purple-500/5 text-purple-600 dark:text-purple-400 border-purple-500/20"
                          )}>
                            {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-secondary)] font-medium truncate">
                          {item.type === 'workspace' && (
                            <><Folder className="w-3 h-3 shrink-0" /> <span className="truncate font-mono">{item.data.config?.rootPath || "No directory selected"}</span></>
                          )}
                          {item.type === 'template' && (
                            <><Rocket className="w-3 h-3 shrink-0" /> <span className="truncate font-mono">Launch New Instance</span></>
                          )}
                          {item.type === 'snippet' && (
                            <><ChevronRightSquare className="w-3 h-3 shrink-0" /> <span className="truncate font-mono opacity-80">{item.data.command}</span></>
                          )}
                          {item.type === 'action' && (
                            <><Zap className="w-3 h-3 shrink-0" /> <span className="truncate font-mono">System Command</span></>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 ml-4">
                      {isSelected ? (
                        <div className="flex items-center gap-2 text-[10px] font-bold text-[var(--accent-primary)] animate-in fade-in slide-in-from-right-1 duration-200">
                          {item.type === 'snippet' && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleExecuteItem(item, true);
                                }}
                                className="h-7 px-2 flex items-center gap-1.5 bg-ansi-yellow/10 hover:bg-ansi-yellow/20 text-ansi-yellow rounded border border-ansi-yellow/20 transition-colors"
                              >
                                <Play size={10} fill="currentColor" />
                                <span>Run</span>
                              </button>
                          )}
                          <div className="flex items-center gap-1.5 px-1">
                            <span className="opacity-50 font-mono text-[12px]">{modKey}</span>
                            <span>{item.type === 'workspace' ? 'Switch' : item.type === 'template' ? 'Launch' : item.type === 'snippet' ? 'Inject' : 'Execute'}</span>
                          </div>
                        </div>
                      ) : item.shortcut && (
                        <span className="text-[12px] font-mono text-[var(--text-secondary)] font-bold transition-colors">
                          {item.shortcut}
                        </span>
                      )}
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
              <Kbd className="bg-[var(--text-primary)]/5 border-[var(--border-color)] text-[var(--text-secondary)] font-bold">↑↓</Kbd>
              <span>Navigate</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Kbd className="bg-[var(--text-primary)]/5 border-[var(--border-color)] text-[var(--text-secondary)] font-bold">Enter</Kbd>
              <span>Select</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Kbd className="bg-[var(--text-primary)]/5 border-[var(--border-color)] text-[var(--text-secondary)] font-bold">Shift+Enter</Kbd>
              <span>Instant Run</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span>{filteredItems.length} Commands</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

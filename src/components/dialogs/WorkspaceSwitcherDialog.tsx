import { useState, useMemo, useEffect } from "react";
import { 
  Dialog, 
  DialogContent,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Workspace, SpaceTemplate, Snippet } from "@/types";
import { LayoutPreviewIcon } from "@/components/ui/layout-preview-icon";
import { Search, Folder, Terminal, Bot, Zap, Rocket, Settings, Keyboard, Maximize, Palette, ChevronRightSquare, Code, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { Kbd } from "@/components/ui/kbd";

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

  const actions: PaletteItem[] = [
    { type: 'action', id: 'toggle-zen', label: 'Toggle Zen Mode', icon: Maximize, action: onToggleZenMode, shortcut: `${modKey}+Shift+Z` },
    { type: 'action', id: 'open-settings', label: 'Open Preferences', icon: Settings, action: onOpenSettings, shortcut: `${modKey}+,` },
    { type: 'action', id: 'open-shortcuts', label: 'View Keyboard Shortcuts', icon: Keyboard, action: onOpenShortcuts, shortcut: `${modKey}+/` },
    { type: 'action', id: 'open-templates', label: 'Manage Cortex Library', icon: Rocket, action: onOpenTemplates, shortcut: `${modKey}+T` },
    // Theme Actions - Fully Synced with useTheme.ts
    { type: 'action', id: 'theme-cortex', label: 'Theme: Cortex Default', icon: Palette, action: () => onSetTheme('cortex') },
    { type: 'action', id: 'theme-ayu', label: 'Theme: Ayu Mirage', icon: Palette, action: () => onSetTheme('ayu') },
    { type: 'action', id: 'theme-catppuccin', label: 'Theme: Catppuccin Mocha', icon: Palette, action: () => onSetTheme('catppuccin') },
    { type: 'action', id: 'theme-iceberg', label: 'Theme: Iceberg Dark', icon: Palette, action: () => onSetTheme('iceberg') },
    { type: 'action', id: 'theme-nvim', label: 'Theme: Nvim Dark', icon: Palette, action: () => onSetTheme('nvim') },
    { type: 'action', id: 'theme-monochrome', label: 'Theme: Monochromatic Luxe', icon: Palette, action: () => onSetTheme('monochrome') },
    { type: 'action', id: 'theme-soft-monochrome', label: 'Theme: Soft Monochrome', icon: Palette, action: () => onSetTheme('soft-monochrome') },
  ];

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
  }, [workspaces, templates, snippets, searchQuery, modKey]);

  // Reset selected index when search changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  const handleExecuteItem = (item: PaletteItem, isShiftPressed: boolean = false) => {
    if (item.type === 'workspace') onSwitchWorkspace(item.data.id);
    else if (item.type === 'template') onLaunchTemplate(item.data);
    else if (item.type === 'snippet') onSnippetExecute(item.data, isShiftPressed);
    else if (item.type === 'action') item.action();
    onOpenChange(false);
  };

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
  }, [isOpen, filteredItems, selectedIndex]);

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
        className="fixed inset-0 m-auto bg-[#0c0c0e]/80 border-[var(--border-color)] shadow-2xl flex flex-col p-0 gap-0 overflow-hidden backdrop-blur-xl"
        style={{
          maxWidth: "640px",
          width: "calc(100% - 2rem)",
          height: "480px",
          maxHeight: "80vh",
          borderRadius: "12px",
        }}
      >
        <div className="relative border-b border-white/5 bg-white/[0.02] shrink-0">
          <Search 
            className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30"
          />
          <Input 
            autoFocus
            placeholder="Search workspaces, snippets, or actions..." 
            className="pl-11 pr-20 py-8 text-[16px] bg-transparent border-none focus-visible:ring-0 placeholder:text-white/20 font-medium"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
            <Kbd className="bg-white/5 border-white/10 text-white/40 px-1.5 py-0.5 text-[10px] font-mono">ESC</Kbd>
          </div>
        </div>

        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="p-2 space-y-0.5">
            {filteredItems.length === 0 ? (
              <div className="h-[300px] flex flex-col items-center justify-center text-center">
                <p className="text-[13px] text-white/30 font-medium">No results matching "{searchQuery}"</p>
              </div>
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
                      isSelected ? "bg-white/[0.07]" : "hover:bg-white/[0.03]"
                    )}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="relative shrink-0">
                        {item.type === 'workspace' && (
                          <div className="relative">
                            {item.data.config?.layout ? (
                                <LayoutPreviewIcon 
                                  layout={item.data.config.layout} 
                                  className={cn("w-12 h-9 border bg-black/40", isSelected ? "border-[var(--accent-primary)]/40" : "border-white/10")} 
                                />
                            ) : (
                                <div className="w-12 h-9 border border-white/5 bg-white/[0.03] rounded-md flex items-center justify-center">
                                  {item.data.mode === 'agents' ? <Bot size={18} className="opacity-20" /> : <Terminal size={18} className="opacity-20" />}
                                </div>
                            )}
                            {activeWorkspaceId === item.data.id && (
                                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[var(--accent-primary)] rounded-full border-2 border-[#0c0c0e]" />
                            )}
                          </div>
                        )}
                        {item.type === 'template' && (
                          <LayoutPreviewIcon 
                            layout={item.data.layout} 
                            className={cn("w-12 h-9 border bg-emerald-500/5", isSelected ? "border-emerald-500/40" : "border-emerald-500/10")} 
                          />
                        )}
                        {item.type === 'snippet' && (
                          <div className={cn(
                            "w-12 h-9 border rounded-md flex items-center justify-center transition-colors",
                            isSelected ? "border-amber-500/40 bg-amber-500/10" : "border-white/5 bg-white/[0.02]"
                          )}>
                            <Code size={16} className={isSelected ? "text-amber-500" : "text-white/20"} />
                          </div>
                        )}
                        {item.type === 'action' && (
                          <div className={cn(
                            "w-12 h-9 border rounded-md flex items-center justify-center",
                            isSelected ? "border-[var(--accent-primary)]/40 bg-[var(--accent-primary)]/10" : "border-white/5 bg-white/[0.02]"
                          )}>
                            <item.icon size={18} className={isSelected ? "text-[var(--accent-primary)]" : "text-white/20"} />
                          </div>
                        )}
                      </div>

                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "text-[14px] font-semibold truncate",
                            isSelected ? "text-white" : "text-white/70"
                          )}>
                            {item.type === 'workspace' ? (item.data.customName || item.data.name || "UNNAMED WORKSPACE") : 
                            item.type === 'template' ? item.data.name : 
                            item.type === 'snippet' ? item.data.label :
                            item.label}
                          </span>
                          <span className={cn(
                            "text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border transition-colors",
                            item.type === 'workspace' ? "bg-blue-500/5 text-blue-500/60 border-blue-500/10" :
                            item.type === 'template' ? "bg-emerald-500/5 text-emerald-500/60 border-emerald-500/10" :
                            item.type === 'snippet' ? "bg-amber-500/5 text-amber-500/60 border-amber-500/10" :
                            "bg-purple-500/5 text-purple-500/60 border-purple-500/10"
                          )}>
                            {item.type}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-white/30 truncate">
                          {item.type === 'workspace' && (
                            <><Folder className="w-3 h-3 shrink-0" /> <span className="truncate font-mono">{item.data.config?.rootPath || "No directory selected"}</span></>
                          )}
                          {item.type === 'template' && (
                            <><Rocket className="w-3 h-3 shrink-0" /> <span className="truncate font-mono">Launch New Instance</span></>
                          )}
                          {item.type === 'snippet' && (
                            <><ChevronRightSquare className="w-3 h-3 shrink-0" /> <span className="truncate font-mono opacity-50">{item.data.command}</span></>
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
                                className="h-7 px-2 flex items-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 rounded border border-amber-500/20 transition-colors"
                              >
                                <Play size={10} fill="currentColor" />
                                <span>RUN</span>
                              </button>
                          )}
                          <div className="flex items-center gap-1.5 px-1">
                            <span className="opacity-50 font-mono text-[12px]">⌘</span>
                            <span>{item.type === 'workspace' ? 'SWITCH' : item.type === 'template' ? 'LAUNCH' : item.type === 'snippet' ? 'INJECT' : 'EXECUTE'}</span>
                          </div>
                        </div>
                      ) : item.shortcut && (
                        <span className="text-[12px] font-mono text-white/10 group-hover:text-white/20 transition-colors">
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

        <div className="p-3 border-t border-white/5 bg-white/[0.01] flex items-center justify-between text-[10px] text-white/20 font-medium shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Kbd className="bg-white/5 border-white/10 text-white/30">↑↓</Kbd>
              <span>Navigate</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Kbd className="bg-white/5 border-white/10 text-white/30">ENTER</Kbd>
              <span>Select</span>
            </div>
            <div className="flex items-center gap-1.5 opacity-50">
              <Kbd className="bg-white/5 border-white/10 text-white/30">SHIFT+ENTER</Kbd>
              <span>Instant Run</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span>{filteredItems.length} COMMANDS AVAILABLE</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

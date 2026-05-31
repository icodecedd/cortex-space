import { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SpaceTemplate, Snippet } from "@/types";
import { SavedLayout, LayoutConfig, INITIAL_LAYOUTS } from "@/lib/setup-constants";
import { getSetting, setSetting } from "@/lib/store";
import { 
  Search, 
  Plus, 
  Trash2, 
  Code, 
  Rocket, 
  Zap, 
  Layers 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Sub-components
import { WorkspacesTab } from "./cortex-library/tabs/WorkspacesTab";
import { SnippetsTab } from "./cortex-library/tabs/SnippetsTab";
import { AssetsTab } from "./cortex-library/tabs/AssetsTab";

interface CortexLibraryDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  templates: SpaceTemplate[];
  snippets: Snippet[];
  onLaunchTemplate: (template: SpaceTemplate) => void;
  onDeleteTemplate: (id: string) => void;
  onCaptureCurrent: () => void;
  onAddSnippet: (label: string, command: string) => void;
  onDeleteSnippet: (id: string) => void;
  onDeleteSnippets?: (ids: string[]) => void;
  onExecuteSnippet: (snippet: Snippet, execute: boolean) => void;
}

import { DirectoryPreset } from "@/hooks/usePresets";

// Helper to normalize path for comparison
const normalizePath = (p: string) => {
  if (!p) return "";
  return p.replace(/[\\/]+$/, "").replace(/\//g, "\\").toLowerCase().trim();
};

export function CortexLibraryDialog({
  isOpen,
  onOpenChange,
  templates,
  snippets,
  onLaunchTemplate,
  onDeleteTemplate,
  onCaptureCurrent,
  onAddSnippet,
  onDeleteSnippet,
  onDeleteSnippets,
  onExecuteSnippet
}: CortexLibraryDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("workspaces");
  const [selectedSnippetIds, setSelectedSnippetIds] = useState<Set<string>>(new Set());
  const [isAddingSnippet, setIsAddSnippet] = useState(false);

  // Asset Management State (Directory Presets & Layouts)
  const [presets, setPresets] = useState<DirectoryPreset[]>([]);
  const [savedLayouts, setSavedLayouts] = useState<SavedLayout[]>([]);

  useEffect(() => {
    async function loadAssets() {
      const savedPresets = await getSetting<DirectoryPreset[]>("cortex_presets", []);
      // Migration: Ensure all have IDs
      const sanitized = savedPresets.map(p => ({
        ...p,
        id: p.id || crypto.randomUUID()
      }));
      const savedList = await getSetting<SavedLayout[]>("cortex_saved_layouts", INITIAL_LAYOUTS);
      setPresets(sanitized);
      setSavedLayouts(savedList);
    }
    if (isOpen) loadAssets();
  }, [isOpen]);

  // Persist asset changes back to store
  const handleRemovePreset = async (id: string) => {
    const preset = presets.find(p => p.id === id);
    const label = preset?.label || "Preset";
    
    const updated = presets.filter(p => p.id !== id);
    setPresets(updated);
    await setSetting("cortex_presets", updated);
    window.dispatchEvent(new Event('cortex:assets-updated'));
    
    toast.info("Preset Removed", {
      description: `Targeting "${label}" has been removed from your library.`
    });
  };

  const handleAddPreset = async (label: string, path: string) => {
    const normalizedTarget = normalizePath(path);
    const isDuplicate = presets.some(p => normalizePath(p.path) === normalizedTarget);

    if (isDuplicate) {
      toast.error("Duplicate Preset", {
        description: "This directory is already in your favorites."
      });
      return;
    }

    const newPreset: DirectoryPreset = { 
      id: crypto.randomUUID(),
      label, 
      path 
    };
    const updated = [...presets, newPreset];
    setPresets(updated);
    await setSetting("cortex_presets", updated);
    window.dispatchEvent(new Event('cortex:assets-updated'));
    toast.success("Preset Added", { 
      description: `Label: ${label}` 
    });
  };

  const handleRemoveLayout = async (id: string) => {
    const layout = savedLayouts.find(l => l.id === id);
    const name = layout?.name || "Layout";

    const updated = savedLayouts.filter(l => l.id !== id);
    setSavedLayouts(updated);
    await setSetting("cortex_saved_layouts", updated);
    window.dispatchEvent(new Event('cortex:assets-updated'));

    toast.info("Layout Removed", {
      description: `Configuration "${name}" has been deleted.`
    });
  };

  const handleAddLayout = async (name: string, config: LayoutConfig) => {
    const finalName = name.trim().toUpperCase();
    
    // Check for duplicates (name or exact grid config)
    const isDuplicate = savedLayouts.some(l => 
      (name.trim() && l.name.toUpperCase() === finalName) ||
      (l.rows === config.rows && l.cols === config.cols)
    );

    if (isDuplicate) {
      toast.error("Duplicate Layout", {
        description: "A layout with this name or configuration already exists."
      });
      return;
    }

    const newLayout: SavedLayout = {
      id: `layout-${Date.now()}`,
      name: finalName,
      rows: config.rows,
      cols: config.cols
    };
    const updated = [...savedLayouts, newLayout];
    setSavedLayouts(updated);
    await setSetting("cortex_saved_layouts", updated);
    window.dispatchEvent(new Event('cortex:assets-updated'));
    toast.success("Layout Saved", {
      description: `Created ${finalName} grid arrangement.`
    });
  };

  const handleRestoreDefaults = async () => {
    // Note: Presets restoration removed per user request (path specific to user machine)
    const existingIds = new Set(savedLayouts.map(l => l.id));
    const toAdd = INITIAL_LAYOUTS.filter(l => !existingIds.has(l.id));
    if (toAdd.length === 0) {
      toast.info("Layout library is already up to date.");
      return;
    }
    const updated = [...savedLayouts, ...toAdd];
    setSavedLayouts(updated);
    await setSetting("cortex_saved_layouts", updated);
    window.dispatchEvent(new Event('cortex:assets-updated'));
    toast.success(`Restored ${toAdd.length} grid layouts.`);
  };

  const toggleSnippetSelection = (id: string) => {
    const next = new Set(selectedSnippetIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedSnippetIds(next);
  };

  const toggleSelectAll = () => {
    const filtered = snippets.filter(s => 
      s.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.command.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (selectedSnippetIds.size === filtered.length) {
      setSelectedSnippetIds(new Set());
    } else {
      setSelectedSnippetIds(new Set(filtered.map(s => s.id)));
    }
  };

  const handleBulkDelete = () => {
    if (onDeleteSnippets && selectedSnippetIds.size > 0) {
      onDeleteSnippets(Array.from(selectedSnippetIds));
      setSelectedSnippetIds(new Set());
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent 
        showCloseButton={true}
        isDeep={true}
        open={isOpen}
        className="bg-[var(--surface-color)] border-[var(--border-color)] shadow-2xl flex flex-col p-0 gap-0 overflow-hidden"
        style={{
          maxWidth: "1100px",
          width: "calc(100% - 2rem)",
          height: "85vh",
          maxHeight: "900px",
        }}
      >
        <div className="flex h-full">
          {/* Modular Sidebar */}
          <div className="w-[220px] border-r border-white/5 bg-black/20 flex flex-col p-5 shrink-0">
             <div className="mb-10 px-1">
                <div className="flex items-center gap-2.5 mb-1.5">
                   <div className="w-6 h-6 bg-[var(--accent-primary)] rounded flex items-center justify-center shadow-[0_0_15px_rgba(var(--accent-primary-rgb),0.2)]">
                      <Zap size={14} className="text-black" fill="currentColor" />
                   </div>
                   <span className="font-bold text-[15px] tracking-tight">CORTEX LIB</span>
                </div>
                <span className="text-[9px] text-white/20 font-bold tracking-[0.2em] uppercase pl-1">Central Repository</span>
             </div>

             <nav className="flex-1 space-y-1.5">
                <LibraryNavButton 
                   isActive={activeTab === 'workspaces'} 
                   onClick={() => setActiveTab('workspaces')}
                   icon={<Rocket size={16} />}
                   label="Workspaces"
                />
                <LibraryNavButton 
                   isActive={activeTab === 'commands'} 
                   onClick={() => setActiveTab('commands')}
                   icon={<Code size={16} />}
                   label="Snippets"
                />
                <LibraryNavButton 
                   isActive={activeTab === 'assets'} 
                   onClick={() => setActiveTab('assets')}
                   icon={<Layers size={16} />}
                   label="Assets"
                />
             </nav>

             <div className="mt-auto">
                <div className="p-4 rounded-lg bg-[var(--accent-primary)]/5 border border-[var(--accent-primary)]/10 space-y-2.5">
                   <p className="text-[10px] font-bold text-[var(--accent-primary)] uppercase tracking-widest">Storage Status</p>
                   <p className="text-[10px] text-white/30 leading-relaxed font-medium">All assets are persisted to your local machine encrypted database.</p>
                </div>
             </div>
          </div>

          {/* Main Dynamic View Area */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
            <header className="p-6 pr-14 border-b border-white/5 flex items-center justify-between shrink-0 bg-black/5">
               <div className="flex items-center gap-4 flex-1 max-w-xl">
                  {activeTab === 'commands' && snippets.length > 0 && (
                    <button 
                      onClick={toggleSelectAll}
                      className={cn(
                        "w-5 h-5 rounded border transition-all flex items-center justify-center shrink-0",
                        selectedSnippetIds.size > 0 ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]/10" : "border-white/10 hover:border-white/20"
                      )}
                    >
                      {selectedSnippetIds.size > 0 && (
                        <div className={cn(
                          "w-2 h-0.5 bg-[var(--accent-primary)] rounded-full",
                          selectedSnippetIds.size === snippets.length && "w-2.5 h-2.5 rounded-sm"
                        )} />
                      )}
                    </button>
                  )}
                  <div className="relative flex-1">
                    <Search 
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" 
                    />
                    <Input 
                      placeholder={`Filter ${activeTab === 'workspaces' ? 'templates' : activeTab === 'commands' ? 'snippets' : 'presets & layouts'}...`}
                      className="pl-9 text-[13px] h-[38px] bg-white/[0.03] border-white/5 focus-visible:ring-1 focus-visible:ring-[var(--accent-primary)]/40 transition-all"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
               </div>

               <div className="flex items-center gap-3">
                  {activeTab === 'workspaces' && (
                    <Button 
                      onClick={onCaptureCurrent}
                      className="h-[38px] px-5 text-[12px] font-bold bg-[var(--accent-primary)] text-black hover:opacity-90 rounded-md transition-all flex gap-2"
                    >
                      <Plus size={16} strokeWidth={3} /> CAPTURE CURRENT
                    </Button>
                  )}
                  {activeTab === 'commands' && (
                    <Button 
                      onClick={() => setIsAddSnippet(true)}
                      className="h-[38px] px-5 text-[12px] font-bold bg-amber-500 text-black hover:opacity-90 rounded-md transition-all flex gap-2"
                    >
                      <Plus size={16} strokeWidth={3} /> NEW SNIPPET
                    </Button>
                  )}
               </div>
            </header>

            <ScrollArea className="flex-1 px-8 py-8 min-h-0">
              <div className="max-w-5xl mx-auto">
                {activeTab === 'workspaces' && (
                  <WorkspacesTab 
                    templates={templates} 
                    searchQuery={searchQuery}
                    onLaunch={onLaunchTemplate}
                    onDelete={onDeleteTemplate}
                    onCapture={onCaptureCurrent}
                  />
                )}
                {activeTab === 'commands' && (
                  <SnippetsTab 
                    snippets={snippets}
                    searchQuery={searchQuery}
                    selectedIds={selectedSnippetIds}
                    onToggleSelection={toggleSnippetSelection}
                    onAdd={onAddSnippet}
                    onDelete={onDeleteSnippet}
                    onExecute={onExecuteSnippet}
                    isAdding={isAddingSnippet}
                    setIsAdding={setIsAddSnippet}
                  />
                )}
                {activeTab === 'assets' && (
                  <AssetsTab 
                    presets={presets}
                    savedLayouts={savedLayouts}
                    searchQuery={searchQuery}
                    onRemovePreset={handleRemovePreset}
                    onRemoveLayout={handleRemoveLayout}
                    onAddPreset={handleAddPreset}
                    onAddLayout={handleAddLayout}
                    onRestoreDefaults={handleRestoreDefaults}
                  />
                )}
              </div>
            </ScrollArea>

            {/* Bulk Action Bar */}
            {activeTab === 'commands' && selectedSnippetIds.size > 0 && (
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-[600px] bg-[#121214] border border-white/10 rounded-full py-2 px-8 flex items-center justify-between shadow-[0_30px_60px_rgba(0,0,0,0.8)] animate-in fade-in slide-in-from-bottom-6 duration-500 z-50">
                <div className="flex items-center gap-4">
                  <div className="w-2 h-2 rounded-full bg-[var(--accent-primary)] animate-pulse shadow-[0_0_10px_var(--accent-primary)]" />
                  <span className="text-[11px] font-bold tracking-tight text-white/80">
                    <span className="text-[var(--accent-primary)]">{selectedSnippetIds.size}</span> Snippets Selected
                  </span>
                </div>
                
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setSelectedSnippetIds(new Set())}
                    className="text-[10px] font-bold text-white/30 hover:text-white/60 transition-all uppercase tracking-widest"
                  >
                    Cancel
                  </button>
                  <div className="w-px h-4 bg-white/10" />
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={handleBulkDelete}
                    className="h-8 px-6 text-[10px] font-bold rounded-full transition-all"
                  >
                    <Trash2 size={12} className="mr-2" />
                    Delete Permanent
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function LibraryNavButton({ isActive, onClick, icon, label }: { isActive: boolean; onClick: () => void; icon: any; label: string }) {
  return (
    <button 
       onClick={onClick}
       className={cn(
         "w-full flex items-center gap-3.5 px-4 py-2.5 rounded-lg text-[13px] font-bold transition-all duration-300",
         isActive 
           ? "bg-white/10 text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] border border-white/5" 
           : "text-white/30 hover:text-white/60 hover:bg-white/[0.03]"
       )}
    >
       <span className={cn("transition-transform duration-300", isActive ? "scale-110 text-[var(--accent-primary)]" : "opacity-50")}>
         {icon}
       </span>
       {label}
    </button>
  );
}

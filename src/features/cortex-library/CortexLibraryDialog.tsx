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
  Code, 
  Rocket, 
  Zap, 
  Layers,
  X,
  Database,
  Archive,
  RotateCcw,
  Trash2
} from "@/components/ui/icons";
import { ViewToggle, ViewMode } from "@/components/ui/view-toggle";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

import { WorkspacesTab } from "./components/WorkspacesTab";
import { SnippetsTab } from "./components/SnippetsTab";
import { PresetsTab } from "./components/PresetsTab";
import { LayoutsTab } from "./components/LayoutsTab";

interface CortexLibraryDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  templates: SpaceTemplate[];
  snippets: Snippet[];
  onLaunchTemplate: (template: SpaceTemplate) => void;
  onDeleteTemplate: (id: string) => void;
  onDeleteTemplates?: (ids: string[]) => void;
  onCaptureCurrent: () => void;
  onAddSnippet: (label: string, command: string) => void;
  onDeleteSnippet: (id: string) => void;
  onDeleteSnippets?: (ids: string[]) => void;
  onExecuteSnippet: (snippet: Snippet, execute: boolean) => void;
  onArchiveSnippet?: (id: string) => void;
  onArchiveSnippets?: (ids: string[]) => void;
  onUnarchiveSnippet?: (id: string) => void;
  onUnarchiveSnippets?: (ids: string[]) => void;
  onArchiveTemplate?: (id: string) => void;
  onArchiveTemplates?: (ids: string[]) => void;
  onUnarchiveTemplate?: (id: string) => void;
  onUnarchiveTemplates?: (ids: string[]) => void;
}

import { DirectoryPreset } from "@/types";

export function CortexLibraryDialog({
  isOpen,
  onOpenChange,
  templates,
  snippets,
  onLaunchTemplate,
  onDeleteTemplate,
  onDeleteTemplates,
  onCaptureCurrent,
  onAddSnippet,
  onDeleteSnippet,
  onDeleteSnippets,
  onExecuteSnippet,
  onArchiveSnippet,
  onArchiveSnippets,
  onUnarchiveSnippet,
  onUnarchiveSnippets,
  onArchiveTemplate,
  onArchiveTemplates,
  onUnarchiveTemplate,
  onUnarchiveTemplates
}: CortexLibraryDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("workspaces");
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [selectedSnippetIds, setSelectedSnippetIds] = useState<Set<string>>(new Set());
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<Set<string>>(new Set());
  const [selectedPresetIds, setSelectedPresetIds] = useState<Set<string>>(new Set());
  const [selectedLayoutIds, setSelectedLayoutIds] = useState<Set<string>>(new Set());
  const [archivedSelectedSnippetIds, setArchivedSelectedSnippetIds] = useState<Set<string>>(new Set());
  const [archivedSelectedTemplateIds, setArchivedSelectedTemplateIds] = useState<Set<string>>(new Set());
  const [archivedSelectedPresetIds, setArchivedSelectedPresetIds] = useState<Set<string>>(new Set());
  const [archivedSelectedLayoutIds, setArchivedSelectedLayoutIds] = useState<Set<string>>(new Set());
  const [isAddingSnippet, setIsAddSnippet] = useState(false);
  const [isAddingPreset, setIsAddingPreset] = useState(false);
  const [isAddingLayout, setIsAddingLayout] = useState(false);

  // Reset adding states when tab changes to prevent forms staying open in background
  useEffect(() => {
    setIsAddSnippet(false);
    setIsAddingPreset(false);
    setIsAddingLayout(false);
  }, [activeTab]);

  // Persisted sub-tab selection (active vs archived) across sidebar navigation
  const [workspaceSubTab, setWorkspaceSubTab] = useState("active");
  const [snippetSubTab, setSnippetSubTab] = useState("active");
  const [presetSubTab, setPresetSubTab] = useState("active");
  const [layoutSubTab, setLayoutSubTab] = useState("active");

  // Asset Management State (Directory Presets & Layouts)
  const [presets, setPresets] = useState<DirectoryPreset[]>([]);
  const [savedLayouts, setSavedLayouts] = useState<SavedLayout[]>([]);
  const [layoutCustomMode, setLayoutCustomMode] = useState<"grid" | "count">("grid");
  const [activeSettingsMode, setActiveSettingsMode] = useState<"grid" | "count">("grid");

  // Sync layout mode with global settings
  useEffect(() => {
    async function loadSettingsMode() {
      const mode = await getSetting<"grid" | "count">("focus.customLayoutMode", "grid");
      setActiveSettingsMode(mode);
      if (isOpen) {
        setLayoutCustomMode(mode);
      }
    }
    loadSettingsMode();

    const handleSync = () => loadSettingsMode();
    window.addEventListener("cortex-settings-changed", handleSync);
    return () => {
      window.removeEventListener("cortex-settings-changed", handleSync);
    };
  }, [isOpen]);

  // Clear layout selections when local customization mode changes
  useEffect(() => {
    setSelectedLayoutIds(new Set());
    setArchivedSelectedLayoutIds(new Set());
  }, [layoutCustomMode]);

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
  const handleArchivePreset = async (id: string) => {
    const preset = presets.find(p => p.id === id);
    const name = preset?.label || "Preset";
    const updated = presets.map(p => p.id === id ? { ...p, isArchived: true } : p);
    setPresets(updated);
    await setSetting("cortex_presets", updated);
    window.dispatchEvent(new Event('cortex:assets-updated'));
    toast.info(`${name} archived`, { description: "The preset has been archived and can be restored later." });
  };

  const handleUnarchivePreset = async (id: string) => {
    const preset = presets.find(p => p.id === id);
    const name = preset?.label || "Preset";
    const updated = presets.map(p => p.id === id ? { ...p, isArchived: false } : p);
    setPresets(updated);
    await setSetting("cortex_presets", updated);
    window.dispatchEvent(new Event('cortex:assets-updated'));
    toast.success(`${name} restored`, { description: "The preset has been restored to your library." });
  };

  const handleArchiveLayout = async (id: string) => {
    const layout = savedLayouts.find(l => l.id === id);
    const name = layout?.name || "Layout";
    const updated = savedLayouts.map(l => l.id === id ? { ...l, isArchived: true } : l);
    setSavedLayouts(updated);
    await setSetting("cortex_saved_layouts", updated);
    window.dispatchEvent(new Event('cortex:assets-updated'));
    toast.info(`${name} archived`, { description: "The layout has been archived and can be restored later." });
  };

  const handleUnarchiveLayout = async (id: string) => {
    const layout = savedLayouts.find(l => l.id === id);
    const name = layout?.name || "Layout";
    const updated = savedLayouts.map(l => l.id === id ? { ...l, isArchived: false } : l);
    setSavedLayouts(updated);
    await setSetting("cortex_saved_layouts", updated);
    window.dispatchEvent(new Event('cortex:assets-updated'));
    toast.success(`${name} restored`, { description: "The layout has been restored to your library." });
  };

  const handleDeletePreset = async (id: string) => {
    const preset = presets.find(p => p.id === id);
    const name = preset?.label || "Preset";
    const updated = presets.filter(p => p.id !== id);
    setPresets(updated);
    await setSetting("cortex_presets", updated);
    window.dispatchEvent(new Event('cortex:assets-updated'));
    toast.success(`${name} permanently deleted`, { description: "The preset has been permanently removed." });
  };

  const handleDeleteLayout = async (id: string) => {
    const layout = savedLayouts.find(l => l.id === id);
    const name = layout?.name || "Layout";
    const updated = savedLayouts.filter(l => l.id !== id);
    setSavedLayouts(updated);
    await setSetting("cortex_saved_layouts", updated);
    window.dispatchEvent(new Event('cortex:assets-updated'));
    toast.success(`${name} permanently deleted`, { description: "The layout has been permanently removed." });
  };

  const handleBulkUnarchivePresets = async (ids: string[]) => {
    const updated = presets.map(p => ids.includes(p.id) ? { ...p, isArchived: false } : p);
    setPresets(updated);
    await setSetting("cortex_presets", updated);
    window.dispatchEvent(new Event('cortex:assets-updated'));
    toast.success(`${ids.length} presets restored`, { description: `Successfully restored ${ids.length} items to your library.` });
  };

  const handleBulkDeletePresets = async (ids: string[]) => {
    const updated = presets.filter(p => !ids.includes(p.id));
    setPresets(updated);
    await setSetting("cortex_presets", updated);
    window.dispatchEvent(new Event('cortex:assets-updated'));
    toast.success(`${ids.length} presets permanently deleted`, { description: `Successfully removed ${ids.length} items from your library.` });
  };

  const handleBulkUnarchiveLayouts = async (ids: string[]) => {
    const updated = savedLayouts.map(l => ids.includes(l.id) ? { ...l, isArchived: false } : l);
    setSavedLayouts(updated);
    await setSetting("cortex_saved_layouts", updated);
    window.dispatchEvent(new Event('cortex:assets-updated'));
    toast.success(`${ids.length} layouts restored`, { description: `Successfully restored ${ids.length} items to your library.` });
  };

  const handleBulkDeleteLayouts = async (ids: string[]) => {
    const updated = savedLayouts.filter(l => !ids.includes(l.id));
    setSavedLayouts(updated);
    await setSetting("cortex_saved_layouts", updated);
    window.dispatchEvent(new Event('cortex:assets-updated'));
    toast.success(`${ids.length} layouts permanently deleted`, { description: `Successfully removed ${ids.length} items from your library.` });
  };

  const handleAddPreset = async (label: string, path: string) => {
    if (presets.some(p => p.path === path)) {
      toast.error("Preset cannot be added", {
        description: "An identical configuration already exists in your library."
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
    toast.success(`${label} saved successfully`, { 
      description: "The preset has been added to your library."
    });
  };

  const handleAddLayout = async (name: string, config: LayoutConfig) => {
    const finalName = name.trim();
    
    const isDuplicate = savedLayouts.some(l => {
      if (l.config.type === 'grid' && config.type === 'grid') {
        return l.config.rows === config.rows && l.config.cols === config.cols;
      }
      if (l.config.type === 'count' && config.type === 'count') {
        return l.config.value === config.value;
      }
      return false;
    });

    if (isDuplicate) {
      toast.error("Layout cannot be added", {
        description: "An identical configuration already exists in your library."
      });
      return;
    }

    const newLayout: SavedLayout = {
      id: `layout-${Date.now()}`,
      name: finalName,
      config
    };
    const updated = [...savedLayouts, newLayout];
    setSavedLayouts(updated);
    await setSetting("cortex_saved_layouts", updated);
    window.dispatchEvent(new Event('cortex:assets-updated'));
    toast.success(`${finalName} saved successfully`, {
      description: "The layout has been added to your library."
    });
  };

  const handleRestoreDefaults = async () => {
    const existingIds = new Set(savedLayouts.map(l => l.id));
    const toAdd = INITIAL_LAYOUTS.filter(l => !existingIds.has(l.id));
    if (toAdd.length === 0) {
      toast.success("Library updated successfully", {
        description: "Your library already contains all default configurations."
      });
      return;
    }
    const updated = [...savedLayouts, ...toAdd];
    setSavedLayouts(updated);
    await setSetting("cortex_saved_layouts", updated);
    window.dispatchEvent(new Event('cortex:assets-updated'));
    toast.success("Library updated successfully", {
      description: `Restored ${toAdd.length} default grid layouts.`
    });
  };

  // Selection helpers
  const toggleSnippetSelection = (id: string) => {
    const next = new Set(selectedSnippetIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedSnippetIds(next);
  };

  const toggleTemplateSelection = (id: string) => {
    const next = new Set(selectedTemplateIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedTemplateIds(next);
  };

  const togglePresetSelection = (id: string) => {
    const next = new Set(selectedPresetIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedPresetIds(next);
  };

  const toggleLayoutSelection = (id: string) => {
    const next = new Set(selectedLayoutIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedLayoutIds(next);
  };

  // Note: Archived tabs handle their own selection state locally since they have
  // dedicated global select buttons inside their card/table views.
  const toggleSelectAll = () => {
    if (activeTab === 'commands') {
      const items = snippets.filter(s => 
        (snippetSubTab === 'active' ? !s.isArchived : s.isArchived) &&
        (s.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.command.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      const selectedIds = snippetSubTab === 'active' ? selectedSnippetIds : archivedSelectedSnippetIds;
      const setSelectedIds = snippetSubTab === 'active' ? setSelectedSnippetIds : setArchivedSelectedSnippetIds;

      if (selectedIds.size === items.length) {
        setSelectedIds(new Set());
      } else {
        setSelectedIds(new Set(items.map(s => s.id)));
      }
    } else if (activeTab === 'workspaces') {
      const items = templates.filter(t => 
        (workspaceSubTab === 'active' ? !t.isArchived : t.isArchived) &&
        (t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.rootPath.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      const selectedIds = workspaceSubTab === 'active' ? selectedTemplateIds : archivedSelectedTemplateIds;
      const setSelectedIds = workspaceSubTab === 'active' ? setSelectedTemplateIds : setArchivedSelectedTemplateIds;

      if (selectedIds.size === items.length) {
        setSelectedIds(new Set());
      } else {
        setSelectedIds(new Set(items.map(t => t.id)));
      }
    } else if (activeTab === 'presets') {
      const items = presets.filter(p => 
        (presetSubTab === 'active' ? !p.isArchived : p.isArchived) &&
        (p.label.toLowerCase().includes(searchQuery.toLowerCase()) || p.path.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      const selectedIds = presetSubTab === 'active' ? selectedPresetIds : archivedSelectedPresetIds;
      const setSelectedIds = presetSubTab === 'active' ? setSelectedPresetIds : setArchivedSelectedPresetIds;

      if (selectedIds.size === items.length) {
        setSelectedIds(new Set());
      } else {
        setSelectedIds(new Set(items.map(p => p.id)));
      }
    } else if (activeTab === 'layouts') {
      const items = savedLayouts.filter(l => 
        (layoutSubTab === 'active' ? !l.isArchived : l.isArchived) &&
        l.config.type === layoutCustomMode &&
        (l.name.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      const selectedIds = layoutSubTab === 'active' ? selectedLayoutIds : archivedSelectedLayoutIds;
      const setSelectedIds = layoutSubTab === 'active' ? setSelectedLayoutIds : setArchivedSelectedLayoutIds;

      if (selectedIds.size === items.length) {
        setSelectedIds(new Set());
      } else {
        setSelectedIds(new Set(items.map(l => l.id)));
      }
    }
  };

  const handleBulkArchive = () => {
    if (activeTab === 'commands') {
      if (onArchiveSnippets && selectedSnippetIds.size > 0) {
        onArchiveSnippets(Array.from(selectedSnippetIds));
        setSelectedSnippetIds(new Set());
      } else if (onArchiveSnippet && selectedSnippetIds.size > 0) {
        selectedSnippetIds.forEach(id => onArchiveSnippet(id));
        setSelectedSnippetIds(new Set());
      }
    } else if (activeTab === 'workspaces') {
      if (onArchiveTemplates && selectedTemplateIds.size > 0) {
        onArchiveTemplates(Array.from(selectedTemplateIds));
        setSelectedTemplateIds(new Set());
      } else if (onArchiveTemplate && selectedTemplateIds.size > 0) {
        selectedTemplateIds.forEach(id => onArchiveTemplate(id));
        setSelectedTemplateIds(new Set());
      }
    } else if (activeTab === 'presets') {
      if (selectedPresetIds.size > 0) {
        const updated = presets.map(p => selectedPresetIds.has(p.id) ? { ...p, isArchived: true } : p);
        setPresets(updated);
        setSetting("cortex_presets", updated);
        window.dispatchEvent(new Event('cortex:assets-updated'));
        toast.info(`${selectedPresetIds.size} presets archived`, { description: "The items have been archived and can be restored later." });
        setSelectedPresetIds(new Set());
      }
    } else if (activeTab === 'layouts') {
      if (selectedLayoutIds.size > 0) {
        const updated = savedLayouts.map(l => selectedLayoutIds.has(l.id) ? { ...l, isArchived: true } : l);
        setSavedLayouts(updated);
        setSetting("cortex_saved_layouts", updated);
        window.dispatchEvent(new Event('cortex:assets-updated'));
        toast.info(`${selectedLayoutIds.size} layouts archived`, { description: "The items have been archived and can be restored later." });
        setSelectedLayoutIds(new Set());
      }
    }
  };

  const handleGlobalClearSelection = () => {
    setSelectedSnippetIds(new Set());
    setSelectedTemplateIds(new Set());
    setSelectedPresetIds(new Set());
    setSelectedLayoutIds(new Set());
    setArchivedSelectedSnippetIds(new Set());
    setArchivedSelectedTemplateIds(new Set());
    setArchivedSelectedPresetIds(new Set());
    setArchivedSelectedLayoutIds(new Set());
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
          <div className="w-[220px] border-r border-[var(--border-color)] bg-[var(--bg-color)]/20 flex flex-col p-5 shrink-0">
             <div className="mb-10 px-1">
                <div className="flex items-center gap-2.5 mb-1.5">
                   <div className="w-6 h-6 bg-[var(--accent-primary)] rounded flex items-center justify-center shadow-[0_0_15px_rgba(var(--accent-primary-rgb),0.2)]">
                      <Zap size={14} className="text-[var(--accent-contrast)]" fill="currentColor" />
                   </div>
                   <span className="font-bold text-[15px] tracking-tight text-[var(--text-primary)]">Cortex Lib</span>
                </div>
                <span className="text-[9px] text-[var(--text-secondary)] font-bold pl-1">Central Repository</span>
             </div>

             <nav className="flex-1 space-y-1.5">
                <LibraryNavButton 
                   isActive={activeTab === 'workspaces'} 
                   onClick={() => { setActiveTab('workspaces'); handleGlobalClearSelection(); }}
                   icon={<Rocket size={16} />}
                   label="Workspaces"
                   count={templates.filter(t => !t.isArchived).length}
                />
                <LibraryNavButton 
                   isActive={activeTab === 'commands'} 
                   onClick={() => { setActiveTab('commands'); handleGlobalClearSelection(); }}
                   icon={<Code size={16} />}
                   label="Snippets"
                   count={snippets.filter(s => !s.isArchived).length}
                />
                <LibraryNavButton 
                   isActive={activeTab === 'presets'} 
                   onClick={() => { setActiveTab('presets'); handleGlobalClearSelection(); }}
                   icon={<Database size={16} />}
                   label="Presets"
                   count={presets.filter(p => !p.isArchived).length}
                />
                <LibraryNavButton 
                   isActive={activeTab === 'layouts'} 
                   onClick={() => { setActiveTab('layouts'); handleGlobalClearSelection(); }}
                   icon={<Layers size={16} />}
                   label="Layouts"
                   count={savedLayouts.filter(l => !l.isArchived).length}
                />
             </nav>
             </div>
          {/* Main Dynamic View Area */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
            {/* Unified Top Header */}
            <div className="px-8 py-5 border-b border-[var(--border-color)] flex items-center justify-between shrink-0 bg-[var(--bg-color)]/5">
               <div className="space-y-0.5">
                  <h3 className="text-[13px] font-bold text-[var(--text-primary)] tracking-tight">
                     {activeTab === 'workspaces' && "Workspace Templates"}
                     {activeTab === 'commands' && "Terminal Snippets"}
                     {activeTab === 'presets' && "Directory Presets"}
                     {activeTab === 'layouts' && "Layout Configurations"}
                  </h3>
                  <p className="text-[10px] text-[var(--text-secondary)]/75 font-medium">
                     {activeTab === 'workspaces' && "Capture, launch, and restore workspace environments."}
                     {activeTab === 'commands' && "Store, run, and inject frequently used command snippets."}
                     {activeTab === 'presets' && "Favorite frequently accessed directory paths."}
                     {activeTab === 'layouts' && "Define and customize terminal splits and sizes."}
                  </p>
               </div>

               {activeTab === 'layouts' && (
                  <div className="flex rounded-lg overflow-hidden border border-[var(--border-color)] bg-[var(--text-primary)]/[0.03] p-0.5 shrink-0">
                     <button
                        onClick={() => setLayoutCustomMode("grid")}
                        className={cn(
                           "text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-md transition-all flex items-center gap-2",
                           layoutCustomMode === "grid"
                              ? "bg-[var(--accent-primary)] text-[var(--accent-contrast)] shadow-sm"
                              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--text-primary)]/[0.02]"
                        )}
                     >
                        Grid Mode
                        {activeSettingsMode === "grid" && (
                           <span className="relative flex h-1.5 w-1.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                           </span>
                        )}
                     </button>
                     <button
                        onClick={() => setLayoutCustomMode("count")}
                        className={cn(
                           "text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-md transition-all flex items-center gap-2",
                           layoutCustomMode === "count"
                              ? "bg-[var(--accent-primary)] text-[var(--accent-contrast)] shadow-sm"
                              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--text-primary)]/[0.02]"
                        )}
                     >
                        Flex Mode
                        {activeSettingsMode === "count" && (
                           <span className="relative flex h-1.5 w-1.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                           </span>
                        )}
                     </button>
                  </div>
               )}
            </div>

            <header className="px-8 py-4 border-b border-[var(--border-color)] flex items-center justify-between shrink-0 bg-[var(--bg-color)]/5">
               <div className="flex items-center gap-4 flex-1 max-w-xl">
                  {/* View Toggle */}
                  <ViewToggle value={viewMode} onChange={setViewMode} className="mr-2 shrink-0" />

                  {/* Select All (global position) */}
                  {(() => {
                    let items: any[] = [];
                    let selectedIds: Set<string> = new Set();

                    if (activeTab === 'commands') {
                      items = snippets.filter(s => 
                        (snippetSubTab === 'active' ? !s.isArchived : s.isArchived) &&
                        (s.label.toLowerCase().includes(searchQuery.toLowerCase()) || s.command.toLowerCase().includes(searchQuery.toLowerCase()))
                      );
                      selectedIds = snippetSubTab === 'active' ? selectedSnippetIds : archivedSelectedSnippetIds;
                    } else if (activeTab === 'workspaces') {
                      items = templates.filter(t => 
                        (workspaceSubTab === 'active' ? !t.isArchived : t.isArchived) &&
                        (t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.description?.toLowerCase().includes(searchQuery.toLowerCase()) || t.rootPath.toLowerCase().includes(searchQuery.toLowerCase()))
                      );
                      selectedIds = workspaceSubTab === 'active' ? selectedTemplateIds : archivedSelectedTemplateIds;
                    } else if (activeTab === 'presets') {
                      items = presets.filter(p => 
                        (presetSubTab === 'active' ? !p.isArchived : p.isArchived) &&
                        (p.label.toLowerCase().includes(searchQuery.toLowerCase()) || p.path.toLowerCase().includes(searchQuery.toLowerCase()))
                      );
                      selectedIds = presetSubTab === 'active' ? selectedPresetIds : archivedSelectedPresetIds;
                    } else if (activeTab === 'layouts') {
                      items = savedLayouts.filter(l => 
                        (layoutSubTab === 'active' ? !l.isArchived : l.isArchived) &&
                        l.config.type === layoutCustomMode &&
                        (l.name.toLowerCase().includes(searchQuery.toLowerCase()))
                      );
                      selectedIds = layoutSubTab === 'active' ? selectedLayoutIds : archivedSelectedLayoutIds;
                    }
                    
                    return items.length > 0 ? (
                      <button 
                        onClick={toggleSelectAll}
                        className={cn(
                          "w-5 h-5 rounded border transition-all flex items-center justify-center shrink-0",
                          selectedIds.size > 0 ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]/10" : "border-[var(--border-color)] hover:border-[var(--accent-primary)]/50"
                        )}
                      >
                        {selectedIds.size === items.length && selectedIds.size > 0 && (
                          <div className="w-2.5 h-2.5 rounded-full bg-[var(--accent-primary)]" />
                        )}
                        {selectedIds.size > 0 && selectedIds.size < items.length && (
                          <div className="w-2 h-0.5 bg-[var(--accent-primary)] rounded-full" />
                        )}
                      </button>
                    ) : null;
                  })()}
                  
                  <div className="relative flex-1">
                    <Search 
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]/60" 
                    />
                    <Input 
                      placeholder={`Filter ${activeTab === 'workspaces' ? 'templates' : activeTab === 'commands' ? 'snippets' : 'presets & layouts'}...`}
                      className="pl-9 pr-10 text-[13px] h-[38px] bg-[var(--text-primary)]/[0.03] border-[var(--border-color)] focus-visible:ring-1 focus-visible:ring-[var(--accent-primary)]/40 transition-all text-[var(--text-primary)]"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--text-primary)]/5 rounded-full transition-all"
                      >
                        <X size={12} strokeWidth={3} />
                      </button>
                    )}
                  </div>
               </div>

               {/* Primary actions relocated to individual tabs beside their respective sub-navigation triggers */}
            </header>

            <ScrollArea className="flex-1 px-8 py-8 min-h-0">
              <div className="max-w-5xl mx-auto">
                {activeTab === 'workspaces' && (
                  <WorkspacesTab 
                    templates={templates}
                    searchQuery={searchQuery}
                    viewMode={viewMode}
                    selectedIds={selectedTemplateIds}
                    onToggleSelection={toggleTemplateSelection}
                    archivedSelectedIds={archivedSelectedTemplateIds}
                    setArchivedSelectedIds={setArchivedSelectedTemplateIds}
                    onLaunch={onLaunchTemplate}
                    onDelete={onDeleteTemplate}
                    onArchive={onArchiveTemplate}
                    onRestore={onUnarchiveTemplate}
                    onCapture={onCaptureCurrent}
                    activeSubTab={workspaceSubTab}
                    onSubTabChange={setWorkspaceSubTab}
                  />
                )}
                {activeTab === 'commands' && (
                  <SnippetsTab 
                    snippets={snippets}
                    searchQuery={searchQuery}
                    viewMode={viewMode}
                    selectedIds={selectedSnippetIds}
                    onToggleSelection={toggleSnippetSelection}
                    archivedSelectedIds={archivedSelectedSnippetIds}
                    setArchivedSelectedIds={setArchivedSelectedSnippetIds}
                    onAdd={onAddSnippet}
                    onDelete={onDeleteSnippet}
                    onArchive={onArchiveSnippet}
                    onUnarchive={onUnarchiveSnippet}
                    onExecute={onExecuteSnippet}
                    isAdding={isAddingSnippet}
                    setIsAdding={setIsAddSnippet}
                    activeSubTab={snippetSubTab}
                    onSubTabChange={setSnippetSubTab}
                  />
                )}
                {activeTab === 'presets' && (
                  <PresetsTab 
                    presets={presets}
                    searchQuery={searchQuery}
                    viewMode={viewMode}
                    selectedIds={selectedPresetIds}
                    onToggleSelection={togglePresetSelection}
                    archivedSelectedIds={archivedSelectedPresetIds}
                    setArchivedSelectedIds={setArchivedSelectedPresetIds}
                    onArchive={handleArchivePreset}
                    onUnarchive={handleUnarchivePreset}
                    onDelete={handleDeletePreset}
                    onAdd={handleAddPreset}
                    isAdding={isAddingPreset}
                    setIsAdding={setIsAddingPreset}
                    activeSubTab={presetSubTab}
                    onSubTabChange={setPresetSubTab}
                  />
                )}
                {activeTab === 'layouts' && (
                  <LayoutsTab 
                    savedLayouts={savedLayouts}
                    searchQuery={searchQuery}
                    viewMode={viewMode}
                    selectedIds={selectedLayoutIds}
                    onToggleSelection={toggleLayoutSelection}
                    archivedSelectedIds={archivedSelectedLayoutIds}
                    setArchivedSelectedIds={setArchivedSelectedLayoutIds}
                    onArchive={handleArchiveLayout}
                    onUnarchive={handleUnarchiveLayout}
                    onDelete={handleDeleteLayout}
                    onAdd={handleAddLayout}
                    onRestoreDefaults={handleRestoreDefaults}
                    isAdding={isAddingLayout}
                    setIsAdding={setIsAddingLayout}
                    activeSubTab={layoutSubTab}
                    onSubTabChange={setLayoutSubTab}
                    layoutCustomMode={layoutCustomMode}
                  />
                )}
              </div>
            </ScrollArea>

            {/* Bulk Action Bar */}
            {((activeTab === 'commands' && (selectedSnippetIds.size > 0 || archivedSelectedSnippetIds.size > 0)) || 
              (activeTab === 'workspaces' && (selectedTemplateIds.size > 0 || archivedSelectedTemplateIds.size > 0)) ||
              (activeTab === 'presets' && (selectedPresetIds.size > 0 || archivedSelectedPresetIds.size > 0)) ||
              (activeTab === 'layouts' && (selectedLayoutIds.size > 0 || archivedSelectedLayoutIds.size > 0))
             ) && (() => {
               // Determine which state is currently active to display appropriate actions
               let selectedCount = 0;
               let entityName = "Items";
               let isArchivedContext = false;

               if (activeTab === 'commands') {
                 if (snippetSubTab === 'active' && selectedSnippetIds.size > 0) {
                   selectedCount = selectedSnippetIds.size;
                   entityName = "Snippets";
                 } else if (snippetSubTab === 'archived' && archivedSelectedSnippetIds.size > 0) {
                   selectedCount = archivedSelectedSnippetIds.size;
                   entityName = "Snippets";
                   isArchivedContext = true;
                 }
               } else if (activeTab === 'workspaces') {
                 if (workspaceSubTab === 'active' && selectedTemplateIds.size > 0) {
                   selectedCount = selectedTemplateIds.size;
                   entityName = "Templates";
                 } else if (workspaceSubTab === 'archived' && archivedSelectedTemplateIds.size > 0) {
                   selectedCount = archivedSelectedTemplateIds.size;
                   entityName = "Templates";
                   isArchivedContext = true;
                 }
               } else if (activeTab === 'presets') {
                 if (presetSubTab === 'active' && selectedPresetIds.size > 0) {
                   selectedCount = selectedPresetIds.size;
                   entityName = "Presets";
                 } else if (presetSubTab === 'archived' && archivedSelectedPresetIds.size > 0) {
                   selectedCount = archivedSelectedPresetIds.size;
                   entityName = "Presets";
                   isArchivedContext = true;
                 }
               } else if (activeTab === 'layouts') {
                  const activeLayoutsForMode = savedLayouts.filter(l => !l.isArchived && l.config.type === layoutCustomMode);
                  const archivedLayoutsForMode = savedLayouts.filter(l => l.isArchived && l.config.type === layoutCustomMode);
                  if (layoutSubTab === 'active' && selectedLayoutIds.size > 0) {
                    const selectedInMode = Array.from(selectedLayoutIds).filter(id => activeLayoutsForMode.some(l => l.id === id));
                    selectedCount = selectedInMode.length;
                    entityName = "Layouts";
                  } else if (layoutSubTab === 'archived' && archivedSelectedLayoutIds.size > 0) {
                    const selectedInMode = Array.from(archivedSelectedLayoutIds).filter(id => archivedLayoutsForMode.some(l => l.id === id));
                    selectedCount = selectedInMode.length;
                    entityName = "Layouts";
                    isArchivedContext = true;
                  }
                }

                if (selectedCount === 0) return null;

                const handleClearCurrentSelection = () => {
                  if (activeTab === 'commands') {
                    setSelectedSnippetIds(new Set());
                    setArchivedSelectedSnippetIds(new Set());
                  } else if (activeTab === 'workspaces') {
                    setSelectedTemplateIds(new Set());
                    setArchivedSelectedTemplateIds(new Set());
                  } else if (activeTab === 'presets') {
                    setSelectedPresetIds(new Set());
                    setArchivedSelectedPresetIds(new Set());
                  } else if (activeTab === 'layouts') {
                    setSelectedLayoutIds(new Set());
                    setArchivedSelectedLayoutIds(new Set());
                  }
                };

               const handleGlobalBulkRestore = () => {
                 if (activeTab === 'commands') {
                   if (onUnarchiveSnippets && archivedSelectedSnippetIds.size > 0) {
                     onUnarchiveSnippets(Array.from(archivedSelectedSnippetIds));
                   } else if (onUnarchiveSnippet && archivedSelectedSnippetIds.size > 0) {
                     archivedSelectedSnippetIds.forEach(id => onUnarchiveSnippet(id));
                   }
                 } else if (activeTab === 'workspaces') {
                   if (onUnarchiveTemplates && archivedSelectedTemplateIds.size > 0) {
                     onUnarchiveTemplates(Array.from(archivedSelectedTemplateIds));
                   } else if (onUnarchiveTemplate && archivedSelectedTemplateIds.size > 0) {
                     archivedSelectedTemplateIds.forEach(id => onUnarchiveTemplate(id));
                   }
                 } else if (activeTab === 'presets') {
                   handleBulkUnarchivePresets(Array.from(archivedSelectedPresetIds));
                 } else if (activeTab === 'layouts') {
                   handleBulkUnarchiveLayouts(Array.from(archivedSelectedLayoutIds));
                 }
                 handleClearCurrentSelection();
               };

               const handleGlobalBulkDelete = () => {
                 if (activeTab === 'commands') {
                   if (onDeleteSnippets && archivedSelectedSnippetIds.size > 0) {
                     onDeleteSnippets(Array.from(archivedSelectedSnippetIds));
                   } else if (onDeleteSnippet && archivedSelectedSnippetIds.size > 0) {
                     archivedSelectedSnippetIds.forEach(id => onDeleteSnippet(id));
                   }
                 } else if (activeTab === 'workspaces') {
                   if (onDeleteTemplates && archivedSelectedTemplateIds.size > 0) {
                     onDeleteTemplates(Array.from(archivedSelectedTemplateIds));
                   } else if (onDeleteTemplate && archivedSelectedTemplateIds.size > 0) {
                     archivedSelectedTemplateIds.forEach(id => onDeleteTemplate(id));
                   }
                 } else if (activeTab === 'presets') {
                   handleBulkDeletePresets(Array.from(archivedSelectedPresetIds));
                 } else if (activeTab === 'layouts') {
                   handleBulkDeleteLayouts(Array.from(archivedSelectedLayoutIds));
                 }
                 handleClearCurrentSelection();
               };

               return (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-[600px] bg-[var(--surface-color)] border border-[var(--border-color)] rounded-xl py-2 px-6 flex items-center justify-between shadow-[0_30px_60px_rgba(0,0,0,0.8)] animate-in fade-in slide-in-from-bottom-6 duration-500 z-50">
                  <div className="flex items-center gap-4">
                    <div className="w-2 h-2 rounded-full bg-[var(--accent-primary)] animate-pulse shadow-[0_0_10px_var(--accent-primary)]" />
                    <span className="text-[11px] font-bold tracking-tight text-[var(--text-primary)]">
                      <span className="text-[var(--accent-primary)]">{selectedCount}</span> {entityName} Selected
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={handleClearCurrentSelection}
                      className="text-[10px] font-bold text-[var(--text-secondary)]/70 hover:text-[var(--text-primary)] transition-all px-2"
                    >
                      Cancel
                    </button>
                    <div className="w-px h-4 bg-[var(--text-primary)]/10 mx-1" />
                    
                    {!isArchivedContext ? (
                      <Button 
                        variant="outline"
                        size="sm" 
                        onClick={handleBulkArchive}
                        className="h-8 px-4 text-[11px] font-bold rounded-md transition-all bg-[var(--accent-primary)]/5 text-[var(--accent-primary)] border-[var(--accent-primary)]/20 hover:bg-[var(--accent-primary)]/10 active:scale-95 flex items-center gap-2"
                      >
                        <Archive size={14} />
                        Archive Selected
                      </Button>
                    ) : (
                      <>
                        <Button 
                          variant="outline"
                          size="sm" 
                          onClick={handleGlobalBulkRestore}
                          className="h-8 px-4 text-[11px] font-bold rounded-md transition-all bg-[var(--accent-primary)]/5 text-[var(--accent-primary)] border-[var(--accent-primary)]/20 hover:bg-[var(--accent-primary)]/10 active:scale-95 flex items-center gap-2"
                        >
                          <RotateCcw size={14} />
                          Restore
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={handleGlobalBulkDelete}
                          className="h-8 px-4 text-[11px] font-bold rounded-md transition-all bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 active:scale-95 flex items-center gap-2"
                        >
                          <Trash2 size={14} />
                          Delete
                        </Button>
                      </>
                    )}
                  </div>
                </div>
               );
             })()}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function LibraryNavButton({ isActive, onClick, icon, label, count }: { isActive: boolean; onClick: () => void; icon: any; label: string; count?: number }) {
  return (
    <button 
       onClick={onClick}
       className={cn(
         "w-full flex items-center gap-3.5 px-4 py-2.5 rounded-lg text-[13px] font-bold transition-all duration-300",
         isActive 
           ? "bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] shadow-sm border border-[var(--accent-primary)]/20" 
           : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--text-primary)]/[0.03]"
       )}
    >
       <span className={cn("transition-transform duration-300", isActive ? "scale-110 text-[var(--accent-primary)]" : "text-[var(--text-secondary)]")}>
         {icon}
       </span>
       <span className="flex-1 text-left">{label}</span>
       {count !== undefined && (
         <span className={cn(
           "text-[9px] font-bold px-2 py-0.5 rounded-full",
           isActive ? "bg-[var(--accent-primary)]/15 text-[var(--accent-primary)]" : "bg-[var(--text-primary)]/[0.05] text-[var(--text-secondary)]/60"
         )}>
           {count}
         </span>
       )}
    </button>
  );
}


import { FolderOpen, Grid3X3, Lock, X, BookmarkPlus, Save } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LayoutType, LayoutConfig, SavedLayout } from "@/lib/setup-constants";
import { LayoutSelector } from "../ui-parts/LayoutSelector";
import { PresetManager } from "../ui-parts/PresetManager";
import { cn } from "@/lib/utils";

interface StepWorkspaceProps {
  rootPath: string;
  setRootPath: (path: string) => void;
  isValidDir: boolean | null;
  handleBrowse: () => void;
  handleBreadcrumbClick: (index: number) => void;
  presets: { label: string; path: string }[];
  addPreset: () => void;
  removePreset: (path: string) => void;
  layout: LayoutType;
  handleLayoutChange: (layout: LayoutType) => void;
  customLayout: LayoutConfig;
  setCustomLayout: (config: Partial<LayoutConfig>) => void;
  savedLayouts: SavedLayout[];
  addSavedLayout: (name: string, config: LayoutConfig) => void;
  removeSavedLayout: (id: string) => void;
  onRestoreLayouts: () => void;
  isInitialized?: boolean;
}

export function StepWorkspace({
  rootPath,
  setRootPath,
  isValidDir,
  handleBrowse,
  handleBreadcrumbClick,
  presets,
  addPreset,
  removePreset,
  layout,
  handleLayoutChange,
  customLayout,
  setCustomLayout,
  savedLayouts,
  addSavedLayout,
  removeSavedLayout,
  onRestoreLayouts,
  isInitialized
}: StepWorkspaceProps) {
  const [layoutName, setLayoutName] = useState("");

  const handleSaveLayout = () => {
    const finalName = layoutName.trim() 
      ? layoutName.toUpperCase() 
      : `${customLayout.rows}X${customLayout.cols}`;
    
    addSavedLayout(finalName, customLayout);
    setLayoutName("");
  };

  return (
    <div className="flex flex-col gap-12">
      {/* SECTION 01: DIRECTORY */}
      <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="mb-6 flex items-center gap-3">
          <FolderOpen size={16} className="text-[var(--accent-primary)]" />
          <h3 className="text-sm font-bold tracking-tight">01. Define Working Directory</h3>
        </div>

        <div className={cn(
          "relative flex items-center gap-3 rounded-md border bg-white/[0.03] px-4 py-1 transition-all duration-300",
          isValidDir === false ? "border-red-500/50" : "border-[var(--border-color)] focus-within:border-[var(--accent-primary)]"
        )}>
          <Lock size={14} className="text-[var(--text-secondary)]" />
          <Input
            type="text"
            value={rootPath}
            onChange={(e) => setRootPath(e.target.value)}
            placeholder="NO DIRECTORY SELECTED / PASTE PATH"
            className="border-none bg-transparent px-0 font-mono text-[13px] text-[var(--text-primary)] shadow-none focus-visible:ring-0"
          />
          {rootPath && (
             <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setRootPath("")}
                className="text-[var(--text-secondary)] hover:text-white"
              >
                <X size={12} />
              </Button>
              <div className="mx-2 h-4 w-px bg-[var(--border-color)]" />
              <Button
                variant="ghost"
                size="sm"
                onClick={addPreset}
                className="h-8 gap-2 font-mono text-[10px] font-bold text-[var(--accent-primary)] hover:bg-white/5"
              >
                <BookmarkPlus size={14} />
                SAVE PRESET
              </Button>
             </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBrowse}
            className="h-8 font-mono text-[10px] font-bold tracking-widest text-[var(--accent-primary)] hover:bg-white/5"
          >
            BROWSE
          </Button>
        </div>

        {rootPath && (
          <div className="animate-in fade-in mt-4 flex flex-wrap gap-1 font-mono text-[10px]">
            {rootPath.split(/[\\/]/).filter(Boolean).map((part, i, arr) => (
              <span key={i} className="flex items-center gap-1">
                <button
                  onClick={() => handleBreadcrumbClick(i)}
                  className={cn(
                    "rounded px-1.5 py-0.5 transition-colors hover:bg-white/5",
                    i === arr.length - 1 ? "text-[var(--accent-primary)]" : "text-[var(--text-secondary)]"
                  )}
                >
                  {part.toUpperCase()}
                </button>
                {i < arr.length - 1 && <span className="text-[var(--text-secondary)] opacity-50">/</span>}
              </span>
            ))}
          </div>
        )}

        <div className="mt-8">
          <PresetManager
            presets={presets}
            onSelect={setRootPath}
            onRemove={removePreset}
            onAdd={addPreset}
            rootPath={rootPath}
          />
        </div>
      </section>

      {/* SECTION 02: LAYOUT */}
      <section>
        <div className="mb-6 flex items-center gap-3">
          <Grid3X3 size={16} className="text-[var(--accent-primary)]" />
          <h3 className="text-sm font-bold tracking-tight">02. Select Pane Layout</h3>
        </div>

        <LayoutSelector 
          currentLayout={layout} 
          onLayoutChange={handleLayoutChange} 
          customLayout={customLayout}
          onCustomLayoutChange={setCustomLayout}
          savedLayouts={savedLayouts}
          onRemoveSavedLayout={removeSavedLayout}
          onRestoreDefaults={onRestoreLayouts}
          isInitialized={isInitialized}
        />

        {layout === 'custom' && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 flex items-center gap-4 rounded-md border border-[var(--border-color)] bg-white/[0.03] p-4"
          >
            <div className="flex flex-1 items-center gap-3">
              <Save size={14} className="text-[var(--text-secondary)]" />
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder={`NAME (OPTIONAL, DEFAULTS TO ${customLayout.rows}X${customLayout.cols})`}
                  value={layoutName}
                  onChange={(e) => setLayoutName(e.target.value.toUpperCase())}
                  className="h-8 border-none bg-transparent px-0 font-mono text-[11px] shadow-none focus-visible:ring-0"
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-[9px] font-mono text-white/30 hidden md:block">
                ID: <span className="text-[var(--accent-primary)] font-bold">{layoutName.trim() ? layoutName : `${customLayout.rows}X${customLayout.cols}`}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveLayout}
                className="h-8 border-[var(--border-color)] bg-transparent font-mono text-[10px] font-bold text-[var(--accent-primary)] hover:bg-white/5"
              >
                SAVE AS REUSABLE LAYOUT
              </Button>
            </div>
          </motion.div>
        )}
      </section>
    </div>
  );
}


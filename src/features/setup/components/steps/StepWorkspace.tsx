import { FolderOpen, Lock, X, Save, Database, Layout, Zap } from "@/components/ui/icons";
import { useState } from "react";
import { motion, Variants } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LayoutType, LayoutConfig, SavedLayout } from "@/lib/setup-constants";
import { LayoutSelector } from "../ui-parts/LayoutSelector";
import { PresetManager } from "../ui-parts/PresetManager";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

import { DirectoryPreset } from "@/types";

interface StepWorkspaceProps {
  rootPath: string;
  setRootPath: (path: string) => void;
  defaultDir: string;
  isValidDir: boolean | null;
  handleBrowse: () => void;
  handleBreadcrumbClick: (index: number) => void;
  presets: DirectoryPreset[];
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
  defaultDir,
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
  onRestoreLayouts
}: StepWorkspaceProps) {
  const [layoutName, setLayoutName] = useState("");

  const handleSaveLayout = () => {
    const finalName = layoutName.trim() 
      ? layoutName 
      : `${customLayout.rows}X${customLayout.cols}`;
    
    addSavedLayout(finalName, customLayout);
    setLayoutName("");
  };

  const currentPath = rootPath || defaultDir;

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] as any }
    }
  };

  return (
    <motion.div 
      className="max-w-4xl mx-auto w-full py-2"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* SECTION 01: DIRECTORY */}
      <motion.section variants={itemVariants} className="mb-16">
        <div className="flex flex-col gap-1 mb-8">
          <div className="flex items-center gap-2 mb-1">
            <Database size={16} className="text-[var(--accent-primary)]" />
            <h3 className="text-lg font-bold tracking-tight text-[var(--text-primary)]">
              Workspace Directory
            </h3>
          </div>
          <p className="text-sm text-[var(--text-secondary)] font-medium">
            Select the main folder for your terminal sessions.
          </p>
        </div>

        <div className={cn(
          "group relative flex items-center gap-4 rounded-md border bg-[var(--text-primary)]/[0.02] p-2 pr-4 transition-all duration-300",
          isValidDir === false ? "border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.1)]" : "border-[var(--text-primary)]/10 focus-within:border-[var(--text-primary)]/20 focus-within:bg-[var(--text-primary)]/[0.04] shadow-sm"
        )}>
          <div className="flex items-center justify-center w-10 h-10 rounded-md bg-[var(--text-primary)]/5 text-[var(--text-secondary)] group-focus-within:text-[var(--accent-primary)] transition-colors">
            <FolderOpen size={18} />
          </div>
          
          <div className="flex-1 flex flex-col">
            <label className="text-[9px] font-bold text-[var(--text-secondary)] tracking-[0.1em] mb-0.5 ml-0.5">
              Selected Path
            </label>
            <Input
              type="text"
              value={rootPath}
              onChange={(e) => setRootPath(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === 'Escape') {
                  e.stopPropagation();
                }
              }}
              placeholder={defaultDir || "Select a target directory"}
              className="h-7 border-none bg-transparent px-0.5 font-mono text-[13px] text-[var(--text-primary)] shadow-none focus-visible:ring-0 placeholder:text-[var(--text-secondary)]/50"
            />
          </div>

          <div className="flex items-center gap-2">
            {rootPath && (
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setRootPath("")}
                className="h-8 w-8 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--text-primary)]/5 rounded-md"
              >
                <X size={14} />
              </Button>
            )}
            <div className="w-px h-6 bg-[var(--border-color)] mx-1" />
            <Button
              variant="outline"
              size="sm"
              onClick={handleBrowse}
              className="h-9 px-4 bg-[var(--text-primary)]/5 border-[var(--border-color)] hover:bg-[var(--text-primary)]/10 hover:border-[var(--text-primary)]/20 text-[10px] font-bold tracking-wider text-[var(--text-primary)] rounded-md transition-all"
            >
              Browse
            </Button>
          </div>
        </div>

        {currentPath && (
          <div className="animate-in fade-in mt-6 flex flex-wrap items-center gap-1.5 font-mono text-[10px] px-2">
            <Lock size={10} className="text-[var(--text-secondary)] mr-1 opacity-80" />
            {currentPath.split(/[\\/]/).filter(Boolean).map((part, i, arr) => (
              <span key={i} className="flex items-center gap-1.5">
                <button
                  onClick={() => handleBreadcrumbClick(i)}
                  className={cn(
                    "rounded-md px-2 py-1 transition-all hover:bg-[var(--accent-primary)]/10 hover:text-[var(--accent-primary)]",
                    i === arr.length - 1 ? "text-[var(--accent-primary)] font-bold bg-[var(--accent-primary)]/5" : "text-[var(--text-secondary)] font-bold"
                  )}
                >
                  {part}
                </button>
                {i < arr.length - 1 && <span className="text-[var(--text-secondary)]/30 font-bold">/</span>}
              </span>
            ))}
            {!rootPath && (
              <Badge variant="outline" className="ml-3 h-5 px-2 text-[8px] font-bold bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border-[var(--accent-primary)]/30 tracking-tighter rounded-full">
                System Default
              </Badge>
            )}
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
      </motion.section>

      {/* SECTION 02: LAYOUT */}
      <motion.section variants={itemVariants}>
        <div className="flex flex-col gap-1 mb-8">
          <div className="flex items-center gap-2 mb-1">
            <Layout size={16} className="text-[var(--accent-primary)]" />
            <h3 className="text-lg font-bold tracking-tight text-[var(--text-primary)]">
              Grid Layout
            </h3>
          </div>
          <p className="text-sm text-[var(--text-secondary)] font-medium">
            Configure the grid structure for your terminal panes.
          </p>
        </div>

        <LayoutSelector 
          currentLayout={layout} 
          onLayoutChange={handleLayoutChange} 
          customLayout={customLayout}
          onCustomLayoutChange={setCustomLayout}
          savedLayouts={savedLayouts}
          onRemoveSavedLayout={removeSavedLayout}
        />

        {savedLayouts.length === 0 && (
          <div className="mt-8">
            <EmptyState 
              icon={Zap}
              compact
              title="Empty Layout Library"
              description="Configure standard grid arrangements by installing the layout starter pack."
              iconColor="text-[var(--accent-primary)]"
              action={{
                label: "Install Starter Pack",
                onClick: onRestoreLayouts,
                icon: Zap
              }}
            />
          </div>
        )}

        {layout === 'custom' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 relative overflow-hidden rounded-md border border-[var(--border-color)] bg-[var(--text-primary)]/[0.02] p-6 group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-primary)]/5 via-transparent to-transparent opacity-50" />
            
            <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex flex-1 items-center gap-4">
                <div className="w-10 h-10 rounded-md bg-[var(--text-primary)]/5 flex items-center justify-center text-[var(--text-secondary)]">
                  <Save size={18} />
                </div>
                <div className="flex-1 flex flex-col">
                  <label className="text-[9px] font-bold text-[var(--text-secondary)] tracking-[0.1em] mb-0.5 ml-0.5">
                    Layout Name
                  </label>
                  <Input
                    type="text"
                    placeholder={`ID: ${customLayout.rows}X${customLayout.cols} (Optional)`}
                    value={layoutName}
                    onChange={(e) => setLayoutName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === 'Escape') {
                        e.stopPropagation();
                      }
                    }}
                    className="h-7 border-none bg-transparent px-0.5 font-mono text-[12px] text-[var(--text-primary)] shadow-none focus-visible:ring-0 placeholder:text-[var(--text-secondary)]/50"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-4 pl-14 md:pl-0">
                <div className="hidden md:flex flex-col items-end gap-0.5 mr-2">
                  <span className="text-[8px] font-mono font-bold text-[var(--text-secondary)] tracking-widest opacity-80 text-right">Layout ID</span>
                  <span className="text-[10px] font-mono font-bold text-[var(--accent-primary)] text-right">
                    {layoutName.trim() ? layoutName : `${customLayout.rows}X${customLayout.cols}`}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSaveLayout}
                  disabled={customLayout.rows < 1 || customLayout.cols < 1}
                  className="h-9 px-6 bg-[var(--accent-primary)] text-[var(--accent-contrast)] border-[var(--accent-primary)] hover:brightness-110 font-bold text-[10px] tracking-wider rounded-md transition-all"
                >
                  Save Layout
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </motion.section>
    </motion.div>
  );
}

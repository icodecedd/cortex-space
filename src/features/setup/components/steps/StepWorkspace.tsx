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
import { Spotlight } from "@/components/ui/spotlight";

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
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as any }
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
        <div className="flex flex-col gap-1 mb-10">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-1.5 rounded-lg bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]">
              <Database size={16} />
            </div>
            <h3 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
              Workspace Directory
            </h3>
          </div>
          <p className="text-sm text-[var(--text-secondary)] font-medium opacity-70">
            Select the main folder for your terminal sessions. All subprocesses will spawn relative to this path.
          </p>
        </div>

        <Spotlight 
          className={cn(
            "group relative flex items-center gap-4 rounded-xl border bg-[var(--text-primary)]/[0.01] p-2 pr-4 transition-all duration-300",
            isValidDir === false ? "border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.1)]" : "border-[var(--border-color)] focus-within:border-[var(--accent-primary)] focus-within:bg-[var(--text-primary)]/[0.03] focus-within:shadow-[0_0_20px_rgba(var(--accent-primary-rgb),0.05)]"
          )}
          spotlightColor="rgba(var(--accent-primary-rgb), 0.05)"
        >
          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-[var(--text-primary)]/5 text-[var(--text-secondary)] group-focus-within:text-[var(--accent-primary)] transition-colors">
            <FolderOpen size={20} />
          </div>
          
          <div className="flex-1 flex flex-col pt-1">
            <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.1em] mb-1 ml-0.5 opacity-60">
              Target Path
            </label>
            <Input
              type="text"
              value={rootPath}
              onChange={(e) => setRootPath(e.target.value)}
              placeholder={defaultDir || "Select a target directory"}
              className="h-8 border-none bg-transparent px-0.5 font-mono text-[14px] text-[var(--text-primary)] shadow-none focus-visible:ring-0 placeholder:text-[var(--text-secondary)]/40"
            />
          </div>

          <div className="flex items-center gap-3">
            {rootPath && (
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setRootPath("")}
                className="h-8 w-8 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--text-primary)]/5 rounded-lg"
              >
                <X size={14} />
              </Button>
            )}
            <div className="w-px h-8 bg-[var(--border-color)] mx-1" />
            <Button
              onClick={handleBrowse}
              className="btn-tactile h-10 px-6 font-bold text-[11px] tracking-wider"
            >
              Browse
            </Button>
          </div>
        </Spotlight>

        {currentPath && (
          <div className="animate-in fade-in slide-in-from-top-2 mt-8 flex flex-wrap items-center gap-1 font-mono text-[11px] px-2">
            <Lock size={12} className="text-[var(--text-secondary)] mr-2 opacity-50" />
            {currentPath.split(/[\\/]/).filter(Boolean).map((part, i, arr) => (
              <span key={i} className="flex items-center gap-1">
                <button
                  onClick={() => handleBreadcrumbClick(i)}
                  className={cn(
                    "rounded-md px-2.5 py-1 transition-all hover:bg-[var(--text-primary)]/5 hover:text-[var(--text-primary)]",
                    i === arr.length - 1 ? "text-[var(--accent-primary)] font-bold bg-[var(--accent-primary)]/10" : "text-[var(--text-secondary)] font-medium"
                  )}
                >
                  {part}
                </button>
                {i < arr.length - 1 && <span className="text-[var(--text-secondary)] opacity-30 font-bold px-1">/</span>}
              </span>
            ))}
            {!rootPath && (
              <Badge variant="outline" className="ml-4 h-6 px-3 text-[9px] font-bold bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border-[var(--accent-primary)]/30 tracking-wider rounded-full uppercase">
                Default
              </Badge>
            )}
          </div>
        )}

        <div className="mt-12">
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
        <div className="flex flex-col gap-1 mb-10">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-1.5 rounded-lg bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]">
              <Layout size={16} />
            </div>
            <h3 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
              Grid Layout
            </h3>
          </div>
          <p className="text-sm text-[var(--text-secondary)] font-medium opacity-70">
            Define how your workspace should be segmented. Select a preset or build a custom arrangement.
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
          <div className="mt-10">
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
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-10"
          >
            <Spotlight className="rounded-xl border border-[var(--border-color)] bg-[var(--text-primary)]/[0.01] p-8 overflow-hidden group">
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="flex flex-1 items-center gap-6">
                  <div className="w-12 h-12 rounded-lg bg-[var(--text-primary)]/5 flex items-center justify-center text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">
                    <Save size={20} />
                  </div>
                  <div className="flex-1 flex flex-col pt-1">
                    <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.1em] mb-1 ml-0.5 opacity-60">
                      Configuration Label
                    </label>
                    <Input
                      type="text"
                      placeholder={`Dynamic ID: ${customLayout.rows}X${customLayout.cols}`}
                      value={layoutName}
                      onChange={(e) => setLayoutName(e.target.value)}
                      className="h-8 border-none bg-transparent px-0.5 font-mono text-[14px] text-[var(--text-primary)] shadow-none focus-visible:ring-0 placeholder:text-[var(--text-secondary)]/40"
                    />
                  </div>
                </div>
                
                <div className="flex items-center gap-6 pl-16 md:pl-0">
                  <div className="hidden md:flex flex-col items-end gap-1 mr-4">
                    <span className="text-[9px] font-bold text-[var(--text-secondary)] tracking-widest uppercase opacity-50 text-right">Layout Blueprint</span>
                    <span className="text-xs font-mono font-bold text-[var(--accent-primary)] text-right">
                      {layoutName.trim() ? layoutName : `${customLayout.rows}X${customLayout.cols}`}
                    </span>
                  </div>
                  <Button
                    onClick={handleSaveLayout}
                    disabled={customLayout.rows < 1 || customLayout.cols < 1}
                    className="btn-tactile primary h-11 px-8 font-bold text-[11px] tracking-wider"
                  >
                    Save Configuration
                  </Button>
                </div>
              </div>
            </Spotlight>
          </motion.div>
        )}
      </motion.section>
    </motion.div>
  );
}

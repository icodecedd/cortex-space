import {
  FolderOpen,
  Lock,
  X,
  Save,
  Database,
  Layout,
  Zap,
  AlertCircle,
  CheckCircle2,
} from "@/components/ui/icons";
import { useState } from "react";
import { motion, Variants } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LayoutType, LayoutConfig, SavedLayout } from "@/lib/setup-constants";
import { LayoutSelector } from "../ui-parts/LayoutSelector";
import { PresetManager } from "../ui-parts/PresetManager";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import { Spotlight } from "@/components/ui/spotlight";

import { DirectoryPreset } from "@/lib";

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
  onRestoreLayouts,
}: StepWorkspaceProps) {
  const [layoutName, setLayoutName] = useState("");

  const handleSaveLayout = () => {
    const finalName = layoutName.trim()
      ? layoutName
      : customLayout.type === "grid"
        ? `${customLayout.rows}X${customLayout.cols}`
        : `${customLayout.value} PANES`;

    addSavedLayout(finalName, customLayout);
    setLayoutName("");
  };

  const currentPath = rootPath || defaultDir;

  const isInvalid =
    customLayout.type === "grid"
      ? customLayout.rows < 1 || customLayout.cols < 1
      : customLayout.value < 1;

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as any },
    },
  };

  return (
    <motion.div
      className="w-full py-4 px-4 md:px-5 lg:px-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* SECTION 01: DIRECTORY (Standard Vertical Flow) */}
      <motion.section variants={itemVariants} className="mb-6 max-w-[800px]">
        <div className="flex flex-col gap-4 items-start">
          {/* Top: Context */}
          <div className="flex flex-col gap-2 w-full">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[var(--accent-primary)]/10 flex items-center justify-center text-[var(--accent-primary)] shadow-sm">
                <Database size={16} />
              </div>
              <h3 className="text-lg font-bold tracking-tight text-[var(--text-primary)]">
                Project Root
              </h3>
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed opacity-70 max-w-xl">
              Choose the main folder for your project. All terminal sessions and
              agents will start in this folder.
            </p>
          </div>

          {/* Bottom: Interaction (Full Width) */}
          <div className="w-full space-y-4">
            <Spotlight
              className={cn(
                "group relative flex flex-col md:flex-row md:items-center gap-4 rounded-xl border p-4 transition-all duration-500 shadow-lg",
                isValidDir === false && rootPath !== ""
                  ? "border-red-500/50 bg-red-500/[0.01]"
                  : isValidDir === true && rootPath !== ""
                  ? "border-emerald-500/30 bg-emerald-500/[0.01]"
                  : "border-white/5 bg-white/[0.02] focus-within:border-[var(--accent-primary)]/40 focus-within:bg-white/[0.04]",
              )}
              spotlightColor="rgba(var(--accent-primary-rgb), 0.05)"
            >
              <div
                className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-500 shrink-0",
                  isValidDir === false && rootPath !== ""
                    ? "bg-red-500/10 text-red-400"
                    : isValidDir === true && rootPath !== ""
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-white/5 text-[var(--text-secondary)] group-focus-within:text-[var(--accent-primary)]"
                )}
              >
                <FolderOpen size={20} />
              </div>

              <div className="flex-1 flex flex-col">
                <label className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1 ml-0.5 opacity-40">
                  Folder Path
                </label>
                <Input
                  type="text"
                  value={rootPath}
                  onChange={(e) => setRootPath(e.target.value)}
                  placeholder={defaultDir || "Select a folder"}
                  autoComplete="off"
                  className="h-8 border-none bg-transparent px-0.5 text-xs text-[var(--text-primary)] shadow-none focus-visible:ring-0 placeholder:text-[var(--text-secondary)]/10 font-bold"
                />
              </div>

              <div className="flex items-center gap-3">
                {rootPath && (
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => setRootPath("")}
                    className="h-8 w-8 text-[var(--text-secondary)] hover:text-red-400 hover:bg-red-400/5 rounded-lg transition-all"
                  >
                    <X size={16} />
                  </Button>
                )}
                <div className="hidden md:block w-px h-6 bg-white/10 mx-1" />
                <Button
                  onClick={handleBrowse}
                  className="btn-tactile primary h-9 px-4 font-bold text-xs tracking-wider rounded-lg flex items-center gap-1.5"
                >
                  <FolderOpen size={13} />
                  BROWSE
                </Button>
              </div>
            </Spotlight>

            {isValidDir === false && rootPath !== "" && (
              <div className="text-[11px] text-red-400 font-bold mt-1.5 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-200 px-1">
                <AlertCircle size={13} />
                Directory does not exist or is inaccessible.
              </div>
            )}

            {isValidDir === true && rootPath !== "" && (
              <div className="text-[11px] text-emerald-400 font-bold mt-1.5 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-200 px-1">
                <CheckCircle2 size={13} />
                Directory verified.
              </div>
            )}

            {currentPath && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-wrap items-center gap-1.5 text-[9px] px-1"
              >
                <Lock
                  size={10}
                  className="text-[var(--text-secondary)] mr-0.5 opacity-30"
                />
                {currentPath
                  .split(/[\\/]/)
                  .filter(Boolean)
                  .map((part, i, arr) => (
                    <span key={i} className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleBreadcrumbClick(i)}
                        className={cn(
                          "rounded-md px-1.5 py-0.5 transition-all hover:bg-white/5 hover:text-[var(--text-primary)] border border-transparent",
                          i === arr.length - 1
                            ? "text-[var(--accent-primary)] bg-[var(--accent-primary)]/10 font-bold"
                            : "text-[var(--text-secondary)]",
                        )}
                      >
                        {part}
                      </button>
                      {i < arr.length - 1 && (
                        <span className="text-[var(--text-secondary)] opacity-10">
                          /
                        </span>
                      )}
                    </span>
                  ))}
                {!rootPath && (
                  <div className="ml-3 px-1.5 py-0.5 text-[7px] font-bold bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/20 tracking-wider rounded-full uppercase">
                    System Default
                  </div>
                )}
              </motion.div>
            )}

            <div className="pt-4 border-t border-white/5">
              <PresetManager
                presets={presets}
                onSelect={setRootPath}
                onRemove={removePreset}
                onAdd={addPreset}
                rootPath={rootPath}
              />
            </div>
          </div>
        </div>
      </motion.section>

      {/* SECTION 02: LAYOUT (Standard Vertical Flow) */}
      <motion.section variants={itemVariants} className="max-w-[800px]">
        <div className="flex flex-col gap-4 items-start">
          {/* Top: Context */}
          <div className="flex flex-col gap-2 w-full">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[var(--accent-primary)]/10 flex items-center justify-center text-[var(--accent-primary)] shadow-sm">
                <Layout size={16} />
              </div>
              <h3 className="text-lg font-bold tracking-tight text-[var(--text-primary)]">
                Workspace Layout
              </h3>
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed opacity-70 max-w-xl">
              Set up your workspace. Divide your screen into multiple terminal
              windows to work more efficiently.
            </p>
          </div>

          {/* Bottom: Interaction (Full Width) */}
          <div className="w-full space-y-6">
            <div className="bg-white/[0.01] rounded-xl border border-white/5 p-4 shadow-lg">
              <LayoutSelector
                currentLayout={layout}
                onLayoutChange={handleLayoutChange}
                customLayout={customLayout}
                onCustomLayoutChange={setCustomLayout}
                savedLayouts={savedLayouts}
                onRemoveSavedLayout={removeSavedLayout}
              />
            </div>

            {savedLayouts.length === 0 && (
              <div className="px-2">
                <EmptyState
                  icon={Zap}
                  compact
                  title="No Saved Layouts"
                  description="Add some sample layouts to get started quickly."
                  iconColor="text-[var(--accent-primary)]"
                  action={{
                    label: "Add Samples",
                    onClick: onRestoreLayouts,
                    icon: Zap,
                  }}
                />
              </div>
            )}

            {layout === "custom" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.99 }}
                animate={{ opacity: 1, scale: 1 }}
                className="px-1"
              >
                <Spotlight className="rounded-xl border border-white/5 bg-white/[0.02] p-4 overflow-hidden group shadow-xl relative">
                  <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex flex-1 items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-[var(--text-secondary)] group-hover:text-[var(--accent-primary)] transition-all duration-500 shrink-0">
                        <Save size={20} />
                      </div>
                      <div className="flex-1 flex flex-col">
                        <label className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-0.5 opacity-40">
                          Layout Name
                        </label>
                        <Input
                          type="text"
                          placeholder={
                            customLayout.type === "grid"
                              ? `${customLayout.rows}X${customLayout.cols} Arrangement`
                              : `${customLayout.value} Pane Vertical`
                          }
                          value={layoutName}
                          onChange={(e) => setLayoutName(e.target.value)}
                          className="h-8 border-none bg-transparent px-0.5 text-xs text-[var(--text-primary)] shadow-none focus-visible:ring-0 placeholder:text-[var(--text-secondary)]/10 font-bold"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="hidden sm:flex flex-col items-end gap-0.5 pr-4 border-r border-white/10">
                        <span className="text-[8px] font-bold text-[var(--text-secondary)] tracking-widest uppercase opacity-30 text-right">
                          Layout Preview
                        </span>
                        <span className="text-xs font-bold text-[var(--accent-primary)] text-right">
                          {layoutName.trim()
                            ? layoutName
                            : customLayout.type === "grid"
                              ? `${customLayout.rows}X${customLayout.cols}`
                              : `${customLayout.value} PANES`}
                        </span>
                      </div>
                      <Button
                        onClick={handleSaveLayout}
                        disabled={isInvalid}
                        className="btn-tactile primary h-9 px-4 font-bold text-xs tracking-wider rounded-lg flex items-center gap-1.5"
                      >
                        <Save size={13} />
                        SAVE CONFIG
                      </Button>
                    </div>
                  </div>
                </Spotlight>
              </motion.div>
            )}
          </div>
        </div>
      </motion.section>
    </motion.div>
  );
}

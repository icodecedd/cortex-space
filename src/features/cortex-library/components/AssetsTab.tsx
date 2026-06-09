import { useState } from "react";
import { Folder, Trash2, Layout, Database, Plus, FolderOpen, Zap, Clock } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SavedLayout, LayoutConfig } from "@/lib/setup-constants";
import { getGridCols, getGridRows, getPaneCount } from "@/lib/setup-utils";
import { truncatePath } from "@/lib/utils";
import { open } from "@tauri-apps/plugin-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import { DirectoryPreset } from "@/types";

interface AssetsTabProps {
  presets: DirectoryPreset[];
  savedLayouts: SavedLayout[];
  searchQuery: string;
  onRemovePreset: (id: string) => void;
  onRemoveLayout: (id: string) => void;
  onAddPreset: (label: string, path: string) => void;
  onAddLayout: (name: string, config: LayoutConfig) => void;
  onRestoreDefaults: (type: 'layouts') => void;
  viewMode?: 'presets' | 'layouts' | 'all';
  isAdding?: boolean;
  setIsAdding?: (adding: boolean) => void;
}

export function AssetsTab({
  presets,
  savedLayouts,
  searchQuery,
  onRemovePreset,
  onRemoveLayout,
  onAddPreset,
  onAddLayout,
  onRestoreDefaults,
  viewMode = 'all',
  isAdding = false,
  setIsAdding
}: AssetsTabProps) {
  // New Preset Form State
  const [newPresetPath, setNewPresetPath] = useState("");

  // New Layout Form State
  const [newLayoutName, setNewLayoutName] = useState("");
  const [newLayoutRows, setNewLayoutRows] = useState(2);
  const [newLayoutCols, setNewLayoutCols] = useState(2);

  const filteredPresets = presets.filter(p =>
    p.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.path.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredLayouts = savedLayouts.filter(l =>
    l.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleBrowse = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: "Select Preset Directory"
      });
      if (selected && typeof selected === 'string') {
        setNewPresetPath(selected);
      }
    } catch (err) {
      console.error("Failed to open directory dialog:", err);
    }
  };

  const handleAddPreset = () => {
    const trimmedPath = newPresetPath.trim();
    if (!trimmedPath) return;

    const derivedName = trimmedPath.split(/[\\/]/).filter(Boolean).pop() || "ROOT";
    onAddPreset(derivedName.toUpperCase(), trimmedPath);
    setNewPresetPath("");
    if (setIsAdding) setIsAdding(false);
  };

  const handleAddLayout = () => {
    const finalName = newLayoutName.trim()
      ? newLayoutName.toUpperCase()
      : `${newLayoutRows}X${newLayoutCols}`;

    onAddLayout(finalName, { rows: newLayoutRows, cols: newLayoutCols });
    setNewLayoutName("");
    setNewLayoutRows(2);
    setNewLayoutCols(2);
    if (setIsAdding) setIsAdding(false);
  };

  const handleNumericInput = (val: string, setter: (n: number) => void) => {
    if (val === "") {
      setter(0); // Allow clearing to type a new number
      return;
    }
    const parsed = parseInt(val);
    if (!isNaN(parsed)) {
      setter(Math.min(4, Math.max(0, parsed)));
    }
  };

  return (
    <div className="space-y-6 overflow-x-hidden">
      {/* ADD PRESET FORM */}
      {viewMode === 'presets' && isAdding && (
        <Card className="bg-[var(--accent-primary)]/[0.03] border-[var(--accent-primary)]/20 p-5 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex flex-col gap-4">
            <div className="space-y-2 flex-1">
              <Label className="text-[10px] font-bold text-[var(--accent-primary)]/80 uppercase tracking-wider">Target Directory Path</Label>
              <div className="flex gap-3">
                <Input
                  autoFocus
                  placeholder="C:\Users\...\Project"
                  className="bg-[var(--text-primary)]/5 border-[var(--border-color)] text-[13px] font-mono h-9 flex-1"
                  value={newPresetPath}
                  onChange={(e) => setNewPresetPath(e.target.value)}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBrowse}
                  className="h-9 gap-2 border-[var(--border-color)] bg-[var(--text-primary)]/5 hover:bg-[var(--text-primary)]/10 font-mono text-[10px] font-bold tracking-wider"
                >
                  <FolderOpen size={14} /> BROWSE
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-[var(--accent-primary)]/10 pt-4 mt-1">
              <div className="text-[10px] font-mono text-[var(--text-secondary)] italic">
                {newPresetPath ? (
                  <>Auto-Labeling as: <span className="text-[var(--accent-primary)] font-bold">{(newPresetPath.split(/[\\/]/).filter(Boolean).pop() || "ROOT").toUpperCase()}</span></>
                ) : "Select a path to automatically generate a preset label."}
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setIsAdding && setIsAdding(false)} className="text-[11px] h-8 text-[var(--text-secondary)]">CANCEL</Button>
                <Button
                  size="sm"
                  onClick={handleAddPreset}
                  disabled={!newPresetPath.trim()}
                  className="bg-[var(--accent-primary)] text-[var(--accent-contrast)] text-[11px] font-bold h-8 hover:opacity-90 px-6"
                >
                  SAVE PRESET
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* ADD LAYOUT FORM */}
      {viewMode === 'layouts' && isAdding && (
        <Card className="bg-[var(--accent-primary)]/[0.03] border-[var(--accent-primary)]/20 p-5 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-5">
            <div className="space-y-2 md:col-span-1">
              <Label className="text-[10px] font-bold text-[var(--accent-primary)] uppercase tracking-wider">Layout Name (Optional)</Label>
              <Input
                autoFocus
                placeholder={`Leave blank for \"${newLayoutRows}X${newLayoutCols}\"`}
                className="bg-[var(--text-primary)]/5 border-[var(--border-color)] text-[13px] h-9"
                value={newLayoutName}
                onChange={(e) => setNewLayoutName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold text-ansi-blue uppercase tracking-wider">Rows (1-4)</Label>
              <Input
                type="number"
                min={1} max={4}
                className="bg-[var(--text-primary)]/5 border-[var(--border-color)] text-[13px] h-9 text-center font-mono"
                value={newLayoutRows === 0 ? "" : newLayoutRows}
                onChange={(e) => handleNumericInput(e.target.value, setNewLayoutRows)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold text-ansi-blue uppercase tracking-wider">Cols (1-4)</Label>
              <Input
                type="number"
                min={1} max={4}
                className="bg-[var(--text-primary)]/5 border-[var(--border-color)] text-[13px] h-9 text-center font-mono"
                value={newLayoutCols === 0 ? "" : newLayoutCols}
                onChange={(e) => handleNumericInput(e.target.value, setNewLayoutCols)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-[var(--border-color)] pt-4">
            <div className="flex items-center gap-4">
              <div
                className="w-10 h-8 grid gap-[1px] bg-[var(--text-primary)]/10 p-[1px] rounded-[2px]"
                style={{
                  gridTemplateColumns: `repeat(${newLayoutCols || 1}, 1fr)`,
                  gridTemplateRows: `repeat(${newLayoutRows || 1}, 1fr)`
                }}
              >
                {Array.from({ length: (newLayoutRows || 1) * (newLayoutCols || 1) }).map((_, i) => (
                  <div key={i} className="bg-[var(--bg-color)]/60" />
                ))}
              </div>
              <div className="text-[10px] font-mono text-[var(--text-secondary)]">
                IDENTIFIER: <span className="text-[var(--accent-primary)] font-bold">{newLayoutName.trim() ? newLayoutName.toUpperCase() : `${newLayoutRows || 1}X${newLayoutCols || 1}`}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setIsAdding && setIsAdding(false)} className="text-[11px] h-8 text-[var(--text-secondary)]">CANCEL</Button>
              <Button
                size="sm"
                onClick={handleAddLayout}
                disabled={newLayoutRows < 1 || newLayoutCols < 1}
                className="bg-[var(--accent-primary)] text-[var(--accent-contrast)] text-[11px] font-bold h-8 hover:opacity-90 px-6"
              >
                SAVE CUSTOM LAYOUT
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* SECTION: DIRECTORY PRESETS */}
      {(viewMode === 'all' || viewMode === 'presets') && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 px-2">
          {filteredPresets.length === 0 ? (
            <EmptyState
              icon={Database}
              title={searchQuery ? "No Presets Found" : "No Directory Presets"}
              description={searchQuery
                ? `No directory favorites matching "${searchQuery}" were discovered.`
                : "Save your frequent workspace paths for faster setup and easy access across sessions."
              }
              iconColor="text-[var(--accent-primary)]/40"
              action={!isAdding && !searchQuery && setIsAdding ? {
                label: "Define First Preset",
                onClick: () => setIsAdding(true),
                icon: Plus
              } : undefined}
              className="col-span-full"
            />
          ) : (
            filteredPresets.map((preset) => (
              <Card 
                key={preset.id} 
                className="group relative flex flex-col p-0 bg-[var(--text-primary)]/[0.02] hover:bg-[var(--text-primary)]/[0.04] transition-all duration-300 cursor-default overflow-hidden border border-[var(--border-color)]"
              >
                <CardHeader className="p-4 pb-2 border-none group/header">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-8 rounded bg-[var(--accent-primary)]/5 border border-[var(--accent-primary)]/10 flex items-center justify-center shrink-0 mt-0.5">
                       <Folder size={18} className="text-[var(--accent-primary)]" />
                    </div>
                    
                    <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                      <CardTitle className="text-[13px] font-bold truncate text-[var(--text-primary)] group-hover/header:text-[var(--accent-primary)] transition-colors leading-tight uppercase tracking-tight">
                        {preset.label}
                      </CardTitle>
                      <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-secondary)] font-mono min-w-0">
                        <FolderOpen size={10} className="shrink-0 opacity-80" /> 
                        <span className="block flex-1 truncate whitespace-nowrap">{truncatePath(preset.path, 35)}</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardFooter className="px-4 py-2 border-t border-[var(--border-color)] bg-[var(--bg-color)]/20 flex items-center justify-between">
                   <span className="text-[9px] text-[var(--text-secondary)] font-medium flex items-center gap-1 leading-none uppercase tracking-wider opacity-60">Directory Preset</span>
                   
                   <div className="flex items-center gap-2.5">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 text-[var(--text-secondary)]/60 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/10 hover:text-red-400 active:scale-95"
                            onClick={(e) => { e.stopPropagation(); onRemovePreset(preset.id); }}
                          >
                            <Trash2 size={13} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="text-[10px] bg-[var(--surface-color)] border-[var(--border-color)] text-[var(--text-primary)]">
                          Delete Preset
                        </TooltipContent>
                      </Tooltip>
                   </div>
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      )}

      {/* SECTION: CUSTOM LAYOUTS */}
      {(viewMode === 'all' || viewMode === 'layouts') && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 px-2">
          {filteredLayouts.length === 0 ? (
            <EmptyState
              icon={Layout}
              title={searchQuery ? "No Layouts Found" : "No Pane Layouts Configured"}
              description={searchQuery
                ? `No grid arrangements matching "${searchQuery}" were discovered.`
                : "Define and save your preferred terminal grid arrangements, from simple splits to complex layouts."
              }
              iconColor="text-[var(--accent-primary)]/40"
              action={!isAdding && !searchQuery && onRestoreDefaults ? {
                label: "Install Starter Pack",
                onClick: () => onRestoreDefaults('layouts'),
                icon: Zap
              } : undefined}
              className="col-span-full"
            />
            ) : (
            filteredLayouts.map((layout) => (
              <Card 
                key={layout.id} 
                className="group relative flex flex-col p-0 bg-[var(--text-primary)]/[0.02] hover:bg-[var(--text-primary)]/[0.04] transition-all duration-300 cursor-default overflow-hidden border border-[var(--border-color)]"
              >
                <CardHeader className="p-4 pb-2 border-none group/header">
                  <div className="flex items-start gap-3 min-w-0">
                    <div 
                      className="w-10 h-8 grid gap-[1px] bg-[var(--text-primary)]/10 p-[1px] rounded-sm shrink-0 mt-0.5"
                      style={{
                        gridTemplateColumns: getGridCols(layout),
                        gridTemplateRows: getGridRows(layout)
                      }}
                    >
                      {Array.from({ length: getPaneCount(layout) }).map((_, i) => (
                        <div key={i} className="bg-[var(--bg-color)]/60" />
                      ))}
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                      <CardTitle className="text-[13px] font-bold truncate text-[var(--text-primary)] group-hover/header:text-[var(--accent-primary)] transition-colors leading-tight uppercase tracking-tight">
                        {layout.name}
                      </CardTitle>
                      <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-secondary)] font-mono min-w-0">
                         <span className="text-[var(--text-primary)] font-bold">{layout.rows}X{layout.cols}</span> LAYOUT
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardFooter className="px-4 py-2 border-t border-[var(--border-color)] bg-[var(--bg-color)]/20 flex items-center justify-between">
                   <span className="text-[9px] text-[var(--text-secondary)] font-medium flex items-center gap-1 leading-none uppercase tracking-wider opacity-60">Grid Arrangement</span>
                   
                   <div className="flex items-center gap-2.5">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 text-[var(--text-secondary)]/60 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/10 hover:text-red-400 active:scale-95"
                            onClick={(e) => { e.stopPropagation(); onRemoveLayout(layout.id); }}
                          >
                            <Trash2 size={13} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="text-[10px] bg-[var(--surface-color)] border-[var(--border-color)] text-[var(--text-primary)]">
                          Delete Layout
                        </TooltipContent>
                      </Tooltip>
                   </div>
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}

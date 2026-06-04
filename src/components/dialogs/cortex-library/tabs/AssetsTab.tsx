import { useState } from "react";
import { Folder, Trash2, Layout, Database, Plus, X, FolderOpen, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SavedLayout, LayoutConfig } from "@/lib/setup-constants";
import { getGridCols, getGridRows, getPaneCount } from "@/lib/setup-utils";
import { cn, truncatePath } from "@/lib/utils";
import { open } from "@tauri-apps/plugin-dialog";
import { EmptyState } from "@/components/ui/empty-state";

import { DirectoryPreset } from "@/hooks/usePresets";

interface AssetsTabProps {
  presets: DirectoryPreset[];
  savedLayouts: SavedLayout[];
  searchQuery: string;
  onRemovePreset: (id: string) => void;
  onRemoveLayout: (id: string) => void;
  onAddPreset: (label: string, path: string) => void;
  onAddLayout: (name: string, config: LayoutConfig) => void;
  onRestoreDefaults: (type: 'layouts') => void;
}

export function AssetsTab({
  presets,
  savedLayouts,
  searchQuery,
  onRemovePreset,
  onRemoveLayout,
  onAddPreset,
  onAddLayout,
  onRestoreDefaults
}: AssetsTabProps) {
  // Form Visibility States
  const [showAddPreset, setShowAddPreset] = useState(false);
  const [showAddLayout, setShowAddLayout] = useState(false);

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
    setShowAddPreset(false);
  };

  const handleAddLayout = () => {
    const finalName = newLayoutName.trim()
      ? newLayoutName.toUpperCase()
      : `${newLayoutRows}X${newLayoutCols}`;

    onAddLayout(finalName, { rows: newLayoutRows, cols: newLayoutCols });
    setNewLayoutName("");
    setNewLayoutRows(2);
    setNewLayoutCols(2);
    setShowAddLayout(false);
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
    <div className="space-y-12 pb-12 px-2 overflow-x-hidden">
      {/* SECTION: DIRECTORY PRESETS */}
      <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 flex items-center justify-center">
              <Database size={16} className="text-[var(--accent-primary)]" />
            </div>
            <div>
              <h3 className="text-[14px] font-bold text-[var(--text-primary)]">Directory Presets</h3>
              <p className="text-[10px] text-[var(--text-secondary)] font-medium uppercase tracking-wider">Fast-access workspace targets</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowAddPreset(!showAddPreset);
                if (!showAddPreset) setShowAddLayout(false);
              }}
              className={cn(
                "h-8 gap-2 font-mono text-[10px] font-bold tracking-widest transition-all",
                showAddPreset ? "text-[var(--accent-primary)] bg-[var(--accent-primary)]/10" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              )}
            >
              {showAddPreset ? <X size={14} /> : <Plus size={14} />}
              {showAddPreset ? "CANCEL" : "ADD PRESET"}
            </Button>
          </div>
        </div>

        {showAddPreset && (
          <Card className="mb-6 bg-[var(--accent-primary)]/[0.03] border-[var(--accent-primary)]/20 p-5 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex flex-col gap-4">
              <div className="space-y-2 flex-1">
                <Label className="text-[10px] font-bold text-[var(--accent-primary)]/80 uppercase tracking-wider">Target Directory Path</Label>
                <div className="flex gap-3">
                  <Input
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
          </Card>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {filteredPresets.length === 0 ? (
            <EmptyState
              icon={Database}
              title={searchQuery ? "No Presets Found" : "No Directory Presets"}
              description={searchQuery
                ? `No directory favorites matching "${searchQuery}" were discovered.`
                : "Save your frequent workspace paths for faster setup and easy access across sessions."
              }
              iconColor="text-[var(--accent-primary)]/40"
              action={!showAddPreset && !searchQuery ? {
                label: "Define First Preset",
                onClick: () => setShowAddPreset(true),
                icon: Plus
              } : undefined}
              className="col-span-full w-full py-12 border border-dashed border-[var(--border-color)] rounded-lg bg-[var(--text-primary)]/5"
            />
          ) : (
            filteredPresets.map((preset) => (
              <Card key={preset.id} className="bg-[var(--text-primary)]/5 border-[var(--border-color)] hover:border-[var(--accent-primary)]/30 transition-all group overflow-hidden w-full min-w-0">
                <CardContent className="p-4 flex items-center justify-between gap-4 min-w-0">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Folder size={16} className="text-[var(--text-secondary)]/60 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-[12px] font-bold text-[var(--text-primary)] truncate uppercase tracking-tight">{preset.label}</div>
                      <div className="text-[10px] text-[var(--text-secondary)] font-mono truncate whitespace-nowrap">{truncatePath(preset.path, 35)}</div>
                    </div>
                  </div>
                  <Button
                    variant="ghost" size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-all hover:bg-ansi-red/10 hover:text-ansi-red shrink-0"
                    onClick={() => onRemovePreset(preset.id)}
                  >
                    <Trash2 size={12} />
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </section>

      {/* SECTION: CUSTOM LAYOUTS */}
      <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 flex items-center justify-center">
              <Layout size={16} className="text-[var(--accent-primary)]" />
            </div>
            <div>
              <h3 className="text-[14px] font-bold text-[var(--text-primary)]">Custom Pane Grids</h3>
              <p className="text-[10px] text-[var(--text-secondary)] font-medium uppercase tracking-wider">Saved terminal arrangements</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
             {!showAddLayout && savedLayouts.length > 0 && savedLayouts.length < 5 && (
               <Button
                variant="ghost"
                size="sm"
                onClick={() => onRestoreDefaults('layouts')}
                className="h-8 px-3 font-mono text-[9px] font-bold text-[var(--text-secondary)]/60 hover:text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/5"
              >
                RESTORE DEFAULTS
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowAddLayout(!showAddLayout);
                if (!showAddLayout) setShowAddPreset(false);
              }}
              className={cn(
                "h-8 gap-2 font-mono text-[10px] font-bold tracking-widest transition-all",
                showAddLayout ? "text-[var(--accent-primary)] bg-[var(--accent-primary)]/10" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              )}
            >
              {showAddLayout ? <X size={14} /> : <Plus size={14} />}
              {showAddLayout ? "CANCEL" : "ADD LAYOUT"}
            </Button>
          </div>
        </div>

        {showAddLayout && (
          <Card className="mb-6 bg-[var(--accent-primary)]/[0.03] border-[var(--accent-primary)]/20 p-5 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-5">
              <div className="space-y-2 md:col-span-1">
                <Label className="text-[10px] font-bold text-[var(--accent-primary)] uppercase tracking-wider">Layout Name (Optional)</Label>
                <Input
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
              <Button
                size="sm"
                onClick={handleAddLayout}
                disabled={newLayoutRows < 1 || newLayoutCols < 1}
                className="bg-[var(--accent-primary)] text-[var(--accent-contrast)] text-[11px] font-bold h-8 hover:opacity-90 px-6"
              >
                SAVE CUSTOM LAYOUT
              </Button>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredLayouts.length === 0 ? (
            <EmptyState
              icon={Layout}
              title={searchQuery ? "No Layouts Found" : "No Pane Layouts Configured"}
              description={searchQuery
                ? `No grid arrangements matching "${searchQuery}" were discovered.`
                : "Define and save your preferred terminal grid arrangements, from simple splits to complex matrices."
              }
              iconColor="text-[var(--accent-primary)]/40"
              action={!showAddLayout && !searchQuery ? {
                label: "Install Starter Pack",
                onClick: () => onRestoreDefaults('layouts'),
                icon: Zap
              } : undefined}
              className="col-span-full w-full py-16 border border-dashed border-[var(--border-color)] rounded-lg bg-[var(--text-primary)]/5"
            />
          ) : (
            filteredLayouts.map((layout) => (
              <Card key={layout.id} className="bg-[var(--text-primary)]/5 border-[var(--border-color)] hover:border-[var(--accent-primary)]/30 transition-all group overflow-hidden w-full min-w-0">
                <CardHeader className="p-4 pb-2 border-none">
                  <div className="flex items-center justify-between gap-3 min-w-0">
                     <span className="text-[12px] font-bold text-[var(--text-primary)] tracking-tight uppercase truncate flex-1">{layout.name}</span>
                     <Button
                        variant="ghost" size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-all hover:bg-ansi-red/10 hover:text-ansi-red shrink-0"
                        onClick={() => onRemoveLayout(layout.id)}
                      >
                        <Trash2 size={12} />
                      </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                   <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-10 grid gap-[1px] bg-[var(--text-primary)]/10 p-[1px] rounded-[2px] opacity-80 group-hover:opacity-100 transition-opacity shrink-0"
                        style={{
                          gridTemplateColumns: getGridCols(layout),
                          gridTemplateRows: getGridRows(layout)
                        }}
                      >
                        {Array.from({ length: getPaneCount(layout) }).map((_, i) => (
                          <div key={i} className="bg-[var(--bg-color)]/60" />
                        ))}
                      </div>
                      <div className="font-mono text-[10px] text-[var(--text-secondary)]">
                        <span className="text-[var(--text-primary)] font-bold">{layout.rows}X{layout.cols}</span> MATRIX
                      </div>
                   </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

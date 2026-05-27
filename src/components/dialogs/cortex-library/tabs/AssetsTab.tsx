import { useState } from "react";
import { Folder, Trash2, Layout, Database, Plus, X, FolderOpen, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SavedLayout, LayoutConfig } from "@/lib/setup-constants";
import { getGridCols, getGridRows, getPaneCount } from "@/lib/setup-utils";
import { cn } from "@/lib/utils";
import { open } from "@tauri-apps/plugin-dialog";
import { EmptyState } from "@/components/ui/empty-state";

interface AssetsTabProps {
  presets: { label: string; path: string }[];
  savedLayouts: SavedLayout[];
  searchQuery: string;
  onRemovePreset: (path: string) => void;
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
    if (newPresetPath.trim()) {
      const derivedName = newPresetPath.split(/[\\/]/).filter(Boolean).pop() || "ROOT";
      onAddPreset(derivedName.toUpperCase(), newPresetPath);
      setNewPresetPath("");
      setShowAddPreset(false);
    }
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

  return (
    <div className="space-y-12 pb-12">
      {/* SECTION: DIRECTORY PRESETS */}
      <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Database size={16} className="text-emerald-500/70" />
            </div>
            <div>
              <h3 className="text-[14px] font-bold text-white/90">Directory Presets</h3>
              <p className="text-[10px] text-white/30 font-medium uppercase tracking-wider">Fast-access workspace targets</p>
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
                showAddPreset ? "text-emerald-400 bg-emerald-500/10" : "text-white/30 hover:text-white"
              )}
            >
              {showAddPreset ? <X size={14} /> : <Plus size={14} />}
              {showAddPreset ? "CANCEL" : "ADD PRESET"}
            </Button>
          </div>
        </div>

        {showAddPreset && (
          <Card className="mb-6 bg-emerald-500/[0.03] border-emerald-500/20 p-5 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex flex-col gap-4">
              <div className="space-y-2 flex-1">
                <Label className="text-[10px] font-bold text-emerald-500/80 uppercase tracking-wider">Target Directory Path</Label>
                <div className="flex gap-3">
                  <Input 
                    placeholder="C:\Users\...\Project"
                    className="bg-black/20 border-white/5 text-[13px] font-mono h-9 flex-1"
                    value={newPresetPath}
                    onChange={(e) => setNewPresetPath(e.target.value)}
                  />
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleBrowse}
                    className="h-9 gap-2 border-white/10 bg-white/5 hover:bg-white/10 font-mono text-[10px] font-bold tracking-wider"
                  >
                    <FolderOpen size={14} /> BROWSE
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-emerald-500/10 pt-4 mt-1">
                <div className="text-[10px] font-mono text-white/30 italic">
                  {newPresetPath ? (
                    <>Auto-Labeling as: <span className="text-emerald-400 font-bold">{(newPresetPath.split(/[\\/]/).filter(Boolean).pop() || "ROOT").toUpperCase()}</span></>
                  ) : "Select a path to automatically generate a preset label."}
                </div>
                <Button 
                  size="sm" 
                  onClick={handleAddPreset} 
                  disabled={!newPresetPath.trim()}
                  className="bg-emerald-500 text-black text-[11px] font-bold h-8 hover:bg-emerald-400 px-6"
                >
                  SAVE PRESET
                </Button>
              </div>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredPresets.length === 0 ? (
            <EmptyState 
              icon={Database}
              title={searchQuery ? "No Presets Found" : "No Directory Presets"}
              description={searchQuery 
                ? `No directory favorites matching "${searchQuery}" were discovered.`
                : "Save your frequent workspace paths for faster setup and easy access across sessions."
              }
              iconColor="text-emerald-500/40"
              action={!showAddPreset && !searchQuery ? {
                label: "Define First Preset",
                onClick: () => setShowAddPreset(true),
                icon: Plus
              } : undefined}
              className="col-span-full w-full py-12 border border-dashed border-white/5 rounded-lg bg-white/[0.01]"
            />
          ) : (
            filteredPresets.map((preset) => (
              <Card key={preset.path} className="bg-white/[0.02] border-white/5 hover:border-emerald-500/30 transition-all group">
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <Folder size={16} className="text-white/20 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-[12px] font-bold text-white/80 truncate uppercase tracking-tight">{preset.label}</div>
                      <div className="text-[10px] text-white/30 truncate font-mono">{preset.path}</div>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" size="icon" 
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/10 hover:text-red-400"
                    onClick={() => onRemovePreset(preset.path)}
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
            <div className="w-8 h-8 rounded bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <Layout size={16} className="text-blue-500/70" />
            </div>
            <div>
              <h3 className="text-[14px] font-bold text-white/90">Custom Pane Grids</h3>
              <p className="text-[10px] text-white/30 font-medium uppercase tracking-wider">Saved terminal arrangements</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
             {!showAddLayout && savedLayouts.length > 0 && savedLayouts.length < 5 && (
               <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onRestoreDefaults('layouts')}
                className="h-8 px-3 font-mono text-[9px] font-bold text-white/20 hover:text-blue-400 hover:bg-blue-500/5"
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
                showAddLayout ? "text-blue-400 bg-blue-500/10" : "text-white/30 hover:text-white"
              )}
            >
              {showAddLayout ? <X size={14} /> : <Plus size={14} />}
              {showAddLayout ? "CANCEL" : "ADD LAYOUT"}
            </Button>
          </div>
        </div>

        {showAddLayout && (
          <Card className="mb-6 bg-blue-500/[0.03] border-blue-500/20 p-5 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-5">
              <div className="space-y-2 md:col-span-1">
                <Label className="text-[10px] font-bold text-blue-500/80 uppercase tracking-wider">Layout Name (Optional)</Label>
                <Input 
                  placeholder={`Leave blank for \"${newLayoutRows}X${newLayoutCols}\"`}
                  className="bg-black/20 border-white/5 text-[13px] h-9"
                  value={newLayoutName}
                  onChange={(e) => setNewLayoutName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-blue-500/80 uppercase tracking-wider">Rows (1-4)</Label>
                <Input 
                  type="number"
                  min={1} max={4}
                  className="bg-black/20 border-white/5 text-[13px] h-9 text-center font-mono"
                  value={newLayoutRows}
                  onChange={(e) => setNewLayoutRows(Math.min(4, Math.max(1, parseInt(e.target.value) || 1)))}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-blue-500/80 uppercase tracking-wider">Cols (1-4)</Label>
                <Input 
                  type="number"
                  min={1} max={4}
                  className="bg-black/20 border-white/5 text-[13px] h-9 text-center font-mono"
                  value={newLayoutCols}
                  onChange={(e) => setNewLayoutCols(Math.min(4, Math.max(1, parseInt(e.target.value) || 1)))}
                />
              </div>
            </div>
            
            <div className="flex items-center justify-between border-t border-white/5 pt-4">
              <div className="flex items-center gap-4">
                <div 
                  className="w-10 h-8 grid gap-[1px] bg-white/10 p-[1px] rounded-[2px]"
                  style={{
                    gridTemplateColumns: `repeat(${newLayoutCols}, 1fr)`,
                    gridTemplateRows: `repeat(${newLayoutRows}, 1fr)`
                  }}
                >
                  {Array.from({ length: newLayoutRows * newLayoutCols }).map((_, i) => (
                    <div key={i} className="bg-black/60" />
                  ))}
                </div>
                <div className="text-[10px] font-mono text-white/40">
                   IDENTIFIER: <span className="text-blue-400 font-bold">{newLayoutName.trim() ? newLayoutName.toUpperCase() : `${newLayoutRows}X${newLayoutCols}`}</span>
                </div>
              </div>
              <Button 
                size="sm" 
                onClick={handleAddLayout} 
                className="bg-blue-600 text-white text-[11px] font-bold h-8 hover:bg-blue-500 px-6"
              >
                SAVE CUSTOM LAYOUT
              </Button>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {filteredLayouts.length === 0 ? (
            <EmptyState 
              icon={Layout}
              title={searchQuery ? "No Layouts Found" : "No Pane Layouts Configured"}
              description={searchQuery 
                ? `No grid arrangements matching "${searchQuery}" were discovered.`
                : "Define and save your preferred terminal grid arrangements, from simple splits to complex matrices."
              }
              iconColor="text-blue-500/40"
              action={!showAddLayout && !searchQuery ? {
                label: "Install Starter Pack",
                onClick: () => onRestoreDefaults('layouts'),
                icon: Zap
              } : undefined}
              className="col-span-full w-full py-16 border border-dashed border-white/5 rounded-lg bg-white/[0.01]"
            />
          ) : (
            filteredLayouts.map((layout) => (
              <Card key={layout.id} className="bg-white/[0.02] border-white/5 hover:border-blue-500/30 transition-all group overflow-hidden">
                <CardHeader className="p-4 pb-2 border-none">
                  <div className="flex items-center justify-between">
                     <span className="text-[12px] font-bold text-white/80 tracking-tight uppercase">{layout.name}</span>
                     <Button 
                        variant="ghost" size="icon" 
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/10 hover:text-red-400"
                        onClick={() => onRemoveLayout(layout.id)}
                      >
                        <Trash2 size={12} />
                      </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                   <div className="flex items-center gap-3">
                      <div 
                        className="w-12 h-10 grid gap-[1px] bg-white/10 p-[1px] rounded-[2px] opacity-40 group-hover:opacity-100 transition-opacity"
                        style={{
                          gridTemplateColumns: getGridCols(layout),
                          gridTemplateRows: getGridRows(layout)
                        }}
                      >
                        {Array.from({ length: getPaneCount(layout) }).map((_, i) => (
                          <div key={i} className="bg-black/60" />
                        ))}
                      </div>
                      <div className="font-mono text-[10px] text-white/30">
                        <span className="text-white/60 font-bold">{layout.rows}X{layout.cols}</span> MATRIX
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

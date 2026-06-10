import { useState } from "react";
import { Folder, Trash2, Database, Plus, FolderOpen, Archive, RotateCcw } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { truncatePath, cn } from "@/lib/utils";
import { open } from "@tauri-apps/plugin-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ViewMode } from "@/components/ui/view-toggle";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";

import { DirectoryPreset } from "@/types";

interface PresetsTabProps {
  presets: DirectoryPreset[];
  searchQuery: string;
  viewMode: ViewMode;
  selectedIds: Set<string>;
  onToggleSelection: (id: string) => void;
  archivedSelectedIds: Set<string>;
  setArchivedSelectedIds: (ids: Set<string>) => void;
  onArchive: (id: string) => void;
  onUnarchive: (id: string) => void;
  onDelete: (id: string) => void;
  onAdd: (label: string, path: string) => void;
  isAdding: boolean;
  setIsAdding: (adding: boolean) => void;
  activeSubTab: string;
  onSubTabChange: (tab: string) => void;
}

export function PresetsTab({
  presets,
  searchQuery,
  viewMode,
  selectedIds,
  onToggleSelection,
  archivedSelectedIds,
  setArchivedSelectedIds,
  onArchive,
  onUnarchive,
  onDelete,
  onAdd,
  isAdding,
  setIsAdding,
  activeSubTab,
  onSubTabChange
}: PresetsTabProps) {
  const [newPresetPath, setNewPresetPath] = useState("");

  const activePresets = presets.filter(p => !p.isArchived);
  const archivedPresets = presets.filter(p => p.isArchived);

  const filtered = activePresets.filter(p =>
    p.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.path.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const archivedFiltered = archivedPresets.filter(p =>
    p.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.path.toLowerCase().includes(searchQuery.toLowerCase())
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

  const handleSave = () => {
    const trimmedPath = newPresetPath.trim();
    if (!trimmedPath) return;
    const derivedName = trimmedPath.split(/[\\/]/).filter(Boolean).pop() || "ROOT";
    onAdd(derivedName.toUpperCase(), trimmedPath);
    setNewPresetPath("");
    setIsAdding(false);
  };

  const renderActiveContent = () => {
    if (filtered.length === 0) {
      return (
        <EmptyState
          icon={Database}
          title={searchQuery ? "No Presets Found" : "No Active Presets"}
          description={searchQuery
            ? `No directory favorites matching "${searchQuery}" were discovered.`
            : "Save your frequent workspace paths for faster setup and easy access across sessions."
          }
          iconColor="text-[var(--accent-primary)]/40"
          compact
        />
      );
    }

    if (viewMode === 'card') {
      return (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {filtered.map((preset) => (
            <PresetCard
              key={preset.id}
              preset={preset}
              isSelected={selectedIds.has(preset.id)}
              onToggleSelection={() => onToggleSelection(preset.id)}
              onArchive={() => onArchive(preset.id)}
            />
          ))}
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10" />
            <TableHead className="text-[10px] font-semibold text-[var(--text-secondary)]/50">Label</TableHead>
            <TableHead className="text-[10px] font-semibold text-[var(--text-secondary)]/50">Path</TableHead>
            <TableHead className="w-16 text-right" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((preset) => (
            <TableRow key={preset.id}>
              <TableCell>
                <div
                  onClick={() => onToggleSelection(preset.id)}
                  className={cn(
                    "w-4 h-4 rounded border transition-all flex items-center justify-center cursor-pointer",
                    selectedIds.has(preset.id)
                      ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]"
                      : "border-[var(--border-color)] hover:border-[var(--text-primary)]/30"
                  )}
                >
                  {selectedIds.has(preset.id) && (
                    <Plus size={10} className="text-black rotate-45" />
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-6 rounded bg-[var(--accent-primary)]/5 border border-[var(--accent-primary)]/10 flex items-center justify-center shrink-0">
                    <Folder size={12} className="text-[var(--accent-primary)]" />
                  </div>
                  <span className="text-[12px] font-bold text-[var(--text-primary)] tracking-tight">{preset.label}</span>
                </div>
              </TableCell>
              <TableCell>
                <span className="text-[11px] font-mono text-[var(--text-secondary)]/70">{truncatePath(preset.path, 35)}</span>
              </TableCell>
              <TableCell className="text-right">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon-xs" className="text-[var(--text-secondary)]/50 hover:text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/5" onClick={() => onArchive(preset.id)}>
                      <Archive size={12} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Archive</TooltipContent>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  const toggleArchivedSelection = (id: string) => {
    const next = new Set(archivedSelectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setArchivedSelectedIds(next);
  };

  const toggleSelectAllArchived = () => {
    if (archivedSelectedIds.size === archivedFiltered.length) {
      setArchivedSelectedIds(new Set());
    } else {
      setArchivedSelectedIds(new Set(archivedFiltered.map(p => p.id)));
    }
  };

  const renderArchivedContent = () => {
    if (archivedFiltered.length === 0) {
      return (
        <EmptyState
          icon={Archive}
          title="No Archived Presets"
          description={searchQuery
            ? `No archived presets matching "${searchQuery}" were found.`
            : "Archived presets will appear here."
          }
          iconColor="text-[var(--text-secondary)]/30"
          compact
        />
      );
    }

    return (
      <>
        {viewMode === 'card' ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {archivedFiltered.map((preset) => (
              <PresetCard
                key={preset.id}
                preset={preset}
                isSelected={archivedSelectedIds.has(preset.id)}
                onToggleSelection={() => toggleArchivedSelection(preset.id)}
                onArchive={undefined} // No archive button in archived view
                onRestore={() => onUnarchive(preset.id)}
                onDelete={() => onDelete(preset.id)}
              />
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10" />
                <TableHead className="text-[10px] font-semibold text-[var(--text-secondary)]/50">Label</TableHead>
                <TableHead className="text-[10px] font-semibold text-[var(--text-secondary)]/50">Path</TableHead>
                <TableHead className="w-24 text-right text-[10px] font-semibold text-[var(--text-secondary)]/50">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {archivedFiltered.map((preset) => (
                <TableRow key={preset.id} className={cn(
                  "transition-all",
                  archivedSelectedIds.has(preset.id)
                    ? "bg-[var(--accent-primary)]/[0.03] hover:bg-[var(--accent-primary)]/[0.05]"
                    : "text-[var(--text-secondary)]/70 hover:bg-[var(--text-primary)]/[0.02]"
                )}>
                  <TableCell>
                    <div
                      onClick={() => toggleArchivedSelection(preset.id)}
                      className={cn(
                        "w-4 h-4 rounded border transition-all flex items-center justify-center cursor-pointer",
                        archivedSelectedIds.has(preset.id)
                          ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]"
                          : "border-[var(--border-color)] hover:border-[var(--text-primary)]/30"
                      )}
                    >
                      {archivedSelectedIds.has(preset.id) && (
                        <Plus size={10} className="text-black rotate-45" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-6 rounded bg-[var(--text-secondary)]/5 border border-[var(--border-color)]/50 flex items-center justify-center shrink-0">
                        <Folder size={12} className="text-[var(--text-secondary)]/50" />
                      </div>
                      <span className="text-[12px] font-medium text-[var(--text-primary)]/60 tracking-tight">{preset.label}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-[11px] font-mono">{truncatePath(preset.path, 35)}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon-xs" className="text-[var(--text-secondary)]/50 hover:text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/5" onClick={() => onUnarchive(preset.id)}>
                            <RotateCcw size={12} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">Restore</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon-xs" className="text-[var(--text-secondary)]/50 hover:text-red-400 hover:bg-red-500/10" onClick={() => onDelete(preset.id)}>
                            <Trash2 size={12} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">Delete</TooltipContent>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </>
    );
  };

  return (
    <div className="space-y-6">
      {isAdding && (
        <Card className="bg-[var(--accent-primary)]/[0.03] border border-[var(--accent-primary)]/20 ring-0 shadow-none p-5 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex flex-col gap-4">
            <div className="space-y-2 flex-1">
          <Label className="text-[10px] font-bold text-[var(--accent-primary)]/80 tracking-wider">Target Directory Path</Label>
              <div className="flex gap-3">
                <Input
                  autoFocus
                  placeholder="C:\\Users\\...\\Project"
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
                  <FolderOpen size={14} /> Browse
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
                <Button variant="ghost" size="sm" onClick={() => setIsAdding(false)} className="text-[11px] h-8 text-[var(--text-secondary)]">Cancel</Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={!newPresetPath.trim()}
                  className="bg-[var(--accent-primary)] text-[var(--accent-contrast)] text-[11px] font-bold h-8 hover:opacity-90 px-6"
                >
                  Save Preset
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      <Tabs value={activeSubTab} onValueChange={onSubTabChange} className="space-y-4">
        <div className="flex items-center justify-between mb-2">
          <TabsList className="bg-[var(--text-primary)]/[0.03]">
            <TabsTrigger value="active" className="text-[11px] font-bold tracking-wider">
              Active ({activePresets.length})
            </TabsTrigger>
            <TabsTrigger value="archived" className="text-[11px] font-bold tracking-wider">
              Archived ({archivedPresets.length})
            </TabsTrigger>
          </TabsList>

          <Button
            onClick={() => setIsAdding(!isAdding)}
            className="h-8 px-4 text-[11px] font-bold bg-[var(--accent-primary)] text-[var(--accent-contrast)] hover:opacity-90 rounded-md transition-all flex gap-2"
          >
            <Plus size={14} strokeWidth={3} className={cn("transition-transform duration-300", isAdding && "rotate-45")} /> {isAdding ? "Cancel" : "Add Preset"}
          </Button>
        </div>

        <TabsContent value="active">
          {renderActiveContent()}
        </TabsContent>

        <TabsContent value="archived">
          {renderArchivedContent()}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PresetCard({ preset, isSelected, onToggleSelection, onArchive, onRestore, onDelete }: {
  preset: DirectoryPreset;
  isSelected?: boolean;
  onToggleSelection?: () => void;
  onArchive?: () => void;
  onRestore?: () => void;
  onDelete?: () => void;
}) {
  return (
    <Card
      className={cn(
        "group relative flex flex-col p-0 bg-[var(--text-primary)]/[0.02] hover:bg-[var(--text-primary)]/[0.04] transition-all duration-300 cursor-default overflow-hidden border",
        isSelected ? "border-[var(--accent-primary)]/40 bg-[var(--accent-primary)]/[0.03]" : "border-[var(--border-color)]"
      )}
    >
      <CardHeader className="p-4 pb-2 border-none group/header">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-8 rounded bg-[var(--accent-primary)]/5 border border-[var(--accent-primary)]/10 flex items-center justify-center shrink-0 mt-0.5">
             <Folder size={18} className="text-[var(--accent-primary)]" />
          </div>
          <div className="flex-1 min-w-0 flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              {onToggleSelection && (
                <div
                  onClick={onToggleSelection}
                  className={cn(
                    "w-4 h-4 rounded border transition-all flex items-center justify-center cursor-pointer shrink-0",
                    isSelected ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]" : "border-[var(--border-color)] hover:border-[var(--text-primary)]/30"
                  )}
                >
                  {isSelected && <Plus size={10} className="text-black rotate-45" />}
                </div>
              )}
              <CardTitle className="text-[13px] font-bold truncate text-[var(--text-primary)] group-hover/header:text-[var(--accent-primary)] transition-colors leading-tight tracking-tight">
                {preset.label}
              </CardTitle>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-secondary)] font-mono min-w-0">
              <FolderOpen size={10} className="shrink-0 opacity-80" />
              <span className="block flex-1 truncate whitespace-nowrap">{truncatePath(preset.path, 35)}</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardFooter className="px-4 py-2 border-t border-[var(--border-color)] bg-[var(--bg-color)]/20 flex items-center justify-between">
         <span className="text-[9px] text-[var(--text-secondary)] font-medium tracking-wider opacity-60">Directory Preset</span>
         <div className="flex items-center gap-2.5">
            {onArchive && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-[var(--text-secondary)]/60 opacity-0 group-hover:opacity-100 transition-all hover:bg-[var(--accent-primary)]/5 hover:text-[var(--accent-primary)] active:scale-95" onClick={onArchive}>
                    <Archive size={13} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Archive Preset</TooltipContent>
              </Tooltip>
            )}
            {onRestore && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-[var(--text-secondary)]/60 opacity-0 group-hover:opacity-100 transition-all hover:bg-[var(--accent-primary)]/5 hover:text-[var(--accent-primary)] active:scale-95" onClick={onRestore}>
                    <RotateCcw size={13} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Restore Preset</TooltipContent>
              </Tooltip>
            )}
            {onDelete && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-[var(--text-secondary)]/60 opacity-0 group-hover:opacity-100 transition-all hover:text-red-400 hover:bg-red-500/10 active:scale-95"
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                  >
                    <Trash2 size={13} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-[10px]">Delete Permanently</TooltipContent>
              </Tooltip>
            )}
         </div>
      </CardFooter>
    </Card>
  );
}

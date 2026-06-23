import { useState, useEffect } from "react";
import {
  Folder,
  Trash2,
  Database,
  Plus,
  FolderOpen,
  Archive,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  X,
} from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { truncatePath, cn } from "@/lib/utils";
import { open } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";
import { EmptyState } from "@/components/ui/empty-state";
import { Spotlight } from "@/components/ui/spotlight";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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

import { DirectoryPreset } from "@/lib";

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
  onSubTabChange,
}: PresetsTabProps) {
  const [newPresetPath, setNewPresetPath] = useState("");
  const [pathError, setPathError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  // Synchronize/reset validation state when the form is toggled
  useEffect(() => {
    if (!isAdding) {
      setNewPresetPath("");
      setPathError(null);
      setIsValidating(false);
    }
  }, [isAdding]);

  // Debounced validation for manual text entries
  useEffect(() => {
    const trimmed = newPresetPath.trim();
    if (!trimmed) {
      setPathError(null);
      return;
    }

    setIsValidating(true);
    const timer = setTimeout(async () => {
      try {
        const isValid = await invoke<boolean>("validate_directory", { path: trimmed });
        if (!isValid) {
          setPathError("Directory path does not exist or is not a valid folder.");
        } else {
          setPathError(null);
        }
      } catch (err) {
        setPathError("Failed to validate directory path.");
      } finally {
        setIsValidating(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [newPresetPath]);

  const activePresets = presets.filter((p) => !p.isArchived);
  const archivedPresets = presets.filter((p) => p.isArchived);

  const filtered = activePresets.filter(
    (p) =>
      p.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.path.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const archivedFiltered = archivedPresets.filter(
    (p) =>
      p.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.path.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleBrowse = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: "Select Preset Directory",
      });
      if (selected && typeof selected === "string") {
        setNewPresetPath(selected);
      }
    } catch (err) {
      console.error("Failed to open directory dialog:", err);
    }
  };

  const handleSave = async () => {
    const trimmedPath = newPresetPath.trim();
    if (!trimmedPath || pathError || isValidating) return;

    setIsValidating(true);
    try {
      const isValid = await invoke<boolean>("validate_directory", { path: trimmedPath });
      if (!isValid) {
        setPathError("Directory path does not exist or is not a valid folder.");
        setIsValidating(false);
        return;
      }
    } catch (err) {
      setPathError("Failed to validate directory path.");
      setIsValidating(false);
      return;
    } finally {
      setIsValidating(false);
    }

    const derivedName =
      trimmedPath.split(/[\\/]/).filter(Boolean).pop() || "ROOT";
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
          description={
            searchQuery
              ? `No directory favorites matching "${searchQuery}" were discovered.`
              : "Save your frequent workspace paths for faster setup and easy access across sessions."
          }
          iconColor="text-[var(--accent-primary)]/40"
          action={!isAdding && !searchQuery ? {
            label: "Add Preset",
            onClick: () => setIsAdding(true),
            icon: Plus,
          } : undefined}
          compact
        />
      );
    }

    if (viewMode === "card") {
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
            <TableHead className="text-[10px] font-semibold text-[var(--text-secondary)]/50">
              Label
            </TableHead>
            <TableHead className="text-[10px] font-semibold text-[var(--text-secondary)]/50">
              Path
            </TableHead>
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
                      : "border-[var(--border-color)] hover:border-[var(--accent-primary)]/50",
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
                    <Folder
                      size={12}
                      className="text-[var(--accent-primary)]"
                    />
                  </div>
                  <span className="text-[12px] font-bold text-[var(--text-primary)] tracking-tight">
                    {preset.label}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <span className="text-[11px] text-[var(--text-secondary)]/70 font-medium">
                  {truncatePath(preset.path, 35)}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="text-[var(--text-secondary)]/50 hover:text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/5"
                      onClick={() => onArchive(preset.id)}
                    >
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

  const renderArchivedContent = () => {
    if (archivedFiltered.length === 0) {
      return (
        <EmptyState
          icon={Archive}
          title="No Archived Presets"
          description={
            searchQuery
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
        {viewMode === "card" ? (
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
                <TableHead className="text-[10px] font-semibold text-[var(--text-secondary)]/50">
                  Label
                </TableHead>
                <TableHead className="text-[10px] font-semibold text-[var(--text-secondary)]/50">
                  Path
                </TableHead>
                <TableHead className="w-24 text-right text-[10px] font-semibold text-[var(--text-secondary)]/50">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {archivedFiltered.map((preset) => (
                <TableRow
                  key={preset.id}
                  className={cn(
                    "transition-all",
                    archivedSelectedIds.has(preset.id)
                      ? "bg-[var(--accent-primary)]/[0.03] hover:bg-[var(--accent-primary)]/[0.05]"
                      : "text-[var(--text-secondary)]/70 hover:bg-[var(--text-primary)]/[0.02]",
                  )}
                >
                  <TableCell>
                    <div
                      onClick={() => toggleArchivedSelection(preset.id)}
                      className={cn(
                        "w-4 h-4 rounded border transition-all flex items-center justify-center cursor-pointer",
                        archivedSelectedIds.has(preset.id)
                          ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]"
                          : "border-[var(--border-color)] hover:border-[var(--accent-primary)]/50",
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
                        <Folder
                          size={12}
                          className="text-[var(--text-secondary)]/50"
                        />
                      </div>
                      <span className="text-[12px] font-medium text-[var(--text-primary)]/60 tracking-tight">
                        {preset.label}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-[11px] font-medium text-[var(--text-secondary)]/70">
                      {truncatePath(preset.path, 35)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            className="text-[var(--text-secondary)]/50 hover:text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/5"
                            onClick={() => onUnarchive(preset.id)}
                          >
                            <RotateCcw size={12} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">Restore</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            className="text-[var(--text-secondary)]/50 hover:text-red-400 hover:bg-red-500/10"
                            onClick={() => onDelete(preset.id)}
                          >
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
        <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-300 mb-6">
            <div className="space-y-2 flex-1">
              <Label className="text-[10px] font-bold text-[var(--accent-primary)]/80 tracking-wider block mb-1">
                Target Directory Path
              </Label>
              
              <Spotlight
                className={cn(
                  "group relative flex items-center gap-2.5 rounded-lg border p-1.5 transition-all duration-500 shadow-sm",
                  pathError
                    ? "border-red-500/50 bg-red-500/[0.01]"
                    : newPresetPath && !pathError && !isValidating
                    ? "border-emerald-500/30 bg-emerald-500/[0.01]"
                    : "border-[var(--border-color)] bg-white/[0.01] focus-within:border-[var(--accent-primary)]/40 focus-within:bg-white/[0.03]",
                )}
                spotlightColor="rgba(var(--accent-primary-rgb), 0.05)"
              >
                <div
                  className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-md transition-all duration-500 shrink-0",
                    pathError
                      ? "bg-red-500/10 text-red-400"
                      : newPresetPath && !pathError && !isValidating
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-[var(--text-primary)]/5 text-[var(--text-secondary)] group-focus-within:text-[var(--accent-primary)]"
                  )}
                >
                  <FolderOpen size={16} />
                </div>

                <Input
                  autoFocus
                  type="text"
                  placeholder="C:\\Users\\...\\Project"
                  className="flex-1 h-8 border-none bg-transparent px-1 text-xs text-[var(--text-primary)] shadow-none focus-visible:ring-0 placeholder:text-[var(--text-secondary)]/30 font-bold"
                  value={newPresetPath}
                  onChange={(e) => setNewPresetPath(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newPresetPath.trim() && !pathError && !isValidating) {
                      handleSave();
                    }
                  }}
                />

                <div className="flex items-center gap-2 shrink-0">
                  {newPresetPath && (
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => setNewPresetPath("")}
                      className="h-7 w-7 text-[var(--text-secondary)] hover:text-red-400 hover:bg-red-400/5 rounded-md transition-all"
                    >
                      <X size={14} />
                    </Button>
                  )}
                  <div className="w-px h-5 bg-[var(--border-color)] opacity-40 mx-0.5" />
                  <Button
                    onClick={handleBrowse}
                    className="h-8 px-4 text-[11px] font-bold rounded-md flex items-center gap-1.5 bg-[var(--accent-primary)] text-[var(--accent-contrast)] hover:opacity-90 transition-all"
                  >
                    <FolderOpen size={14} />
                    Browse
                  </Button>
                </div>
              </Spotlight>

              {pathError && (
                <div className="text-[10px] text-red-400 font-bold mt-1.5 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-200 px-1">
                  <AlertCircle size={12} /> {pathError}
                </div>
              )}
              {newPresetPath && !pathError && !isValidating && (
                <div className="text-[10px] text-emerald-400 font-bold mt-1.5 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-200 px-1">
                  <CheckCircle2 size={12} /> Directory verified.
                </div>
              )}
            </div>
            <div className="flex items-center justify-between border-t border-[var(--accent-primary)]/10 pt-4 mt-1">
              <div className="text-[10px] text-[var(--text-secondary)]/70 italic font-medium">
                {newPresetPath && !pathError ? (
                  <>
                    Auto-Labeling as:{" "}
                    <span className="text-[var(--accent-primary)] font-bold">
                      {(
                        newPresetPath.split(/[\\/]/).filter(Boolean).pop() ||
                        "ROOT"
                      ).toUpperCase()}
                    </span>
                  </>
                ) : (
                  "Select a path to automatically generate a preset label."
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsAdding(false)}
                  className="text-[11px] h-8 text-[var(--text-secondary)]"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={!newPresetPath.trim() || !!pathError || isValidating}
                  className="bg-[var(--accent-primary)] text-[var(--accent-contrast)] text-[11px] font-bold h-8 hover:opacity-90 px-6"
                >
                  {isValidating ? "Validating..." : "Save Preset"}
                </Button>
              </div>
            </div>
          </div>
        )}

      <Tabs
        value={activeSubTab}
        onValueChange={onSubTabChange}
        className="space-y-4"
      >
        <div className="flex items-center justify-between mb-2">
          <TabsList className="bg-[var(--text-primary)]/[0.03]">
            <TabsTrigger
              value="active"
              className="text-[11px] font-bold tracking-wider"
            >
              Active ({activePresets.length})
            </TabsTrigger>
            <TabsTrigger
              value="archived"
              className="text-[11px] font-bold tracking-wider"
            >
              Archived ({archivedPresets.length})
            </TabsTrigger>
          </TabsList>

          <Button
            onClick={() => setIsAdding(!isAdding)}
            className="h-8 px-4 text-[11px] font-bold bg-[var(--accent-primary)] text-[var(--accent-contrast)] hover:opacity-90 rounded-md transition-all flex gap-2"
          >
            <Plus
              size={14}
              strokeWidth={3}
              className={cn(
                "transition-transform duration-300",
                isAdding && "rotate-45",
              )}
            />{" "}
            {isAdding ? "Cancel" : "Add Preset"}
          </Button>
        </div>

        <TabsContent value="active">{renderActiveContent()}</TabsContent>

        <TabsContent value="archived">{renderArchivedContent()}</TabsContent>
      </Tabs>
    </div>
  );
}

function PresetCard({
  preset,
  isSelected,
  onToggleSelection,
  onArchive,
  onRestore,
  onDelete,
}: {
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
        isSelected
          ? "border-[var(--accent-primary)]/40 bg-[var(--accent-primary)]/[0.03]"
          : "border-[var(--border-color)]",
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
                    isSelected
                      ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]"
                      : "border-[var(--border-color)] hover:border-[var(--accent-primary)]/50",
                  )}
                >
                  {isSelected && (
                    <Plus size={10} className="text-black rotate-45" />
                  )}
                </div>
              )}
              <CardTitle className="text-[13px] font-bold truncate text-[var(--text-primary)] group-hover/header:text-[var(--accent-primary)] transition-colors leading-tight tracking-tight">
                {preset.label}
              </CardTitle>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-secondary)]/70 font-medium min-w-0">
              <FolderOpen size={10} className="shrink-0 opacity-80" />
              <span className="block flex-1 truncate whitespace-nowrap">
                {truncatePath(preset.path, 35)}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardFooter className="px-4 py-2 border-t border-[var(--border-color)] bg-[var(--bg-color)]/20 flex items-center justify-between">
        <span className="text-[9px] text-[var(--text-secondary)] font-medium tracking-wider opacity-60">
          Directory Preset
        </span>
        <div className="flex items-center gap-2.5">
          {onArchive && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-[var(--text-secondary)]/60 opacity-0 group-hover:opacity-100 transition-all hover:bg-[var(--accent-primary)]/5 hover:text-[var(--accent-primary)] active:scale-95"
                  onClick={onArchive}
                >
                  <Archive size={13} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Archive Preset</TooltipContent>
            </Tooltip>
          )}
          {onRestore && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-[var(--text-secondary)]/60 opacity-0 group-hover:opacity-100 transition-all hover:bg-[var(--accent-primary)]/5 hover:text-[var(--accent-primary)] active:scale-95"
                  onClick={onRestore}
                >
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
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                >
                  <Trash2 size={13} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-[10px]">
                Delete Permanently
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}

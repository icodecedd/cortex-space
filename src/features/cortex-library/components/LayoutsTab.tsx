import { useState } from "react";
import { Layout, Trash2, Plus, Zap, Archive, RotateCcw } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SavedLayout, LayoutConfig } from "@/lib/setup-constants";
import { getGridCols, getGridRows, getPaneCount } from "@/lib/setup-utils";
import { cn } from "@/lib/utils";
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

interface LayoutsTabProps {
  savedLayouts: SavedLayout[];
  searchQuery: string;
  viewMode: ViewMode;
  selectedIds: Set<string>;
  onToggleSelection: (id: string) => void;
  archivedSelectedIds: Set<string>;
  setArchivedSelectedIds: (ids: Set<string>) => void;
  onArchive: (id: string) => void;
  onUnarchive: (id: string) => void;
  onDelete: (id: string) => void;
  onAdd: (name: string, config: LayoutConfig) => void;
  onRestoreDefaults: () => void;
  isAdding: boolean;
  setIsAdding: (adding: boolean) => void;
  activeSubTab: string;
  onSubTabChange: (tab: string) => void;
}

export function LayoutsTab({
  savedLayouts,
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
  onRestoreDefaults,
  isAdding,
  setIsAdding,
  activeSubTab,
  onSubTabChange
}: LayoutsTabProps) {
  const [newLayoutName, setNewLayoutName] = useState("");
  const [newLayoutRows, setNewLayoutRows] = useState(2);
  const [newLayoutCols, setNewLayoutCols] = useState(2);

  const activeLayouts = savedLayouts.filter(l => !l.isArchived);
  const archivedLayouts = savedLayouts.filter(l => l.isArchived);

  const filtered = activeLayouts.filter(l =>
    l.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const archivedFiltered = archivedLayouts.filter(l =>
    l.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSave = () => {
    const finalName = newLayoutName.trim()
      ? newLayoutName.toUpperCase()
      : `${newLayoutRows}X${newLayoutCols}`;

    onAdd(finalName, { rows: newLayoutRows, cols: newLayoutCols });
    setNewLayoutName("");
    setNewLayoutRows(2);
    setNewLayoutCols(2);
    setIsAdding(false);
  };

  const handleNumericInput = (val: string, setter: (n: number) => void) => {
    if (val === "") {
      setter(0);
      return;
    }
    const parsed = parseInt(val);
    if (!isNaN(parsed)) {
      setter(Math.min(4, Math.max(0, parsed)));
    }
  };

  const renderActiveContent = () => {
    if (filtered.length === 0) {
      return (
        <EmptyState
          icon={Layout}
          title={searchQuery ? "No Layouts Found" : "No Active Layouts"}
          description={searchQuery
            ? `No grid arrangements matching "${searchQuery}" were discovered.`
            : "Define and save your preferred terminal grid arrangements, from simple splits to complex layouts."
          }
          iconColor="text-[var(--accent-primary)]/40"
          action={!isAdding && !searchQuery && savedLayouts.length === 0 ? {
            label: "Install Starter Pack",
            onClick: onRestoreDefaults,
            icon: Zap
          } : undefined}
          compact
        />
      );
    }

    if (viewMode === 'card') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((layout) => (
            <LayoutCard
              key={layout.id}
              layout={layout}
              isSelected={selectedIds.has(layout.id)}
              onToggleSelection={() => onToggleSelection(layout.id)}
              onArchive={() => onArchive(layout.id)}
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
            <TableHead className="text-[10px] font-semibold text-[var(--text-secondary)]/50">Name</TableHead>
            <TableHead className="text-[10px] font-semibold text-[var(--text-secondary)]/50">Grid</TableHead>
            <TableHead className="text-[10px] font-semibold text-[var(--text-secondary)]/50">Preview</TableHead>
            <TableHead className="w-16 text-right" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((layout) => (
            <TableRow key={layout.id}>
              <TableCell>
                <div
                  onClick={() => onToggleSelection(layout.id)}
                  className={cn(
                    "w-4 h-4 rounded border transition-all flex items-center justify-center cursor-pointer",
                    selectedIds.has(layout.id)
                      ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]"
                      : "border-[var(--border-color)] hover:border-[var(--text-primary)]/30"
                  )}
                >
                    {selectedIds.has(layout.id) && (
                      <Plus size={10} className="text-black rotate-45" />
                    )}
                </div>
              </TableCell>
              <TableCell>
                <span className="text-[12px] font-bold text-[var(--text-primary)] tracking-tight">{layout.name}</span>
              </TableCell>
              <TableCell>
                <span className="text-[11px] font-mono text-[var(--text-primary)]/80 font-bold">{layout.rows}X{layout.cols}</span>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-6 grid gap-[1px] bg-[var(--text-primary)]/10 p-[1px] rounded-sm shrink-0"
                    style={{
                      gridTemplateColumns: getGridCols(layout),
                      gridTemplateRows: getGridRows(layout)
                    }}
                  >
                    {Array.from({ length: getPaneCount(layout) }).map((_, i) => (
                      <div key={i} className="bg-[var(--bg-color)]/60" />
                    ))}
                  </div>
                  <span className="text-[10px] text-[var(--text-secondary)]/60">{getPaneCount(layout)} panes</span>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon-xs" className="text-[var(--text-secondary)]/50 hover:text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/5" onClick={() => onArchive(layout.id)}>
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
          title="No Archived Layouts"
          description={searchQuery
            ? `No archived layouts matching "${searchQuery}" were found.`
            : "Archived grid arrangements will appear here."
          }
          iconColor="text-[var(--text-secondary)]/30"
          compact
        />
      );
    }

    return (
      <>
        {viewMode === 'card' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {archivedFiltered.map((layout) => (
              <LayoutCard
                key={layout.id}
                layout={layout}
                isSelected={archivedSelectedIds.has(layout.id)}
                onToggleSelection={() => toggleArchivedSelection(layout.id)}
                onArchive={undefined} // No archive button in archived view
                onRestore={() => onUnarchive(layout.id)}
                onDelete={() => onDelete(layout.id)}
              />
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10" />
                <TableHead className="text-[10px] font-semibold text-[var(--text-secondary)]/50">Name</TableHead>
                <TableHead className="text-[10px] font-semibold text-[var(--text-secondary)]/50">Grid</TableHead>
                <TableHead className="text-[10px] font-semibold text-[var(--text-secondary)]/50">Preview</TableHead>
                <TableHead className="w-24 text-right text-[10px] font-semibold text-[var(--text-secondary)]/50">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {archivedFiltered.map((layout) => (
                <TableRow key={layout.id} className={cn(
                  "transition-all",
                  archivedSelectedIds.has(layout.id)
                    ? "bg-[var(--accent-primary)]/[0.03] hover:bg-[var(--accent-primary)]/[0.05]"
                    : "text-[var(--text-secondary)]/70 hover:bg-[var(--text-primary)]/[0.02]"
                )}>
                  <TableCell>
                    <div
                      onClick={() => toggleArchivedSelection(layout.id)}
                      className={cn(
                        "w-4 h-4 rounded border transition-all flex items-center justify-center cursor-pointer",
                        archivedSelectedIds.has(layout.id)
                          ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]"
                          : "border-[var(--border-color)] hover:border-[var(--text-primary)]/30"
                      )}
                    >
                      {archivedSelectedIds.has(layout.id) && (
                        <Plus size={10} className="text-black rotate-45" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-[12px] font-medium text-[var(--text-primary)]/60 tracking-tight">{layout.name}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-[11px] font-mono">{layout.rows}X{layout.cols}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-8 h-6 grid gap-[1px] bg-[var(--text-primary)]/10 p-[1px] rounded-sm shrink-0 opacity-50"
                        style={{
                          gridTemplateColumns: getGridCols(layout),
                          gridTemplateRows: getGridRows(layout)
                        }}
                      >
                        {Array.from({ length: getPaneCount(layout) }).map((_, i) => (
                          <div key={i} className="bg-[var(--bg-color)]/60" />
                        ))}
                      </div>
                      <span className="text-[10px] text-[var(--text-secondary)]/40">{getPaneCount(layout)} panes</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon-xs" className="text-[var(--text-secondary)]/50 hover:text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/5" onClick={() => onUnarchive(layout.id)}>
                            <RotateCcw size={12} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">Restore</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon-xs" className="text-[var(--text-secondary)]/50 hover:text-red-400 hover:bg-red-500/10" onClick={() => onDelete(layout.id)}>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-5">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold text-ansi-blue tracking-wider">Rows (1-4)</Label>
              <Input
                autoFocus
                type="number"
                min={1} max={4}
                className="bg-[var(--text-primary)]/5 border-[var(--border-color)] text-[13px] h-9 text-center font-mono"
                value={newLayoutRows === 0 ? "" : newLayoutRows}
                onChange={(e) => handleNumericInput(e.target.value, setNewLayoutRows)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold text-ansi-blue tracking-wider">Cols (1-4)</Label>
              <Input
                type="number"
                min={1} max={4}
                className="bg-[var(--text-primary)]/5 border-[var(--border-color)] text-[13px] h-9 text-center font-mono"
                value={newLayoutCols === 0 ? "" : newLayoutCols}
                onChange={(e) => handleNumericInput(e.target.value, setNewLayoutCols)}
              />
            </div>
            <div className="space-y-2 md:col-span-1">
            <Label className="text-[10px] font-bold text-[var(--accent-primary)] tracking-wider">Layout Name (Optional)</Label>
              <Input
                placeholder={`Leave blank for "${newLayoutRows}X${newLayoutCols}"`}
                className="bg-[var(--text-primary)]/5 border-[var(--border-color)] text-[13px] h-9"
                value={newLayoutName}
                onChange={(e) => setNewLayoutName(e.target.value)}
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
                Identifier: <span className="text-[var(--accent-primary)] font-bold">{newLayoutName.trim() ? newLayoutName.toUpperCase() : `${newLayoutRows || 1}X${newLayoutCols || 1}`}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setIsAdding(false)} className="text-[11px] h-8 text-[var(--text-secondary)]">Cancel</Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={newLayoutRows < 1 || newLayoutCols < 1}
                className="bg-[var(--accent-primary)] text-[var(--accent-contrast)] text-[11px] font-bold h-8 hover:opacity-90 px-6"
              >
                Save Custom Layout
              </Button>
            </div>
          </div>
        </Card>
      )}

      <Tabs value={activeSubTab} onValueChange={onSubTabChange} className="space-y-4">
        <div className="flex items-center justify-between mb-2">
          <TabsList className="bg-[var(--text-primary)]/[0.03]">
            <TabsTrigger value="active" className="text-[11px] font-bold tracking-wider">
              Active ({activeLayouts.length})
            </TabsTrigger>
            <TabsTrigger value="archived" className="text-[11px] font-bold tracking-wider">
              Archived ({archivedLayouts.length})
            </TabsTrigger>
          </TabsList>

          <Button
            onClick={() => setIsAdding(!isAdding)}
            className="h-8 px-4 text-[11px] font-bold bg-[var(--accent-primary)] text-[var(--accent-contrast)] hover:opacity-90 rounded-md transition-all flex gap-2"
          >
            <Plus size={14} strokeWidth={3} className={cn("transition-transform duration-300", isAdding && "rotate-45")} /> {isAdding ? "Cancel" : "New Layout"}
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

function LayoutCard({ layout, isSelected, onToggleSelection, onArchive, onRestore, onDelete }: {
  layout: SavedLayout;
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
                {layout.name}
              </CardTitle>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-secondary)] font-mono min-w-0">
               <span className="text-[var(--text-primary)] font-bold">{layout.rows}X{layout.cols}</span> LAYOUT
            </div>
          </div>
        </div>
      </CardHeader>
      <CardFooter className="px-4 py-2 border-t border-[var(--border-color)] bg-[var(--bg-color)]/20 flex items-center justify-between">
         <span className="text-[9px] text-[var(--text-secondary)] font-medium tracking-wider opacity-60">Grid Arrangement</span>
         <div className="flex items-center gap-2.5">
            {onArchive && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-[var(--text-secondary)]/60 opacity-0 group-hover:opacity-100 transition-all hover:bg-[var(--accent-primary)]/5 hover:text-[var(--accent-primary)] active:scale-95" onClick={onArchive}>
                    <Archive size={13} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Archive Layout</TooltipContent>
              </Tooltip>
            )}
            {onRestore && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-[var(--text-secondary)]/60 opacity-0 group-hover:opacity-100 transition-all hover:bg-[var(--accent-primary)]/5 hover:text-[var(--accent-primary)] active:scale-95" onClick={onRestore}>
                    <RotateCcw size={13} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Restore Layout</TooltipContent>
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

import { useState, useMemo } from "react";
import {
  ChevronRightSquare,
  Plus,
  Terminal,
  Trash2,
  Archive,
  RotateCcw,
} from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Snippet } from "@/lib";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
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

interface SnippetsTabProps {
  snippets: Snippet[];
  searchQuery: string;
  viewMode: ViewMode;
  selectedIds: Set<string>;
  onToggleSelection: (id: string) => void;
  archivedSelectedIds: Set<string>;
  setArchivedSelectedIds: (ids: Set<string>) => void;
  onAdd: (label: string, command: string) => void;
  onDelete: (id: string) => void;
  onArchive?: (id: string) => void;
  onUnarchive?: (id: string) => void;
  onExecute: (snippet: Snippet, execute: boolean) => void;
  isAdding: boolean;
  setIsAdding: (adding: boolean) => void;
  activeSubTab: string;
  onSubTabChange: (tab: string) => void;
}

export function SnippetsTab({
  snippets,
  searchQuery,
  viewMode,
  selectedIds,
  onToggleSelection,
  archivedSelectedIds,
  setArchivedSelectedIds,
  onAdd,
  onDelete,
  onArchive,
  onUnarchive,
  onExecute,
  isAdding,
  setIsAdding,
  activeSubTab,
  onSubTabChange,
}: SnippetsTabProps) {
  // State lifted to CortexLibraryDialog to persist across sidebar navigation
  const [newLabel, setNewLabel] = useState("");
  const [newCommand, setNewCommand] = useState("");

  const activeSnippets = useMemo(
    () => snippets.filter((s) => !s.isArchived),
    [snippets],
  );

  const archivedSnippets = useMemo(
    () => snippets.filter((s) => s.isArchived),
    [snippets],
  );

  const filtered = useMemo(
    () =>
      activeSnippets.filter(
        (s) =>
          s.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.command.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [activeSnippets, searchQuery],
  );

  const archivedFiltered = useMemo(
    () =>
      archivedSnippets.filter(
        (s) =>
          s.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.command.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [archivedSnippets, searchQuery],
  );

  const handleSave = () => {
    if (newCommand.trim()) {
      onAdd(newLabel.trim(), newCommand.trim());
      setNewLabel("");
      setNewCommand("");
      setIsAdding(false);
    }
  };

  const renderActiveContent = () => {
    if (filtered.length === 0) {
      return (
        <EmptyState
          icon={Terminal}
          title={
            searchQuery ? "No Active Snippets Found" : "No Active Snippets"
          }
          description={
            searchQuery
              ? `No commands matching "${searchQuery}" were found.`
              : "Create new snippets or restore from the archived tab."
          }
          iconColor="text-[var(--accent-primary)]/40"
          action={
            !searchQuery
              ? {
                  label: "Create New Snippet",
                  onClick: () => setIsAdding(true),
                  icon: Plus,
                }
              : undefined
          }
          compact
        />
      );
    }

    if (viewMode === "card") {
      return (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {filtered.map((snippet) => (
            <SnippetCard
              key={snippet.id}
              snippet={snippet}
              isSelected={selectedIds.has(snippet.id)}
              onToggleSelection={() => onToggleSelection(snippet.id)}
              onArchive={onArchive ? () => onArchive(snippet.id) : undefined}
              onExecute={(exec) => onExecute(snippet, exec)}
            />
          ))}
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              {/* Select All Checkbox could go here but it needs to clear parent state */}
            </TableHead>
            <TableHead className="text-[10px] font-semibold text-[var(--text-secondary)]/50">
              Label
            </TableHead>
            <TableHead className="text-[10px] font-semibold text-[var(--text-secondary)]/50">
              Command
            </TableHead>
            <TableHead className="w-28 text-right" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((snippet) => (
            <TableRow key={snippet.id}>
              <TableCell>
                <div
                  onClick={() => onToggleSelection(snippet.id)}
                  className={cn(
                    "w-4 h-4 rounded border transition-all flex items-center justify-center cursor-pointer",
                    selectedIds.has(snippet.id)
                      ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]"
                      : "border-[var(--border-color)] hover:border-[var(--accent-primary)]/50",
                  )}
                >
                  {selectedIds.has(snippet.id) && (
                    <Plus size={10} className="text-black rotate-45" />
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-6 rounded bg-[var(--accent-primary)]/5 border border-[var(--accent-primary)]/10 flex items-center justify-center shrink-0">
                    <Terminal
                      size={12}
                      className="text-[var(--accent-primary)]"
                    />
                  </div>
                  <span className="text-[12px] font-bold text-[var(--text-primary)] tracking-tight">
                    {snippet.label}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1.5">
                  <ChevronRightSquare
                    size={10}
                    className="text-[var(--text-secondary)]/50 shrink-0"
                  />
                  <span className="text-[11px] font-mono text-[var(--text-secondary)]/70 truncate max-w-[300px]">
                    {snippet.command}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="xs"
                    className="text-[9px] font-bold text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/5 px-2 h-6"
                    onClick={() => onExecute(snippet, false)}
                  >
                    Inject
                  </Button>
                  <Button
                    size="xs"
                    className="text-[9px] font-bold bg-[var(--accent-primary)] text-[var(--accent-contrast)] px-2 h-6 hover:opacity-90"
                    onClick={() => onExecute(snippet, true)}
                  >
                    Run
                  </Button>
                  {onArchive && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          className="text-[var(--text-secondary)]/50 hover:text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/5"
                          onClick={() => onArchive(snippet.id)}
                        >
                          <Archive size={12} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">Archive</TooltipContent>
                    </Tooltip>
                  )}
                </div>
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
      setArchivedSelectedIds(new Set(archivedFiltered.map((s) => s.id)));
    }
  };

  const renderArchivedContent = () => {
    if (archivedFiltered.length === 0) {
      return (
        <EmptyState
          icon={Archive}
          title="No Archived Snippets"
          description={
            searchQuery
              ? `No archived snippets matching "${searchQuery}" were found.`
              : "Archived snippets will appear here."
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
            {archivedFiltered.map((snippet) => (
              <SnippetCard
                key={snippet.id}
                snippet={snippet}
                isSelected={archivedSelectedIds.has(snippet.id)}
                onToggleSelection={() => toggleArchivedSelection(snippet.id)}
                onArchive={undefined} // No archive button in archived view
                onExecute={undefined} // No execute in archived view
                onRestore={
                  onUnarchive ? () => onUnarchive(snippet.id) : undefined
                }
                onDelete={() => onDelete(snippet.id)}
              />
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <div
                    onClick={toggleSelectAllArchived}
                    className={cn(
                      "w-4 h-4 rounded border transition-all flex items-center justify-center cursor-pointer",
                      archivedSelectedIds.size > 0
                        ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]"
                        : "border-[var(--border-color)] hover:border-[var(--accent-primary)]/50",
                    )}
                  >
                    {archivedSelectedIds.size === archivedFiltered.length &&
                      archivedSelectedIds.size > 0 && (
                        <div className="w-2.5 h-2.5 rounded-sm bg-black" />
                      )}
                    {archivedSelectedIds.size > 0 &&
                      archivedSelectedIds.size < archivedFiltered.length && (
                        <div className="w-2 h-0.5 bg-black rounded-full" />
                      )}
                  </div>
                </TableHead>
                <TableHead className="text-[10px] font-semibold text-[var(--text-secondary)]/50">
                  Label
                </TableHead>
                <TableHead className="text-[10px] font-semibold text-[var(--text-secondary)]/50">
                  Command
                </TableHead>
                <TableHead className="w-24 text-right text-[10px] font-semibold text-[var(--text-secondary)]/50">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {archivedFiltered.map((snippet) => (
                <TableRow
                  key={snippet.id}
                  className={cn(
                    "transition-all",
                    archivedSelectedIds.has(snippet.id)
                      ? "bg-[var(--accent-primary)]/[0.03] hover:bg-[var(--accent-primary)]/[0.05]"
                      : "text-[var(--text-secondary)]/70 hover:bg-[var(--text-primary)]/[0.02]",
                  )}
                >
                  <TableCell>
                    <div
                      onClick={() => toggleArchivedSelection(snippet.id)}
                      className={cn(
                        "w-4 h-4 rounded border transition-all flex items-center justify-center cursor-pointer",
                        archivedSelectedIds.has(snippet.id)
                          ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]"
                          : "border-[var(--border-color)] hover:border-[var(--accent-primary)]/50",
                      )}
                    >
                      {archivedSelectedIds.has(snippet.id) && (
                        <Plus size={10} className="text-black rotate-45" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-6 rounded bg-[var(--text-secondary)]/5 border border-[var(--border-color)]/50 flex items-center justify-center shrink-0">
                        <Terminal
                          size={12}
                          className="text-[var(--text-secondary)]/50"
                        />
                      </div>
                      <span className="text-[12px] font-medium text-[var(--text-primary)]/60 tracking-tight">
                        {snippet.label}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-[11px] font-mono truncate max-w-[300px]">
                      {snippet.command}
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
                            onClick={() =>
                              onUnarchive && onUnarchive(snippet.id)
                            }
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
                            onClick={() => onDelete(snippet.id)}
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
        <AddSnippetForm
          label={newLabel}
          command={newCommand}
          onLabelChange={setNewLabel}
          onCommandChange={setNewCommand}
          onSave={handleSave}
          onCancel={() => setIsAdding(false)}
        />
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
              Active ({activeSnippets.length})
            </TabsTrigger>
            <TabsTrigger
              value="archived"
              className="text-[11px] font-bold tracking-wider"
            >
              Archived ({archivedSnippets.length})
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
            {isAdding ? "Cancel" : "New Snippet"}
          </Button>
        </div>

        <TabsContent value="active">{renderActiveContent()}</TabsContent>

        <TabsContent value="archived">{renderArchivedContent()}</TabsContent>
      </Tabs>
    </div>
  );
}

function AddSnippetForm({
  label,
  command,
  onLabelChange,
  onCommandChange,
  onSave,
  onCancel,
}: {
  label: string;
  command: string;
  onLabelChange: (v: string) => void;
  onCommandChange: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <Card className="bg-[var(--accent-primary)]/[0.03] border border-[var(--accent-primary)]/20 ring-0 shadow-none p-5 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-[var(--accent-primary)] tracking-wider">
            Terminal Command
          </label>
          <Input
            autoFocus
            placeholder="e.g. docker-compose up --build"
            className="bg-[var(--text-primary)]/5 border-[var(--border-color)] text-[13px] font-mono h-9"
            value={command}
            onChange={(e) => onCommandChange(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-[var(--accent-primary)] tracking-wider">
            Snippet Label
          </label>
          <Input
            placeholder="e.g. Docker Fresh Build"
            className="bg-[var(--text-primary)]/5 border-[var(--border-color)] text-[13px] h-9"
            value={label}
            onChange={(e) => onLabelChange(e.target.value)}
          />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="text-[11px] h-8 text-[var(--text-secondary)]"
        >
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={onSave}
          className="bg-[var(--accent-primary)] text-[var(--accent-contrast)] text-[11px] font-bold h-8 hover:opacity-90"
        >
          Save Snippet
        </Button>
      </div>
    </Card>
  );
}

function SnippetCard({
  snippet,
  isSelected,
  onToggleSelection,
  onArchive,
  onExecute,
  onRestore,
  onDelete,
}: {
  snippet: Snippet;
  isSelected: boolean;
  onToggleSelection: () => void;
  onArchive?: () => void;
  onExecute?: (exec: boolean) => void;
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
            <Terminal size={18} className="text-[var(--accent-primary)]" />
          </div>
          <div className="flex-1 min-w-0 flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
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
              <CardTitle className="text-[13px] font-bold truncate text-[var(--text-primary)] group-hover/header:text-[var(--accent-primary)] transition-colors leading-tight tracking-tight">
                {snippet.label}
              </CardTitle>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-secondary)] font-mono min-w-0">
              <ChevronRightSquare size={10} className="shrink-0 opacity-80" />
              <span className="block flex-1 truncate whitespace-nowrap">
                {snippet.command}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardFooter className="px-4 py-2 border-t border-[var(--border-color)] bg-[var(--bg-color)]/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {onExecute && (
            <>
              <Button
                variant="ghost"
                size="xs"
                className="text-[9px] font-bold text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/5 px-2 h-6"
                onClick={() => onExecute(false)}
              >
                Inject
              </Button>
              <Button
                size="xs"
                className="text-[9px] font-bold bg-[var(--accent-primary)] text-[var(--accent-contrast)] px-2 h-6 hover:opacity-90"
                onClick={() => onExecute(true)}
              >
                Run
              </Button>
            </>
          )}
          {!onExecute && (
            <span className="text-[9px] text-[var(--text-secondary)] font-medium tracking-wider opacity-60">
              Terminal Snippet
            </span>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          {onArchive && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-[var(--text-secondary)]/60 opacity-0 group-hover:opacity-100 transition-all hover:bg-[var(--accent-primary)]/5 hover:text-[var(--accent-primary)] active:scale-95"
                  onClick={(e) => {
                    e.stopPropagation();
                    onArchive();
                  }}
                >
                  <Archive size={13} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-[10px]">
                Archive Snippet
              </TooltipContent>
            </Tooltip>
          )}
          {onRestore && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-[var(--text-secondary)]/60 opacity-0 group-hover:opacity-100 transition-all hover:bg-[var(--accent-primary)]/5 hover:text-[var(--accent-primary)] active:scale-95"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRestore();
                  }}
                >
                  <RotateCcw size={13} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-[10px]">
                Restore
              </TooltipContent>
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

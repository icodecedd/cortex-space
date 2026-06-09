import { useState } from "react";
import { ChevronRightSquare, Plus, Terminal, Trash2, FolderOpen, Database } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Snippet } from "@/types";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface SnippetsTabProps {
  snippets: Snippet[];
  searchQuery: string;
  selectedIds: Set<string>;
  onToggleSelection: (id: string) => void;
  onAdd: (label: string, command: string) => void;
  onDelete: (id: string) => void;
  onExecute: (snippet: Snippet, execute: boolean) => void;
  isAdding: boolean;
  setIsAdding: (adding: boolean) => void;
}

export function SnippetsTab({
  snippets,
  searchQuery,
  selectedIds,
  onToggleSelection,
  onAdd,
  onDelete,
  onExecute,
  isAdding,
  setIsAdding
}: SnippetsTabProps) {
  const [newLabel, setNewLabel] = useState("");
  const [newCommand, setNewCommand] = useState("");

  const filtered = snippets.filter(s =>
    s.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.command.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSave = () => {
    if (newLabel.trim() && newCommand.trim()) {
      onAdd(newLabel.trim(), newCommand.trim());
      setNewLabel("");
      setNewCommand("");
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-4">
      {isAdding && (
        <Card className="bg-[var(--accent-primary)]/5 border-[var(--accent-primary)]/20 p-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[var(--accent-primary)] uppercase tracking-wider">Snippet Label</label>
              <Input
                autoFocus
                placeholder="e.g. Docker Fresh Build"
                className="bg-[var(--text-primary)]/5 border-[var(--border-color)] text-[13px] h-9"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[var(--accent-primary)] uppercase tracking-wider">Terminal Command</label>
              <Input
                placeholder="e.g. docker-compose up --build"
                className="bg-[var(--text-primary)]/5 border-[var(--border-color)] text-[13px] font-mono h-9"
                value={newCommand}
                onChange={(e) => setNewCommand(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsAdding(false)} className="text-[11px] h-8 text-[var(--text-secondary)] hover:text-[var(--text-primary)]">CANCEL</Button>
            <Button size="sm" onClick={handleSave} className="bg-[var(--accent-primary)] text-[var(--accent-contrast)] text-[11px] font-bold h-8 hover:opacity-90">SAVE SNIPPET</Button>
          </div>
        </Card>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          icon={Terminal}
          title={searchQuery ? "No Snippets Found" : "No Terminal Snippets"}
          description={searchQuery
            ? `No commands matching "${searchQuery}" were found in your snippet library.`
            : "Save your frequently used terminal commands as snippets to inject them instantly into any active pane."
          }
          iconColor="text-[var(--accent-primary)]/40"
          action={!isAdding && !searchQuery ? {
            label: "Create New Snippet",
            onClick: () => setIsAdding(true),
            icon: Plus
          } : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 px-2">
          {filtered.map(snippet => (
            <SnippetCard
              key={snippet.id}
              snippet={snippet}
              isSelected={selectedIds.has(snippet.id)}
              onToggleSelection={() => onToggleSelection(snippet.id)}
              onDelete={() => onDelete(snippet.id)}
              onExecute={(exec) => onExecute(snippet, exec)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SnippetCard({ snippet, isSelected, onToggleSelection, onDelete, onExecute }: {
  snippet: Snippet;
  isSelected: boolean;
  onToggleSelection: () => void;
  onDelete: () => void;
  onExecute: (exec: boolean) => void
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
             <Terminal size={18} className="text-[var(--accent-primary)]" />
          </div>
          
          <div className="flex-1 min-w-0 flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <div
                onClick={onToggleSelection}
                className={cn(
                  "w-4 h-4 rounded border transition-all flex items-center justify-center cursor-pointer shrink-0",
                  isSelected ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]" : "border-[var(--border-color)] hover:border-[var(--text-primary)]/30"
                )}
              >
                {isSelected && <Plus size={10} className="text-black rotate-45" />}
              </div>
              <CardTitle className="text-[13px] font-bold truncate text-[var(--text-primary)] group-hover/header:text-[var(--accent-primary)] transition-colors leading-tight uppercase tracking-tight">
                {snippet.label}
              </CardTitle>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-secondary)] font-mono min-w-0">
              <ChevronRightSquare size={10} className="shrink-0 opacity-80" /> 
              <span className="block flex-1 truncate whitespace-nowrap">{snippet.command}</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardFooter className="px-4 py-2 border-t border-[var(--border-color)] bg-[var(--bg-color)]/20 flex items-center justify-between">
         <div className="flex items-center gap-2">
            <Button
              variant="ghost" size="xs"
              className="text-[9px] font-bold text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/5 px-2 h-6"
              onClick={() => onExecute(false)}
            >
               INJECT
            </Button>
            <Button
              size="xs"
              className="text-[9px] font-bold bg-[var(--accent-primary)] text-[var(--accent-contrast)] px-2 h-6 hover:opacity-90"
              onClick={() => onExecute(true)}
            >
               RUN
            </Button>
         </div>
         
         <div className="flex items-center gap-2.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 text-[var(--text-secondary)]/60 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/10 hover:text-red-400 active:scale-95"
                  onClick={(e) => { e.stopPropagation(); onDelete(); }}
                >
                  <Trash2 size={13} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-[10px] bg-[var(--surface-color)] border-[var(--border-color)] text-[var(--text-primary)]">
                Delete Snippet
              </TooltipContent>
            </Tooltip>
         </div>
      </CardFooter>
    </Card>
  );
}

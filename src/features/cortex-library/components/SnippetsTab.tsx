import { useState } from "react";
import { ChevronRightSquare, Plus, Terminal, Trash2 } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Snippet } from "@/types";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";

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
        <div className="grid grid-cols-1 gap-3">
          {filtered.map(snippet => (
            <SnippetRow 
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

function SnippetRow({ snippet, isSelected, onToggleSelection, onDelete, onExecute }: { 
  snippet: Snippet; 
  isSelected: boolean;
  onToggleSelection: () => void;
  onDelete: () => void; 
  onExecute: (exec: boolean) => void 
}) {
  return (
    <div 
       className={cn(
         "group flex items-center justify-between p-4 bg-[var(--text-primary)]/[0.02] hover:bg-[var(--text-primary)]/[0.04] border rounded-lg transition-all cursor-default",
         isSelected ? "border-[var(--accent-primary)]/40 bg-[var(--accent-primary)]/[0.03]" : "border-[var(--border-color)]"
       )}
    >
       <div className="flex items-center gap-4 min-w-0">
          <div 
            onClick={onToggleSelection}
            className={cn(
              "w-5 h-5 rounded border transition-all flex items-center justify-center cursor-pointer shrink-0",
              isSelected ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]" : "border-[var(--border-color)] group-hover:border-[var(--text-primary)]/30"
            )}
          >
            {isSelected && <Plus size={12} className="text-black rotate-45" />}
          </div>

          <div className="w-10 h-10 rounded bg-[var(--accent-primary)]/5 border border-[var(--accent-primary)]/10 flex items-center justify-center shrink-0">
             <Terminal size={18} className="text-[var(--accent-primary)]" />
          </div>
          <div className="min-w-0">
             <h4 className="text-[13px] font-bold text-[var(--text-primary)] leading-none mb-1.5">{snippet.label}</h4>
             <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-[var(--bg-color)]/30 border border-[var(--border-color)] font-mono text-[11px] text-[var(--text-secondary)]">
                   <ChevronRightSquare size={10} />
                   <span className="truncate max-w-[300px] lg:max-w-[450px]">{snippet.command}</span>
                </div>
             </div>
          </div>
       </div>

       <div className="flex items-center gap-2">
          <Button 
            variant="ghost" size="sm" 
            className="text-[10px] font-bold text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/5 px-2 h-7"
            onClick={() => onExecute(false)}
          >
             INJECT
          </Button>
          <Button 
            size="sm" 
            className="text-[10px] font-bold bg-[var(--accent-primary)] text-[var(--accent-contrast)] px-3 h-7 hover:opacity-90"
            onClick={() => onExecute(true)}
          >
             RUN
          </Button>
          <div className="w-px h-4 bg-[var(--border-color)] mx-1" />
          <Button 
            variant="ghost" size="icon" 
            className="h-7 w-7 text-[var(--text-secondary)]/60 hover:bg-ansi-red/10 hover:text-ansi-red"
            onClick={onDelete}
          >
            <Trash2 size={14} />
          </Button>
       </div>
    </div>
  );
}

import { useState } from "react";
import { ChevronRightSquare, Plus, Terminal, Trash2 } from "lucide-react";
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
        <Card className="bg-amber-500/5 border-amber-500/20 p-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-amber-500/80 uppercase tracking-wider">Snippet Label</label>
              <Input 
                autoFocus
                placeholder="e.g. Docker Fresh Build"
                className="bg-black/20 border-white/5 text-[13px] h-9"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-amber-500/80 uppercase tracking-wider">Terminal Command</label>
              <Input 
                placeholder="e.g. docker-compose up --build"
                className="bg-black/20 border-white/5 text-[13px] font-mono h-9"
                value={newCommand}
                onChange={(e) => setNewCommand(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsAdding(false)} className="text-[11px] h-8 text-white/40 hover:text-white">CANCEL</Button>
            <Button size="sm" onClick={handleSave} className="bg-amber-500 text-black text-[11px] font-bold h-8 hover:bg-amber-400">SAVE SNIPPET</Button>
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
          iconColor="text-amber-500/40"
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
         "group flex items-center justify-between p-4 bg-white/[0.02] hover:bg-white/[0.04] border rounded-lg transition-all cursor-default",
         isSelected ? "border-[var(--accent-primary)]/40 bg-[var(--accent-primary)]/[0.03]" : "border-white/5"
       )}
    >
       <div className="flex items-center gap-4 min-w-0">
          <div 
            onClick={onToggleSelection}
            className={cn(
              "w-5 h-5 rounded border transition-all flex items-center justify-center cursor-pointer shrink-0",
              isSelected ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]" : "border-white/10 group-hover:border-white/30"
            )}
          >
            {isSelected && <Plus size={12} className="text-black rotate-45" />}
          </div>

          <div className="w-10 h-10 rounded bg-amber-500/5 border border-amber-500/10 flex items-center justify-center shrink-0">
             <Terminal size={18} className="text-amber-500/60" />
          </div>
          <div className="min-w-0">
             <h4 className="text-[13px] font-bold text-white/90 leading-none mb-1.5">{snippet.label}</h4>
             <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-black/30 border border-white/5 font-mono text-[11px] text-white/40">
                   <ChevronRightSquare size={10} />
                   <span className="truncate max-w-[300px] lg:max-w-[450px]">{snippet.command}</span>
                </div>
             </div>
          </div>
       </div>

       <div className="flex items-center gap-2">
          <Button 
            variant="ghost" size="sm" 
            className="text-[10px] font-bold text-white/20 hover:text-amber-500 hover:bg-amber-500/5 px-2 h-7"
            onClick={() => onExecute(false)}
          >
             INJECT
          </Button>
          <Button 
            size="sm" 
            className="text-[10px] font-bold bg-amber-500 text-black px-3 h-7 hover:opacity-90"
            onClick={() => onExecute(true)}
          >
             RUN
          </Button>
          <div className="w-px h-4 bg-white/5 mx-1" />
          <Button 
            variant="ghost" size="icon" 
            className="h-7 w-7 text-white/20 hover:bg-red-500/10 hover:text-red-400"
            onClick={onDelete}
          >
            <Trash2 size={14} />
          </Button>
       </div>
    </div>
  );
}

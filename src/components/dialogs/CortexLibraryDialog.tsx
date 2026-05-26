import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardFooter,
} from "@/components/ui/card";
import { SpaceTemplate, Snippet } from "@/types";
import { LayoutPreviewIcon } from "@/components/ui/layout-preview-icon";
import { Search, Plus, Trash2, Clock, Folder, ExternalLink, Code, Terminal, Rocket, ChevronRightSquare, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

function formatTimeAgo(date: string) {
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
}

interface CortexLibraryDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  templates: SpaceTemplate[];
  snippets: Snippet[];
  onLaunchTemplate: (template: SpaceTemplate) => void;
  onDeleteTemplate: (id: string) => void;
  onCaptureCurrent: () => void;
  onAddSnippet: (label: string, command: string) => void;
  onDeleteSnippet: (id: string) => void;
  onDeleteSnippets?: (ids: string[]) => void;
  onExecuteSnippet: (snippet: Snippet, execute: boolean) => void;
}

export function CortexLibraryDialog({
  isOpen,
  onOpenChange,
  templates,
  snippets,
  onLaunchTemplate,
  onDeleteTemplate,
  onCaptureCurrent,
  onAddSnippet,
  onDeleteSnippet,
  onDeleteSnippets,
  onExecuteSnippet
}: CortexLibraryDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("workspaces");
  const [selectedSnippetIds, setSelectedSnippetIds] = useState<Set<string>>(new Set());

  // Snippet Form State
  const [isAddingSnippet, setIsAddSnippet] = useState(false);
  const [newSnippetLabel, setNewSnippetLabel] = useState("");
  const [newSnippetCommand, setNewSnippetCommand] = useState("");

  const filteredTemplates = templates.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.rootPath.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSnippets = snippets.filter(s => 
    s.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.command.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddSnippet = () => {
    if (newSnippetLabel.trim() && newSnippetCommand.trim()) {
      onAddSnippet(newSnippetLabel.trim(), newSnippetCommand.trim());
      setNewSnippetLabel("");
      setNewSnippetCommand("");
      setIsAddSnippet(false);
    }
  };

  const toggleSnippetSelection = (id: string) => {
    const next = new Set(selectedSnippetIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedSnippetIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedSnippetIds.size === filteredSnippets.length) {
      setSelectedSnippetIds(new Set());
    } else {
      setSelectedSnippetIds(new Set(filteredSnippets.map(s => s.id)));
    }
  };

  const handleBulkDelete = () => {
    if (onDeleteSnippets && selectedSnippetIds.size > 0) {
      onDeleteSnippets(Array.from(selectedSnippetIds));
      setSelectedSnippetIds(new Set());
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent 
        showCloseButton={true}
        isDeep={true}
        open={isOpen}
        className="bg-[var(--surface-color)] border-[var(--border-color)] shadow-2xl flex flex-col p-0 gap-0 overflow-hidden"
        style={{
          maxWidth: "1000px",
          width: "calc(100% - 2rem)",
          height: "85vh",
          maxHeight: "900px",
        }}
      >
        <div className="flex h-full">
          {/* Sidebar / Navigation */}
          <div className="w-[200px] border-r border-white/5 bg-black/20 flex flex-col p-4 shrink-0">
             <div className="mb-8 px-2">
                <div className="flex items-center gap-2 mb-1">
                   <div className="w-5 h-5 bg-[var(--accent-primary)] rounded flex items-center justify-center">
                      <Zap size={12} className="text-black" fill="currentColor" />
                   </div>
                   <span className="font-bold text-[14px] tracking-tight">CORTEX LIB</span>
                </div>
                <span className="text-[10px] text-white/30 font-bold tracking-widest uppercase">Central Repository</span>
             </div>

             <nav className="flex-1 space-y-1">
                <button 
                   onClick={() => setActiveTab("workspaces")}
                   className={cn(
                     "w-full flex items-center gap-3 px-3 py-2 rounded-md text-[13px] font-medium transition-all",
                     activeTab === "workspaces" ? "bg-white/10 text-white" : "text-white/40 hover:text-white/60 hover:bg-white/5"
                   )}
                >
                   <Rocket size={16} />
                   Workspaces
                </button>
                <button 
                   onClick={() => setActiveTab("commands")}
                   className={cn(
                     "w-full flex items-center gap-3 px-3 py-2 rounded-md text-[13px] font-medium transition-all",
                     activeTab === "commands" ? "bg-white/10 text-white" : "text-white/40 hover:text-white/60 hover:bg-white/5"
                   )}
                >
                   <Code size={16} />
                   Snippets
                </button>
             </nav>

             <div className="mt-auto">
                <div className="p-3 rounded-lg bg-[var(--accent-primary)]/5 border border-[var(--accent-primary)]/10 space-y-2">
                   <p className="text-[10px] font-bold text-[var(--accent-primary)] uppercase tracking-wider">Storage Tip</p>
                   <p className="text-[10px] text-white/40 leading-relaxed">All items are stored locally in your app settings.</p>
                </div>
             </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
            <header className="p-6 pr-12 border-b border-white/5 flex items-center justify-between shrink-0">
               <div className="flex items-center gap-4 flex-1 max-w-xl">
                  {activeTab === 'commands' && filteredSnippets.length > 0 && (
                    <button 
                      onClick={toggleSelectAll}
                      className={cn(
                        "w-5 h-5 rounded border transition-all flex items-center justify-center shrink-0",
                        selectedSnippetIds.size > 0 ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]/10" : "border-white/10 hover:border-white/20"
                      )}
                    >
                      {selectedSnippetIds.size === filteredSnippets.length && <Plus size={12} className="text-[var(--accent-primary)] rotate-45" />}
                      {selectedSnippetIds.size > 0 && selectedSnippetIds.size < filteredSnippets.length && <div className="w-2 h-0.5 bg-[var(--accent-primary)] rounded-full" />}
                    </button>
                  )}
                  <div className="relative flex-1">
                    <Search 
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" 
                    />
                    <Input 
                      placeholder={`Search ${activeTab === 'workspaces' ? 'templates' : 'snippets'}...`}
                      className="pl-9 text-[13px] h-[36px] bg-white/5 border-white/5 focus-visible:ring-1 focus-visible:ring-[var(--accent-primary)]/50"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
               </div>

               {activeTab === 'workspaces' ? (
                  <Button 
                    onClick={onCaptureCurrent}
                    className="ml-4 h-[36px] px-4 text-[12px] font-bold bg-[var(--accent-primary)] text-black hover:opacity-90 rounded-md shadow-[0_0_20px_rgba(var(--accent-primary-rgb),0.1)] transition-all"
                  >
                    <Plus size={16} className="mr-1.5" /> CAPTURE CURRENT
                  </Button>
               ) : (
                  <Button 
                    onClick={() => setIsAddSnippet(true)}
                    className="ml-4 h-[36px] px-4 text-[12px] font-bold bg-amber-500 text-black hover:opacity-90 rounded-md shadow-[0_0_20px_rgba(245,158,11,0.1)] transition-all"
                  >
                    <Plus size={16} className="mr-1.5" /> NEW SNIPPET
                  </Button>
               )}
            </header>

            <ScrollArea className="flex-1 p-6 pb-24">
              {activeTab === 'workspaces' ? (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {filteredTemplates.length === 0 ? (
                    <EmptyState type="templates" query={searchQuery} />
                  ) : (
                    filteredTemplates.map((template) => (
                      <TemplateCard 
                        key={template.id} 
                        template={template} 
                        onLaunch={() => onLaunchTemplate(template)}
                        onDelete={() => onDeleteTemplate(template.id)}
                      />
                    ))
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                   {isAddingSnippet && (
                      <Card className="bg-amber-500/5 border-amber-500/20 p-4 animate-in fade-in slide-in-from-top-2 duration-300">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div className="space-y-2">
                               <label className="text-[10px] font-bold text-amber-500/80 uppercase">Snippet Label</label>
                               <Input 
                                  autoFocus
                                  placeholder="e.g. Docker Fresh Build"
                                  className="bg-black/20 border-white/5 text-[13px]"
                                  value={newSnippetLabel}
                                  onChange={(e) => setNewSnippetLabel(e.target.value)}
                               />
                            </div>
                            <div className="space-y-2">
                               <label className="text-[10px] font-bold text-amber-500/80 uppercase">Terminal Command</label>
                               <Input 
                                  placeholder="e.g. docker-compose up --build"
                                  className="bg-black/20 border-white/5 text-[13px] font-mono"
                                  value={newSnippetCommand}
                                  onChange={(e) => setNewSnippetCommand(e.target.value)}
                               />
                            </div>
                         </div>
                         <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => setIsAddSnippet(false)} className="text-[11px] h-8">CANCEL</Button>
                            <Button size="sm" onClick={handleAddSnippet} className="bg-amber-500 text-black text-[11px] font-bold h-8">SAVE SNIPPET</Button>
                         </div>
                      </Card>
                   )}

                   {filteredSnippets.length === 0 ? (
                      <EmptyState type="snippets" query={searchQuery} />
                   ) : (
                      <div className="grid grid-cols-1 gap-3">
                         {filteredSnippets.map(snippet => (
                            <SnippetRow 
                               key={snippet.id} 
                               snippet={snippet} 
                               isSelected={selectedSnippetIds.has(snippet.id)}
                               onToggleSelection={() => toggleSnippetSelection(snippet.id)}
                               onDelete={() => onDeleteSnippet(snippet.id)}
                               onExecute={(exec) => onExecuteSnippet(snippet, exec)}
                            />
                         ))}
                      </div>
                   )}
                </div>
              )}
            </ScrollArea>

            {/* Bulk Action Bar - Long & Thin Aesthetic */}
            {activeTab === 'commands' && selectedSnippetIds.size > 0 && (
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-[600px] bg-[#1a1a1e]/90 backdrop-blur-xl border border-white/10 rounded-full py-1.5 px-8 flex items-center justify-between shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-in fade-in slide-in-from-bottom-4 duration-300 z-50">
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-bold tracking-[0.1em] text-white/40 uppercase">
                    Selection Active
                  </span>
                  <div className="w-1 h-1 rounded-full bg-[var(--accent-primary)] animate-pulse" />
                  <span className="text-[11px] font-bold tracking-tight text-white/80">
                    <span className="text-[var(--accent-primary)]">{selectedSnippetIds.size}</span> Snippets Marked
                  </span>
                </div>
                
                <div className="flex items-center gap-3">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setSelectedSnippetIds(new Set())}
                    className="h-7 px-4 text-[10px] font-bold text-white/30 hover:text-white/60 hover:bg-white/5 rounded-full transition-all"
                  >
                    CLEAR
                  </Button>
                  <div className="w-px h-3 bg-white/5" />
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleBulkDelete}
                    className="h-7 px-6 text-[10px] font-bold bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 rounded-full border border-red-500/20 transition-all"
                  >
                    <Trash2 size={12} className="mr-2" />
                    CONFIRM DELETE
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TemplateCard({ template, onLaunch, onDelete }: { template: SpaceTemplate; onLaunch: () => void; onDelete: () => void }) {
  return (
    <Card 
      className="group relative flex flex-col p-0 bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-300 cursor-pointer overflow-hidden border border-white/5"
      onClick={onLaunch}
    >
      <CardHeader className="p-4 pb-2 border-none">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <LayoutPreviewIcon layout={template.layout} className="w-10 h-8 border bg-black shrink-0 rounded-sm border-white/10" />
            <div className="min-w-0">
              <CardTitle className="text-[13px] font-bold truncate text-white/90 group-hover:text-[var(--accent-primary)] transition-colors">{template.name}</CardTitle>
              <div className="flex items-center gap-1 text-[10px] text-white/30 truncate font-mono">
                <Folder size={10} /> {template.rootPath}
              </div>
            </div>
          </div>
          <Button 
            variant="ghost" size="icon" 
            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/10 hover:text-red-400"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
          >
            <Trash2 size={12} />
          </Button>
        </div>
      </CardHeader>
      <CardFooter className="px-4 py-2 border-t border-white/5 bg-black/20 flex items-center justify-between">
         <span className="text-[9px] text-white/20 font-medium flex items-center gap-1"><Clock size={10} /> {formatTimeAgo(template.createdAt)}</span>
         <ExternalLink size={10} className="text-white/10 group-hover:text-[var(--accent-primary)] transition-colors" />
      </CardFooter>
    </Card>
  );
}

function SnippetRow({ 
  snippet, 
  isSelected,
  onToggleSelection,
  onDelete, 
  onExecute 
}: { 
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
                   <span className="truncate max-w-[400px]">{snippet.command}</span>
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

function EmptyState({ type, query }: { type: string, query: string }) {
  return (
    <div className="col-span-full py-20 flex flex-col items-center justify-center text-center space-y-3 opacity-50">
       <div className="w-12 h-12 rounded-full border border-dashed border-white/20 flex items-center justify-center">
          <Search size={20} />
       </div>
       <div>
          <p className="text-[14px] font-bold">No {type} found</p>
          <p className="text-[11px]">No results matching "{query}".</p>
       </div>
    </div>
  );
}

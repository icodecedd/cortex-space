import { CheckCircle2, Terminal, Code, Cpu, Library, X, CornerDownLeft } from "@/components/ui/icons";
import { PaneConfig } from "@/lib/setup-constants";
import { Snippet, Agent } from "@/types";
import {
  Combobox,
} from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useState, useRef } from "react";
import { Kbd } from "@/components/ui/kbd";
import { extractVariables, resolveVariables } from "@/lib/snippet-utils";
import { toTitleCase } from "@/lib/utils";
import { Spotlight } from "@/components/ui/spotlight";

interface PendingSnippet {
  originalCommand: string;
  variables: string[];
  resolvedValues: Record<string, string>;
  currentIndex: number;
}

interface PaneConfigCardProps {
  pane: PaneConfig;
  index: number;
  mode: 'normal' | 'agents';
  onUpdate: (id: number, command: string, isCustom?: boolean) => void;
  onNameUpdate?: (id: number, name: string) => void;
  snippets: Snippet[];
  agents?: Agent[];
}

export function PaneConfigCard({ pane, index, mode, onUpdate, onNameUpdate, snippets, agents = [] }: PaneConfigCardProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [pendingSnippet, setPendingSnippet] = useState<PendingSnippet | null>(null);
  const [currentVarValue, setCurrentVarValue] = useState("");
  const promptInputRef = useRef<HTMLInputElement>(null);
  
  const isPopulated = (pane.command || "").trim() !== "";

  const handleSnippetSelect = (snippet: Snippet) => {
    const variables = extractVariables(snippet.command);
    if (variables.length > 0) {
      setPendingSnippet({
        originalCommand: snippet.command,
        variables,
        resolvedValues: {},
        currentIndex: 0
      });
      setCurrentVarValue("");
    } else {
      onUpdate(pane.id, snippet.command, false);
    }
  };

  const handleVariableSubmit = () => {
    if (!pendingSnippet) return;

    const currentVar = pendingSnippet.variables[pendingSnippet.currentIndex];
    const newResolved = { ...pendingSnippet.resolvedValues, [currentVar]: currentVarValue };
    const nextIndex = pendingSnippet.currentIndex + 1;

    if (nextIndex < pendingSnippet.variables.length) {
      setPendingSnippet({
        ...pendingSnippet,
        resolvedValues: newResolved,
        currentIndex: nextIndex
      });
      setCurrentVarValue("");
      setTimeout(() => promptInputRef.current?.focus(), 10);
    } else {
      const finalCommand = resolveVariables(pendingSnippet.originalCommand, newResolved);
      onUpdate(pane.id, finalCommand, false);
      setPendingSnippet(null);
      setCurrentVarValue("");
    }
  };

  const handleVariableCancel = () => {
    setPendingSnippet(null);
    setCurrentVarValue("");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.6, ease: [0.22, 1, 0.36, 1] as any }}
      className="relative"
    >
      <Spotlight
        className={`
          group relative overflow-hidden flex flex-col p-6 rounded-xl border transition-all duration-500
          ${isPopulated 
            ? "bg-[var(--text-primary)]/[0.03] border-[var(--border-color)] shadow-2xl shadow-black/40" 
            : "bg-[var(--text-primary)]/[0.01] border-[var(--border-color)] hover:border-[var(--accent-primary)]/50"}
        `}
        spotlightColor="rgba(var(--text-primary-rgb), 0.03)"
      >
        <div className="flex items-center justify-between mb-8 relative z-20">
          <div className="flex items-center gap-3">
            <div className={`
              w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300
              ${isPopulated ? "bg-[var(--accent-primary)] text-[var(--accent-contrast)] shadow-[0_0_15px_rgba(var(--accent-primary-rgb),0.3)]" : "bg-[var(--text-primary)]/5 text-[var(--text-secondary)]"}
            `}>
              {mode === 'agents' ? <Cpu size={18} /> : <Terminal size={18} />}
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-[var(--accent-primary)] uppercase tracking-[0.15em] opacity-80 mb-0.5">
                Terminal Pane 0{pane.id}
              </span>
              {isEditingName ? (
                <input
                  autoFocus
                  className="text-xs font-bold text-[var(--text-primary)] bg-transparent border-none outline-none focus:ring-0 p-0 w-full"
                  value={pane.name}
                  onChange={(e) => onNameUpdate?.(pane.id, e.target.value)}
                  onBlur={() => setIsEditingName(false)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') setIsEditingName(false);
                    if (e.key === 'Escape') setIsEditingName(false);
                  }}
                />
              ) : (
                <span 
                  className="text-xs font-bold text-[var(--text-primary)] truncate max-w-[140px] cursor-text hover:text-[var(--accent-primary)] transition-colors"
                  onClick={() => setIsEditingName(true)}
                >
                  {pane.name}
                </span>
              )}
            </div>
          </div>
          
          {isPopulated && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-2 px-3 py-1 rounded-full bg-ansi-green/10 border border-ansi-green/20"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-ansi-green animate-pulse" />
              <span className="text-[9px] font-bold text-ansi-green uppercase tracking-wider">Ready</span>
            </motion.div>
          )}
        </div>

        <div className="space-y-4 relative z-20">
          <div className="flex items-center justify-between px-1">
            <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.1em] opacity-50">
              {mode === 'agents' 
                ? (pane.isCustom ? 'Manual Command' : 'Agent Identity') 
                : 'Execution Command'}
            </label>
            <div className="flex items-center gap-2">
              {mode === 'agents' && (
                <Button
                  variant="ghost"
                  onClick={() => onUpdate(pane.id, "", !pane.isCustom)}
                  className="h-6 px-3 gap-2 bg-[var(--text-primary)]/5 text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all"
                >
                  {pane.isCustom ? <Cpu size={12} /> : <Code size={12} />}
                  <span>{pane.isCustom ? 'AI Agent' : 'Manual'}</span>
                </Button>
              )}
              {mode === 'normal' && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                      className="h-6 px-3 gap-2 bg-[var(--text-primary)]/5 text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all"
                    >
                      <Library size={12} />
                      <span>Snippets</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-2 bg-[var(--surface-color)]/95 backdrop-blur-xl border-[var(--border-color)] shadow-2xl rounded-xl" align="end">
                    <div className="flex flex-col gap-1">
                      <div className="px-3 py-2 text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest border-b border-[var(--border-color)] mb-1">
                        Workspace Library
                      </div>
                      {snippets.length === 0 ? (
                        <div className="mx-1 my-2 p-6 flex flex-col items-center justify-center gap-2 text-center rounded-lg border border-dashed border-[var(--border-color)] bg-[var(--text-primary)]/[0.01]">
                          <Library size={18} className="text-[var(--text-secondary)] opacity-40 mb-1" />
                          <span className="text-[11px] font-bold text-[var(--text-primary)]/80">Empty Library</span>
                          <span className="text-[10px] text-[var(--text-secondary)] font-medium leading-relaxed opacity-60">
                            Add commands in the Cortex Library to see them here.
                          </span>
                        </div>
                      ) : (
                        <div className="max-h-[280px] overflow-y-auto pr-1">
                          {snippets.map((snippet) => (
                            <button
                              key={snippet.id}
                              onClick={() => handleSnippetSelect(snippet)}
                              className="w-full flex flex-col gap-1 text-left px-3 py-2 rounded-lg hover:bg-[var(--text-primary)]/5 transition-colors group/snippet"
                            >
                              <span className="text-xs font-bold text-[var(--text-primary)] group-hover/snippet:text-[var(--accent-primary)] transition-colors">{snippet.label}</span>
                              <span className="text-[10px] font-mono text-[var(--text-secondary)] truncate opacity-50 group-hover/snippet:opacity-80 transition-opacity">{snippet.command}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>
          </div>

          {mode === 'agents' && !pane.isCustom ? (
            <Combobox
              items={agents.filter(p => p.status === 'installed').map(p => ({ label: toTitleCase(p.label), value: p.command }))}
              value={pane.command || ""}
              onValueChange={(val) => {
                const isPreset = agents.some(p => p.command === val);
                onUpdate(pane.id, val, !isPreset);
              }}
              placeholder="Select AI agent..."
              triggerClassName="h-10 bg-[var(--text-primary)]/[0.03] border-transparent hover:bg-[var(--text-primary)]/[0.05] focus-within:bg-[var(--bg-color)] focus-within:border-[var(--accent-primary)]/40 text-xs transition-all rounded-lg placeholder:text-[var(--text-secondary)]/40 shadow-none font-medium"
              emptyText="No agents found."
            />
          ) : (
            <div className="relative group/input">
              <Input
                type="text"
                value={pane.command || ""}
                onChange={(e) => onUpdate(pane.id, e.target.value, true)}
                placeholder={
                  mode === 'agents' ? "Enter custom command..." :
                  pane.id === 1 ? "npm run dev" :
                  pane.id === 2 ? "docker-compose up" :
                  "Enter command..."
                }
                className="w-full h-10 bg-[var(--text-primary)]/[0.03] border-transparent hover:bg-[var(--text-primary)]/[0.05] focus-visible:bg-[var(--bg-color)] focus-visible:border-[var(--accent-primary)]/40 text-xs font-mono placeholder:text-[var(--text-secondary)]/30 transition-all rounded-lg shadow-none focus-visible:ring-0"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-focus-within/input:opacity-100 transition-opacity pointer-events-none">
                <div className="w-1 h-3.5 bg-[var(--accent-primary)] animate-pulse rounded-full" />
              </div>
            </div>
          )}
        </div>

        <AnimatePresence>
          {pendingSnippet && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
            >
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="w-full bg-[var(--surface-color)]/90 backdrop-blur-2xl border border-[var(--border-color)] rounded-xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col"
              >
                <div className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[var(--accent-primary)] uppercase tracking-[0.2em]">Variable Entry</span>
                    <button onClick={handleVariableCancel} className="p-1.5 hover:bg-[var(--text-primary)]/5 rounded-lg text-[var(--text-secondary)] transition-colors">
                      <X size={14} />
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[var(--text-primary)]/90">
                      Value for <span className="text-[var(--accent-primary)] font-mono">{pendingSnippet.variables[pendingSnippet.currentIndex]}</span>
                    </label>
                    <div className="relative">
                      <Input 
                        ref={promptInputRef}
                        autoFocus
                        value={currentVarValue}
                        onChange={(e) => setCurrentVarValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') { e.stopPropagation(); handleVariableSubmit(); }
                          if (e.key === 'Escape') { e.stopPropagation(); handleVariableCancel(); }
                        }}
                        placeholder={`Enter ${pendingSnippet.variables[pendingSnippet.currentIndex].toLowerCase()}...`}
                        className="h-10 text-xs bg-[var(--text-primary)]/5 border-[var(--border-color)] pr-10 focus:border-[var(--accent-primary)]/50 rounded-lg"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-20">
                        <CornerDownLeft size={14} />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-[var(--text-secondary)] font-bold">
                    <div className="flex gap-4">
                      <div className="flex items-center gap-2 uppercase tracking-wider opacity-60"><Kbd className="text-[9px]">Enter</Kbd> Confirm</div>
                      <div className="flex items-center gap-2 uppercase tracking-wider opacity-60"><Kbd className="text-[9px]">Esc</Kbd> Skip</div>
                    </div>
                    <div className="font-mono text-[var(--accent-primary)]">{pendingSnippet.currentIndex + 1} / {pendingSnippet.variables.length}</div>
                  </div>
                </div>
                <div className="h-1 w-full bg-[var(--text-primary)]/5">
                  <motion.div 
                    className="h-full bg-[var(--accent-primary)] shadow-[0_0_10px_rgba(var(--accent-primary-rgb),0.5)]"
                    initial={{ width: 0 }}
                    animate={{ width: `${((pendingSnippet.currentIndex + 1) / pendingSnippet.variables.length) * 100}%` }}
                    transition={{ duration: 0.5, ease: "circOut" }}
                  />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </Spotlight>
    </motion.div>
  );
}

import { CheckCircle2, Terminal, Code, Cpu, Library } from "lucide-react";
import { AGENT_PRESETS, PaneConfig } from "@/lib/setup-constants";
import { Snippet } from "@/types";
import {
  Combobox,
} from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface PaneConfigCardProps {
  pane: PaneConfig;
  index: number;
  mode: 'normal' | 'agents';
  onUpdate: (id: number, command: string, isCustom?: boolean) => void;
  onNameUpdate?: (id: number, name: string) => void;
  snippets: Snippet[];
}

export function PaneConfigCard({ pane, index, mode, onUpdate, onNameUpdate, snippets }: PaneConfigCardProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const isPopulated = (pane.command || "").trim() !== "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className={`
        group relative overflow-hidden flex flex-col p-5 rounded-md border transition-all duration-300
        ${isPopulated 
          ? "bg-[var(--text-primary)]/[0.03] border-[var(--border-color)] shadow-lg" 
          : "bg-[var(--text-primary)]/[0.01] border-[var(--border-color)] hover:border-[var(--text-primary)]/10"}
      `}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className={`
            w-8 h-8 rounded-md flex items-center justify-center transition-colors
            ${isPopulated ? "bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]" : "bg-[var(--text-primary)]/5 text-[var(--text-secondary)]"}
          `}>
            {mode === 'agents' ? <Cpu size={14} /> : <Terminal size={14} />}
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-mono font-bold text-[var(--accent-primary)] opacity-80 uppercase tracking-widest">
              Pane 0{pane.id}
            </span>
            {isEditingName ? (
              <input
                autoFocus
                className="text-[11px] font-bold text-[var(--text-primary)] bg-transparent border-none outline-none focus:ring-0 p-0 w-full"
                value={pane.name}
                onChange={(e) => onNameUpdate?.(pane.id, e.target.value)}
                onBlur={() => setIsEditingName(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setIsEditingName(false);
                }}
              />
            ) : (
              <span 
                className="text-[11px] font-bold text-[var(--text-primary)] truncate max-w-[120px] cursor-text hover:text-[var(--accent-primary)] transition-colors"
                onClick={() => setIsEditingName(true)}
                title="Click to rename"
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
            className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-ansi-green/10 border border-ansi-green/20"
          >
            <CheckCircle2 size={10} className="text-ansi-green" />
            <span className="text-[8px] font-bold text-ansi-green uppercase tracking-tighter">Ready</span>
          </motion.div>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <label className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.1em]">
            {mode === 'agents' 
              ? (pane.isCustom ? 'Custom Command' : 'Selection Matrix') 
              : 'Input Command'}
          </label>
          <div className="flex items-center gap-1">
            {mode === 'agents' && (
              <Button
                variant="ghost"
                size="xs"
                className="h-5 px-2 gap-1.5 border border-[var(--border-color)] bg-[var(--text-primary)]/[0.02] text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:border-[var(--accent-primary)]/30 hover:bg-[var(--accent-primary)]/5 transition-all"
                onClick={() => onUpdate(pane.id, "", !pane.isCustom)}
                title={pane.isCustom ? "Return to Agent Selection" : "Enter Manual Command"}
              >
                {pane.isCustom ? <Cpu size={10} /> : <Code size={10} />}
                <span className="text-[9px] font-bold uppercase tracking-tight whitespace-nowrap">
                  {pane.isCustom ? 'Switch to AI' : 'Switch to Custom'}
                </span>
              </Button>
            )}
            {mode === 'normal' && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="xs" 
                    className="h-5 px-2 gap-1.5 border border-[var(--border-color)] bg-[var(--text-primary)]/[0.02] text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:border-[var(--accent-primary)]/30 hover:bg-[var(--accent-primary)]/5 transition-all"
                  >
                    <Library size={10} />
                    <span className="text-[9px] font-bold uppercase tracking-tight whitespace-nowrap">
                      Snippets
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-2 bg-[var(--surface-color)] border-[var(--border-color)] shadow-xl rounded-md" align="end">
                  <div className="flex flex-col gap-1">
                    <div className="px-2 py-1.5 text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-widest border-b border-[var(--border-color)] mb-1">
                      Quick Snippets
                    </div>
                    {snippets.map((snippet) => (
                      <button
                        key={snippet.id}
                        onClick={() => onUpdate(pane.id, snippet.command, false)}
                        className="flex flex-col gap-0.5 text-left px-2 py-1.5 rounded hover:bg-[var(--text-primary)]/5 transition-colors group/snippet"
                      >
                        <span className="text-[10px] font-bold text-[var(--text-primary)] group-hover/snippet:text-[var(--accent-primary)]">{snippet.label}</span>
                        <span className="text-[9px] font-mono text-[var(--text-secondary)] truncate opacity-70">{snippet.command}</span>
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>
        </div>

        {mode === 'agents' && !pane.isCustom ? (
          <Combobox
            items={AGENT_PRESETS.map(p => ({ label: p.label, value: p.command }))}
            value={pane.command || ""}
            onValueChange={(val) => {
              const isPreset = AGENT_PRESETS.some(p => p.command === val);
              onUpdate(pane.id, val, !isPreset);
            }}
            placeholder="Select AI agent..."
            triggerClassName="font-mono h-9 bg-[var(--text-primary)]/[0.03] border-transparent hover:bg-[var(--text-primary)]/[0.05] focus-within:bg-[var(--bg-color)] focus-within:border-[var(--accent-primary)]/30 text-[11px] transition-all rounded-md placeholder:text-[var(--text-secondary)]/40 shadow-none"
            emptyText="No matching protocol."
          />
        ) : (
          <div className="relative group/input">
            <Input
              type="text"
              value={pane.command || ""}
              onChange={(e) => {
                onUpdate(pane.id, e.target.value, true);
              }}
              placeholder={
                mode === 'agents' ? "Enter custom command..." :
                pane.id === 1 ? "npm run dev" :
                pane.id === 2 ? "docker-compose up" :
                pane.id === 3 ? "git status" :
                "Enter command..."
              }
              className="w-full font-mono h-9 bg-[var(--text-primary)]/[0.03] border-transparent hover:bg-[var(--text-primary)]/[0.05] focus-visible:bg-[var(--bg-color)] focus-visible:border-[var(--accent-primary)]/30 text-[11px] placeholder:text-[var(--text-secondary)]/40 transition-all rounded-md shadow-none focus-visible:ring-0"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-focus-within/input:opacity-100 transition-opacity pointer-events-none">
              <div className="w-1 h-3 bg-[var(--accent-primary)] animate-pulse rounded-full" />
            </div>
          </div>
        )}
      </div>

      {/* Decorative corner accent */}
      <div className={`
        absolute -right-4 -bottom-4 w-12 h-12 bg-gradient-to-br from-transparent to-[var(--text-primary)]/5 rounded-full transition-opacity
        ${isPopulated ? "opacity-100" : "opacity-0"}
      `} />
    </motion.div>
  );
}

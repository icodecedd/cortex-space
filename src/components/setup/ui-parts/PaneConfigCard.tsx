import { CheckCircle2, Terminal, Code, Cpu } from "lucide-react";
import { AGENT_PRESETS, PaneConfig } from "@/lib/setup-constants";
import {
  Combobox,
} from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";

interface PaneConfigCardProps {
  pane: PaneConfig;
  index: number;
  mode: 'normal' | 'agents';
  onUpdate: (id: number, command: string, isCustom?: boolean) => void;
}

export function PaneConfigCard({ pane, index, mode, onUpdate }: PaneConfigCardProps) {
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
            <span className="text-[11px] font-bold text-[var(--text-primary)]">
              {mode === 'agents' ? 'Agent Identity' : 'Execution Hook'}
            </span>
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
            {mode === 'agents' ? 'Selection Matrix' : 'Input Command'}
          </label>
          {mode === 'normal' && <Code size={10} className="text-[var(--text-secondary)] opacity-60" />}
        </div>

        {mode === 'agents' ? (
          <Combobox
            items={AGENT_PRESETS.map(p => ({ label: p.label, value: p.command }))}
            value={pane.command || ""}
            onValueChange={(val) => {
              const isPreset = AGENT_PRESETS.some(p => p.command === val);
              onUpdate(pane.id, val, !isPreset);
            }}
            placeholder="Select AI agent..."
            triggerClassName="font-mono h-9 bg-[var(--bg-color)]/20 border-[var(--border-color)] text-[11px] focus:border-[var(--accent-primary)] transition-all rounded-md pl-3 placeholder:text-[var(--text-secondary)]/50"
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
                pane.id === 1 ? "npm run dev" :
                pane.id === 2 ? "docker-compose up" :
                pane.id === 3 ? "git status" :
                "Enter command..."
              }
              className="w-full font-mono h-9 bg-[var(--bg-color)]/20 border-[var(--border-color)] text-[11px] placeholder:text-[var(--text-secondary)]/60 focus:border-[var(--accent-primary)] transition-all rounded-md pl-3"
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

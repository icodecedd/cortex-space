import { Zap, Command } from "@/components/ui/icons";
import { motion, Variants } from "framer-motion";
import { PaneConfig } from "@/lib/setup-constants";
import { PaneConfigCard } from "../ui-parts/PaneConfigCard";
import { useState } from "react";
import { Snippet, Agent } from "@/types";
import { toTitleCase } from "@/lib/utils";
import { Combobox } from "@/components/ui/combobox";
import { Spotlight } from "@/components/ui/spotlight";

interface StepConfigureProps {
  mode: 'normal' | 'agents';
  activePanes: PaneConfig[];
  updatePaneCommand: (id: number, command: string, isCustom?: boolean) => void;
  updatePaneName: (id: number, name: string) => void;
  updateAllPaneCommands: (command: string, isCustom?: boolean) => void;
  snippets: Snippet[];
  agents?: Agent[];
}

export function StepConfigure({ mode, activePanes, updatePaneCommand, updatePaneName, updateAllPaneCommands, snippets, agents = [] }: StepConfigureProps) {
  const [globalValue, setGlobalValue] = useState("");

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as any }
    }
  };

  const globalItems = mode === 'agents' 
    ? agents.filter(p => p.status === 'installed').map(p => ({ label: toTitleCase(p.label), value: p.command }))
    : snippets.map(s => ({ label: s.label, value: s.command }));

  return (
    <motion.div 
      className="max-w-4xl mx-auto w-full py-2"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants} className="flex flex-col gap-1 mb-10">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-1.5 rounded-lg bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]">
            <Command size={16} />
          </div>
          <h3 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
            {mode === 'agents' ? 'Configure AI Agents' : 'Configure Terminal Commands'}
          </h3>
        </div>
        <p className="text-sm text-[var(--text-secondary)] font-medium opacity-70">
          {mode === 'agents' 
            ? 'Assign specific AI roles to each terminal pane or apply a global configuration.' 
            : 'Specify the initial commands to be executed in each workspace pane.'}
        </p>
      </motion.div>

      {mode === 'agents' && (
        <motion.div variants={itemVariants} className="mb-10">
          <Spotlight className="rounded-xl border border-[var(--border-color)] bg-[var(--text-primary)]/[0.01] p-8 overflow-hidden group">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-10">
              <div className="flex flex-col gap-2 max-w-md">
                <div className="flex items-center gap-2">
                  <Zap size={14} className="text-[var(--accent-primary)]" />
                  <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent-primary)]">
                    Batch Configuration
                  </h4>
                </div>
                <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed font-bold opacity-60">
                  Select a single agent to initialize all {activePanes.length} workspace panes simultaneously. Individual overrides can still be applied to specific panes below.
                </p>
              </div>
              
              <div className="w-full md:w-[420px] flex flex-col gap-4">
                <Combobox
                  items={globalItems}
                  value={globalValue}
                  onValueChange={(val) => {
                    setGlobalValue(val);
                    const isPreset = mode === 'agents' 
                      ? agents.some(p => p.command === val)
                      : snippets.some(s => s.command === val);
                    updateAllPaneCommands(val, !isPreset);
                  }}
                  placeholder="Apply agent to all panes..."
                  triggerClassName="h-11 bg-[var(--text-primary)]/5 border-transparent hover:bg-[var(--text-primary)]/[0.08] focus-within:bg-[var(--bg-color)] focus-within:border-[var(--accent-primary)]/40 text-xs transition-all rounded-lg placeholder:text-[var(--text-secondary)]/40 shadow-none font-medium"
                  emptyText="No agents found."
                />
                <div className="flex items-center gap-3 px-1">
                  <div className="w-1 h-1 rounded-full bg-[var(--accent-primary)] animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)] opacity-40">System ready for global assignment</span>
                </div>
              </div>
            </div>
          </Spotlight>
        </motion.div>
      )}

      <motion.div 
        variants={itemVariants}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        {activePanes.map((pane, index) => (
          <PaneConfigCard
            key={pane.id}
            pane={pane}
            index={index}
            mode={mode}
            onUpdate={updatePaneCommand}
            onNameUpdate={updatePaneName}
            snippets={snippets}
            agents={agents}
          />
        ))}
      </motion.div>
    </motion.div>
  );
}

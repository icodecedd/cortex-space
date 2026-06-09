import { Zap, Command } from "@/components/ui/icons";
import { motion, Variants } from "framer-motion";
import { PaneConfig } from "@/lib/setup-constants";
import { PaneConfigCard } from "../ui-parts/PaneConfigCard";
import { useState } from "react";
import { Snippet, Agent } from "@/types";
import {
  Combobox,
} from "@/components/ui/combobox";

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
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] as any }
    }
  };

  const globalItems = mode === 'agents' 
    ? agents.filter(p => p.status === 'installed').map(p => ({ label: p.label, value: p.command }))
    : snippets.map(s => ({ label: s.label, value: s.command }));

  return (
    <motion.div 
      className="max-w-4xl mx-auto w-full py-2"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants} className="flex flex-col gap-1 mb-10">
        <div className="flex items-center gap-2 mb-1">
          <Command size={16} className="text-[var(--accent-primary)]" />
          <h3 className="text-lg font-bold tracking-tight text-[var(--text-primary)] uppercase">
            {mode === 'agents' ? 'Assign AI Agents' : 'Define Command Matrix'}
          </h3>
        </div>
        <p className="text-sm text-[var(--text-secondary)] font-medium">
          {mode === 'agents' 
            ? 'Select specialized agents for each terminal pane or apply a global template.' 
            : 'Specify the initialization commands for each pane in your workspace grid.'}
        </p>
      </motion.div>

      {mode === 'agents' && (
        <motion.div 
          variants={itemVariants}
          className="mb-10 relative overflow-hidden rounded-md border border-[var(--border-color)] bg-[var(--text-primary)]/[0.02] p-8 group"
        >
          {/* Subtle gradient accent */}
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-primary)]/5 via-transparent to-transparent opacity-50" />
          
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="flex flex-col gap-2 max-w-md">
              <div className="flex items-center gap-2">
                <Zap size={14} className="text-[var(--accent-primary)]" />
                <h4 className="text-[11px] font-bold uppercase tracking-[0.15em] text-[var(--accent-primary)]">
                  Global Agent Protocol
                </h4>
              </div>
              <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed font-bold">
                Applying a global agent will initialize all {activePanes.length} workspace panes with the same identity. This can be overridden per pane.
              </p>
            </div>
            
            <div className="w-full md:w-[420px] flex flex-col gap-3">
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
                placeholder="Select global identity..."
                triggerClassName="font-mono h-10 bg-[var(--text-primary)]/[0.03] border-transparent hover:bg-[var(--text-primary)]/[0.05] focus-within:bg-[var(--bg-color)] focus-within:border-[var(--accent-primary)]/30 text-xs transition-all rounded-md placeholder:text-[var(--text-secondary)]/40 shadow-none"
                emptyText="Protocol matrix not found."
              />
              <div className="flex items-center gap-2 opacity-80">
                <span className="text-[9px] font-mono text-[var(--text-secondary)] font-bold uppercase tracking-tighter">Overrides enabled per pane</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <motion.div 
        variants={itemVariants}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
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

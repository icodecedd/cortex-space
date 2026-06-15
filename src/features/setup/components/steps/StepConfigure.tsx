import { Zap, Command } from "@/components/ui/icons";
import { motion, Variants } from "framer-motion";
import { PaneConfig } from "@/lib/setup-constants";
import { PaneConfigCard } from "../ui-parts/PaneConfigCard";
import { useState } from "react";
import { Snippet, Agent } from "@/types";
import { toTitleCase, cn } from "@/lib/utils";
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
      className="w-full py-4 px-4 md:px-5 lg:px-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="flex flex-col gap-6 items-start max-w-[1200px]">
        {/* Top Section: Context & Global Actions (Balanced) */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 w-full">
          <motion.div variants={itemVariants} className="flex flex-col gap-3 flex-1">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[var(--accent-primary)]/10 flex items-center justify-center text-[var(--accent-primary)] shadow-sm">
                <Command size={16} />
              </div>
              <h3 className="text-lg font-bold tracking-tight text-[var(--text-primary)] leading-none whitespace-pre-line">
                {mode === 'agents' ? 'Agent Assignment' : 'Startup Commands'}
              </h3>
            </div>
            <p className="text-xs text-[var(--text-secondary)] font-medium leading-relaxed opacity-60 max-w-xl">
              {mode === 'agents' 
                ? 'Assign specific AI agents to each terminal. You can use one agent for everything or assign different ones to each window.' 
                : 'Set up the commands that run when you open your workspace. Automatically initialize every terminal window.'}
            </p>
            <div className="w-10 h-0.5 bg-[var(--accent-primary)]/20 rounded-full" />
          </motion.div>

          {mode === 'agents' && (
            <motion.div variants={itemVariants} className="flex flex-col gap-3 w-full lg:w-[320px] shrink-0">
              <Spotlight className="flex flex-col gap-3 p-3.5 rounded-xl border border-white/5 bg-white/[0.01] shadow-xl shadow-black/20 group">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] group-hover:scale-105 transition-transform duration-500">
                    <Zap size={14} />
                  </div>
                  <h4 className="text-[8px] font-black uppercase tracking-[0.2em] text-[var(--accent-primary)]">
                    Global Assignment
                  </h4>
                </div>
                
                <div className="flex flex-col gap-2">
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
                    placeholder="Assign agent to all windows..."
                    triggerClassName="h-9 bg-white/[0.02] border-white/5 hover:border-[var(--accent-primary)]/30 focus-within:bg-[var(--bg-color)] focus-within:border-[var(--accent-primary)]/40 text-xs transition-all duration-500 rounded-lg placeholder:text-[var(--text-secondary)]/20 shadow-none font-black tracking-tight"
                    emptyText="No identities found."
                  />
                  <div className="flex items-center gap-2 px-1 opacity-40 group-focus-within:opacity-100 transition-opacity duration-500">
                    <div className="w-1 h-1 rounded-full bg-[var(--accent-primary)] animate-pulse shadow-[0_0_4px_rgba(var(--accent-primary-rgb),0.6)]" />
                    <span className="text-[7px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)]">Ready</span>
                  </div>
                </div>
              </Spotlight>
            </motion.div>
          )}
        </div>

        {/* Interaction Section: Individual Pane Configurations (Wide & Balanced) */}
        <div className="w-full">
          <motion.div 
            variants={itemVariants}
            className="grid grid-cols-1 lg:grid-cols-2 gap-5"
          >
            {activePanes.map((pane, index) => (
              <div 
                key={pane.id} 
                className="w-full"
              >
                <PaneConfigCard
                  pane={pane}
                  index={index}
                  mode={mode}
                  onUpdate={updatePaneCommand}
                  onNameUpdate={updatePaneName}
                  snippets={snippets}
                  agents={agents}
                />
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

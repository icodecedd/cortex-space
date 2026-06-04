import { Zap, Command } from "lucide-react";
import { motion } from "framer-motion";
import { AGENT_PRESETS, PaneConfig } from "@/lib/setup-constants";
import { PaneConfigCard } from "../ui-parts/PaneConfigCard";
import { useState } from "react";
import {
  Combobox,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxEmpty,
} from "@/components/ui/combobox";

interface StepConfigureProps {
  mode: 'normal' | 'agents';
  activePanes: PaneConfig[];
  updatePaneCommand: (id: number, command: string, isCustom?: boolean) => void;
  updateAllPaneCommands: (command: string, isCustom?: boolean) => void;
}

export function StepConfigure({ mode, activePanes, updatePaneCommand, updateAllPaneCommands }: StepConfigureProps) {
  const [globalAgent, setGlobalAgent] = useState("");

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] as any }
    }
  };

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
            {mode === 'agents' ? 'Assign AI Agents' : 'Define Command Protocol'}
          </h3>
        </div>
        <p className="text-sm text-[var(--text-secondary)] font-medium">
          {mode === 'agents' 
            ? 'Select specialized agents for each terminal pane or apply a global template.' 
            : 'Specify the initialization commands for each pane in your workspace matrix.'}
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
            
            <div className="w-full md:w-72 flex flex-col gap-3">
              <Combobox
                items={AGENT_PRESETS}
                value={globalAgent}
                onValueChange={(val) => {
                  if (val !== undefined) {
                    setGlobalAgent(val as string);
                    const isPreset = AGENT_PRESETS.some(p => p.command === val);
                    updateAllPaneCommands(val as string, !isPreset);
                  }
                }}
              >
                <div className="relative">
                  <ComboboxInput
                    placeholder="Select global identity..."
                    className="font-mono h-10 bg-[var(--bg-color)]/40 border-[var(--border-color)] text-xs focus:border-[var(--accent-primary)] transition-all rounded-md placeholder:text-[var(--text-secondary)]/60"
                  />
                </div>
                <ComboboxContent
                  className="bg-[var(--surface-color)] border-[var(--border-color)] rounded-md"
                  style={{ boxShadow: '0 20px 50px rgba(0,0,0,0.8)' }}
                >
                  <ComboboxEmpty className="text-[10px] font-mono p-4">Identity matrix not found.</ComboboxEmpty>
                  <ComboboxList>
                    {(preset: { label: string, command: string }) => (
                      <ComboboxItem
                        key={preset.label}
                        value={preset.command}
                        className="flex items-center justify-between gap-4 font-mono text-[11px] py-2.5 px-4 cursor-pointer hover:bg-[var(--text-primary)]/5 transition-colors"
                      >
                        <span className="font-bold text-[var(--text-primary)]">{preset.label}</span>
                        <span className="text-[9px] text-[var(--text-secondary)] font-bold truncate opacity-80">
                          {preset.command}
                        </span>
                      </ComboboxItem>
                    )}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
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
          />
        ))}
      </motion.div>
    </motion.div>
  );
}

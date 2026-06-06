import { Cpu, Download, CheckCircle2, AlertCircle, Loader2, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Agent } from "@/types";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Input } from "@/components/ui/input";

interface StepAgentsProps {
  agents: Agent[];
  installAgent: (id: string) => Promise<void>;
  addAgent: (label: string, command: string) => void;
}

export function StepAgents({ agents, installAgent, addAgent }: StepAgentsProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newCommand, setNewCommand] = useState("");

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

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCommand.trim()) {
      addAgent(newLabel, newCommand);
      setNewLabel("");
      setNewCommand("");
      setShowAddForm(false);
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
          <Cpu size={16} className="text-[var(--accent-primary)]" />
          <h3 className="text-lg font-bold tracking-tight text-[var(--text-primary)] uppercase">
            Protocol Management
          </h3>
        </div>
        <p className="text-sm text-[var(--text-secondary)] font-medium">
          Configure and install the AI agents for your workspace matrix.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
        {agents.map((agent) => (
          <motion.div
            key={agent.id}
            variants={itemVariants}
            className="group relative flex flex-col p-5 rounded-md border border-[var(--border-color)] bg-[var(--text-primary)]/[0.02] hover:bg-[var(--text-primary)]/[0.04] transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`
                  w-10 h-10 rounded-lg flex items-center justify-center
                  ${agent.status === 'installed' ? 'bg-ansi-green/10 text-ansi-green' : 'bg-[var(--text-primary)]/5 text-[var(--text-secondary)]'}
                `}>
                  <Cpu size={18} />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-tight">{agent.label}</span>
                  <span className="text-[10px] font-mono text-[var(--text-secondary)] opacity-70">{agent.command}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {agent.status === 'installed' && (
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-ansi-green/10 border border-ansi-green/20">
                    <CheckCircle2 size={10} className="text-ansi-green" />
                    <span className="text-[8px] font-bold text-ansi-green uppercase tracking-tighter">Verified</span>
                  </div>
                )}
                {agent.status === 'installing' && (
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-ansi-blue/10 border border-ansi-blue/20">
                    <Loader2 size={10} className="text-ansi-blue animate-spin" />
                    <span className="text-[8px] font-bold text-ansi-blue uppercase tracking-tighter">Syncing...</span>
                  </div>
                )}
                {agent.status === 'error' && (
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-ansi-red/10 border border-ansi-red/20">
                    <AlertCircle size={10} className="text-ansi-red" />
                    <span className="text-[8px] font-bold text-ansi-red uppercase tracking-tighter">Failed</span>
                  </div>
                )}
                {agent.status === 'not-installed' && (
                  <Button
                    variant="ghost"
                    size="xs"
                    className="h-7 px-3 gap-2 border border-[var(--border-color)] bg-[var(--surface-color)] text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:border-[var(--accent-primary)]/30 transition-all"
                    onClick={() => installAgent(agent.id)}
                  >
                    <Download size={12} />
                    <span className="text-[10px] font-bold uppercase tracking-tight">Setup</span>
                  </Button>
                )}
              </div>
            </div>

            {agent.isDefault && agent.status === 'not-installed' && (
              <p className="text-[10px] text-[var(--text-secondary)] font-medium leading-relaxed opacity-60">
                This managed protocol is recommended for the agent matrix.
              </p>
            )}
          </motion.div>
        ))}

        <motion.div
          variants={itemVariants}
          className="relative flex flex-col p-5 rounded-md border border-dashed border-[var(--border-color)] bg-transparent hover:border-[var(--accent-primary)]/30 transition-all group"
        >
          <AnimatePresence mode="wait">
            {!showAddForm ? (
              <motion.button
                key="add-btn"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col items-center justify-center gap-2 h-full min-h-[80px]"
                onClick={() => setShowAddForm(true)}
              >
                <div className="w-8 h-8 rounded-full bg-[var(--text-primary)]/5 flex items-center justify-center text-[var(--text-secondary)] group-hover:bg-[var(--accent-primary)]/10 group-hover:text-[var(--accent-primary)] transition-all">
                  <Plus size={16} />
                </div>
                <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest group-hover:text-[var(--text-primary)] transition-colors">
                  Add Custom Protocol
                </span>
              </motion.button>
            ) : (
              <motion.form
                key="add-form"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className="flex flex-col gap-3"
                onSubmit={handleAddSubmit}
              >
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-widest px-1">Label</label>
                  <Input 
                    autoFocus
                    placeholder="ANTIGRAVITY"
                    value={newLabel}
                    onChange={e => setNewLabel(e.target.value)}
                    className="h-8 text-[11px] font-bold bg-[var(--text-primary)]/5 border-transparent focus:border-[var(--accent-primary)]/30"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-widest px-1">Command</label>
                  <Input 
                    placeholder="agy"
                    value={newCommand}
                    onChange={e => setNewCommand(e.target.value)}
                    className="h-8 text-[11px] font-mono bg-[var(--text-primary)]/5 border-transparent focus:border-[var(--accent-primary)]/30"
                  />
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Button type="submit" size="xs" className="flex-1 h-8 bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-primary)]/90">
                    Register
                  </Button>
                  <Button type="button" variant="ghost" size="xs" className="h-8 text-[10px] uppercase font-bold" onClick={() => setShowAddForm(false)}>
                    Cancel
                  </Button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </motion.div>
  );
}

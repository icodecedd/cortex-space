import { Cpu, Download, CheckCircle2, AlertCircle, Loader2, Plus, Trash2, Cpu as CpuIcon } from "@/components/ui/icons";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { useAgents } from "@/hooks/useAgents";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { SettingsCard } from "../shared/SettingsUI";

export function AgentsTab() {
  const { agents, installAgent, addAgent, deleteAgent } = useAgents();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newCommand, setNewCommand] = useState("");
  const [newInstallCommand, setNewInstallCommand] = useState("");
  const [newDownloadUrl, setNewDownloadUrl] = useState("");

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCommand.trim()) {
      addAgent(newLabel, newCommand, newInstallCommand, newDownloadUrl);
      setNewLabel("");
      setNewCommand("");
      setNewInstallCommand("");
      setNewDownloadUrl("");
      setShowAddForm(false);
    }
  };

  const handleCancel = () => {
    setNewLabel("");
    setNewCommand("");
    setNewInstallCommand("");
    setNewDownloadUrl("");
    setShowAddForm(false);
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-0 pb-10 pr-2"
    >
      <motion.div variants={itemVariants}>
        <SettingsCard 
          title="Managed AI Protocols" 
          icon={<CpuIcon size={16} />}
          description="Configure and maintain your AI agent library. Agents can be used in any terminal pane."
        >
          <div className="grid grid-cols-1 gap-2 mt-2">
            {agents.map((agent) => (
              <div
                key={agent.id}
                className="group relative flex items-center justify-between p-3 rounded-lg border border-[var(--border-color)]/20 bg-[var(--text-primary)]/[0.02] hover:bg-[var(--text-primary)]/[0.04] transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className={`
                    w-9 h-9 rounded-lg flex items-center justify-center
                    ${agent.status === 'installed' ? 'bg-ansi-green/10 text-ansi-green shadow-[0_0_15px_rgba(var(--ansi-green-rgb),0.1)]' : 'bg-[var(--text-primary)]/5 text-[var(--text-secondary)]'}
                  `}>
                    <Cpu size={16} />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-[var(--text-primary)] uppercase tracking-tight">{agent.label}</span>
                      {agent.isDefault && (
                        <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] font-bold uppercase tracking-tighter">System</span>
                      )}
                    </div>
                    <span className="text-[10px] font-mono text-[var(--text-secondary)] opacity-60">{agent.command}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 mr-2">
                    {agent.status === 'installed' && (
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 size={11} className="text-ansi-green" />
                        <span className="text-[9px] font-bold text-ansi-green uppercase tracking-tighter">Active</span>
                      </div>
                    )}
                    {agent.status === 'installing' && (
                      <div className="flex items-center gap-1.5">
                        <Loader2 size={11} className="text-ansi-blue animate-spin" />
                        <span className="text-[9px] font-bold text-ansi-blue uppercase tracking-tighter">Syncing</span>
                      </div>
                    )}
                    {agent.status === 'error' && (
                      <div className="flex items-center gap-1.5">
                        <AlertCircle size={11} className="text-ansi-red" />
                        <span className="text-[9px] font-bold text-ansi-red uppercase tracking-tighter">Error</span>
                      </div>
                    )}
                  </div>

                  {(agent.status === 'not-installed' || agent.status === 'error') && agent.installCommand && (
                    <Button
                      variant="ghost"
                      size="xs"
                      className="h-7 px-2.5 gap-2 border border-[var(--border-color)]/20 bg-[var(--surface-color)]/50 text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:border-[var(--accent-primary)]/30 transition-all"
                      onClick={() => installAgent(agent.id)}
                    >
                      <Download size={10} />
                      <span className="text-[9px] font-bold uppercase tracking-tight">Install</span>
                    </Button>
                  )}

                  {!agent.isDefault && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-7 h-7 text-[var(--text-secondary)]/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      onClick={() => deleteAgent(agent.id)}
                    >
                      <Trash2 size={12} className="text-inherit" />
                    </Button>
                  )}
                </div>
              </div>
            ))}

            <AnimatePresence mode="wait">
              {!showAddForm ? (
                <motion.button
                  key="add-btn"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-center gap-2 p-3 rounded-lg border border-dashed border-[var(--border-color)]/30 bg-transparent hover:border-[var(--accent-primary)]/40 transition-all group"
                  onClick={() => setShowAddForm(true)}
                >
                  <Plus size={12} className="text-[var(--text-secondary)] group-hover:text-[var(--accent-primary)] transition-colors" />
                  <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest group-hover:text-[var(--text-primary)] transition-colors">
                    Register Custom Protocol
                  </span>
                </motion.button>
              ) : (
                <motion.form
                  key="add-form"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="flex flex-col gap-4 p-5 rounded-lg border border-[var(--accent-primary)]/20 bg-[var(--accent-primary)]/[0.02]"
                  onSubmit={handleAddSubmit}
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-widest px-1">Identity Label</label>
                      <Input 
                        autoFocus
                        placeholder="DROID"
                        value={newLabel}
                        onChange={e => setNewLabel(e.target.value)}
                        className="h-8 text-[11px] font-bold bg-[var(--bg-color)]/50 border-[var(--border-color)]/20 focus:border-[var(--accent-primary)]/40"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-widest px-1">Command Protocol</label>
                      <Input 
                        placeholder="droid"
                        value={newCommand}
                        onChange={e => setNewCommand(e.target.value)}
                        className="h-8 text-[11px] font-mono bg-[var(--bg-color)]/50 border-[var(--border-color)]/20 focus:border-[var(--accent-primary)]/40 text-right"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-widest px-1">
                      Installation Command (Optional)
                    </label>
                    <Input 
                      placeholder="npm install -g @droid/cli"
                      value={newInstallCommand}
                      onChange={e => setNewInstallCommand(e.target.value)}
                      className="h-8 text-[10px] font-mono bg-[var(--bg-color)]/50 border-[var(--border-color)]/20 focus:border-[var(--accent-primary)]/40"
                    />
                  </div>

                  <div className="flex items-center gap-2 justify-end mt-2">
                    <Button type="button" variant="ghost" size="xs" className="h-7 text-[10px] uppercase font-bold px-3" onClick={handleCancel}>
                      Cancel
                    </Button>
                    <Button type="submit" size="xs" className="h-7 px-5 bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-primary)]/90 font-bold uppercase tracking-tight text-[10px]">
                      Register Protocol
                    </Button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </SettingsCard>
      </motion.div>
    </motion.div>
  );
}

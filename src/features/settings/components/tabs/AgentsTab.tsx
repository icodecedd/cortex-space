import { Cpu, Download, CheckCircle2, AlertCircle, Loader2, Plus, Trash2, ChevronDown } from "@/components/ui/icons";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { useAgents } from "@/hooks/useAgents";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { SettingsCard } from "../shared/SettingsUI";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn, toTitleCase } from "@/lib/utils";

export function AgentsTab() {
  const { agents, installAgent, addAgent, deleteAgent } = useAgents();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newCommand, setNewCommand] = useState("");
  const [newInstallCommand, setNewInstallCommand] = useState("");
  const [newDownloadUrl, setNewDownloadUrl] = useState("");
  const [expandedErrors, setExpandedErrors] = useState<Set<string>>(new Set());

  const toggleError = (id: string) => {
    setExpandedErrors(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

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
          title="Managed AI Agents" 
          icon={<Cpu size={16} />}
          description="Configure and maintain your AI agent library. Agents can be used in any terminal pane."
        >
          <div className="grid grid-cols-1 gap-2 mt-2">
            {agents.map((agent) => (
                <div
                key={agent.id}
                className="group/agent relative flex flex-col border border-[var(--border-color)]/20 rounded-lg overflow-hidden"
              >
                <div className="flex items-center justify-between p-3 bg-[var(--text-primary)]/[0.02] hover:bg-[var(--text-primary)]/[0.04] transition-all">
                  <div className="flex items-center gap-4">
                    <div className={`
                      w-9 h-9 rounded-lg flex items-center justify-center
                      ${agent.status === 'installed' ? 'bg-ansi-green/10 text-ansi-green shadow-[0_0_15px_rgba(var(--ansi-green-rgb),0.1)]' : 'bg-[var(--text-primary)]/5 text-[var(--text-secondary)]'}
                    `}>
                      <Cpu size={16} />
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-[var(--text-primary)] tracking-tight">{toTitleCase(agent.label)}</span>
                        {agent.isDefault && (
                          <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] font-bold tracking-tighter">System</span>
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
                          <span className="text-[9px] font-bold text-ansi-green tracking-tighter">Active</span>
                        </div>
                      )}
                      {agent.status === 'installing' && (
                        <div className="flex items-center gap-1.5">
                          <Loader2 size={11} className="text-ansi-blue animate-spin" />
                          <span className="text-[9px] font-bold text-ansi-blue tracking-tighter">Syncing</span>
                        </div>
                      )}
                      {agent.status === 'error' && (
                        <div className="flex items-center gap-1.5">
                          <AlertCircle size={11} className="text-ansi-red" />
                          <span className="text-[9px] font-bold text-ansi-red tracking-tighter">Error</span>
                        </div>
                      )}
                    </div>

                    {(agent.status === 'not-installed' || agent.status === 'error') && agent.installCommand && (
                      <Button
                        variant="ghost"
                        size="xs"
                        className="h-7 px-2.5 gap-2 border border-[var(--border-color)]/20 bg-[var(--surface-color)]/50 text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:border-[var(--accent-primary)]/30 transition-all"
                        onClick={() => {
                          if (expandedErrors.has(agent.id)) toggleError(agent.id);
                          installAgent(agent.id);
                        }}
                      >
                        <Download size={10} />
                        <span className="text-[9px] font-bold tracking-tight">{agent.status === 'error' ? 'Retry' : 'Install'}</span>
                      </Button>
                    )}

                    {agent.status === 'error' && agent.errorMessage && (
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => toggleError(agent.id)}
                        className={cn(
                          "h-7 px-2.5 gap-1.5 border text-[9px] font-bold tracking-tight transition-all",
                          expandedErrors.has(agent.id)
                            ? "border-red-500/30 bg-red-500/10 text-red-400"
                            : "border-[var(--border-color)]/20 text-[var(--text-secondary)] hover:border-red-500/30 hover:bg-red-500/5 hover:text-red-400"
                        )}
                      >
                        <ChevronDown size={10} className={cn("transition-transform duration-200", expandedErrors.has(agent.id) && "rotate-180")} />
                        View Error
                      </Button>
                    )}

                    {!agent.isDefault && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-7 h-7 text-[var(--text-secondary)]/60 opacity-0 group-hover/agent:opacity-100 transition-all hover:bg-red-500/10 hover:text-red-400 active:scale-95"
                            onClick={() => deleteAgent(agent.id)}
                          >
                            <Trash2 size={12} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" sideOffset={4} className="text-[10px] bg-[var(--surface-color)] border-[var(--border-color)] text-[var(--text-primary)]">
                          Remove Agent
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </div>

                {/* Inline error accordion */}
                <AnimatePresence initial={false}>
                  {agent.status === 'error' && expandedErrors.has(agent.id) && agent.errorMessage && (
                    <motion.div
                      key="error-panel"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 py-3 border-t border-red-500/10 bg-red-500/[0.03]">
                        <p className="text-[9px] font-bold tracking-widest text-red-400/70 mb-2">Installation Error Output</p>
                        <pre className="text-[10px] font-mono text-red-300/80 whitespace-pre-wrap break-all leading-relaxed max-h-40 overflow-y-auto scrollbar-thin">{agent.errorMessage}</pre>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}

            <AnimatePresence mode="wait">
              {!showAddForm ? (
                <motion.button
                  key="add-btn"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-center gap-2 p-3 rounded-lg border border-dashed border-[var(--border-color)]/30 bg-transparent hover:border-[var(--accent-primary)]/40 transition-all group/add"
                  onClick={() => setShowAddForm(true)}
                >
                  <Plus size={12} className="text-[var(--text-secondary)] group-hover/add:text-[var(--accent-primary)] transition-colors" />
                  <span className="text-[10px] font-bold text-[var(--text-secondary)] tracking-widest group-hover/add:text-[var(--text-primary)] transition-colors">
                    Register Custom Agent
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
                      <label className="text-[9px] font-bold text-[var(--text-secondary)] tracking-widest px-1">Terminal Command</label>
                      <Input 
                        autoFocus
                        placeholder="droid"
                        value={newCommand}
                        onChange={e => setNewCommand(e.target.value)}
                        className="h-8 text-[11px] font-mono bg-[var(--bg-color)]/50 border-[var(--border-color)]/20 focus:border-[var(--accent-primary)]/40"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-bold text-[var(--text-secondary)] tracking-widest px-1">Agent Label (Optional)</label>
                      <Input 
                        placeholder="DROID"
                        value={newLabel}
                        onChange={e => setNewLabel(e.target.value)}
                        className="h-8 text-[11px] font-bold bg-[var(--bg-color)]/50 border-[var(--border-color)]/20 focus:border-[var(--accent-primary)]/40 text-right"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-bold text-[var(--text-secondary)] tracking-widest px-1">
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
                    <Button type="button" variant="ghost" size="xs" className="h-7 text-[10px] font-bold px-3" onClick={handleCancel}>
                      Cancel
                    </Button>
                    <Button type="submit" size="xs" className="h-7 px-5 bg-[var(--accent-primary)] text-[var(--text-primary)] hover:bg-[var(--accent-primary)]/90 font-bold tracking-tight text-[10px]">
                      Register Agent
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

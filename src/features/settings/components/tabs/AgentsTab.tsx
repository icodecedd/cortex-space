import { Cpu, Download, CheckCircle2, AlertCircle, Loader2, Plus, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAgents } from "@/hooks/useAgents";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Input } from "@/components/ui/input";

export function AgentsTab() {
  const { agents, installAgent, addAgent, deleteAgent } = useAgents();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newCommand, setNewCommand] = useState("");

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
    <div className="flex flex-col gap-6 py-2">
      <div className="flex flex-col gap-1.5">
        <h4 className="text-[11px] font-bold uppercase tracking-[0.15em] text-[var(--text-primary)] px-1">
          Managed AI Protocols
        </h4>
        <p className="text-[11px] text-[var(--text-secondary)] font-medium px-1">
          Configure and maintain your AI agent library. Agents can be used in any terminal pane.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {agents.map((agent) => (
          <div
            key={agent.id}
            className="group relative flex items-center justify-between p-4 rounded-md border border-[var(--border-color)] bg-[var(--text-primary)]/[0.02] hover:bg-[var(--text-primary)]/[0.04] transition-all"
          >
            <div className="flex items-center gap-4">
              <div className={`
                w-10 h-10 rounded-lg flex items-center justify-center
                ${agent.status === 'installed' ? 'bg-ansi-green/10 text-ansi-green' : 'bg-[var(--text-primary)]/5 text-[var(--text-secondary)]'}
              `}>
                <Cpu size={18} />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-tight">{agent.label}</span>
                  {agent.isDefault && (
                    <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] font-bold uppercase tracking-tighter">System</span>
                  )}
                </div>
                <span className="text-[10px] font-mono text-[var(--text-secondary)] opacity-70">{agent.command}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 mr-2">
                {agent.status === 'installed' && (
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 size={12} className="text-ansi-green" />
                    <span className="text-[9px] font-bold text-ansi-green uppercase tracking-tighter">Active</span>
                  </div>
                )}
                {agent.status === 'installing' && (
                  <div className="flex items-center gap-1.5">
                    <Loader2 size={12} className="text-ansi-blue animate-spin" />
                    <span className="text-[9px] font-bold text-ansi-blue uppercase tracking-tighter">Syncing</span>
                  </div>
                )}
                {agent.status === 'error' && (
                  <div className="flex items-center gap-1.5">
                    <AlertCircle size={12} className="text-ansi-red" />
                    <span className="text-[9px] font-bold text-ansi-red uppercase tracking-tighter">Error</span>
                  </div>
                )}
              </div>

              {agent.status === 'not-installed' && (
                <Button
                  variant="ghost"
                  size="xs"
                  className="h-8 px-3 gap-2 border border-[var(--border-color)] bg-[var(--surface-color)] text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:border-[var(--accent-primary)]/30 transition-all"
                  onClick={() => installAgent(agent.id)}
                >
                  <Download size={12} />
                  <span className="text-[10px] font-bold uppercase tracking-tight">Install</span>
                </Button>
              )}

              {!agent.isDefault && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 text-[var(--text-secondary)] hover:text-ansi-red hover:bg-ansi-red/10 transition-colors"
                  onClick={() => deleteAgent(agent.id)}
                >
                  <Trash2 size={14} />
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
              className="flex items-center justify-center gap-2 p-4 rounded-md border border-dashed border-[var(--border-color)] bg-transparent hover:border-[var(--accent-primary)]/30 transition-all group"
              onClick={() => setShowAddForm(true)}
            >
              <Plus size={14} className="text-[var(--text-secondary)] group-hover:text-[var(--accent-primary)] transition-colors" />
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
              className="flex flex-col gap-4 p-5 rounded-md border border-[var(--accent-primary)]/20 bg-[var(--accent-primary)]/[0.02]"
              onSubmit={handleAddSubmit}
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-widest px-1">Identity Label</label>
                  <Input 
                    autoFocus
                    placeholder="ANTIGRAVITY"
                    value={newLabel}
                    onChange={e => setNewLabel(e.target.value)}
                    className="h-9 text-[11px] font-bold bg-[var(--surface-color)] border-[var(--border-color)] focus:border-[var(--accent-primary)]/40"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-widest px-1">Command Protocol</label>
                  <Input 
                    placeholder="agy"
                    value={newCommand}
                    onChange={e => setNewCommand(e.target.value)}
                    className="h-9 text-[11px] font-mono bg-[var(--surface-color)] border-[var(--border-color)] focus:border-[var(--accent-primary)]/40"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 justify-end">
                <Button type="button" variant="ghost" size="xs" className="h-8 text-[10px] uppercase font-bold" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="xs" className="h-8 px-6 bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-primary)]/90 font-bold uppercase tracking-tight text-[10px]">
                  Register Protocol
                </Button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

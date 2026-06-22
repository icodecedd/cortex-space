import { Cpu, Download, CheckCircle2, AlertCircle, Loader2, Plus, Trash2, ChevronDown } from "@/components/ui/icons";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { useAgents } from "@/hooks/useAgents";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { SettingsCard } from "../shared/SettingsUI";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn, toTitleCase } from "@/lib/utils";

function GeminiLogo() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L14.5 9L22 11.5L14.5 14L12 21.5L9.5 14L2 11.5L9.5 9Z" />
    </svg>
  );
}

function ClaudeLogo() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3L20 7.5V16.5L12 21L4 16.5V7.5L12 3Z" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

function CodexLogo() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 7L3 12L8 17" />
      <path d="M16 7L21 12L16 17" />
    </svg>
  );
}

function OpenCodeLogo() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M9 9L11 11.5L9 14" />
      <path d="M14 14H16" />
    </svg>
  );
}

function AntigravityLogo() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L7 8H10V17H14V8H17L12 2Z" />
      <path d="M8 20H16" />
      <path d="M11 22H13" />
    </svg>
  );
}

function FallbackLogo() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M12 8V16" />
      <path d="M8 12H16" />
    </svg>
  );
}

const AGENT_META: Record<string, { logo: React.ReactNode; accent: string; description: string }> = {
  'agent-gemini': {
    logo: <GeminiLogo />,
    accent: '#8B5CF6',
    description: "Google's AI-powered command-line assistant for natural language interactions",
  },
  'agent-claude': {
    logo: <ClaudeLogo />,
    accent: '#F59E0B',
    description: "Anthropic's conversational AI agent designed for terminal workflows",
  },
  'agent-codex': {
    logo: <CodexLogo />,
    accent: '#10B981',
    description: "OpenAI's coding agent that translates natural language into terminal commands",
  },
  'agent-opencode': {
    logo: <OpenCodeLogo />,
    accent: '#3B82F6',
    description: "Cortex's native AI agent for code generation and terminal assistance",
  },
  'agent-antigravity': {
    logo: <AntigravityLogo />,
    accent: '#EC4899',
    description: "Zero-configuration deployment agent for launching projects from the terminal",
  },
};

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

  const getAgentMeta = (agentId: string) => {
    const meta = AGENT_META[agentId];
    if (meta) return meta;
    const agent = agents.find(a => a.id === agentId);
    return {
      logo: <FallbackLogo />,
      accent: '#6B7280',
      description: `Custom agent for the "${agent?.command ?? 'unknown'}" terminal command`,
    };
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-1 pt-2 pb-4">
            {agents.map((agent) => {
              const meta = getAgentMeta(agent.id);
              return (
                <Card
                key={agent.id}
                className={cn(
                  "group/agent overflow-hidden border transition-all duration-300",
                  agent.status === 'installed'
                    ? "border-ansi-green/30 bg-ansi-green/[0.03]"
                    : agent.status === 'error'
                      ? "border-red-500/30 bg-red-500/[0.03]"
                      : "border-[var(--border-color)] bg-[var(--text-primary)]/[0.02] hover:border-[var(--accent-primary)]/30 hover:bg-[var(--text-primary)]/[0.04]"
                )}
              >
                <CardContent className="flex flex-row items-center p-3 gap-4">
                  <div
                    className="flex items-center justify-center w-12 h-12 rounded-lg shrink-0 transition-all duration-300"
                    style={{
                      background: agent.status === 'installed'
                        ? 'rgba(var(--ansi-green-rgb), 0.12)'
                        : meta.accent + '18',
                      color: agent.status === 'installed' ? 'var(--ansi-green)' : meta.accent,
                    }}
                  >
                    <div className="w-6 h-6">
                      {meta.logo}
                    </div>
                  </div>

                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-bold tracking-tight truncate text-[var(--text-primary)]">
                        {toTitleCase(agent.label)}
                      </span>
                      {agent.isDefault ? (
                        <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] font-bold tracking-tight shrink-0">
                          Default
                        </span>
                      ) : (
                        <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-[var(--text-primary)]/5 text-[var(--text-secondary)] font-bold tracking-tight shrink-0">
                          Custom
                        </span>
                      )}
                    </div>
                    <span className="text-[11.5px] text-[var(--text-secondary)] mt-0.5 leading-tight line-clamp-1">
                      {meta.description}
                    </span>
                    <span className="text-[10px] font-mono text-[var(--text-secondary)]/40 mt-0.5">
                      {agent.command}
                    </span>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <div className="flex items-center gap-1.5">
                      {agent.status === 'installed' && (
                        <div className="flex items-center gap-1">
                          <CheckCircle2 size={9} className="text-ansi-green" />
                          <span className="text-[8px] font-bold text-ansi-green tracking-tight">Active</span>
                        </div>
                      )}
                      {agent.status === 'installing' && (
                        <div className="flex items-center gap-1">
                          <Loader2 size={9} className="text-ansi-blue animate-spin" />
                          <span className="text-[8px] font-bold text-ansi-blue tracking-tight">Syncing</span>
                        </div>
                      )}
                      {agent.status === 'error' && (
                        <div className="flex items-center gap-1">
                          <AlertCircle size={9} className="text-ansi-red" />
                          <span className="text-[8px] font-bold text-ansi-red tracking-tight">Error</span>
                        </div>
                      )}
                      {agent.status === 'not-installed' && (
                        <div className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-[var(--text-secondary)]/30" />
                          <span className="text-[8px] font-bold text-[var(--text-secondary)]/40 tracking-tight">Ready</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {(agent.status === 'not-installed' || agent.status === 'error') && agent.installCommand && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-7 h-7 rounded-md text-[var(--text-secondary)]/60 hover:text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10"
                          onClick={() => {
                            if (expandedErrors.has(agent.id)) toggleError(agent.id);
                            installAgent(agent.id);
                          }}
                        >
                          <Download size={11} />
                        </Button>
                      )}

                      {agent.status === 'error' && agent.errorMessage && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleError(agent.id)}
                          className={cn(
                            "w-7 h-7 rounded-md transition-all",
                            expandedErrors.has(agent.id)
                              ? "text-red-400 bg-red-500/10"
                              : "text-[var(--text-secondary)]/40 hover:text-red-400 hover:bg-red-500/10"
                          )}
                        >
                          <ChevronDown size={11} className={cn("transition-transform duration-200", expandedErrors.has(agent.id) && "rotate-180")} />
                        </Button>
                      )}

                      {!agent.isDefault && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-7 h-7 text-[var(--text-secondary)]/40 opacity-0 group-hover/agent:opacity-100 transition-all hover:bg-red-500/10 hover:text-red-400 active:scale-95"
                              onClick={() => deleteAgent(agent.id)}
                            >
                              <Trash2 size={11} />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" sideOffset={4} className="text-[10px] bg-[var(--surface-color)] border-[var(--border-color)] text-[var(--text-primary)]">
                            Remove Agent
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </div>
                </CardContent>

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
              </Card>
              );
            })}

            <AnimatePresence mode="wait">
              {!showAddForm ? (
                <motion.button
                  key="add-btn"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center gap-2 p-6 rounded-lg border-2 border-dashed border-[var(--border-color)]/20 bg-transparent hover:border-[var(--accent-primary)]/30 hover:bg-[var(--accent-primary)]/[0.02] transition-all group/add cursor-pointer"
                  onClick={() => setShowAddForm(true)}
                >
                  <Plus size={16} className="text-[var(--text-secondary)] group-hover/add:text-[var(--accent-primary)] transition-colors" />
                  <span className="text-[11px] font-bold text-[var(--text-secondary)] group-hover/add:text-[var(--accent-primary)] transition-colors">
                    Register Custom Agent
                  </span>
                </motion.button>
              ) : (
                <motion.form
                  key="add-form"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="sm:col-span-2 flex flex-col gap-4 p-5 rounded-xl border border-[var(--accent-primary)]/20 bg-[var(--accent-primary)]/[0.02]"
                  onSubmit={handleAddSubmit}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]">
                      <Plus size={14} />
                    </div>
                    <div>
                      <span className="text-[12px] font-bold text-[var(--text-primary)]">New Custom Agent</span>
                      <p className="text-[10px] text-[var(--text-secondary)]/70">Register a custom CLI agent for your workflow</p>
                    </div>
                  </div>

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
                        className="h-8 text-[11px] font-bold bg-[var(--bg-color)]/50 border-[var(--border-color)]/20 focus:border-[var(--accent-primary)]/40"
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

                  <div className="flex items-center gap-2 justify-end">
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

import { useState, useMemo, useRef } from "react";
import { Cpu, Download, CheckCircle2, AlertCircle, Loader2, Plus, Trash2, ChevronDown, Edit2, Upload } from "@/components/ui/icons";
import { m, AnimatePresence } from "framer-motion";
import { useAgents } from "@/hooks/useAgents";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn, toTitleCase } from "@/lib/utils";
import { ViewMode } from "@/components/ui/view-toggle";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { toast } from "sonner";
import * as LobeIcons from "@lobehub/icons";
import React from "react";
import { Agent } from "@/lib";

const AGENT_META: Record<string, { description: string }> = {
  'agent-gemini': {
    description: "Google's AI-powered command-line assistant for natural language interactions",
  },
  'agent-claude': {
    description: "Anthropic's conversational AI agent designed for terminal workflows",
  },
  'agent-codex': {
    description: "OpenAI's coding agent that translates natural language into terminal commands",
  },
  'agent-opencode': {
    description: "Cortex's native AI agent for code generation and terminal assistance",
  },
  'agent-antigravity': {
    description: "Zero-configuration deployment agent for launching projects from the terminal",
  },
};

function resolveLobeIcon(name: string | undefined): any {
  if (!name || !name.trim()) return null;
  const trimmed = name.trim();
  
  // 1. Exact match
  if ((LobeIcons as any)[trimmed]) return (LobeIcons as any)[trimmed];

  // 2. Capitalized match (e.g. 'gemini' -> 'Gemini')
  const capitalized = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  if ((LobeIcons as any)[capitalized]) return (LobeIcons as any)[capitalized];

  // 3. Case-insensitive TOC lookup
  const match = (LobeIcons.toc || []).find(
    (item: any) => item.id.toLowerCase() === trimmed.toLowerCase()
  );
  if (match && (LobeIcons as any)[match.id]) {
    return (LobeIcons as any)[match.id];
  }

  return null;
}

interface AgentsTabProps {
  searchQuery: string;
  viewMode: ViewMode;
  isAdding: boolean;
  setIsAdding: (adding: boolean) => void;
  activeSubTab: string;
  onSubTabChange: (tab: string) => void;
}

export function AgentsTab({
  searchQuery,
  viewMode,
  isAdding,
  setIsAdding,
  activeSubTab,
  onSubTabChange,
}: AgentsTabProps) {
  const { agents, installAgent, addAgent, editAgent, deleteAgent } = useAgents();
  const [editingAgentId, setEditingAgentId] = useState<string | null>(null);

  const [newLabel, setNewLabel] = useState("");
  const [newCommand, setNewCommand] = useState("");
  const [newInstallCommand, setNewInstallCommand] = useState("");
  const [newDownloadUrl, setNewDownloadUrl] = useState("");
  const [newIcon, setNewIcon] = useState("");
  const [tempIconBase64, setTempIconBase64] = useState("");
  const [expandedErrors, setExpandedErrors] = useState<Set<string>>(new Set());

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Real-time icon validation using robust helper
  const brandIconComponent = resolveLobeIcon(newIcon);
  const brandIconExists = !!brandIconComponent;

  const toggleError = (id: string) => {
    setExpandedErrors(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) { // Increased to 5MB
      toast.error("Image too large", {
        description: "Please choose an image smaller than 5MB.",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setTempIconBase64(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleEditClick = (agent: Agent) => {
    setEditingAgentId(agent.id);
    setNewLabel(agent.label);
    setNewCommand(agent.command);
    setNewInstallCommand(agent.installCommand || "");
    setNewDownloadUrl(agent.downloadUrl || "");
    setNewIcon(agent.icon && !agent.icon.startsWith("data:image/") ? agent.icon : "");
    setTempIconBase64(agent.icon && agent.icon.startsWith("data:image/") ? agent.icon : "");
    setIsAdding(true);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCommand.trim()) {
      const finalIcon = tempIconBase64 || newIcon;
      if (editingAgentId) {
        editAgent(editingAgentId, newLabel, newCommand, newInstallCommand, newDownloadUrl, finalIcon);
      } else {
        addAgent(newLabel, newCommand, newInstallCommand, newDownloadUrl, finalIcon);
      }
      handleCancel();
    }
  };

  const handleCancel = () => {
    setNewLabel("");
    setNewCommand("");
    setNewInstallCommand("");
    setNewDownloadUrl("");
    setNewIcon("");
    setTempIconBase64("");
    setEditingAgentId(null);
    setIsAdding(false);
  };

  const getAgentMeta = (agentId: string) => {
    const meta = AGENT_META[agentId];
    if (meta) return meta;
    const agent = agents.find(a => a.id === agentId);
    return {
      description: `Custom agent for the "${agent?.command ?? 'unknown'}" terminal command`,
    };
  };

  const getAgentIcon = (agent: any, size = 28) => {
    // 0. Check if the icon is a base64 string
    if (agent.icon && agent.icon.startsWith("data:image/")) {
      return (
        <img
          src={agent.icon}
          style={{ width: size, height: size }}
          className="object-contain rounded-md"
          alt={agent.label}
        />
      );
    }

    // 1. Try matching explicitly saved icon name
    let IconComponent = resolveLobeIcon(agent.icon);
    
    // 2. Try matching the label (e.g. "Gemini" -> Gemini)
    if (!IconComponent) {
      IconComponent = resolveLobeIcon(agent.label);
    }

    // 3. Try matching the command (e.g. "gemini" -> Gemini)
    if (!IconComponent) {
      IconComponent = resolveLobeIcon(agent.command);
    }

    if (IconComponent) {
      return IconComponent.Color ? <IconComponent.Color size={size} /> : <IconComponent size={size} />;
    }

    return <Cpu size={size} className="text-[var(--accent-primary)] opacity-80" />;
  };

  // Grouping
  const activeAgents = useMemo(() => agents, [agents]);

  const installedAgents = useMemo(
    () => agents.filter((a) => a.status === "installed"),
    [agents]
  );

  const customAgents = useMemo(
    () => agents.filter((a) => !a.isDefault),
    [agents]
  );

  const filtered = useMemo(() => {
    let list = activeAgents;
    if (activeSubTab === "installed") {
      list = installedAgents;
    } else if (activeSubTab === "custom") {
      list = customAgents;
    }
    return list.filter(
      (a) =>
        a.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.command.toLowerCase().includes(searchQuery.toLowerCase()) ||
        getAgentMeta(a.id).description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [activeSubTab, activeAgents, installedAgents, customAgents, searchQuery]);

  const renderContent = () => {
    if (filtered.length === 0) {
      return (
        <EmptyState
          icon={Cpu}
          title={searchQuery ? "No Agents Found" : activeSubTab === "installed" ? "No Installed Agents" : "No Agents Registered"}
          description={
            searchQuery
              ? `No agents matching "${searchQuery}" were found.`
              : activeSubTab === "installed"
              ? "Install available agents to deploy them in terminal panes."
              : "Register custom CLI agents to get started."
          }
          iconColor="text-[var(--accent-primary)]/40"
          action={
            !searchQuery && activeSubTab !== "installed"
              ? {
                  label: "Register Custom Agent",
                  onClick: () => setIsAdding(true),
                  icon: Plus,
                }
              : undefined
          }
          compact
        />
      );
    }

    if (viewMode === "card") {
      return (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {filtered.map((agent) => {
            const meta = getAgentMeta(agent.id);
            return (
              <Card
                key={agent.id}
                className={cn(
                  "group/agent relative flex flex-col p-0 bg-[var(--text-primary)]/[0.02] hover:bg-[var(--text-primary)]/[0.04] transition-all duration-300 border min-h-[140px]",
                  agent.status === "installed"
                    ? "border-emerald-500/20 bg-emerald-500/[0.01]"
                    : agent.status === "error"
                    ? "border-red-500/20 bg-red-500/[0.01]"
                    : "border-[var(--border-color)]"
                )}
              >
                <CardHeader className="p-4 pb-2 border-none">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5 text-[var(--text-primary)] group-hover/agent:scale-105 transition-transform duration-300">
                      {getAgentIcon(agent)}
                    </div>
                    <div className="flex flex-col text-left min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-bold text-[var(--text-primary)] truncate">
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
                      <span className="text-[11.5px] text-[var(--text-secondary)] mt-1 leading-relaxed line-clamp-2">
                        {meta.description}
                      </span>
                    </div>
                  </div>
                </CardHeader>

                <CardFooter className="px-4 py-2 border-t border-[var(--border-color)] bg-[var(--bg-color)]/20 flex items-center justify-between mt-auto gap-4">
                  <span className="text-[9px] text-[var(--text-secondary)] opacity-60 truncate max-w-[120px]" title={`cmd: ${agent.command}`}>
                    {agent.command}
                  </span>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="flex items-center gap-1.5">
                      {agent.status === "installed" && (
                        <div className="flex items-center gap-1 font-bold text-[9px] text-[var(--ansi-green)] uppercase">
                          <span>Active</span>
                          <CheckCircle2 size={11} />
                        </div>
                      )}
                      {agent.status === "installing" && (
                        <div className="flex items-center gap-1 font-bold text-[9px] text-[var(--accent-primary)] uppercase">
                          <span>Syncing</span>
                          <Loader2 size={11} className="animate-spin" />
                        </div>
                      )}
                      {agent.status === "error" && (
                        <div className="flex items-center gap-1 font-bold text-[9px] text-[var(--ansi-red)] uppercase">
                          <span>Error</span>
                          <AlertCircle size={11} />
                        </div>
                      )}
                      {agent.status === "not-installed" && (
                        <div className="flex items-center gap-1">
                          {agent.installCommand ? (
                            <div className="flex items-center gap-1 font-bold text-[9px] text-[var(--text-secondary)] uppercase">
                              <span>Available</span>
                              <div className="w-1.5 h-1.5 rounded-full bg-[var(--text-secondary)]/30" />
                            </div>
                          ) : (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center gap-1 font-bold text-[9px] text-[var(--ansi-red)] uppercase cursor-help">
                                  <span>Unavailable</span>
                                  <AlertCircle size={11} />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="bottom" className="text-[10px] max-w-xs bg-[var(--surface-color)] border-[var(--border-color)] text-[var(--text-primary)]">
                                Command "{agent.command}" was not found in your system's PATH. Please install it manually or check the command name.
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {(agent.status === "not-installed" || agent.status === "error") && agent.installCommand && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              className="text-[var(--text-secondary)]/60 hover:text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10"
                              onClick={() => {
                                if (expandedErrors.has(agent.id)) toggleError(agent.id);
                                installAgent(agent.id);
                              }}
                            >
                              <Download size={12} />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="text-[10px]">Install CLI tool</TooltipContent>
                        </Tooltip>
                      )}

                      {agent.status === "error" && agent.errorMessage && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleError(agent.id)}
                          className={cn(
                            "w-6 h-6 rounded-md transition-all text-[var(--text-secondary)] hover:text-red-400 hover:bg-red-500/10",
                            expandedErrors.has(agent.id) && "text-red-400 bg-red-500/10"
                          )}
                        >
                          <ChevronDown size={11} className={cn("transition-transform duration-200", expandedErrors.has(agent.id) && "rotate-180")} />
                        </Button>
                      )}

                      {!agent.isDefault && (
                        <div className="flex items-center gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon-xs"
                                className="text-[var(--text-secondary)]/40 opacity-0 group-hover/agent:opacity-100 transition-all hover:bg-[var(--accent-primary)]/10 hover:text-[var(--accent-primary)] active:scale-95"
                                onClick={() => handleEditClick(agent)}
                              >
                                <Edit2 size={12} />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="text-[10px]">Edit Agent</TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon-xs"
                                className="text-[var(--text-secondary)]/40 opacity-0 group-hover/agent:opacity-100 transition-all hover:bg-red-500/10 hover:text-red-400 active:scale-95"
                                onClick={() => deleteAgent(agent.id)}
                              >
                                <Trash2 size={12} />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="text-[10px]">Remove Agent</TooltipContent>
                          </Tooltip>
                        </div>
                      )}
                    </div>
                  </div>
                </CardFooter>

                <AnimatePresence initial={false}>
                  {agent.status === "error" && expandedErrors.has(agent.id) && agent.errorMessage && (
                    <m.div
                      key="error-panel"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden w-full border-t border-[var(--border-color)] bg-[var(--bg-color)]/30"
                    >
                      <div className="p-4">
                        <p className="text-[9px] font-bold tracking-widest text-red-400/70 mb-2">Installation Error Output</p>
                        <pre className="text-[10px] text-red-300/80 whitespace-pre-wrap break-all leading-relaxed max-h-40 overflow-y-auto scrollbar-thin">{agent.errorMessage}</pre>
                      </div>
                    </m.div>
                  )}
                </AnimatePresence>
              </Card>
            );
          })}
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12"></TableHead>
            <TableHead className="text-[10px] font-semibold text-[var(--text-secondary)]/50">Name</TableHead>
            <TableHead className="text-[10px] font-semibold text-[var(--text-secondary)]/50">Command</TableHead>
            <TableHead className="text-[10px] font-semibold text-[var(--text-secondary)]/50">Status</TableHead>
            <TableHead className="w-24 text-right"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((agent) => (
            <TableRow
              key={agent.id}
              className={cn(
                "transition-all",
                agent.status === "installed"
                  ? "bg-emerald-500/[0.005] hover:bg-emerald-500/[0.01]"
                  : "text-[var(--text-secondary)]/70 hover:bg-[var(--text-primary)]/[0.02]"
              )}
            >
              <TableCell>
                <div className="flex-shrink-0 text-[var(--text-primary)]">
                  {getAgentIcon(agent, 16)}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-bold text-[var(--text-primary)]">
                    {toTitleCase(agent.label)}
                  </span>
                  {agent.isDefault && (
                    <span className="text-[7px] px-1 py-0.2 bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] font-bold tracking-tight rounded">
                      Default
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <span className="text-[11px] opacity-80">{agent.command}</span>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1.5">
                  {agent.status === "installed" && (
                    <span className="text-[9px] font-bold text-[var(--ansi-green)] uppercase">Active</span>
                  )}
                  {agent.status === "installing" && (
                    <span className="text-[9px] font-bold text-[var(--accent-primary)] uppercase flex items-center gap-1">
                      <Loader2 size={10} className="animate-spin" /> Syncing
                    </span>
                  )}
                  {agent.status === "error" && (
                    <span className="text-[9px] font-bold text-[var(--ansi-red)] uppercase">Error</span>
                  )}
                  {agent.status === "not-installed" && (
                    <div className="flex items-center gap-1">
                      {agent.installCommand ? (
                        <span className="text-[9px] font-bold text-[var(--text-secondary)] uppercase">Ready</span>
                      ) : (
                        <span className="text-[9px] font-bold text-[var(--ansi-red)] uppercase">Unavailable</span>
                      )}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1.5">
                  {(agent.status === "not-installed" || agent.status === "error") && agent.installCommand && (
                    <Button
                      variant="ghost"
                      size="xs"
                      className="text-[9px] font-bold text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/5 h-6"
                      onClick={() => installAgent(agent.id)}
                    >
                      Install
                    </Button>
                  )}
                  {!agent.isDefault && (
                    <div className="flex items-center gap-1 justify-end">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        className="text-[var(--text-secondary)]/50 hover:text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/5 h-6 w-6"
                        onClick={() => handleEditClick(agent)}
                      >
                        <Edit2 size={12} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        className="text-[var(--text-secondary)]/50 hover:text-red-400 hover:bg-red-500/10 h-6 w-6"
                        onClick={() => deleteAgent(agent.id)}
                      >
                        <Trash2 size={12} />
                      </Button>
                    </div>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <div className="space-y-6">
      {isAdding && (
        <Card className="bg-[var(--accent-primary)]/[0.03] border border-[var(--accent-primary)]/20 ring-0 shadow-none p-5 animate-in fade-in slide-in-from-top-2 duration-300 text-left">
          <form onSubmit={handleAddSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[var(--accent-primary)] tracking-wider block">
                  Terminal Command
                </label>
                <Input
                  autoFocus
                  placeholder="e.g. copilot"
                  className="bg-[var(--text-primary)]/5 border-[var(--border-color)] text-[13px] h-9"
                  value={newCommand}
                  onChange={(e) => setNewCommand(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-[var(--accent-primary)] tracking-wider block">
                    Agent Label (Optional)
                  </label>
                  {newCommand.trim() && (
                    <button
                      type="button"
                      onClick={() => setNewLabel(newCommand.trim())}
                      className="text-[8px] font-bold text-[var(--accent-primary)] hover:underline hover:brightness-110 cursor-pointer"
                    >
                      Use Command
                    </button>
                  )}
                </div>
                <Input
                  placeholder="e.g. COPILOT"
                  className="bg-[var(--text-primary)]/5 border-[var(--border-color)] text-[13px] h-9"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[var(--accent-primary)] tracking-wider block">
                  Installation Command (Optional)
                </label>
                <Input
                  placeholder="e.g. npm install -g @github/copilot-cli"
                  className="bg-[var(--text-primary)]/5 border-[var(--border-color)] text-[11px] h-9"
                  value={newInstallCommand}
                  onChange={(e) => setNewInstallCommand(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-[var(--accent-primary)] tracking-wider block">
                    Icon Brand Name (Optional)
                  </label>
                  {newCommand.trim() && (
                    <button
                      type="button"
                      onClick={() => setNewIcon(newCommand.trim())}
                      className="text-[8px] font-bold text-[var(--accent-primary)] hover:underline hover:brightness-110 cursor-pointer"
                    >
                      Use Command
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Input
                    placeholder="Mistral"
                    className={cn(
                      "bg-[var(--text-primary)]/5 border-[var(--border-color)] text-[13px] h-9 pr-8",
                      brandIconExists && "border-green-500/30 focus:border-green-500/50"
                    )}
                    value={newIcon}
                    onChange={(e) => setNewIcon(e.target.value)}
                    disabled={!!tempIconBase64}
                  />
                  {brandIconExists && brandIconComponent && (
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none" title="Matching LobeHub icon found!">
                      {brandIconComponent.Color ? (
                        <brandIconComponent.Color size={16} />
                      ) : (
                        <React.Fragment>
                          {React.createElement(brandIconComponent, { size: 16 })}
                        </React.Fragment>
                      )}
                    </div>
                  )}
                </div>
                {newIcon.trim() && !brandIconExists && !tempIconBase64 && (
                  <span className="text-[9px] text-[var(--ansi-red)]/70 px-1 font-semibold mt-0.5 block">
                    No matching icon brand found in library.
                  </span>
                )}
                {tempIconBase64 && (
                  <span className="text-[9px] text-[var(--text-secondary)]/50 px-1 font-semibold mt-0.5 block italic">
                    Custom image icon overrides brand name.
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[var(--accent-primary)] tracking-wider block">
                Custom Icon Image (Optional)
              </label>
              <div className="flex items-center gap-4 p-3 rounded-lg border border-[var(--border-color)]/20 bg-[var(--bg-color)]/30">
                {tempIconBase64 ? (
                  <div className="relative w-12 h-12 rounded-lg border border-[var(--border-color)]/40 flex items-center justify-center bg-[var(--surface-color)]/80 shrink-0 shadow-inner group/icon-preview">
                    <img src={tempIconBase64} className="w-9 h-9 object-contain rounded" alt="Preview" />
                    <button
                      type="button"
                      onClick={() => setTempIconBase64("")}
                      className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center text-[10px] leading-none transition-colors shadow"
                    >
                      &times;
                    </button>
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-lg border border-dashed border-[var(--border-color)]/30 flex items-center justify-center text-[var(--text-secondary)]/40 shrink-0 bg-[var(--bg-color)]/20">
                    <Upload size={16} />
                  </div>
                )}
                <div className="flex-1 flex flex-col gap-1.5">
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      className="h-7 text-[10px] font-bold bg-white/5 border border-[var(--border-color)]/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/10"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Choose PNG/JPG
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                    {tempIconBase64 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        className="h-7 text-[10px] font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        onClick={() => setTempIconBase64("")}
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                  <span className="text-[8px] text-[var(--text-secondary)]/50">
                    Max size 5MB. PNG, JPG or SVG. Overrides the Brand Name option.
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                className="text-[11px] h-8 text-[var(--text-secondary)]"
                type="button"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                type="submit"
                className="bg-[var(--accent-primary)] text-[var(--accent-contrast)] text-[11px] font-bold h-8 hover:opacity-90"
              >
                {editingAgentId ? "Update Agent" : "Register Agent"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Tabs
        value={activeSubTab}
        onValueChange={onSubTabChange}
        className="space-y-4"
      >
        <div className="flex items-center justify-between mb-2">
          <TabsList className="bg-[var(--text-primary)]/[0.03]">
            <TabsTrigger
              value="all"
              className="text-[11px] font-bold tracking-wider"
            >
              All ({activeAgents.length})
            </TabsTrigger>
            <TabsTrigger
              value="installed"
              className="text-[11px] font-bold tracking-wider"
            >
              Installed ({installedAgents.length})
            </TabsTrigger>
            <TabsTrigger
              value="custom"
              className="text-[11px] font-bold tracking-wider"
            >
              Custom ({customAgents.length})
            </TabsTrigger>
          </TabsList>

          <Button
            onClick={() => {
              if (isAdding) {
                handleCancel();
              } else {
                setIsAdding(true);
              }
            }}
            className="h-8 px-4 text-[11px] font-bold bg-[var(--accent-primary)] text-[var(--accent-contrast)] hover:opacity-90 rounded-md transition-all flex gap-2"
          >
            <Plus
              size={14}
              strokeWidth={3}
              className={cn(
                "transition-transform duration-300",
                isAdding && "rotate-45"
              )}
            />{" "}
            {isAdding ? "Cancel" : "Register Agent"}
          </Button>
        </div>

        <TabsContent value="all">{renderContent()}</TabsContent>
        <TabsContent value="installed">{renderContent()}</TabsContent>
        <TabsContent value="custom">{renderContent()}</TabsContent>
      </Tabs>
    </div>
  );
}

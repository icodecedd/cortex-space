import { useState, useEffect, useCallback, useRef } from "react";
import { getSetting, setSetting } from "@/lib/store";
import { Agent } from "@/types";
import { DEFAULT_AGENTS } from "@/lib/setup-constants";
import { toast } from "sonner";
import { invoke } from "@tauri-apps/api/core";

export function useAgents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const agentsRef = useRef<Agent[]>([]);

  // Sync ref with state
  useEffect(() => {
    agentsRef.current = agents;
  }, [agents]);

  useEffect(() => {
    async function loadAgents() {
      const saved = await getSetting<Agent[]>("cortex_agents", DEFAULT_AGENTS);
      
      // 1. Immediately set the loaded state from memory/store and initialize to avoid blocking the UI
      const initial = saved.map(agent => {
        const defaultAgent = DEFAULT_AGENTS.find(da => da.id === agent.id);
        return {
          ...agent,
          installCommand: defaultAgent?.installCommand ?? agent.installCommand,
          downloadUrl: defaultAgent?.downloadUrl ?? agent.downloadUrl,
        } as Agent;
      });
      
      setAgents(initial);
      agentsRef.current = initial;
      setIsInitialized(true);

      // 2. Perform verification check asynchronously in the background
      const updated = await Promise.all(initial.map(async (agent) => {
        try {
          const isInstalled = await invoke<boolean>("check_command", { command: agent.command });
          return {
            ...agent,
            status: isInstalled ? 'installed' : agent.status === 'installed' ? 'not-installed' : agent.status 
          } as Agent;
        } catch (e) {
          console.error("Verification failed for agent:", agent.label, e);
          return agent;
        }
      }));

      setAgents(updated);
      agentsRef.current = updated;
    }
    loadAgents();
  }, []);

  useEffect(() => {
    if (isInitialized) {
      setSetting("cortex_agents", agents);
    }
  }, [agents, isInitialized]);

  const addAgent = useCallback((label: string, command: string, installCommand?: string, downloadUrl?: string) => {
    const trimmedLabel = label?.trim();
    const trimmedCommand = command?.trim();
    const trimmedInstallCommand = installCommand?.trim();
    const trimmedDownloadUrl = downloadUrl?.trim();
    
    if (!trimmedCommand) {
      toast.error("Failed to add agent", {
        description: "Enter a valid command to register the agent."
      });
      return;
    }

    const currentAgents = agentsRef.current;
    const isDuplicate = currentAgents.some(a => a.command.trim() === trimmedCommand);
    
    if (isDuplicate) {
      toast.error("Agent cannot be added", {
        description: "An agent with this command already exists."
      });
      return;
    }

    const newAgent: Agent = {
      id: crypto.randomUUID(),
      label: trimmedLabel || trimmedCommand.toUpperCase(),
      command: trimmedCommand,
      status: 'not-installed',
      downloadUrl: trimmedDownloadUrl || undefined,
      installCommand: trimmedInstallCommand || undefined,
      isDefault: false
    };

    setAgents(prev => [...prev, newAgent]);
    toast.success(`${newAgent.label} added successfully`, {
      description: "The agent is now in your protocol matrix."
    });
    
    // Check if it's already installed
    invoke<boolean>("check_command", { command: trimmedCommand }).then(isInstalled => {
      if (isInstalled) {
        updateAgentStatus(newAgent.id, 'installed');
      }
    });
  }, []);

  const updateAgentStatus = useCallback((id: string, status: Agent['status']) => {
    setAgents(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  }, []);

  const deleteAgent = useCallback((id: string) => {
    const agent = agentsRef.current.find(a => a.id === id);
    if (agent?.isDefault) {
      toast.error("Agent cannot be deleted", {
        description: "Default agents must remain in your library."
      });
      return;
    }
    setAgents(prev => prev.filter(a => a.id !== id));
    toast.success(`${agent?.label || 'Agent'} removed successfully`, {
      description: "The agent has been removed from your library."
    });
  }, []);

  const installAgent = useCallback(async (id: string) => {
    const agent = agentsRef.current.find(a => a.id === id);
    if (!agent) return;

    updateAgentStatus(id, 'installing');
    
    // Simulate managed setup for now
    try {
      if (agent.installCommand) {
        await invoke("install_agent_cli", { command: agent.installCommand });
        // Add a small artificial delay so the UI progress animation is visible
        await new Promise(resolve => setTimeout(resolve, 2500));
      } else {
        // Fallback for agents without an install script (simulate)
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      // Check again if command is now available
      const isInstalled = await invoke<boolean>("check_command", { command: agent.command });
      
      if (isInstalled) {
        updateAgentStatus(id, 'installed');
        toast.success(`${agent.label} installed successfully`, {
          description: "The agent is ready for deployment."
        });
      } else {
        updateAgentStatus(id, 'error');
        toast.error(`Failed to install ${agent.label}`, {
          description: "The installation could not be verified."
        });
      }
    } catch (e) {
      updateAgentStatus(id, 'error');
      toast.error(`Failed to install ${agent.label}`, {
        description: "An error occurred during the installation process."
      });
    }
  }, [updateAgentStatus]);

  return {
    agents,
    addAgent,
    deleteAgent,
    installAgent,
    isInitialized
  };
}

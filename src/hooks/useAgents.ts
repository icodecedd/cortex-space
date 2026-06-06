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
      
      // Update installation status for each agent
      const updated = await Promise.all(saved.map(async (agent) => {
        const isInstalled = await invoke<boolean>("check_command", { command: agent.command });
        return { 
          ...agent, 
          status: isInstalled ? 'installed' : agent.status === 'installed' ? 'not-installed' : agent.status 
        } as Agent;
      }));
      
      setAgents(updated);
      agentsRef.current = updated;
      setIsInitialized(true);
    }
    loadAgents();
  }, []);

  useEffect(() => {
    if (isInitialized) {
      setSetting("cortex_agents", agents);
    }
  }, [agents, isInitialized]);

  const addAgent = useCallback((label: string, command: string, downloadUrl?: string) => {
    const trimmedLabel = label?.trim();
    const trimmedCommand = command?.trim();
    
    if (!trimmedCommand) {
      toast.error("Empty Command", {
        description: "Please enter a valid command for the agent."
      });
      return;
    }

    const currentAgents = agentsRef.current;
    const isDuplicate = currentAgents.some(a => a.command.trim() === trimmedCommand);
    
    if (isDuplicate) {
      toast.error("Duplicate Agent", {
        description: `An agent with command "${trimmedCommand}" already exists.`
      });
      return;
    }

    const newAgent: Agent = {
      id: crypto.randomUUID(),
      label: trimmedLabel || trimmedCommand.toUpperCase(),
      command: trimmedCommand,
      status: 'not-installed',
      downloadUrl,
      isDefault: false
    };

    setAgents(prev => [...prev, newAgent]);
    toast.success("Agent Added", {
      description: `"${newAgent.label}" is now in your protocol matrix.`
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
      toast.error("Cannot Delete Default Agent", {
        description: "Default agents can only be disabled (not yet implemented)."
      });
      return;
    }
    setAgents(prev => prev.filter(a => a.id !== id));
    toast.info("Agent Removed");
  }, []);

  const installAgent = useCallback(async (id: string) => {
    const agent = agentsRef.current.find(a => a.id === id);
    if (!agent) return;

    updateAgentStatus(id, 'installing');
    
    // Simulate managed setup for now
    try {
      // In a real implementation, we would call a Tauri command to download/install
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check again if command is now available
      const isInstalled = await invoke<boolean>("check_command", { command: agent.command });
      
      if (isInstalled) {
        updateAgentStatus(id, 'installed');
        toast.success(`${agent.label} Installed`, {
          description: "Agent is now ready for deployment."
        });
      } else {
        updateAgentStatus(id, 'error');
        toast.error(`Installation Failed`, {
          description: `Could not verify installation of ${agent.label}.`
        });
      }
    } catch (e) {
      updateAgentStatus(id, 'error');
      toast.error(`Installation Error`, {
        description: String(e)
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

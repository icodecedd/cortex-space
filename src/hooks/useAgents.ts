import { useState, useEffect, useCallback } from "react";
import { getSetting, setSetting } from "@/lib/store";
import { Agent } from "@/lib";
import { DEFAULT_AGENTS } from "@/lib/setup-constants";
import { toast } from "sonner";
import { invoke } from "@tauri-apps/api/core";

// Shared module-level state for synchronization across all hook instances
let globalAgents: Agent[] = [];
let globalIsInitialized = false;
let globalIsInitializing = false;
const listeners = new Set<(agents: Agent[], isInitialized: boolean) => void>();

function notify() {
  listeners.forEach((listener) => listener(globalAgents, globalIsInitialized));
}

async function writeToStore(agents: Agent[]) {
  try {
    await setSetting("cortex_agents", agents);
  } catch (e) {
    console.error("Failed to write agents to store:", e);
  }
}

async function initializeGlobalAgents() {
  if (globalIsInitialized || globalIsInitializing) return;
  globalIsInitializing = true;

  try {
    const saved = await getSetting<Agent[]>("cortex_agents", DEFAULT_AGENTS);

    // 1. Sync default properties from constants (now from JSON) to ensure updates reach users
    const initial = saved.map((agent) => {
      const defaultAgent = DEFAULT_AGENTS.find((da) => da.id === agent.id);

      // If it's a default agent, prioritize the latest installCommand and downloadUrl from the app bundle
      if (defaultAgent) {
        return {
          ...agent,
          installCommand: defaultAgent.installCommand,
          downloadUrl: defaultAgent.downloadUrl,
          // Also ensure label and command are synced if they were changed in the app bundle
          label: agent.label || defaultAgent.label,
          command: agent.command || defaultAgent.command,
        } as Agent;
      }
      return agent;
    });

    // 2. Add any NEW default agents that aren't in the saved list yet
    const missingDefaults = DEFAULT_AGENTS.filter(
      (da) => !initial.some((ia) => ia.id === da.id),
    );

    globalAgents = [...initial, ...missingDefaults];
    globalIsInitialized = true;
    notify();

    // 3. Perform verification check asynchronously in the background
    const updated = await Promise.all(
      globalAgents.map(async (agent) => {
        try {
          const isInstalled = await invoke<boolean>("check_command", {
            command: agent.command,
          });
          return {
            ...agent,
            status: isInstalled
              ? "installed"
              : agent.status === "installed"
                ? "not-installed"
                : agent.status,
          } as Agent;
        } catch (e) {
          console.error("Verification failed for agent:", agent.label, e);
          return agent;
        }
      }),
    );

    globalAgents = updated;
    await writeToStore(updated);
    notify();
  } catch (error) {
    console.error("Failed to initialize agents:", error);
  } finally {
    globalIsInitializing = false;
  }
}

async function reloadFromStore() {
  try {
    const saved = await getSetting<Agent[]>("cortex_agents", DEFAULT_AGENTS);
    const initial = saved.map((agent) => {
      const defaultAgent = DEFAULT_AGENTS.find((da) => da.id === agent.id);
      if (defaultAgent) {
        return {
          ...agent,
          installCommand: defaultAgent.installCommand,
          downloadUrl: defaultAgent.downloadUrl,
          label: agent.label || defaultAgent.label,
          command: agent.command || defaultAgent.command,
        } as Agent;
      }
      return agent;
    });

    const missingDefaults = DEFAULT_AGENTS.filter(
      (da) => !initial.some((ia) => ia.id === da.id),
    );

    globalAgents = [...initial, ...missingDefaults];
    notify();
  } catch (e) {
    console.error("Failed to reload agents store:", e);
  }
}

// Global listener for settings changes
if (typeof window !== "undefined") {
  window.addEventListener("cortex-settings-changed", reloadFromStore);
  window.addEventListener("cortex:agents-updated", reloadFromStore);
}

export function useAgents() {
  const [agents, setAgents] = useState<Agent[]>(globalAgents);
  const [isInitialized, setIsInitialized] = useState(globalIsInitialized);

  useEffect(() => {
    const listener = (nextAgents: Agent[], nextInitialized: boolean) => {
      setAgents(nextAgents);
      setIsInitialized(nextInitialized);
    };
    listeners.add(listener);

    // Trigger initialization if not started
    if (!globalIsInitialized && !globalIsInitializing) {
      initializeGlobalAgents();
    }

    return () => {
      listeners.delete(listener);
    };
  }, []);

  const updateAgentStatus = useCallback(
    async (id: string, status: Agent["status"], errorMessage?: string) => {
      globalAgents = globalAgents.map((a) =>
        a.id === id
          ? {
              ...a,
              status,
              errorMessage:
                errorMessage ??
                (status !== "error" ? undefined : a.errorMessage),
            }
          : a,
      );
      notify();
      await writeToStore(globalAgents);
      window.dispatchEvent(new Event("cortex:agents-updated"));
    },
    [],
  );

  const installAgent = useCallback(
    async (id: string) => {
      const agent = globalAgents.find((a) => a.id === id);
      if (!agent) return;

      // Clear any previous error and mark as installing
      await updateAgentStatus(id, "installing", undefined);

      try {
        if (agent.installCommand) {
          await invoke("install_agent_cli", { command: agent.installCommand });
          await new Promise((resolve) => setTimeout(resolve, 1500));
        } else {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        // Invoke succeeded — optimistically mark installed. PATH refresh needs new shell.
        await updateAgentStatus(id, "installed", undefined);

        try {
          const confirmedInPath = await invoke<boolean>("check_command", {
            command: agent.command,
          });
          if (!confirmedInPath) {
            toast.success(`${agent.label} installed successfully`, {
              description:
                "Restart Cortex or open a new terminal for the command to be available in PATH.",
              duration: 7000,
            });
          } else {
            toast.success(`${agent.label} installed successfully`, {
              description: "The agent is ready for deployment.",
            });
          }
        } catch {
          toast.success(`${agent.label} installed successfully`, {
            description: "The agent is ready for deployment.",
          });
        }
      } catch (e: any) {
        const detail =
          typeof e === "string"
            ? e
            : (e?.message ?? "An unexpected error occurred.");
        await updateAgentStatus(id, "error", detail);
        toast.error(`Failed to install ${agent.label}`, {
          description:
            'Click "View Error" on the agent card to see full details.',
          duration: 6000,
        });
      }
    },
    [updateAgentStatus],
  );

  const addAgent = useCallback(
    async (
      label: string,
      command: string,
      installCommand?: string,
      downloadUrl?: string,
      icon?: string,
    ) => {
      const trimmedLabel = label?.trim();
      const trimmedCommand = command?.trim();
      const trimmedInstallCommand = installCommand?.trim();
      const trimmedDownloadUrl = downloadUrl?.trim();
      const trimmedIcon = icon?.trim();

      if (!trimmedCommand) {
        toast.error("Failed to add agent", {
          description: "Enter a valid command to register the agent.",
        });
        return;
      }

      const isDuplicate = globalAgents.some(
        (a) => a.command.trim() === trimmedCommand,
      );

      if (isDuplicate) {
        toast.error("Agent cannot be added", {
          description: "An agent with this command already exists.",
        });
        return;
      }

      let finalLabel = trimmedLabel || trimmedCommand.toUpperCase();

      // Normalize standard names like 'freebuff' to 'Freebuff'
      if (finalLabel.toLowerCase() === "freebuff") {
        finalLabel = "Freebuff";
      }

      const newAgent: Agent = {
        id: crypto.randomUUID(),
        label: finalLabel,
        command: trimmedCommand,
        status: "not-installed",
        downloadUrl: trimmedDownloadUrl || undefined,
        installCommand: trimmedInstallCommand || undefined,
        isDefault: false,
        icon: trimmedIcon || undefined,
      };

      globalAgents = [...globalAgents, newAgent];
      notify();
      await writeToStore(globalAgents);
      window.dispatchEvent(new Event("cortex:agents-updated"));

      toast.success(`${newAgent.label} added successfully`, {
        description: "The agent is now in your agent library.",
      });

      // Check if it's already installed
      try {
        const isInstalled = await invoke<boolean>("check_command", {
          command: trimmedCommand,
        });
        if (isInstalled) {
          await updateAgentStatus(newAgent.id, "installed");
        } else if (trimmedInstallCommand) {
          // Auto trigger installation!
          installAgent(newAgent.id);
        }
      } catch (e) {
        console.error("Verification failed for new agent:", newAgent.label, e);
      }
    },
    [updateAgentStatus, installAgent],
  );

  const editAgent = useCallback(
    async (
      id: string,
      label: string,
      command: string,
      installCommand?: string,
      downloadUrl?: string,
      icon?: string,
    ) => {
      const trimmedLabel = label?.trim();
      const trimmedCommand = command?.trim();
      const trimmedInstallCommand = installCommand?.trim();
      const trimmedDownloadUrl = downloadUrl?.trim();
      const trimmedIcon = icon?.trim();

      if (!trimmedCommand) {
        toast.error("Failed to update agent", {
          description: "Enter a valid command to update the agent.",
        });
        return;
      }

      const isDuplicate = globalAgents.some(
        (a) => a.id !== id && a.command.trim() === trimmedCommand,
      );

      if (isDuplicate) {
        toast.error("Agent cannot be updated", {
          description: "An agent with this command already exists.",
        });
        return;
      }

      let finalLabel = trimmedLabel || trimmedCommand.toUpperCase();
      if (finalLabel.toLowerCase() === "freebuff") {
        finalLabel = "Freebuff";
      }

      const existingAgent = globalAgents.find((a) => a.id === id);
      if (!existingAgent) return;

      const isCommandChanged = existingAgent.command !== trimmedCommand;
      const isInstallCommandChanged = existingAgent.installCommand !== trimmedInstallCommand;

      globalAgents = globalAgents.map((a) =>
        a.id === id
          ? {
              ...a,
              label: finalLabel,
              command: trimmedCommand,
              installCommand: trimmedInstallCommand || undefined,
              downloadUrl: trimmedDownloadUrl || undefined,
              icon: trimmedIcon || undefined,
              status: isCommandChanged ? "not-installed" : a.status,
            }
          : a,
      );

      notify();
      await writeToStore(globalAgents);
      window.dispatchEvent(new Event("cortex:agents-updated"));

      toast.success(`${finalLabel} updated successfully`);

      if (isCommandChanged) {
        try {
          const isInstalled = await invoke<boolean>("check_command", {
            command: trimmedCommand,
          });
          if (isInstalled) {
            await updateAgentStatus(id, "installed");
          } else if (trimmedInstallCommand) {
            installAgent(id);
          }
        } catch (e) {
          console.error("Verification failed for updated agent:", finalLabel, e);
        }
      } else if (isInstallCommandChanged && trimmedInstallCommand) {
        const updatedAgent = globalAgents.find((a) => a.id === id);
        if (updatedAgent && updatedAgent.status !== "installed" && updatedAgent.status !== "installing") {
          installAgent(id);
        }
      }
    },
    [updateAgentStatus, installAgent],
  );

  const deleteAgent = useCallback(async (id: string) => {
    const agent = globalAgents.find((a) => a.id === id);
    if (agent?.isDefault) {
      toast.error("Agent cannot be deleted", {
        description: "Default agents must remain in your library.",
      });
      return;
    }

    globalAgents = globalAgents.filter((a) => a.id !== id);
    notify();
    await writeToStore(globalAgents);
    window.dispatchEvent(new Event("cortex:agents-updated"));

    toast.success(`${agent?.label || "Agent"} removed successfully`, {
      description: "The agent has been removed from your library.",
    });
  }, []);

  return {
    agents,
    addAgent,
    editAgent,
    deleteAgent,
    installAgent,
    isInitialized,
  };
}

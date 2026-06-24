/**
 * WorkspaceContext
 *
 * Owns all workspace state and operations so App.tsx is no longer a god
 * component. Every workspace mutation lives here; App.tsx only holds
 * UI/dialog state and renders the layout.
 *
 * Improvements vs the old App.tsx inline code:
 *  - activeWorkspace is memoised (was recomputed on every render)
 *  - handleLaunch reads mode before setWorkspaces (fixes stale-closure bug)
 *  - Workspace IDs use crypto.randomUUID() (was Date.now() - not collision-safe)
 *  - Context value is memoised to prevent unnecessary downstream re-renders
 */
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  type ReactNode,
} from "react";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";
import { type Workspace, type Mode, type SpaceTemplate, type SubTab } from "../lib";
import { useSpaceTemplates } from "../hooks/useSpaceTemplates";
import { useSnippets } from "../hooks/useSnippets";
import {
  splitNode,
  removeNode,
  updatePaneNode,
  repositionNode,
} from "../lib/setup-utils";
import { formatWorkspaceName } from "../lib/utils";
import { getSetting, setSetting, type StartupBehavior } from "../lib/store";
import { APP_CONTENT } from "../lib/content";

// ---------------------------------------------------------------------------
// Context shape
// ---------------------------------------------------------------------------

export interface WorkspaceContextValue {
  // State
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  activeWorkspace: Workspace | undefined;

  // Templates
  templates: ReturnType<typeof useSpaceTemplates>["templates"];
  captureCurrent: ReturnType<typeof useSpaceTemplates>["captureCurrent"];
  deleteTemplate: ReturnType<typeof useSpaceTemplates>["deleteTemplate"];
  deleteTemplates: ReturnType<typeof useSpaceTemplates>["deleteTemplates"];
  archiveTemplate: ReturnType<typeof useSpaceTemplates>["archiveTemplate"];
  archiveTemplates: ReturnType<typeof useSpaceTemplates>["archiveTemplates"];
  unarchiveTemplate: ReturnType<typeof useSpaceTemplates>["unarchiveTemplate"];
  unarchiveTemplates: ReturnType<
    typeof useSpaceTemplates
  >["unarchiveTemplates"];

  // Snippets
  snippets: ReturnType<typeof useSnippets>["snippets"];
  addSnippet: ReturnType<typeof useSnippets>["addSnippet"];
  deleteSnippet: ReturnType<typeof useSnippets>["deleteSnippet"];
  deleteSnippets: ReturnType<typeof useSnippets>["deleteSnippets"];
  archiveSnippet: ReturnType<typeof useSnippets>["archiveSnippet"];
  archiveSnippets: ReturnType<typeof useSnippets>["archiveSnippets"];
  unarchiveSnippet: ReturnType<typeof useSnippets>["unarchiveSnippet"];
  unarchiveSnippets: ReturnType<typeof useSnippets>["unarchiveSnippets"];

  // Lifecycle
  initWorkspace: () => Promise<void>;

  // Workspace CRUD
  handleLaunch: (config: any) => Promise<void>;
  handleSwitchWorkspace: (id: string) => void;
  handleCloseWorkspace: (id: string) => void;
  handleCloseWorkspaces: (ids: string[]) => void;
  handleRenameWorkspace: (id: string, name: string) => void;
  handleColorWorkspace: (id: string, color: any) => void;
  handleReorderWorkspaces: (newOrder: Workspace[]) => void;
  handlePinWorkspace: (id: string, isPinned: boolean) => void;
  handleNewWorkspaceFlow: () => void;
  handleNewWorkspaceToRight: (targetId: string) => void;
  handleSelectMode: (mode: Mode) => void;
  handleGoBack: (id: string) => void;
  handleCreateProjectWorkspace: (rootPath: string, name: string) => void;
  handleUpdateWorkspace: (
    id: string,
    updates: Partial<Omit<Workspace, "id" | "subTabs" | "activeSubTabId">>,
  ) => void;

  // Sub-tab operations
  handleCreateSubTab: (mode?: Mode, workspaceId?: string) => void;
  handleCloseSubTab: (id: string) => void;
  handleSwitchSubTab: (id: string) => void;
  handleRenameSubTab: (id: string, name: string) => void;

  // Pane operations
  handleSplitPane: (
    paneId: string,
    direction: "horizontal" | "vertical",
  ) => void;
  handleKillPane: (paneId: string) => void;
  handleRenamePane: (paneId: string, newName: string) => void;
  handleMovePane: (
    dragId: string,
    dropId: string,
    direction: "top" | "bottom" | "left" | "right",
  ) => void;
  handleUpdatePaneCommand: (paneId: string, command: string) => void;

  // Template operations
  handleLaunchTemplate: (template: SpaceTemplate) => Promise<void>;
  handleCaptureCurrent: () => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(
  undefined,
);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(
    null,
  );
  const [isLoaded, setIsLoaded] = useState(false);

  // Memoised — was recomputed inline on every render in the old App.tsx
  const activeWorkspace = useMemo(
    () => workspaces.find((w) => w.id === activeWorkspaceId),
    [workspaces, activeWorkspaceId],
  );

  const {
    templates,
    captureCurrent,
    deleteTemplate,
    deleteTemplates,
    archiveTemplate,
    archiveTemplates,
    unarchiveTemplate,
    unarchiveTemplates,
  } = useSpaceTemplates();

  const {
    snippets,
    addSnippet,
    deleteSnippet,
    deleteSnippets,
    archiveSnippet,
    archiveSnippets,
    unarchiveSnippet,
    unarchiveSnippets,
  } = useSnippets();

  // ── Persistence ──────────────────────────────────────────────────────────

  // Sync workspaces to store whenever they change (and after initial load)
  useEffect(() => {
    if (isLoaded) {
      setSetting("internal.workspaces", workspaces);
      setSetting("internal.activeWorkspaceId", activeWorkspaceId);
    }
  }, [workspaces, activeWorkspaceId, isLoaded]);

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  const initWorkspace = useCallback(async () => {
    const behavior = await getSetting<StartupBehavior>(
      "startup.behavior",
      "lastMode",
    );

    if (behavior === "lastMode") {
      const savedWorkspaces = await getSetting<Workspace[]>(
        "internal.workspaces",
        [],
      );
      const savedActiveId = await getSetting<string | null>(
        "internal.activeWorkspaceId",
        null,
      );

      if (savedWorkspaces.length > 0) {
        const migrated = savedWorkspaces.map(w => {
          const oldW = w as any;
          if (!oldW.subTabs || oldW.subTabs.length === 0) {
            if (oldW.status === "active" && oldW.config) {
              const firstTabId = crypto.randomUUID();
              return {
                ...oldW,
                subTabs: [{
                  id: firstTabId,
                  name: "Tab 1",
                  mode: oldW.mode,
                  status: oldW.status,
                  config: {
                    rootPath: oldW.config.rootPath,
                    layout: oldW.config.layout,
                    panes: oldW.config.panes || [],
                  }
                }],
                activeSubTabId: firstTabId
              };
            } else {
              return {
                ...oldW,
                subTabs: [],
                activeSubTabId: null
              };
            }
          }
          return oldW as Workspace;
        });

        setWorkspaces(migrated);
        setActiveWorkspaceId(savedActiveId || migrated[0].id);
        setIsLoaded(true);
        return;
      }
    }

    const lastMode = await getSetting<Mode>("startup.lastMode", "normal");
    const initialId = crypto.randomUUID();

    let mode: Mode = "normal";
    let status: "mode-select" | "setup" = "setup";

    switch (behavior) {
      case "lastMode":
        mode = lastMode;
        status = "setup";
        break;
      case "newTerminal":
        mode = "normal";
        status = "setup";
        break;
      case "newAgents":
        mode = "agents" as Mode;
        status = "setup";
        break;
      case "modeSelector":
      default:
        mode = "normal";
        status = "setup";
        break;
    }

    setWorkspaces([{
      id: initialId,
      name: "",
      mode,
      config: null,
      status,
      subTabs: [],
      activeSubTabId: null
    }]);
    setActiveWorkspaceId(initialId);
    setIsLoaded(true);
  }, []);

  // ── Workspace CRUD ────────────────────────────────────────────────────────

  const handleLaunch = useCallback(
    async (newConfig: any) => {
      let finalPath = newConfig.rootPath;

      if (!finalPath) {
        const savedDefault = await getSetting("cortex_default_path", "");
        if (savedDefault) {
          finalPath = savedDefault;
        } else {
          try {
            const homeDir = await invoke<string>("get_home_dir");
            if (homeDir) finalPath = homeDir;
          } catch (err) {
            if (import.meta.env.DEV)
              console.error("Failed to get home directory:", err);
          }
        }
      }

      const rawName =
        finalPath
          ?.split(/[\/\\]/)
          .filter(Boolean)
          .pop() ||
        finalPath ||
        APP_CONTENT.WORKSPACE_DEFAULT_NAME;
      const rootName = formatWorkspaceName(rawName);

      const current = workspaces.find((w) => w.id === activeWorkspaceId);
      if (!current) return;
      const activeMode = current.mode;

      if (current.status !== "active" || !current.config?.rootPath) {
        const firstTabId = crypto.randomUUID();
        const firstSubTab: SubTab = {
          id: firstTabId,
          name: "Tab 1",
          mode: activeMode,
          status: "active" as const,
          config: {
            rootPath: finalPath,
            layout: newConfig.layout,
            panes: newConfig.panes || [],
          },
        };

        toast.success(APP_CONTENT.WORKSPACE_ACTIVATED(rootName), {
          description: `Workspace is now active in ${activeMode} mode.`,
        });

        setWorkspaces((prev) => {
          return prev.map((w) =>
            w.id === activeWorkspaceId
              ? {
                  ...w,
                  name: rootName,
                  config: { rootPath: finalPath },
                  status: "active" as const,
                  subTabs: [firstSubTab],
                  activeSubTabId: firstTabId,
                }
              : w,
          );
        });
      } else {
        // Project is active; launching layout configuration for a subsequent sub-tab!
        toast.success("New tab launched successfully", {
          description: `Sub-tab has been configured.`,
        });

        setWorkspaces((prev) => {
          return prev.map((w) => {
            if (w.id === activeWorkspaceId) {
              const activeTabId = w.activeSubTabId || (w.subTabs[0]?.id);
              if (!activeTabId) return w;
              return {
                ...w,
                subTabs: w.subTabs.map((t) =>
                  t.id === activeTabId
                    ? {
                        ...t,
                        status: "active" as const,
                        config: {
                          rootPath: w.config!.rootPath,
                          layout: newConfig.layout,
                          panes: newConfig.panes || [],
                        },
                      }
                    : t
                ),
              };
            }
            return w;
          });
        });
      }
    },
    [activeWorkspaceId, workspaces],
  );

  const handleSwitchWorkspace = useCallback((id: string) => {
    setActiveWorkspaceId(id);
  }, []);

  const handleCloseWorkspace = useCallback(
    (id: string) => {
      const target = workspaces.find((w) => w.id === id);
      if (!target) return;

      toast.warning("Workspace closed successfully", {
        description: "Process connections have been terminated.",
      });

      setWorkspaces((prev) => {
        const index = prev.findIndex((w) => w.id === id);
        if (index === -1) return prev;

        const updated = prev.filter((w) => w.id !== id);
        if (activeWorkspaceId === id) {
          if (updated.length > 0) {
            setActiveWorkspaceId(updated[Math.max(0, index - 1)].id);
          } else {
            setActiveWorkspaceId(null);
          }
        }

        return updated;
      });
    },
    [activeWorkspaceId, workspaces],
  );

  const handleCloseWorkspaces = useCallback(
    (ids: string[]) => {
      if (ids.length === 0) return;

      toast.warning("Workspaces closed successfully", {
        description: `${ids.length} workspaces have been terminated.`,
      });

      setWorkspaces((prev) => {
        const updated = prev.filter((w) => !ids.includes(w.id));

        if (activeWorkspaceId && ids.includes(activeWorkspaceId)) {
          if (updated.length > 0) {
            const firstIdx = prev.findIndex((w) => ids.includes(w.id));
            const next =
              updated[
                Math.max(0, Math.min(firstIdx - 1, updated.length - 1))
              ] || updated[updated.length - 1];
            setActiveWorkspaceId(next.id);
          } else {
            setActiveWorkspaceId(null);
          }
        }

        return updated;
      });
    },
    [activeWorkspaceId],
  );

  const handleRenameWorkspace = useCallback((id: string, newName: string) => {
    setWorkspaces((prev) =>
      prev.map((w) => (w.id === id ? { ...w, customName: newName } : w)),
    );
  }, []);

  const handleColorWorkspace = useCallback((id: string, color: any) => {
    setWorkspaces((prev) =>
      prev.map((w) => (w.id === id ? { ...w, color } : w)),
    );
  }, []);

  const handleReorderWorkspaces = useCallback((newOrder: Workspace[]) => {
    const pinned = newOrder.filter((w) => w.isPinned);
    const unpinned = newOrder.filter((w) => !w.isPinned);
    setWorkspaces([...pinned, ...unpinned]);
  }, []);

  const handlePinWorkspace = useCallback((id: string, isPinned: boolean) => {
    setWorkspaces((prev) => {
      const updated = prev.map((w) => (w.id === id ? { ...w, isPinned } : w));
      return [...updated].sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return 0;
      });
    });
  }, []);

  const handleCreateProjectWorkspace = useCallback((rootPath: string, name: string) => {
    const newId = crypto.randomUUID();
    const firstTabId = crypto.randomUUID();
    const firstSubTab: SubTab = {
      id: firstTabId,
      name: "Tab 1",
      mode: "normal",
      status: "mode-select" as const,
      config: null,
    };

    const newWs: Workspace = {
      id: newId,
      name: name || rootPath.split(/[\\/]/).filter(Boolean).pop() || "Project Workspace",
      mode: "normal",
      config: { rootPath },
      status: "active" as const,
      subTabs: [firstSubTab],
      activeSubTabId: firstTabId,
    };

    setWorkspaces((prev) => [...prev, newWs]);
    setActiveWorkspaceId(newId);

    toast.success("Project workspace created", {
      description: `Opened ${newWs.name} as a new project.`,
    });
  }, []);

  const handleUpdateWorkspace = useCallback(
    (id: string, updates: Partial<Omit<Workspace, "id" | "subTabs" | "activeSubTabId">>) => {
      setWorkspaces((prev) =>
        prev.map((w) => {
          if (w.id === id) {
            const next = { ...w, ...updates };
            if (updates.config !== undefined) {
              next.config = updates.config ? { ...w.config, ...updates.config } : null;
            }
            return next as Workspace;
          }
          return w;
        })
      );
    },
    [],
  );

  const handleNewWorkspaceFlow = useCallback(() => {
    const newId = crypto.randomUUID();
    setWorkspaces((prev) => [
      ...prev,
      {
        id: newId,
        name: "",
        mode: "normal" as Mode,
        config: null,
        status: "setup" as const,
        subTabs: [],
        activeSubTabId: null
      },
    ]);
    setActiveWorkspaceId(newId);
  }, []);

  const handleNewWorkspaceToRight = useCallback((targetId: string) => {
    const newId = crypto.randomUUID();
    const newWs: Workspace = {
      id: newId,
      name: "",
      mode: "normal",
      config: null,
      status: "setup",
      subTabs: [],
      activeSubTabId: null
    };
    setWorkspaces((prev) => {
      const index = prev.findIndex((w) => w.id === targetId);
      if (index === -1) return [...prev, newWs];
      const next = [...prev];
      next.splice(index + 1, 0, newWs);
      return next;
    });
    setActiveWorkspaceId(newId);
  }, []);

  const handleSelectMode = useCallback(
    (mode: Mode) => {
      setSetting("startup.lastMode", mode);
      setWorkspaces((prev) =>
        prev.map((w) => {
          if (w.id === activeWorkspaceId) {
            if (w.status !== "active") {
              return { ...w, mode, status: "setup" as const };
            }
            const activeTabId = w.activeSubTabId || (w.subTabs[0]?.id);
            if (activeTabId) {
              return {
                ...w,
                subTabs: w.subTabs.map((t) =>
                  t.id === activeTabId
                    ? { ...t, mode, status: "setup" as const }
                    : t
                ),
              };
            }
          }
          return w;
        })
      );
    },
    [activeWorkspaceId],
  );

  const handleGoBack = useCallback((id: string) => {
    setWorkspaces((prev) =>
      prev.map((w) => {
        if (w.id === id) {
          if (w.status !== "active") {
            return { ...w, status: "mode-select" as const };
          }
          const activeTabId = w.activeSubTabId || (w.subTabs[0]?.id);
          if (activeTabId) {
            return {
              ...w,
              subTabs: w.subTabs.map((t) =>
                t.id === activeTabId
                  ? { ...t, status: "mode-select" as const }
                  : t
              ),
            };
          }
        }
        return w;
      })
    );
  }, []);

  // ── Sub-tab operations ───────────────────────────────────────────────────

  const handleCreateSubTab = useCallback((mode: Mode = "normal", workspaceId?: string) => {
    const targetId = workspaceId || activeWorkspaceId;
    if (!targetId) return;
    const newTabId = crypto.randomUUID();
    setWorkspaces((prev) =>
      prev.map((w) => {
        if (w.id === targetId) {
          const newName = `Tab ${w.subTabs.length + 1}`;
          const newTab: SubTab = {
            id: newTabId,
            name: newName,
            mode,
            status: "mode-select" as const,
            config: null,
          };
          return {
            ...w,
            subTabs: [...w.subTabs, newTab],
            activeSubTabId: newTabId,
          };
        }
        return w;
      })
    );
    setActiveWorkspaceId(targetId);
  }, [activeWorkspaceId]);

  const handleCloseSubTab = useCallback((subTabId: string) => {
    if (!activeWorkspaceId) return;
    setWorkspaces((prev) =>
      prev.map((w) => {
        if (w.id === activeWorkspaceId) {
          const index = w.subTabs.findIndex((t) => t.id === subTabId);
          if (index === -1) return w;

          const updatedTabs = w.subTabs.filter((t) => t.id !== subTabId);
          if (updatedTabs.length === 0) {
            return {
              ...w,
              subTabs: [],
              activeSubTabId: null,
              status: "setup" as const,
              config: null,
            };
          }

          let nextActiveId = w.activeSubTabId;
          if (w.activeSubTabId === subTabId) {
            nextActiveId = updatedTabs[Math.max(0, index - 1)].id;
          }

          return {
            ...w,
            subTabs: updatedTabs,
            activeSubTabId: nextActiveId,
          };
        }
        return w;
      })
    );
  }, [activeWorkspaceId]);

  const handleSwitchSubTab = useCallback((subTabId: string) => {
    if (!activeWorkspaceId) return;
    setWorkspaces((prev) =>
      prev.map((w) =>
        w.id === activeWorkspaceId
          ? { ...w, activeSubTabId: subTabId }
          : w
      )
    );
  }, [activeWorkspaceId]);

  const handleRenameSubTab = useCallback((subTabId: string, newName: string) => {
    if (!activeWorkspaceId) return;
    setWorkspaces((prev) =>
      prev.map((w) =>
        w.id === activeWorkspaceId
          ? {
              ...w,
              subTabs: w.subTabs.map((t) =>
                t.id === subTabId ? { ...t, name: newName } : t
              ),
            }
          : w
      )
    );
  }, [activeWorkspaceId]);

  // ── Pane operations ───────────────────────────────────────────────────────

  const handleSplitPane = useCallback(
    (paneId: string, direction: "horizontal" | "vertical") => {
      if (!activeWorkspaceId) return;
      const internalDir = direction === "vertical" ? "horizontal" : "vertical";
      setWorkspaces((prev) =>
        prev.map((w) => {
          if (w.id === activeWorkspaceId) {
            const activeTabId = w.activeSubTabId || (w.subTabs[0]?.id);
            if (!activeTabId) return w;
            return {
              ...w,
              subTabs: w.subTabs.map((t) => {
                if (t.id === activeTabId && t.config) {
                  return {
                    ...t,
                    config: {
                      ...t.config,
                      layout: splitNode(t.config.layout, paneId, internalDir),
                    },
                  };
                }
                return t;
              }),
            };
          }
          return w;
        })
      );
    },
    [activeWorkspaceId],
  );

  const handleKillPane = useCallback(
    (paneId: string) => {
      if (!activeWorkspaceId) return;
      setWorkspaces((prev) =>
        prev.map((w) => {
          if (w.id === activeWorkspaceId) {
            const activeTabId = w.activeSubTabId || (w.subTabs[0]?.id);
            if (!activeTabId) return w;
            return {
              ...w,
              subTabs: w.subTabs.map((t) => {
                if (t.id === activeTabId && t.config) {
                  const newLayout = removeNode(t.config.layout, paneId);
                  if (!newLayout) {
                    toast.success(APP_CONTENT.WORKSPACE_RESET, {
                      description: APP_CONTENT.WORKSPACE_RESET_DESC,
                    });
                    return { ...t, status: "mode-select" as const, config: null };
                  }
                  return {
                    ...t,
                    config: {
                      ...t.config,
                      layout: newLayout,
                    },
                  };
                }
                return t;
              }),
            };
          }
          return w;
        })
      );
    },
    [activeWorkspaceId],
  );

  const handleRenamePane = useCallback(
    (paneId: string, newName: string) => {
      if (!activeWorkspaceId) return;
      setWorkspaces((prev) =>
        prev.map((w) => {
          if (w.id === activeWorkspaceId) {
            const activeTabId = w.activeSubTabId || (w.subTabs[0]?.id);
            if (!activeTabId) return w;
            return {
              ...w,
              subTabs: w.subTabs.map((t) => {
                if (t.id === activeTabId && t.config) {
                  return {
                    ...t,
                    config: {
                      ...t.config,
                      layout: updatePaneNode(t.config.layout, paneId, {
                        name: newName,
                      }),
                    },
                  };
                }
                return t;
              }),
            };
          }
          return w;
        })
      );
    },
    [activeWorkspaceId],
  );

  const handleMovePane = useCallback(
    (
      dragId: string,
      dropId: string,
      direction: "top" | "bottom" | "left" | "right",
    ) => {
      if (!activeWorkspaceId) return;
      setWorkspaces((prev) =>
        prev.map((w) => {
          if (w.id === activeWorkspaceId) {
            const activeTabId = w.activeSubTabId || (w.subTabs[0]?.id);
            if (!activeTabId) return w;
            return {
              ...w,
              subTabs: w.subTabs.map((t) => {
                if (t.id === activeTabId && t.config) {
                  return {
                    ...t,
                    config: {
                      ...t.config,
                      layout: repositionNode(
                        t.config.layout,
                        dragId,
                        dropId,
                        direction,
                      ),
                    },
                  };
                }
                return t;
              }),
            };
          }
          return w;
        })
      );
      toast.success("Layout updated successfully", {
        description: "The pane position has been saved.",
      });
    },
    [activeWorkspaceId],
  );

  const handleUpdatePaneCommand = useCallback(
    (paneId: string, command: string) => {
      if (!activeWorkspaceId) return;
      setWorkspaces((prev) =>
        prev.map((w) => {
          if (w.id === activeWorkspaceId) {
            const activeTabId = w.activeSubTabId || (w.subTabs[0]?.id);
            if (!activeTabId) return w;
            return {
              ...w,
              subTabs: w.subTabs.map((t) => {
                if (t.id === activeTabId && t.config) {
                  return {
                    ...t,
                    config: {
                      ...t.config,
                      layout: updatePaneNode(t.config.layout, paneId, {
                        command,
                      }),
                    },
                  };
                }
                return t;
              }),
            };
          }
          return w;
        })
      );
    },
    [activeWorkspaceId],
  );

  // ── Template operations ───────────────────────────────────────────────────

  const handleLaunchTemplate = useCallback(
    async (template: SpaceTemplate) => {
      try {
        const exists = await invoke<boolean>("validate_directory", {
          path: template.rootPath,
        });
        if (!exists) {
          toast.error("Failed to find directory", {
            description: "The template path no longer exists.",
          });
          return;
        }
      } catch (err) {
        if (import.meta.env.DEV)
          console.warn("Failed to verify directory existence:", err);
      }

      const firstTabId = crypto.randomUUID();
      const firstSubTab: SubTab = {
        id: firstTabId,
        name: "Tab 1",
        mode: template.mode,
        status: "active" as const,
        config: {
          rootPath: template.rootPath,
          layout: template.layout,
          panes: [],
        },
      };

      if (activeWorkspace && activeWorkspace.status === "active") {
        const newId = crypto.randomUUID();
        setWorkspaces((prev) => [
          ...prev,
          {
            id: newId,
            name: formatWorkspaceName(template.name),
            mode: template.mode,
            config: { rootPath: template.rootPath },
            status: "active" as const,
            subTabs: [firstSubTab],
            activeSubTabId: firstTabId,
          },
        ]);
        setActiveWorkspaceId(newId);
      } else {
        setWorkspaces((prev) =>
          prev.map((w) =>
            w.id === activeWorkspaceId
              ? {
                  ...w,
                  name: formatWorkspaceName(template.name),
                  mode: template.mode,
                  config: { rootPath: template.rootPath },
                  status: "active" as const,
                  subTabs: [firstSubTab],
                  activeSubTabId: firstTabId,
                }
              : w,
          ),
        );
      }

      toast.success(`${template.name} launched successfully`, {
        description: "The template was loaded from the library.",
      });
    },
    [activeWorkspace, activeWorkspaceId],
  );

  const handleCaptureCurrent = useCallback(() => {
    if (!activeWorkspace || activeWorkspace.status !== "active") {
      toast.error("Workspace cannot be captured", {
        description: "Select an active workspace before capturing.",
      });
      return;
    }

    const activeTab = activeWorkspace.subTabs.find(t => t.id === activeWorkspace.activeSubTabId) || activeWorkspace.subTabs[0];
    if (!activeTab || activeTab.status !== "active" || !activeTab.config) {
      toast.error("Active tab layout cannot be captured", {
        description: "Configure the active tab layout before capturing.",
      });
      return;
    }

    const { rootPath, layout, panes } = activeTab.config;
    const name = activeWorkspace.name || "UNNAMED SPACE";

    captureCurrent(
      formatWorkspaceName(name),
      rootPath,
      layout,
      panes,
      activeTab.mode,
      `Captured from active sub-tab on ${new Date().toLocaleDateString()}`,
    );
  }, [activeWorkspace, captureCurrent]);

  // ── Context value (memoised to prevent unnecessary downstream re-renders) ──

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      workspaces,
      activeWorkspaceId,
      activeWorkspace,
      templates,
      captureCurrent,
      deleteTemplate,
      deleteTemplates,
      archiveTemplate,
      archiveTemplates,
      unarchiveTemplate,
      unarchiveTemplates,
      snippets,
      addSnippet,
      deleteSnippet,
      deleteSnippets,
      archiveSnippet,
      archiveSnippets,
      unarchiveSnippet,
      unarchiveSnippets,
      initWorkspace,
      handleLaunch,
      handleSwitchWorkspace,
      handleCloseWorkspace,
      handleCloseWorkspaces,
      handleRenameWorkspace,
      handleColorWorkspace,
      handleReorderWorkspaces,
      handlePinWorkspace,
      handleNewWorkspaceFlow,
      handleNewWorkspaceToRight,
      handleSelectMode,
      handleGoBack,
      handleCreateProjectWorkspace,
      handleUpdateWorkspace,
      handleCreateSubTab,
      handleCloseSubTab,
      handleSwitchSubTab,
      handleRenameSubTab,
      handleSplitPane,
      handleKillPane,
      handleRenamePane,
      handleMovePane,
      handleUpdatePaneCommand,
      handleLaunchTemplate,
      handleCaptureCurrent,
    }),
    [
      workspaces,
      activeWorkspaceId,
      activeWorkspace,
      templates,
      captureCurrent,
      deleteTemplate,
      deleteTemplates,
      archiveTemplate,
      archiveTemplates,
      unarchiveTemplate,
      unarchiveTemplates,
      snippets,
      addSnippet,
      deleteSnippet,
      deleteSnippets,
      archiveSnippet,
      archiveSnippets,
      unarchiveSnippet,
      unarchiveSnippets,
      initWorkspace,
      handleLaunch,
      handleSwitchWorkspace,
      handleCloseWorkspace,
      handleCloseWorkspaces,
      handleRenameWorkspace,
      handleColorWorkspace,
      handleReorderWorkspaces,
      handlePinWorkspace,
      handleNewWorkspaceFlow,
      handleNewWorkspaceToRight,
      handleSelectMode,
      handleGoBack,
      handleCreateProjectWorkspace,
      handleUpdateWorkspace,
      handleCreateSubTab,
      handleCloseSubTab,
      handleSwitchSubTab,
      handleRenameSubTab,
      handleSplitPane,
      handleKillPane,
      handleRenamePane,
      handleMovePane,
      handleUpdatePaneCommand,
      handleLaunchTemplate,
      handleCaptureCurrent,
    ],
  );

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx)
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  return ctx;
}

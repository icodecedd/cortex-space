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
import { type Workspace, type Mode, type SpaceTemplate } from "../lib";
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
    const savedWorkspaces = await getSetting<Workspace[]>(
      "internal.workspaces",
      [],
    );
    const savedActiveId = await getSetting<string | null>(
      "internal.activeWorkspaceId",
      null,
    );

    if (savedWorkspaces.length > 0) {
      setWorkspaces(savedWorkspaces);
      setActiveWorkspaceId(savedActiveId || savedWorkspaces[0].id);
      setIsLoaded(true);
      return;
    }

    const behavior = await getSetting<StartupBehavior>(
      "startup.behavior",
      "modeSelector",
    );
    const lastMode = await getSetting<Mode>("startup.lastMode", "normal");
    const initialId = crypto.randomUUID();

    let mode: Mode = "normal";
    let status: "mode-select" | "setup" = "mode-select";

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
        status = "mode-select";
        break;
    }

    setWorkspaces([{ id: initialId, name: "", mode, config: null, status }]);
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
      const updatedConfig = { ...newConfig, rootPath: finalPath };

      const current = workspaces.find((w) => w.id === activeWorkspaceId);
      const activeMode = current?.mode ?? "normal";

      toast.success(APP_CONTENT.WORKSPACE_ACTIVATED(rootName), {
        description: `Workspace is now active in ${activeMode} mode.`,
      });

      setWorkspaces((prev) => {
        return prev.map((w) =>
          w.id === activeWorkspaceId
            ? {
                ...w,
                name: rootName,
                config: updatedConfig,
                status: "active" as const,
              }
            : w,
        );
      });
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

      if (workspaces.length <= 1) {
        toast.success("Workspace reset successfully", {
          description: "Returning to the mode selection screen.",
        });
      } else {
        toast.warning("Workspace closed successfully", {
          description: "Process connections have been terminated.",
        });
      }

      setWorkspaces((prev) => {
        const index = prev.findIndex((w) => w.id === id);
        if (index === -1) return prev;

        if (prev.length <= 1) {
          const newId = crypto.randomUUID();
          setActiveWorkspaceId(newId);
          return [
            {
              id: newId,
              name: "",
              mode: "normal" as Mode,
              config: null,
              status: "mode-select" as const,
            },
          ];
        }

        const updated = prev.filter((w) => w.id !== id);
        if (activeWorkspaceId === id) {
          setActiveWorkspaceId(updated[Math.max(0, index - 1)].id);
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
            const newId = crypto.randomUUID();
            setActiveWorkspaceId(newId);
            return [
              {
                id: newId,
                name: "",
                mode: "normal" as Mode,
                config: null,
                status: "mode-select" as const,
              },
            ];
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

  const handleNewWorkspaceFlow = useCallback(() => {
    const newId = crypto.randomUUID();
    setWorkspaces((prev) => [
      ...prev,
      {
        id: newId,
        name: "",
        mode: "normal" as Mode,
        config: null,
        status: "mode-select" as const,
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
      status: "mode-select",
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
      setWorkspaces((prev) =>
        prev.map((w) =>
          w.id === activeWorkspaceId
            ? { ...w, mode, status: "setup" as const }
            : w,
        ),
      );
    },
    [activeWorkspaceId],
  );

  const handleGoBack = useCallback((id: string) => {
    setWorkspaces((prev) =>
      prev.map((w) =>
        w.id === id ? { ...w, status: "mode-select" as const } : w,
      ),
    );
  }, []);

  // ── Pane operations ───────────────────────────────────────────────────────

  const handleSplitPane = useCallback(
    (paneId: string, direction: "horizontal" | "vertical") => {
      if (!activeWorkspaceId) return;
      const internalDir = direction === "vertical" ? "horizontal" : "vertical";
      setWorkspaces((prev) =>
        prev.map((w) => {
          if (w.id === activeWorkspaceId && w.config) {
            return {
              ...w,
              config: {
                ...w.config,
                layout: splitNode(w.config.layout, paneId, internalDir),
              },
            };
          }
          return w;
        }),
      );
    },
    [activeWorkspaceId],
  );

  const handleKillPane = useCallback(
    (paneId: string) => {
      if (!activeWorkspaceId) return;

      const ws = workspaces.find((w) => w.id === activeWorkspaceId);
      if (ws?.config) {
        const newLayout = removeNode(ws.config.layout, paneId);
        if (!newLayout) {
          toast.success(APP_CONTENT.WORKSPACE_RESET, {
            description: APP_CONTENT.WORKSPACE_RESET_DESC,
          });
        }
      }

      setWorkspaces((prev) =>
        prev.map((w) => {
          if (w.id === activeWorkspaceId && w.config) {
            const newLayout = removeNode(w.config.layout, paneId);
            if (!newLayout) {
              return { ...w, status: "mode-select" as const, config: null };
            }
            return { ...w, config: { ...w.config, layout: newLayout } };
          }
          return w;
        }),
      );
    },
    [activeWorkspaceId, workspaces],
  );

  const handleRenamePane = useCallback(
    (paneId: string, newName: string) => {
      if (!activeWorkspaceId) return;
      setWorkspaces((prev) =>
        prev.map((w) => {
          if (w.id === activeWorkspaceId && w.config) {
            return {
              ...w,
              config: {
                ...w.config,
                layout: updatePaneNode(w.config.layout, paneId, {
                  name: newName,
                }),
              },
            };
          }
          return w;
        }),
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
          if (w.id === activeWorkspaceId && w.config) {
            return {
              ...w,
              config: {
                ...w.config,
                layout: repositionNode(
                  w.config.layout,
                  dragId,
                  dropId,
                  direction,
                ),
              },
            };
          }
          return w;
        }),
      );
      toast.success("Layout updated successfully", {
        description: "The pane position has been saved.",
      });
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

      const config = {
        rootPath: template.rootPath,
        layout: template.layout,
        panes: [],
      };

      if (activeWorkspace && activeWorkspace.status === "active") {
        const newId = crypto.randomUUID();
        setWorkspaces((prev) => [
          ...prev,
          {
            id: newId,
            name: formatWorkspaceName(template.name),
            mode: template.mode,
            config,
            status: "active" as const,
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
                  config,
                  status: "active" as const,
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

    const { rootPath, layout, panes } = activeWorkspace.config;
    const name = activeWorkspace.name || "UNNAMED SPACE";

    captureCurrent(
      formatWorkspaceName(name),
      rootPath,
      layout,
      panes,
      activeWorkspace.mode,
      `Captured from active workspace on ${new Date().toLocaleDateString()}`,
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
      handleSplitPane,
      handleKillPane,
      handleRenamePane,
      handleMovePane,
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
      handleSplitPane,
      handleKillPane,
      handleRenamePane,
      handleMovePane,
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

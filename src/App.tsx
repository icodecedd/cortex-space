import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { m } from "framer-motion";
import { SetupView } from "./features/setup/SetupView";
import { SpaceView } from "./features/space/SpaceView";
import { useTheme, ThemeName } from "./hooks/useTheme";
import { useColorScheme } from "./hooks/useColorScheme";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { AppState, Workspace, Mode, SpaceTemplate } from "./types";
import { useWindowControls } from "./hooks/useWindowControls";
import { useAppShortcuts } from "./hooks/useAppShortcuts";
import { AppHeader } from "./components/layout/AppHeader";
import { AppFooter } from "./components/layout/AppFooter";
import { KeyboardShortcutsDialog } from "./components/dialogs/KeyboardShortcutsDialog";
import { SettingsDialog } from "./features/settings/SettingsDialog";
import { SplashScreen } from "./components/screens/SplashScreen";
import { ModeSelectorScreen } from "./components/screens/ModeSelectorScreen";
import { AgentOnboardingScreen } from "./components/screens/AgentOnboardingScreen";
import { useAgents } from "./hooks/useAgents";
import { getSetting, setSetting, StartupBehavior } from "./lib/store";
import { CortexLibraryDialog } from "./features/cortex-library/CortexLibraryDialog";
import { WorkspaceSwitcherDialog } from "./components/dialogs/WorkspaceSwitcherDialog";
import { useSpaceTemplates } from "./hooks/useSpaceTemplates";
import { useSnippets } from "./hooks/useSnippets";
import { splitNode, removeNode, updatePaneNode, repositionNode } from "./lib/setup-utils";
import { formatWorkspaceName } from "./lib/utils";
import { APP_CONTENT } from "./lib/content";

declare global {
  interface Window {
    __TAURI_INTERNALS__?: any;
  }
}

import { useFocusSettings } from "./hooks/useFocusSettings";
import { useDemoSettings } from "./hooks/useDemoSettings";

function App() {
  const [appState, setAppState] = useState<AppState>('splash');
  const [splashKey, setSplashKey] = useState(0);
  const [splashTimerDone, setSplashTimerDone] = useState(false);
  const { agents, installAgent, isInitialized } = useAgents();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);

  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState("general");
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);

  const handleOpenSettings = useCallback((tab: string = "general") => {
    setSettingsInitialTab(tab);
    setSettingsOpen(true);
  }, []);

  const handleCustomizeShortcuts = useCallback(() => {
    setShortcutsOpen(false);
    handleOpenSettings("shortcuts");
  }, [handleOpenSettings]);

  const [isBackgroundRecessed, setIsBackgroundRecessed] = useState(false);
  const { settings: colorSchemeSettings, resolvedScheme, setColorScheme, setUiFontScale, setZenPadding, setReducedMotion, resetToDefaults: resetAppearance } = useColorScheme();
  const { theme, setTheme, allThemes, addCustomTheme, removeCustomTheme, previewTheme, cancelPreview } = useTheme();
  const { settings: focusSettings, setFocusSetting, toggleZenMode, resetToDefaults: resetFocus } = useFocusSettings();
  const { settings: demoSettings, setDemoSetting, resetToDefaults: resetDemo } = useDemoSettings();

  // Handle tiered motion effects via events
  useEffect(() => {
    const handleDepthChange = (e: Event) => {
      const evt = e as CustomEvent<{ isDeep: boolean }>;
      setIsBackgroundRecessed(evt.detail.isDeep);
    };

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Prevent Ctrl+R from refreshing the app if the setting is disabled
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'r') {
        // If it's NOT Ctrl+Alt+R (which is our relaunch shortcut) AND refresh is disabled, prevent default
        if (!e.altKey && !demoSettings.enableBrowserRefresh) {
          e.preventDefault();
        }
      }
    };

    window.addEventListener('cortex:modal-depth-changed', handleDepthChange);
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('cortex:modal-depth-changed', handleDepthChange);
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [demoSettings.enableBrowserRefresh]);

  const { isWindowMaximized, handleMinimize, handleMaximize, handleClose } = useWindowControls();
  const { templates, captureCurrent, deleteTemplate, deleteTemplates, archiveTemplate, archiveTemplates, unarchiveTemplate, unarchiveTemplates } = useSpaceTemplates();
  const { snippets, addSnippet, deleteSnippet, deleteSnippets, archiveSnippet, archiveSnippets, unarchiveSnippet, unarchiveSnippets } = useSnippets();

  const handleSplitPane = useCallback((paneId: string, direction: 'horizontal' | 'vertical') => {
    if (!activeWorkspaceId) return;

    // Map user split-line action to internal stacking direction:
    // - A vertical split line separates left/right panes (horizontal stack)
    // - A horizontal split line separates top/bottom panes (vertical stack)
    const internalDir = direction === 'vertical' ? 'horizontal' : 'vertical';

    setWorkspaces(prev => prev.map(w => {
      if (w.id === activeWorkspaceId && w.config) {
        return {
          ...w,
          config: {
            ...w.config,
            layout: splitNode(w.config.layout, paneId, internalDir)
          }
        };
      }
      return w;
    }));
  }, [activeWorkspaceId]);

  const handleKillPane = useCallback((paneId: string) => {
    if (!activeWorkspaceId) return;
    setWorkspaces(prev => prev.map(w => {
      if (w.id === activeWorkspaceId && w.config) {
        const newLayout = removeNode(w.config.layout, paneId);
        if (!newLayout) {
          // If no layout left, close workspace or reset
          toast.success(APP_CONTENT.WORKSPACE_RESET, { description: APP_CONTENT.WORKSPACE_RESET_DESC });
          return {
            ...w,
            status: 'mode-select',
            config: null
          };
        }
        return {
          ...w,
          config: {
            ...w.config,
            layout: newLayout
          }
        };
      }
      return w;
    }));
  }, [activeWorkspaceId]);

  const handleRenamePane = useCallback((paneId: string, newName: string) => {
    if (!activeWorkspaceId) return;
    setWorkspaces(prev => prev.map(w => {
      if (w.id === activeWorkspaceId && w.config) {
        return {
          ...w,
          config: {
            ...w.config,
            layout: updatePaneNode(w.config.layout, paneId, { name: newName })
          }
        };
      }
      return w;
    }));
  }, [activeWorkspaceId]);

  const handleMovePane = useCallback((dragId: string, dropId: string, direction: 'top' | 'bottom' | 'left' | 'right') => {
    if (!activeWorkspaceId) return;
    setWorkspaces(prev => prev.map(w => {
      if (w.id === activeWorkspaceId && w.config) {
        const newLayout = repositionNode(w.config.layout, dragId, dropId, direction);
        return {
          ...w,
          config: {
            ...w.config,
            layout: newLayout
          }
        };
      }
      return w;
    }));
    toast.success("Layout updated successfully", { description: "The pane position has been saved." });
  }, [activeWorkspaceId]);

  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId);

  // Verify Tauri PATH environment on startup
  useEffect(() => {
    invoke<string>('debug_env')
      .then(path => {
        console.log('Tauri PATH:', path);
      })
      .catch(err => {
        console.error('Failed to get Tauri PATH:', err);
      });
  }, []);

  const initWorkspace = useCallback(async () => {
    const behavior = await getSetting<StartupBehavior>('startup.behavior', 'modeSelector');
    const lastMode = await getSetting<Mode>('startup.lastMode', 'normal');
    const initialId = Date.now().toString();

    let mode: Mode = 'normal';
    let status: 'mode-select' | 'setup' = 'mode-select';

    switch (behavior) {
      case 'lastMode':
        mode = lastMode;
        status = 'setup';
        break;
      case 'newTerminal':
        mode = 'normal';
        status = 'setup';
        break;
      case 'newAgents':
        mode = 'agents';
        status = 'setup';
        break;
      case 'modeSelector':
      default:
        mode = 'normal';
        status = 'mode-select';
        break;
    }

    setWorkspaces([{ id: initialId, name: '', mode, config: null, status }]);
    setActiveWorkspaceId(initialId);
  }, []);

  useEffect(() => {
    if (appState !== 'splash') return;

    let cleanup: (() => void) | undefined;

    getSetting('startup.showSplashAnimation', true).then(async (showSplash) => {
      const hasOnboarded = await getSetting('startup.hasOnboardedAgents', false);

      if (!showSplash) {
        // Skip splash entirely
        const nextState = hasOnboarded ? 'running' : 'agent-setup';
        setAppState(nextState);
        if (nextState === 'running') initWorkspace();
        return;
      }

      setSplashKey(prev => prev + 1);
      setSplashTimerDone(false);

      const timer = setTimeout(() => {
        setSplashTimerDone(true);
      }, 2500);

      cleanup = () => clearTimeout(timer);
    });

    return () => cleanup?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appState, initWorkspace]);

  // Handle splash transition based on state, timer, and agent path verification status
  useEffect(() => {
    if (appState !== 'splash' || !splashTimerDone) return;

    async function evaluateTransition() {
      const hasOnboarded = await getSetting('startup.hasOnboardedAgents', false);
      if (hasOnboarded) {
        setAppState('running');
        initWorkspace();
      } else if (isInitialized) {
        setAppState('agent-setup');
      }
    }
    evaluateTransition();
  }, [appState, splashTimerDone, isInitialized, initWorkspace]);

  const handleLaunch = useCallback(async (newConfig: any) => {
    let finalPath = newConfig.rootPath;
    
    // If no path provided, fall back to default setting or system home
    if (!finalPath) {
      const savedDefault = await getSetting("cortex_default_path", "");
      if (savedDefault) {
        finalPath = savedDefault;
      } else {
        try {
          const homeDir = await invoke<string>('get_home_dir');
          if (homeDir) {
            finalPath = homeDir;
          }
        } catch (err) {
          console.error('Failed to get home directory:', err);
        }
      }
    }

    const rawName = finalPath.split(/[/\\]/).filter(Boolean).pop() || finalPath || APP_CONTENT.WORKSPACE_DEFAULT_NAME;
    const rootName = formatWorkspaceName(rawName);
    const updatedConfig = {
      ...newConfig,
      rootPath: finalPath
    };

    setWorkspaces(prev => prev.map(w => {
      if (w.id === activeWorkspaceId) {
        return {
          ...w,
          name: rootName,
          config: updatedConfig,
          status: 'active'
        };
      }
      return w;
    }));

    const currentWs = workspaces.find(w => w.id === activeWorkspaceId);
    const activeMode = currentWs ? currentWs.mode : 'normal';

    toast.success(APP_CONTENT.WORKSPACE_ACTIVATED(rootName), {
      description: `Workspace is now active in ${activeMode} mode.`,
    });
  }, [activeWorkspaceId, workspaces]);

  const handleSwitchWorkspace = useCallback((id: string) => {
    const ws = workspaces.find(w => w.id === id);
    if (ws) {
      setActiveWorkspaceId(id);
    }
  }, [workspaces]);

  const handleCloseWorkspace = useCallback((id: string) => {
    const index = workspaces.findIndex(w => w.id === id);
    if (index === -1) return;

    // If it's the last one, reset to mode-select instead of removing
    if (workspaces.length <= 1) {
      const newId = Date.now().toString();
      setWorkspaces([{
        id: newId,
        name: '',
        mode: 'normal',
        config: null,
        status: 'mode-select'
      }]);
      setActiveWorkspaceId(newId);
      toast.success("Workspace reset successfully", { description: "Returning to the mode selection screen." });
      return;
    }

    const updated = workspaces.filter(w => w.id !== id);


    if (activeWorkspaceId === id) {
      if (updated.length > 0) {
        const nextActive = updated[Math.max(0, index - 1)];
        setActiveWorkspaceId(nextActive.id);
      } else {
        const newId = Date.now().toString();
        updated.push({
          id: newId,
          name: '',
          mode: 'normal',
          config: null,
          status: 'mode-select'
        });
        setActiveWorkspaceId(newId);
      }
    }

    setWorkspaces(updated);

    toast.warning("Workspace closed successfully", {
      description: "Process connections have been terminated.",
    });
  }, [workspaces, activeWorkspaceId]);

  const handleCloseWorkspaces = useCallback((ids: string[]) => {
    if (ids.length === 0) return;
    
    setWorkspaces(prev => {
      const updated = prev.filter(w => !ids.includes(w.id));
      
      if (activeWorkspaceId && ids.includes(activeWorkspaceId)) {
        if (updated.length > 0) {
          const firstClosedIndex = prev.findIndex(w => ids.includes(w.id));
          const nextActive = updated[Math.max(0, Math.min(firstClosedIndex - 1, updated.length - 1))] || updated[updated.length - 1];
          setActiveWorkspaceId(nextActive.id);
        } else {
          const newId = Date.now().toString();
          setActiveWorkspaceId(newId);
          return [{
            id: newId,
            name: '',
            mode: 'normal',
            config: null,
            status: 'mode-select'
          }];
        }
      }
      return updated;
    });

    toast.warning("Workspaces closed successfully", {
      description: `${ids.length} workspaces have been terminated.`,
    });
  }, [activeWorkspaceId]);

  const handleRenameWorkspace = useCallback((id: string, newName: string) => {
    setWorkspaces(prev => prev.map(w => {
      if (w.id === id) {
        return {
          ...w,
          customName: newName
        };
      }
      return w;
    }));
  }, []);

  const handleColorWorkspace = useCallback((id: string, color: any) => {
    setWorkspaces(prev => prev.map(w => {
      if (w.id === id) {
        return {
          ...w,
          color
        };
      }
      return w;
    }));
  }, []);

  const handleReorderWorkspaces = useCallback((newOrder: Workspace[]) => {
    const pinned = newOrder.filter(w => w.isPinned);
    const unpinned = newOrder.filter(w => !w.isPinned);
    setWorkspaces([...pinned, ...unpinned]);
  }, []);

  const handlePinWorkspace = useCallback((id: string, isPinned: boolean) => {
    setWorkspaces(prev => {
      const updated = prev.map(w => w.id === id ? { ...w, isPinned } : w);
      // Sort: pinned first, then preserve relative order
      return [...updated].sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return 0;
      });
    });
  }, []);

  const handleNewWorkspaceToRight = useCallback((targetId: string) => {
    const newId = Date.now().toString();
    const newWs: Workspace = {
      id: newId,
      name: '',
      mode: 'normal',
      config: null,
      status: 'mode-select'
    };
    
    setWorkspaces(prev => {
      const index = prev.findIndex(w => w.id === targetId);
      if (index === -1) return [...prev, newWs];
      const next = [...prev];
      next.splice(index + 1, 0, newWs);
      return next;
    });
    setActiveWorkspaceId(newId);
  }, []);

  const handleNewWorkspaceFlow = useCallback(() => {
    const newId = Date.now().toString();
    setWorkspaces(prev => [...prev, {
      id: newId,
      name: '',
      mode: 'normal',
      config: null,
      status: 'mode-select'
    }]);
    setActiveWorkspaceId(newId);
  }, []);

  const handleSelectMode = useCallback((mode: Mode) => {
    setWorkspaces(prev => prev.map(w => w.id === activeWorkspaceId ? { ...w, mode, status: 'setup' } : w));
  }, [activeWorkspaceId]);

  useAppShortcuts({
    workspaces,
    activeWorkspaceId,
    isZenMode: focusSettings.isZenMode,
    onNewWorkspaceFlow: handleNewWorkspaceFlow,
    onCloseWorkspace: handleCloseWorkspace,
    onSwitchWorkspace: handleSwitchWorkspace,
    onToggleShortcuts: () => setShortcutsOpen(prev => !prev),
    onToggleTemplates: () => setTemplatesOpen(prev => !prev),
    onToggleSettings: () => setSettingsOpen(prev => !prev),
    onToggleZenMode: toggleZenMode,
    onToggleSwitcher: () => setSwitcherOpen(prev => !prev),
    onSelectMode: handleSelectMode
  });

  const handleLaunchTemplate = useCallback(async (template: SpaceTemplate) => {
    // Check if rootPath exists
    try {
      const exists = await invoke<boolean>('validate_directory', { path: template.rootPath });
      if (!exists) {
        toast.error("Failed to find directory", {
          description: "The template path no longer exists.",
        });
        return;
      }
    } catch (err) {
       console.warn("Failed to verify directory existence:", err);
    }

    // Use the tree layout directly for the new resizable system
    const config = {
      rootPath: template.rootPath,
      layout: template.layout,
      panes: [] // No longer need the flat panes array as primary
    };

    // If current workspace is already active, launch as a NEW workspace
    // Otherwise, reuse the current one (e.g. if we're on the mode selector)
    if (activeWorkspace && activeWorkspace.status === 'active') {
      const newId = Date.now().toString();
      const newWorkspace: Workspace = {
        id: newId,
        name: formatWorkspaceName(template.name),
        mode: template.mode,
        config: config,
        status: 'active'
      };
      setWorkspaces(prev => [...prev, newWorkspace]);
      setActiveWorkspaceId(newId);
    } else {
      setWorkspaces(prev => prev.map(w => {
        if (w.id === activeWorkspaceId) {
          return {
            ...w,
            name: formatWorkspaceName(template.name),
            mode: template.mode,
            config: config,
            status: 'active'
          };
        }
        return w;
      }));
    }

    setTemplatesOpen(false);
    setSwitcherOpen(false);
    
    toast.success(`${template.name} launched successfully`, {
      description: "The template was loaded from the library.",
    });
  }, [activeWorkspace, activeWorkspaceId]);

  const handleCaptureCurrent = useCallback(() => {
    if (!activeWorkspace || activeWorkspace.status !== 'active') {
      toast.error("Workspace cannot be captured", {
        description: "Select an active workspace before capturing."
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
      `Captured from active workspace on ${new Date().toLocaleDateString()}`
    );
  }, [activeWorkspace, captureCurrent]);

  const showHeader = appState === 'running' && (!focusSettings.isZenMode || focusSettings.showTabs);
  const showFooter = appState === 'running' && (!focusSettings.isZenMode || focusSettings.showStatusBar);

  const handleSnippetExecute = useCallback((snippet: any, execute: boolean) => {
    if (!activeWorkspaceId) return;
    
    // Dispatch custom event to let the focused terminal handle the injection
    const event = new CustomEvent('cortex:write-to-terminal', {
      detail: {
        workspaceId: activeWorkspaceId,
        command: snippet.command,
        execute
      }
    });
    window.dispatchEvent(event);

    // Close modals so the user can see the injection/execution
    setTemplatesOpen(false);
    setSwitcherOpen(false);
  }, [activeWorkspaceId]);

  return (
    <div id="root" className="h-screen w-screen flex flex-col overflow-hidden bg-[var(--bg-color)]">
      <m.div 
        className="flex-1 flex flex-col overflow-hidden"
        animate={{
          scale: (isBackgroundRecessed && !colorSchemeSettings.reducedMotion) ? 0.98 : 1,
          opacity: (isBackgroundRecessed && !colorSchemeSettings.reducedMotion) ? 0.5 : 1,
          // We removed the expensive blur(4px) filter to prevent frame drops on lower-end GPUs.
          // The combination of scale + opacity provides a similar "recessed" depth effect.
        }}
        transition={colorSchemeSettings.reducedMotion ? { duration: 0.1 } : {
          type: "spring",
          stiffness: 300,
          damping: 25
        }}
      >
        {showHeader && (
          <AppHeader
            workspaces={workspaces}
            activeWorkspaceId={activeWorkspaceId}
            isWindowMaximized={isWindowMaximized}
            onSwitchWorkspace={handleSwitchWorkspace}
            onCloseWorkspace={handleCloseWorkspace}
            onCloseWorkspaces={handleCloseWorkspaces}
            onReorderWorkspaces={handleReorderWorkspaces}
            onNewWorkspaceFlow={handleNewWorkspaceFlow}
            onNewWorkspaceToRight={handleNewWorkspaceToRight}
            onRenameWorkspace={handleRenameWorkspace}
            onColorWorkspace={handleColorWorkspace}
            onPinWorkspace={handlePinWorkspace}
            onOpenShortcuts={() => setShortcutsOpen(true)}
            onOpenSettings={handleOpenSettings}
            onOpenTemplates={() => setTemplatesOpen(true)}
            onMinimize={handleMinimize}
            onMaximize={handleMaximize}
            onClose={handleClose}
            showWorkspacesTab={demoSettings.showWorkspacesTab}
            showTemplatesButton={demoSettings.showTemplatesButton}
            showShortcutsButton={demoSettings.showShortcutsButton}
          />
        )}

        <main style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: activeWorkspace?.status === 'active' ? 'stretch' : 'center',
          alignItems: activeWorkspace?.status === 'active' ? 'stretch' : 'center',
          overflow: 'hidden'
        }}>
          {appState === 'splash' && <SplashScreen splashKey={splashKey} reducedMotion={colorSchemeSettings.reducedMotion} />}

          {appState === 'agent-setup' && (
            <AgentOnboardingScreen 
              agents={agents}
              installAgent={installAgent}
              isInitialized={isInitialized}
              onComplete={async () => {
                await setSetting('startup.hasOnboardedAgents', true);
                setAppState('running');
                initWorkspace();
              }} 
            />
          )}

          {appState === 'running' && workspaces.map(ws => {
            const isCurrent = activeWorkspaceId === ws.id;

            // Performance: Prune non-current workspaces that are not 'active'
            // We keep 'active' ones to maintain terminal sessions, but they are now memoized.
            if (!isCurrent && ws.status !== 'active') return null;

            if (ws.status === 'mode-select') {
              return (
                <div key={ws.id} className="w-full h-full flex">
                  <ModeSelectorScreen
                    onSelectMode={handleSelectMode}
                    showShortcutHints={demoSettings.showModeShortcutHints}
                    showTemplatesHint={demoSettings.showTemplatesButton}
                  />
                </div>
              );
            }

            if (ws.status === 'setup') {
              return (
                <div 
                  key={ws.id} 
                  className="w-full h-full flex flex-col max-w-[1100px] mx-auto px-8 pt-8 overflow-hidden"
                >
                  <SetupView
                    mode={ws.mode}
                    onLaunch={handleLaunch}
                    onBack={() => {
                      setWorkspaces(prev => prev.map(w => w.id === ws.id ? { ...w, status: 'mode-select' } : w));
                    }}
                  />
                </div>
              );
            }

            if (ws.status === 'active') {
              return (
                <div
                  key={ws.id}
                  style={{
                    display: isCurrent ? 'flex' : 'none',
                    flex: 1,
                    flexDirection: 'column',
                    height: '100%',
                    width: '100%',
                    overflow: 'hidden'
                  }}
                >
                  <SpaceView
                    workspaceId={ws.id}
                    config={ws.config}
                    mode={ws.mode}
                    theme={theme}
                    setTheme={setTheme}
                    onStop={() => handleCloseWorkspace(ws.id)}
                    isZenMode={focusSettings.isZenMode}
                    setIsZenMode={(v) => setFocusSetting('isZenMode', v)}
                    zenPadding={colorSchemeSettings.zenPadding}
                    showPaneHeaders={focusSettings.showPaneHeaders as boolean}
                    onSplitPane={handleSplitPane}
                    onMovePane={handleMovePane}
                    onKillPane={handleKillPane}
                    onRenamePane={handleRenamePane}
                    isCurrent={isCurrent}
                  />
                </div>
              );
            }

            return null;
          })}
        </main>

        {showFooter && (
          <AppFooter
            theme={theme}
            setTheme={(newTheme) => setTheme(newTheme as ThemeName)}
            allThemes={allThemes}
          />
        )}
      </m.div>

      <KeyboardShortcutsDialog 
        open={shortcutsOpen} 
        onOpenChange={setShortcutsOpen} 
        onCustomize={handleCustomizeShortcuts}
      />
      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        initialTab={settingsInitialTab}
        theme={theme}
        setTheme={setTheme}
        allThemes={allThemes}
        addCustomTheme={addCustomTheme}
        removeCustomTheme={removeCustomTheme}
        previewTheme={previewTheme}
        cancelPreview={cancelPreview}
        colorScheme={colorSchemeSettings.colorScheme}
        setColorScheme={setColorScheme}
        uiFontScale={colorSchemeSettings.uiFontScale}
        setUiFontScale={setUiFontScale}
        zenPadding={colorSchemeSettings.zenPadding}
        setZenPadding={setZenPadding}
        reducedMotion={colorSchemeSettings.reducedMotion}
        setReducedMotion={setReducedMotion}
        onResetAppearance={resetAppearance}
        focusSettings={focusSettings}
        setFocusSetting={setFocusSetting}
        resetFocus={resetFocus}
        demoSettings={demoSettings}
        setDemoSetting={setDemoSetting}
        resetDemo={resetDemo}
      />
      <CortexLibraryDialog 
        isOpen={templatesOpen} 
        onOpenChange={setTemplatesOpen}
        templates={templates}
        snippets={snippets}
        onLaunchTemplate={handleLaunchTemplate}
        onDeleteTemplate={deleteTemplate}
        onDeleteTemplates={deleteTemplates}
        onCaptureCurrent={handleCaptureCurrent}
        onAddSnippet={addSnippet}
        onDeleteSnippet={deleteSnippet}
        onDeleteSnippets={deleteSnippets}
        onExecuteSnippet={handleSnippetExecute}
        onArchiveSnippet={archiveSnippet}
        onArchiveSnippets={archiveSnippets}
        onUnarchiveSnippet={unarchiveSnippet}
        onUnarchiveSnippets={unarchiveSnippets}
        onArchiveTemplate={archiveTemplate}
        onArchiveTemplates={archiveTemplates}
        onUnarchiveTemplate={unarchiveTemplate}
        onUnarchiveTemplates={unarchiveTemplates}
      />

      <WorkspaceSwitcherDialog
        isOpen={switcherOpen}
        onOpenChange={setSwitcherOpen}
        templates={templates.filter(t => !t.isArchived)}
        workspaces={workspaces}
        activeWorkspaceId={activeWorkspaceId}
        snippets={snippets.filter(s => !s.isArchived)}
        onSwitchWorkspace={handleSwitchWorkspace}
        onLaunchTemplate={handleLaunchTemplate}
        onSnippetExecute={handleSnippetExecute}
        onToggleZenMode={toggleZenMode}
        onOpenSettings={handleOpenSettings}
        onOpenShortcuts={() => setShortcutsOpen(true)}
        onOpenTemplates={() => setTemplatesOpen(true)}
        onSetTheme={setTheme}
        allThemes={allThemes}
      />

      <Toaster position="bottom-right" closeButton richColors theme={resolvedScheme as "light" | "dark" | "system"} />
    </div>
  );
}

export default App;

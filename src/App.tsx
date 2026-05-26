import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { motion } from "framer-motion";
import { SetupView } from "./components/SetupView";
import { SpaceView } from "./components/SpaceView";
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
import { SettingsDialog } from "./components/dialogs/SettingsDialog";
import { SplashScreen } from "./components/screens/SplashScreen";
import { ModeSelectorScreen } from "./components/screens/ModeSelectorScreen";
import { getSetting } from "./lib/store";
import { CortexLibraryDialog } from "./components/dialogs/CortexLibraryDialog";
import { WorkspaceSwitcherDialog } from "./components/dialogs/WorkspaceSwitcherDialog";
import { useSpaceTemplates } from "./hooks/useSpaceTemplates";
import { useSnippets } from "./hooks/useSnippets";

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
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);

  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [isBackgroundRecessed, setIsBackgroundRecessed] = useState(false);
  const { theme, setTheme } = useTheme();

  // Handle tiered motion effects via events
  useEffect(() => {
    const handleDepthChange = (e: Event) => {
      const evt = e as CustomEvent<{ isDeep: boolean }>;
      setIsBackgroundRecessed(evt.detail.isDeep);
    };
    window.addEventListener('cortex:modal-depth-changed', handleDepthChange);
    return () => window.removeEventListener('cortex:modal-depth-changed', handleDepthChange);
  }, []);
  const { settings: colorSchemeSettings, setColorScheme, setUiFontScale, setZenPadding, setReducedMotion, resetToDefaults: resetAppearance } = useColorScheme();
  const { settings: focusSettings, setFocusSetting, toggleZenMode, resetToDefaults: resetFocus } = useFocusSettings();
  const { settings: demoSettings, setDemoSetting, resetToDefaults: resetDemo } = useDemoSettings();

  const { isWindowMaximized, handleMinimize, handleMaximize, handleClose } = useWindowControls();
  const { templates, captureCurrent, deleteTemplate } = useSpaceTemplates();
  const { snippets, addSnippet, deleteSnippet, deleteSnippets } = useSnippets();

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

  useEffect(() => {
    if (appState !== 'splash') return;

    const initWorkspace = async () => {
      const rememberMode = await getSetting('startup.rememberLastMode', false);
      const lastMode = await getSetting<Mode>('startup.lastMode', 'normal');
      const openOnLaunch = await getSetting<'modeSelector' | 'newTerminal'>('startup.openOnLaunch', 'modeSelector');
      const initialId = Date.now().toString();

      let mode: Mode = 'normal';
      let status: 'mode-select' | 'setup' = 'mode-select';

      if (rememberMode) {
        // rememberLastMode takes full precedence
        mode = lastMode;
        status = 'setup';
      } else if (openOnLaunch === 'newTerminal') {
        // Skip mode selector, jump straight to setup with normal mode
        mode = 'normal';
        status = 'setup';
      }
      // else: default mode-select

      setWorkspaces([{ id: initialId, name: '', mode, config: null, status }]);
      setActiveWorkspaceId(initialId);
    };

    let cleanup: (() => void) | undefined;

    getSetting('startup.showSplashAnimation', true).then((showSplash) => {
      if (!showSplash) {
        // Skip splash entirely — jump straight to running
        setAppState('running');
        initWorkspace();
        return;
      }
      setSplashKey(prev => prev + 1);
      const timer = setTimeout(() => {
        setAppState('running');
        initWorkspace();
      }, 2500);
      cleanup = () => clearTimeout(timer);
    });

    return () => cleanup?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appState]);

  const handleLaunch = async (newConfig: any) => {
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

    const rootName = finalPath.split(/[/\\]/).filter(Boolean).pop() || finalPath || "Workspace";
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
    const m = currentWs ? currentWs.mode : 'normal';

    toast.success("Workspace Activated", {
      description: `Loaded ${rootName} successfully in ${m.toUpperCase()} mode.`,
    });
  };

  const handleSwitchWorkspace = (id: string) => {
    const ws = workspaces.find(w => w.id === id);
    if (ws) {
      setActiveWorkspaceId(id);
    }
  };

  const handleCloseWorkspace = (id: string) => {
    const index = workspaces.findIndex(w => w.id === id);
    if (index === -1) return;

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

    toast.warning("Workspace Closed", {
      description: "PTY process connections terminated cleanly.",
    });
  };

  const handleCloseWorkspaces = (ids: string[]) => {
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

    toast.warning("Workspaces Closed", {
      description: `${ids.length} workspaces terminated cleanly.`,
    });
  };

  const handleRenameWorkspace = (id: string, newName: string) => {
    setWorkspaces(prev => prev.map(w => {
      if (w.id === id) {
        return {
          ...w,
          customName: newName
        };
      }
      return w;
    }));
  };

  const handleColorWorkspace = (id: string, color: any) => {
    setWorkspaces(prev => prev.map(w => {
      if (w.id === id) {
        return {
          ...w,
          color
        };
      }
      return w;
    }));
  };

  const handleNewWorkspaceFlow = () => {
    const newId = Date.now().toString();
    setWorkspaces(prev => [...prev, {
      id: newId,
      name: '',
      mode: 'normal',
      config: null,
      status: 'mode-select'
    }]);
    setActiveWorkspaceId(newId);
  };

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
    onToggleSwitcher: () => setSwitcherOpen(prev => !prev)
  });

  const handleLaunchTemplate = async (template: SpaceTemplate) => {
    // Check if rootPath exists
    try {
      const exists = await invoke<boolean>('validate_directory', { path: template.rootPath });
      if (!exists) {
        toast.error("Directory not found", {
          description: `The path "${template.rootPath}" no longer exists.`,
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
        name: template.name.toUpperCase(),
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
            name: template.name.toUpperCase(),
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
    
    toast.success("Workspace Launched", {
      description: `Loaded "${template.name}" from library.`,
    });
  };

  const handleCaptureCurrent = () => {
    if (!activeWorkspace || activeWorkspace.status !== 'active') {
      toast.error("No active workspace to capture", {
        description: "Go to a workspace and configure it first."
      });
      return;
    }

    const { rootPath, layout, panes } = activeWorkspace.config;
    const name = activeWorkspace.name || "UNNAMED SPACE";

    captureCurrent(
      name.toUpperCase(),
      rootPath,
      layout,
      panes,
      activeWorkspace.mode,
      `Captured from active workspace on ${new Date().toLocaleDateString()}`
    );
  };

  const showHeader = appState === 'running' && (!focusSettings.isZenMode || focusSettings.showTabs);
  const showFooter = appState === 'running' && (!focusSettings.isZenMode || focusSettings.showStatusBar);

  const handleSnippetExecute = (snippet: any, execute: boolean) => {
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
  };

  return (
    <div id="root" className="h-screen w-screen flex flex-col overflow-hidden bg-[var(--bg-color)]">
      <motion.div 
        className="flex-1 flex flex-col overflow-hidden"
        animate={{
          scale: (isBackgroundRecessed && !colorSchemeSettings.reducedMotion) ? 0.99 : 1,
          filter: (isBackgroundRecessed && !colorSchemeSettings.reducedMotion) ? "blur(4px)" : "blur(0px)",
        }}
        transition={colorSchemeSettings.reducedMotion ? { duration: 0.1 } : {
          type: "spring",
          stiffness: 400,
          damping: 30
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
            onNewWorkspaceFlow={handleNewWorkspaceFlow}
            onRenameWorkspace={handleRenameWorkspace}
            onColorWorkspace={handleColorWorkspace}
            onOpenShortcuts={() => setShortcutsOpen(true)}
            onOpenSettings={() => setSettingsOpen(true)}
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

          {appState === 'running' && workspaces.map(ws => {
            const isCurrent = activeWorkspaceId === ws.id;

            if (!isCurrent && ws.status !== 'active') return null;

            if (ws.status === 'mode-select') {
              return (
                <div key={ws.id} style={{ display: isCurrent ? 'flex' : 'none', width: '100%', height: '100%' }}>
                  <ModeSelectorScreen
                    onSelectMode={(mode) => {
                      setWorkspaces(prev => prev.map(w => w.id === ws.id ? { ...w, mode, status: 'setup' } : w));
                    }}
                    showShortcutHints={demoSettings.showModeShortcutHints}
                  />                </div>
              );
            }

            if (ws.status === 'setup') {
              return (
                <div key={ws.id} style={{ display: isCurrent ? 'block' : 'none', width: '100%', maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
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
                    showPaneHeaders={focusSettings.showPaneHeaders}
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
          />
        )}
      </motion.div>

      <KeyboardShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        theme={theme}
        setTheme={setTheme}
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
        onCaptureCurrent={handleCaptureCurrent}
        onAddSnippet={addSnippet}
        onDeleteSnippet={deleteSnippet}
        onDeleteSnippets={deleteSnippets}
        onExecuteSnippet={handleSnippetExecute}
      />

      <WorkspaceSwitcherDialog
        isOpen={switcherOpen}
        onOpenChange={setSwitcherOpen}
        workspaces={workspaces}
        activeWorkspaceId={activeWorkspaceId}
        templates={templates}
        snippets={snippets}
        onSwitchWorkspace={handleSwitchWorkspace}
        onLaunchTemplate={handleLaunchTemplate}
        onSnippetExecute={handleSnippetExecute}
        onToggleZenMode={toggleZenMode}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenShortcuts={() => setShortcutsOpen(true)}
        onOpenTemplates={() => setTemplatesOpen(true)}
        onSetTheme={setTheme}
      />

      <Toaster position="bottom-right" theme="dark" closeButton richColors />
    </div>
  );
}

export default App;


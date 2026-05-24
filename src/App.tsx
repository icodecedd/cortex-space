import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
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
import { TemplateLibraryDialog } from "./components/dialogs/TemplateLibraryDialog";
import { useSpaceTemplates } from "./hooks/useSpaceTemplates";
import { flattenLayoutToGrid } from "./lib/setup-utils";

declare global {
  interface Window {
    __TAURI_INTERNALS__?: any;
  }
}

function App() {
  const [appState, setAppState] = useState<AppState>('splash');
  const [splashKey, setSplashKey] = useState(0);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);

  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const { settings: colorSchemeSettings, setColorScheme, setUiFontScale, resetToDefaults: resetAppearance } = useColorScheme();

  const { isWindowMaximized, handleMinimize, handleMaximize, handleClose } = useWindowControls();
  const { templates, captureCurrent, deleteTemplate } = useSpaceTemplates();

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
    if (!finalPath) {
      try {
        const homeDir = await invoke<string>('get_home_dir');
        if (homeDir) {
          finalPath = homeDir;
        }
      } catch (err) {
        console.error('Failed to get home directory:', err);
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
    onNewWorkspaceFlow: handleNewWorkspaceFlow,
    onCloseWorkspace: handleCloseWorkspace,
    onSwitchWorkspace: handleSwitchWorkspace,
    onToggleShortcuts: () => setShortcutsOpen(prev => !prev),
    onToggleTemplates: () => setTemplatesOpen(prev => !prev)
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

    // Flatten tree layout back to panes array and a layout string for the current rigid system
    const { panes, layout } = flattenLayoutToGrid(template.layout);

    const config = {
      rootPath: template.rootPath,
      layout: layout, // This will be '1x1', '1x2', etc.
      panes: panes
    };

    handleLaunch(config);
    setTemplatesOpen(false);
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

  return (
    <div id="root" className="h-screen w-screen flex flex-col overflow-hidden bg-[var(--bg-color)]">
      {appState === 'running' && (
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
        {appState === 'splash' && <SplashScreen splashKey={splashKey} />}

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
                />
              </div>
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
                />
              </div>
            );
          }

          return null;
        })}
      </main>

      <KeyboardShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        theme={theme}
        setTheme={(t) => setTheme(t as ThemeName)}
        colorScheme={colorSchemeSettings.colorScheme}
        setColorScheme={setColorScheme}
        uiFontScale={colorSchemeSettings.uiFontScale}
        setUiFontScale={setUiFontScale}
        onResetAppearance={resetAppearance}
      />
      <TemplateLibraryDialog 
        isOpen={templatesOpen} 
        onOpenChange={setTemplatesOpen}
        templates={templates}
        onLaunch={handleLaunchTemplate}
        onDelete={deleteTemplate}
        onCapture={handleCaptureCurrent}
      />

      {appState === 'running' && (
        <AppFooter
          theme={theme}
          setTheme={(newTheme) => setTheme(newTheme as ThemeName)}
        />
      )}

      <Toaster position="bottom-right" theme="dark" closeButton richColors />
    </div>
  );
}

export default App;

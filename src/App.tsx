import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { invoke } from "@tauri-apps/api/core";
import { m, LazyMotion, domAnimation } from "framer-motion";
import { SetupView } from "./features/setup/SetupView";
import { SpaceView } from "./features/space/SpaceView";
import { useTheme, ThemeName } from "./hooks/useTheme";
import { useColorScheme } from "./hooks/useColorScheme";
import { Toaster } from "@/components/ui/sonner";
import { AppState, Workspace } from "./lib";
import { Button } from "@/components/ui/button";
import { useWindowControls } from "./hooks/useWindowControls";
import { useAppShortcuts } from "./hooks/useAppShortcuts";
import { AppHeader } from "./components/layout/AppHeader";
import { AppSidebar } from "./components/layout/AppSidebar";
import { AppRightSidebar } from "./components/layout/AppRightSidebar";
import { AppFooter } from "./components/layout/AppFooter";
import { SplashScreen } from "./components/screens/SplashScreen";
import { ModeSelectorScreen } from "./components/screens/ModeSelectorScreen";
import { FirstRunOnboardingScreen } from "./components/screens/FirstRunOnboardingScreen";
import { getSetting, setSetting } from "./lib/store";
import { useFocusSettings } from "./hooks/useFocusSettings";
import { useDemoSettings } from "./hooks/useDemoSettings";
import { WorkspaceProvider, useWorkspace } from "./context/WorkspaceContext";
import { Rocket, FolderAdd, Library } from "@/components/ui/icons";

// ---------------------------------------------------------------------------
// Heavy dialogs — lazy-loaded so they never hit the initial parse budget.
// Each one only loads when first opened by the user.
// ---------------------------------------------------------------------------
const KeyboardShortcutsDialog = lazy(() =>
  import("./components/dialogs/KeyboardShortcutsDialog").then((m) => ({
    default: m.KeyboardShortcutsDialog,
  })),
);
const SettingsDialog = lazy(() =>
  import("./features/settings/SettingsDialog").then((m) => ({
    default: m.SettingsDialog,
  })),
);
const CortexLibraryDialog = lazy(() =>
  import("./features/cortex-library/CortexLibraryDialog").then((m) => ({
    default: m.CortexLibraryDialog,
  })),
);
const WorkspaceSwitcherDialog = lazy(() =>
  import("./components/dialogs/WorkspaceSwitcherDialog").then((m) => ({
    default: m.WorkspaceSwitcherDialog,
  })),
);
const NewProjectDialog = lazy(() =>
  import("./components/dialogs/NewProjectDialog").then((m) => ({
    default: m.NewProjectDialog,
  })),
);
const WorkspaceSearchDialog = lazy(() =>
  import("./components/dialogs/WorkspaceSearchDialog").then((m) => ({
    default: m.WorkspaceSearchDialog,
  })),
);
const ProjectSettingsDialog = lazy(() =>
  import("./components/dialogs/ProjectSettingsDialog").then((m) => ({
    default: m.ProjectSettingsDialog,
  })),
);

declare global {
  interface Window {
    __TAURI_INTERNALS__?: any;
  }
}

// ---------------------------------------------------------------------------
// AppInner — consumes WorkspaceContext; holds only UI / app-lifecycle state
// ---------------------------------------------------------------------------

function AppInner() {
  const {
    workspaces,
    activeWorkspaceId,
    activeWorkspace,
    initWorkspace,
    templates,
    snippets,
    deleteTemplate,
    deleteTemplates,
    archiveTemplate,
    archiveTemplates,
    unarchiveTemplate,
    unarchiveTemplates,
    addSnippet,
    deleteSnippet,
    deleteSnippets,
    archiveSnippet,
    archiveSnippets,
    unarchiveSnippet,
    unarchiveSnippets,
    handleLaunch,
    handleSwitchWorkspace,
    handleCloseWorkspace,
    handleRenameWorkspace,
    handleReorderWorkspaces,
    handlePinWorkspace,
    handleUpdateWorkspace,
    handleSelectMode,
    handleGoBack,
    handleSplitPane,
    handleKillPane,
    handleRenamePane,
    handleMovePane,
    handleLaunchTemplate,
    handleCaptureCurrent,
    handleCreateProjectWorkspace,
    handleCreateSubTab,
    handleCloseSubTab,
    handleSwitchSubTab,
    handleRenameSubTab,
    handleUpdatePaneCommand,
  } = useWorkspace();

  // ── App lifecycle state ──────────────────────────────────────────────────
  const [appState, setAppState] = useState<AppState>("splash");
  const [splashKey, setSplashKey] = useState(0);
  const [splashTimerDone, setSplashTimerDone] = useState(false);

  // ── Right Sidebar state ──────────────────────────────────────────────────
  const [rightSidebarVisible, setRightSidebarVisible] = useState(true);
  const [rightSidebarTab, setRightSidebarTab] = useState<'explorer' | 'layouts' | 'skills' | 'tasks'>('skills');

  // ── Left Sidebar width & resizing states (hoisted) ───────────────────────
  const [leftSidebarWidth, setLeftSidebarWidth] = useState(() => {
    const saved = localStorage.getItem("cortex_left_sidebar_width");
    return saved ? parseInt(saved, 10) : 240;
  });
  const [isLeftSidebarResizing, setIsLeftSidebarResizing] = useState(false);

  // ── Dialog state (pure UI — does not affect workspace logic) ────────────
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState("general");
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [workspaceSearchOpen, setWorkspaceSearchOpen] = useState(false);
  const [projectSettingsWorkspaceId, setProjectSettingsWorkspaceId] = useState<string | null>(null);
  const [projectSettingsOpen, setProjectSettingsOpen] = useState(false);

  const handleOpenProjectSettings = useCallback((id: string) => {
    setProjectSettingsWorkspaceId(id);
    setProjectSettingsOpen(true);
  }, []);

  const handleOpenSettings = useCallback((tab: string = "general") => {
    setSettingsInitialTab(tab);
    setSettingsOpen(true);
  }, []);

  const handleCustomizeShortcuts = useCallback(() => {
    setShortcutsOpen(false);
    handleOpenSettings("shortcuts");
  }, [handleOpenSettings]);

  const handleSidebarSubTabSwitch = useCallback((workspaceId: string, subTabId: string) => {
    handleSwitchWorkspace(workspaceId);
    handleSwitchSubTab(subTabId);
  }, [handleSwitchWorkspace, handleSwitchSubTab]);

  const handleSidebarSubTabClose = useCallback((workspaceId: string, subTabId: string) => {
    if (activeWorkspaceId !== workspaceId) {
      handleSwitchWorkspace(workspaceId);
    }
    handleCloseSubTab(subTabId);
  }, [activeWorkspaceId, handleSwitchWorkspace, handleCloseSubTab]);

  // ── Appearance / settings hooks ──────────────────────────────────────────
  const [isBackgroundRecessed, setIsBackgroundRecessed] = useState(false);
  const {
    settings: colorSchemeSettings,
    resolvedScheme,
    setColorScheme,
    setUiFontScale,
    setZenPadding,
    setReducedMotion,
    setShimmerPreset,
    setShimmerDuration,
    resetToDefaults: resetAppearance,
  } = useColorScheme();
  const {
    theme,
    setTheme,
    allThemes,
    addCustomTheme,
    removeCustomTheme,
    previewTheme,
    cancelPreview,
  } = useTheme();
  const {
    settings: focusSettings,
    setFocusSetting,
    toggleZenMode,
    resetToDefaults: originalResetFocus,
  } = useFocusSettings();

  const resetFocus = useCallback(async () => {
    await originalResetFocus();
    await setZenPadding(32);
  }, [originalResetFocus, setZenPadding]);
  const {
    settings: demoSettings,
    setDemoSetting,
    resetToDefaults: resetDemo,
  } = useDemoSettings();

  // ── Global event listeners ───────────────────────────────────────────────
  useEffect(() => {
    const handleDepthChange = (e: Event) => {
      const evt = e as CustomEvent<{ isDeep: boolean }>;
      setIsBackgroundRecessed(evt.detail.isDeep);
    };

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "r") {
        if (!e.altKey && !demoSettings.enableBrowserRefresh) {
          e.preventDefault();
        }
      }
    };

    window.addEventListener("cortex:modal-depth-changed", handleDepthChange);
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => {
      window.removeEventListener(
        "cortex:modal-depth-changed",
        handleDepthChange,
      );
      window.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, [demoSettings.enableBrowserRefresh]);

  const { isWindowMaximized, handleMinimize, handleMaximize, handleClose } =
    useWindowControls();

  // ── Debug: log Tauri PATH only in dev builds ─────────────────────────────
  useEffect(() => {
    if (import.meta.env.DEV) {
      invoke<string>("debug_env")
        .then((path) => console.log("Tauri PATH:", path))
        .catch((err) => console.error("Failed to get Tauri PATH:", err));
    }
  }, []);

  // ── Splash screen ────────────────────────────────────────────────────────
  useEffect(() => {
    if (appState !== "splash") return;

    let cleanup: (() => void) | undefined;

    getSetting("startup.showSplashAnimation", true).then(async (showSplash) => {
      const [hasCompletedOnboarding, hasOnboarded] = await Promise.all([
        getSetting("startup.hasCompletedOnboarding", false),
        getSetting("startup.hasOnboardedAgents", false),
      ]);

      if (!showSplash) {
        const nextState =
          hasCompletedOnboarding || hasOnboarded
            ? "running"
            : "first-run-onboarding";
        setAppState(nextState);
        if (nextState === "running") initWorkspace();
        return;
      }

      setSplashKey((prev) => prev + 1);
      setSplashTimerDone(false);

      const timer = setTimeout(() => {
        setSplashTimerDone(true);
      }, 2500);

      cleanup = () => clearTimeout(timer);
    });

    return () => cleanup?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appState, initWorkspace]);

  useEffect(() => {
    if (appState !== "splash" || !splashTimerDone) return;

    async function evaluateTransition() {
      const [hasCompletedOnboarding, hasOnboarded] = await Promise.all([
        getSetting("startup.hasCompletedOnboarding", false),
        getSetting("startup.hasOnboardedAgents", false),
      ]);
      if (hasOnboarded || hasCompletedOnboarding) {
        setAppState("running");
        initWorkspace();
      } else {
        // First-time user — redirect to the full first-run onboarding flow
        setAppState("first-run-onboarding");
      }
    }
    evaluateTransition();
  }, [appState, splashTimerDone, initWorkspace]);

  const activeSubTabs = activeWorkspace?.subTabs || [];
  const activeSubTabId = activeWorkspace?.activeSubTabId || null;

  // ── Keyboard shortcuts ───────────────────────────────────────────────────
  useAppShortcuts({
    workspaces: activeSubTabs as unknown as Workspace[],
    activeWorkspaceId: activeSubTabId,
    isZenMode: focusSettings.isZenMode,
    onNewWorkspaceFlow: handleCreateSubTab,
    onCloseWorkspace: handleCloseSubTab,
    onSwitchWorkspace: handleSwitchSubTab,
    onToggleShortcuts: () => setShortcutsOpen((prev) => !prev),
    onToggleTemplates: () => setTemplatesOpen((prev) => !prev),
    onToggleSettings: () => setSettingsOpen((prev) => !prev),
    onToggleZenMode: toggleZenMode,
    onToggleSwitcher: () => setSwitcherOpen((prev) => !prev),
    onSelectMode: handleSelectMode,
  });

  const showHeader =
    appState === "running" &&
    (!focusSettings.isZenMode || focusSettings.showTabs);
  const showSidebar =
    appState === "running" &&
    focusSettings.sidebarLayout === "vertical" &&
    (!focusSettings.isZenMode || focusSettings.showTabs);
  const showRightSidebar =
    appState === "running" &&
    rightSidebarVisible &&
    (!focusSettings.isZenMode || focusSettings.showTabs);
  const showFooter =
    appState === "running" &&
    (!focusSettings.isZenMode || focusSettings.showStatusBar);

  const handleSnippetExecute = useCallback(
    (snippet: any, execute: boolean) => {
      if (!activeWorkspaceId) return;
      window.dispatchEvent(
        new CustomEvent("cortex:write-to-terminal", {
          detail: {
            workspaceId: activeWorkspaceId,
            command: snippet.command,
            execute,
          },
        }),
      );
      setTemplatesOpen(false);
      setSwitcherOpen(false);
    },
    [activeWorkspaceId],
  );

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div
      id="root"
      className="min-h-[100dvh] w-full flex flex-col overflow-hidden bg-[var(--bg-color)]"
    >
      {/* LazyMotion loads only the domAnimation feature set (~18KB vs ~130KB
          for the full bundle). Must wrap all <m.*> usage. */}
      <LazyMotion features={domAnimation}>
        <m.div
          className="flex-1 flex flex-col overflow-hidden"
          animate={{
            scale:
              isBackgroundRecessed && !colorSchemeSettings.reducedMotion
                ? 0.98
                : 1,
            opacity:
              isBackgroundRecessed && !colorSchemeSettings.reducedMotion
                ? 0.5
                : 1,
          }}
          transition={
            colorSchemeSettings.reducedMotion
              ? { duration: 0.1 }
              : { type: "spring", stiffness: 300, damping: 25 }
          }
        >
          {showHeader && (
            <AppHeader
              subTabs={activeSubTabs}
              activeSubTabId={activeSubTabId}
              isWindowMaximized={isWindowMaximized}
              onSwitchSubTab={handleSwitchSubTab}
              onCloseSubTab={handleCloseSubTab}
              onCreateSubTab={handleCreateSubTab}
              onRenameSubTab={handleRenameSubTab}
              onOpenShortcuts={() => setShortcutsOpen(true)}
              onOpenSettings={handleOpenSettings}
              onOpenTemplates={() => setTemplatesOpen(true)}
              onMinimize={handleMinimize}
              onMaximize={handleMaximize}
              onClose={handleClose}
              showSubTabs={
                focusSettings.sidebarLayout === "horizontal" &&
                demoSettings.showWorkspacesTab
              }
              showTemplatesButton={demoSettings.showTemplatesButton}
              showShortcutsButton={demoSettings.showShortcutsButton}
              rightSidebarVisible={rightSidebarVisible}
              onToggleRightSidebar={() => setRightSidebarVisible((prev) => !prev)}
              leftSidebarWidth={leftSidebarWidth}
              isLeftSidebarResizing={isLeftSidebarResizing}
              isLeftSidebarCollapsed={focusSettings.sidebarCollapsed ?? false}
              onToggleLeftSidebarCollapse={() =>
                setFocusSetting(
                  "sidebarCollapsed",
                  !(focusSettings.sidebarCollapsed ?? false),
                )
              }
            />
          )}

          <div className="flex-1 flex overflow-hidden">
            {showSidebar && (
              <AppSidebar
                workspaces={workspaces}
                activeWorkspaceId={activeWorkspaceId}
                onSwitchWorkspace={handleSwitchWorkspace}
                onCloseWorkspace={handleCloseWorkspace}
                onReorderWorkspaces={handleReorderWorkspaces}
                onNewProjectModal={() => setNewProjectOpen(true)}
                onCreateSubTab={handleCreateSubTab}
                onSwitchSubTab={handleSidebarSubTabSwitch}
                onCloseSubTab={handleSidebarSubTabClose}
                onSearchWorkspace={() => setWorkspaceSearchOpen(true)}
                onRenameWorkspace={handleRenameWorkspace}
                onPinWorkspace={handlePinWorkspace}
                onUpdateWorkspace={handleUpdateWorkspace}
                onOpenProjectSettings={handleOpenProjectSettings}
                isCollapsed={focusSettings.sidebarCollapsed ?? false}
                onToggleCollapse={() =>
                  setFocusSetting(
                    "sidebarCollapsed",
                    !(focusSettings.sidebarCollapsed ?? false),
                  )
                }
                sidebarWidth={leftSidebarWidth}
                setSidebarWidth={setLeftSidebarWidth}
                isResizing={isLeftSidebarResizing}
                setIsResizing={setIsLeftSidebarResizing}
              />
            )}

            <main
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent:
                  activeWorkspace?.status === "active" ? "stretch" : "center",
                alignItems:
                  activeWorkspace?.status === "active" ? "stretch" : "center",
                overflow: "hidden",
              }}
            >
              {appState === "splash" && (
                <SplashScreen
                  splashKey={splashKey}
                  reducedMotion={colorSchemeSettings.reducedMotion}
                />
              )}

              {appState === "first-run-onboarding" && (
                <FirstRunOnboardingScreen
                  onComplete={async () => {
                    await Promise.all([
                      setSetting("startup.hasCompletedOnboarding", true),
                      setSetting("startup.hasOnboardedAgents", true),
                    ]);
                    setAppState("running");
                    initWorkspace();
                  }}
                />
              )}

              {appState === "running" && workspaces.length === 0 && (
                <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-[var(--canvas-color)]">
                  <div className="max-w-md space-y-6">
                    <div className="relative w-16 h-16 mx-auto flex items-center justify-center rounded-2xl bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/20 shadow-lg">
                      <Rocket size={32} className="animate-pulse" />
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-lg font-bold text-[var(--text-primary)]">No Active Workspaces</h2>
                      <p className="text-xs text-[var(--text-secondary)] leading-relaxed max-w-sm mx-auto">
                        Get started by opening a local folder as a new workspace project, or launch a space template from your library.
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                      <Button
                        onClick={() => setNewProjectOpen(true)}
                        className="w-full sm:w-auto h-9 text-xs font-bold rounded-lg px-4 bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90 text-white flex items-center gap-2 cursor-pointer shadow-md"
                      >
                        <FolderAdd size={14} />
                        <span>Open Local Folder</span>
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => setTemplatesOpen(true)}
                        className="w-full sm:w-auto h-9 text-xs font-bold rounded-lg px-4 border border-[var(--border-color)]/30 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--text-primary)]/5 flex items-center gap-2 cursor-pointer"
                      >
                        <Library size={14} />
                        <span>Browse Templates</span>
                      </Button>
                    </div>
                    <div className="text-[10px] text-[var(--text-secondary)]/50 pt-4 font-mono">
                      Press <kbd className="px-1.5 py-0.5 rounded bg-[var(--surface-color)] border border-[var(--border-color)]/30 font-sans font-bold">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 rounded bg-[var(--surface-color)] border border-[var(--border-color)]/30 font-sans font-bold">P</kbd> to search or open anything
                    </div>
                  </div>
                </div>
              )}

              {appState === "running" &&
                workspaces.map((ws) => {
                  const isCurrent = activeWorkspaceId === ws.id;

                  if (!isCurrent && ws.status !== "active") return null;

                  if (ws.status === "mode-select") {
                    return (
                      <div key={ws.id} className="w-full h-full flex">
                        <ModeSelectorScreen
                          onSelectMode={handleSelectMode}
                          onBack={() => handleCloseWorkspace(ws.id)}
                          showShortcutHints={
                            demoSettings.showModeShortcutHints
                          }
                          showTemplatesHint={demoSettings.showTemplatesButton}
                        />
                      </div>
                    );
                  }

                  if (ws.status === "setup") {
                    return (
                      <div
                        key={ws.id}
                        className="w-full h-full flex flex-col max-w-[1100px] mx-auto px-8 pt-8 overflow-hidden"
                      >
                        <SetupView
                          mode={ws.mode}
                          onLaunch={handleLaunch}
                          onBack={() => handleGoBack(ws.id)}
                        />
                      </div>
                    );
                  }

                  if (ws.status === "active") {
                    return (
                      <div
                        key={ws.id}
                        style={{
                          display: isCurrent ? "flex" : "none",
                          flex: 1,
                          flexDirection: "column",
                          height: "100%",
                          width: "100%",
                          overflow: "hidden",
                        }}
                      >
                        {(ws.subTabs || []).map((tab, idx) => {
                          const isTabCurrent =
                            isCurrent &&
                            (ws.activeSubTabId === tab.id ||
                              (!ws.activeSubTabId && idx === 0));

                          if (!isTabCurrent && tab.status !== "active") return null;

                          if (tab.status === "mode-select") {
                            return (
                              <div
                                key={tab.id}
                                style={{
                                  display: isTabCurrent ? "flex" : "none",
                                  flex: 1,
                                  height: "100%",
                                  width: "100%",
                                }}
                              >
                                <ModeSelectorScreen
                                  onSelectMode={handleSelectMode}
                                  onBack={() => handleCloseSubTab(tab.id)}
                                  showShortcutHints={
                                    demoSettings.showModeShortcutHints
                                  }
                                  showTemplatesHint={demoSettings.showTemplatesButton}
                                />
                              </div>
                            );
                          }

                          if (tab.status === "setup") {
                            return (
                              <div
                                key={tab.id}
                                style={{
                                  display: isTabCurrent ? "flex" : "none",
                                  flex: 1,
                                  flexDirection: "column",
                                  height: "100%",
                                  width: "100%",
                                  overflow: "hidden",
                                }}
                                className="max-w-[1100px] mx-auto px-8 pt-8"
                              >
                                <SetupView
                                  mode={tab.mode}
                                  initialCwd={ws.config?.rootPath}
                                  onLaunch={handleLaunch}
                                  onBack={() => handleGoBack(ws.id)}
                                />
                              </div>
                            );
                          }

                          if (tab.status === "active") {
                            return (
                              <div
                                key={tab.id}
                                style={{
                                  display: isTabCurrent ? "flex" : "none",
                                  flex: 1,
                                  flexDirection: "column",
                                  height: "100%",
                                  width: "100%",
                                  overflow: "hidden",
                                }}
                              >
                                <SpaceView
                                  workspaceId={ws.id}
                                  config={tab.config!}
                                  mode={tab.mode}
                                  theme={theme}
                                  setTheme={setTheme}
                                  onStop={() => handleCloseSubTab(tab.id)}
                                  isZenMode={focusSettings.isZenMode}
                                  setIsZenMode={(v) =>
                                    setFocusSetting("isZenMode", v)
                                  }
                                  zenPadding={colorSchemeSettings.zenPadding}
                                  showPaneHeaders={
                                    focusSettings.showPaneHeaders as boolean
                                  }
                                  onSplitPane={handleSplitPane}
                                  onMovePane={handleMovePane}
                                  onKillPane={handleKillPane}
                                  onRenamePane={handleRenamePane}
                                  onUpdateCommandPane={handleUpdatePaneCommand}
                                  isCurrent={isTabCurrent}
                                />
                              </div>
                            );
                          }

                          return null;
                        })}
                      </div>
                    );
                  }

                  return null;
                })}
            </main>

            {appState === "running" && (
              <AppRightSidebar
                tab={rightSidebarTab}
                onTabChange={setRightSidebarTab}
                workspaces={workspaces}
                activeWorkspaceId={activeWorkspaceId}
                templates={templates}
                onLaunchTemplate={handleLaunchTemplate}
                isVisible={showRightSidebar}
              />
            )}
          </div>

          {showFooter && (
            <AppFooter
              theme={theme}
              setTheme={(newTheme) => setTheme(newTheme as ThemeName)}
              allThemes={allThemes}
            />
          )}
        </m.div>
      </LazyMotion>

      {/* Dialogs are lazy — Suspense provides a no-op fallback while the
          chunk loads (typically <50ms on first open). */}
      <Suspense fallback={null}>
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
          colorScheme={colorSchemeSettings.colorScheme}
          setColorScheme={setColorScheme}
          uiFontScale={colorSchemeSettings.uiFontScale}
          setUiFontScale={setUiFontScale}
          zenPadding={colorSchemeSettings.zenPadding}
          setZenPadding={setZenPadding}
          reducedMotion={colorSchemeSettings.reducedMotion}
          setReducedMotion={setReducedMotion}
          shimmerPreset={colorSchemeSettings.shimmerPreset}
          setShimmerPreset={setShimmerPreset}
          shimmerDuration={colorSchemeSettings.shimmerDuration}
          setShimmerDuration={setShimmerDuration}
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
          theme={theme}
          allThemes={allThemes}
          resolvedScheme={resolvedScheme}
          setTheme={setTheme}
          addCustomTheme={addCustomTheme}
          removeCustomTheme={removeCustomTheme}
          previewTheme={previewTheme}
          cancelPreview={cancelPreview}
        />
        <WorkspaceSwitcherDialog
          isOpen={switcherOpen}
          onOpenChange={setSwitcherOpen}
          templates={templates.filter((t) => !t.isArchived)}
          workspaces={workspaces}
          activeWorkspaceId={activeWorkspaceId}
          snippets={snippets.filter((s) => !s.isArchived)}
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
        <NewProjectDialog
          isOpen={newProjectOpen}
          onOpenChange={setNewProjectOpen}
          onCreateProject={handleCreateProjectWorkspace}
        />
        <WorkspaceSearchDialog
          isOpen={workspaceSearchOpen}
          onOpenChange={setWorkspaceSearchOpen}
          workspaces={workspaces}
          activeWorkspaceId={activeWorkspaceId}
          onSwitchWorkspace={handleSwitchWorkspace}
          onSwitchSubTab={handleSidebarSubTabSwitch}
        />
        <ProjectSettingsDialog
          isOpen={projectSettingsOpen}
          onOpenChange={setProjectSettingsOpen}
          workspace={workspaces.find((w) => w.id === projectSettingsWorkspaceId)}
          onUpdateWorkspace={handleUpdateWorkspace}
          onCloseWorkspace={handleCloseWorkspace}
        />
      </Suspense>

      <Toaster
        position="bottom-right"
        closeButton
        richColors
        theme={resolvedScheme as "light" | "dark" | "system"}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Root — wraps AppInner with the WorkspaceProvider
// ---------------------------------------------------------------------------

function App() {
  return (
    <WorkspaceProvider>
      <AppInner />
    </WorkspaceProvider>
  );
}

export default App;

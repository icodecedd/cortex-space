import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { invoke } from "@tauri-apps/api/core";
import { m, LazyMotion, domAnimation } from "framer-motion";
import { SetupView } from "./features/setup/SetupView";
import { SpaceView } from "./features/space/SpaceView";
import { useTheme, ThemeName } from "./hooks/useTheme";
import { useColorScheme } from "./hooks/useColorScheme";
import { Toaster } from "@/components/ui/sonner";
import { AppState } from "./types";
import { useWindowControls } from "./hooks/useWindowControls";
import { useAppShortcuts } from "./hooks/useAppShortcuts";
import { AppHeader } from "./components/layout/AppHeader";
import { AppFooter } from "./components/layout/AppFooter";
import { SplashScreen } from "./components/screens/SplashScreen";
import { ModeSelectorScreen } from "./components/screens/ModeSelectorScreen";
import { FirstRunOnboardingScreen } from "./components/screens/FirstRunOnboardingScreen";
import { getSetting, setSetting } from "./lib/store";
import { useFocusSettings } from "./hooks/useFocusSettings";
import { useDemoSettings } from "./hooks/useDemoSettings";
import { WorkspaceProvider, useWorkspace } from "./context/WorkspaceContext";

// ---------------------------------------------------------------------------
// Heavy dialogs — lazy-loaded so they never hit the initial parse budget.
// Each one only loads when first opened by the user.
// ---------------------------------------------------------------------------
const KeyboardShortcutsDialog = lazy(() =>
  import("./components/dialogs/KeyboardShortcutsDialog").then((m) => ({
    default: m.KeyboardShortcutsDialog,
  }))
);
const SettingsDialog = lazy(() =>
  import("./features/settings/SettingsDialog").then((m) => ({
    default: m.SettingsDialog,
  }))
);
const CortexLibraryDialog = lazy(() =>
  import("./features/cortex-library/CortexLibraryDialog").then((m) => ({
    default: m.CortexLibraryDialog,
  }))
);
const WorkspaceSwitcherDialog = lazy(() =>
  import("./components/dialogs/WorkspaceSwitcherDialog").then((m) => ({
    default: m.WorkspaceSwitcherDialog,
  }))
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
  } = useWorkspace();

  // ── App lifecycle state ──────────────────────────────────────────────────
  const [appState, setAppState] = useState<AppState>("splash");
  const [splashKey, setSplashKey] = useState(0);
  const [splashTimerDone, setSplashTimerDone] = useState(false);

  // ── Dialog state (pure UI — does not affect workspace logic) ────────────
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

  // ── Appearance / settings hooks ──────────────────────────────────────────
  const [isBackgroundRecessed, setIsBackgroundRecessed] = useState(false);
  const {
    settings: colorSchemeSettings,
    resolvedScheme,
    setColorScheme,
    setUiFontScale,
    setZenPadding,
    setReducedMotion,
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
    resetToDefaults: resetFocus,
  } = useFocusSettings();
  const { settings: demoSettings, setDemoSetting, resetToDefaults: resetDemo } =
    useDemoSettings();

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
        handleDepthChange
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

  // ── Keyboard shortcuts ───────────────────────────────────────────────────
  useAppShortcuts({
    workspaces,
    activeWorkspaceId,
    isZenMode: focusSettings.isZenMode,
    onNewWorkspaceFlow: handleNewWorkspaceFlow,
    onCloseWorkspace: handleCloseWorkspace,
    onSwitchWorkspace: handleSwitchWorkspace,
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
        })
      );
      setTemplatesOpen(false);
      setSwitcherOpen(false);
    },
    [activeWorkspaceId]
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
                        showShortcutHints={demoSettings.showModeShortcutHints}
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
                      <SpaceView
                        workspaceId={ws.id}
                        config={ws.config}
                        mode={ws.mode}
                        theme={theme}
                        setTheme={setTheme}
                        onStop={() => handleCloseWorkspace(ws.id)}
                        isZenMode={focusSettings.isZenMode}
                        setIsZenMode={(v) => setFocusSetting("isZenMode", v)}
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

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Settings2,
  Keyboard,
  Terminal,
  FlaskConical,
  Info
} from "@/components/ui/icons";
import { open } from "@tauri-apps/plugin-dialog";

import {
  getSetting,
  setSetting,
  getSettingsGroup,
  setSettingsGroup,
  clearAllSettings,
  ShortcutSettings,
  SHORTCUT_DEFAULTS,
  FocusSettings,
  DemoSettings,
  ColorScheme,
  StartupBehavior
} from "@/lib/store";

import { useTerminalSettings } from "@/hooks/useTerminalSettings";
import { ThemeName, ThemeDefinition } from "@/hooks/useTheme";

import { toast } from "sonner";


// Tab Components
import { GeneralTab } from "./components/tabs/GeneralTab";
import { ShortcutsTab } from "./components/tabs/ShortcutsTab";
import { TerminalTab } from "./components/tabs/TerminalTab";

import { DemoTab } from "./components/tabs/DemoTab";
import { AboutTab } from "./components/tabs/AboutTab";

interface SettingsDialogProps {
// ...
// ...

  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTab?: string;
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  allThemes: ThemeDefinition[];
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => void;
  uiFontScale: number;
  setUiFontScale: (scale: number) => void;
  zenPadding: number;
  setZenPadding: (padding: number) => void;
  reducedMotion: boolean;
  setReducedMotion: (reduced: boolean) => void;
  shimmerPreset: string;
  setShimmerPreset: (preset: string) => void;
  shimmerDuration: number;
  setShimmerDuration: (v: number) => void;
  onResetAppearance: () => void;
  focusSettings: FocusSettings;
  setFocusSetting: <K extends keyof FocusSettings>(key: K, value: FocusSettings[K]) => Promise<void>;
  resetFocus: () => Promise<void>;
  demoSettings: DemoSettings;
  setDemoSetting: <K extends keyof DemoSettings>(key: K, value: DemoSettings[K]) => Promise<void>;
  resetDemo: () => Promise<void>;
}

export function SettingsDialog({
  open: isOpen,
  onOpenChange,
  initialTab = "general",
  theme,
  setTheme,
  allThemes,
  colorScheme,
  setColorScheme,
  uiFontScale,
  setUiFontScale,
  zenPadding,
  setZenPadding,
  reducedMotion,
  setReducedMotion,
  shimmerPreset,
  setShimmerPreset,
  shimmerDuration,
  setShimmerDuration,
  onResetAppearance,
  focusSettings,
  setFocusSetting,
  resetFocus,
  demoSettings,
  setDemoSetting,
  resetDemo,
}: SettingsDialogProps) {

  const [defaultPath, setDefaultPath] = useState<string>("");
  const [activeTab, setActiveTab] = useState(initialTab);

  // Sync activeTab with initialTab when dialog opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Startup settings (local state, persisted on change)
  const [showSplash, setShowSplash] = useState(true);
  const [startupBehavior, setStartupBehavior] = useState<StartupBehavior>("modeSelector");
  const [checkUpdates, setCheckUpdates] = useState(true);
  const [confirmModeChange, setConfirmModeChange] = useState(true);
  const [defaultShell, setDefaultShell] = useState("");
  // Shortcut settings
  const [shortcuts, setShortcuts] = useState<ShortcutSettings>(SHORTCUT_DEFAULTS);

  // Terminal settings via hook
  const {
    settings: ts,
    isLoaded,
    updateSetting,
    updateSettingLive,
    commitSettings,
    resetToDefaults: resetTerminal,
  } = useTerminalSettings();

  // Load general + startup + shortcuts
  useEffect(() => {
    // We intentionally load settings even before the modal is fully open
    // so they are ready when the user clicks. The cache inside `getSetting`
    // makes this fast and safe.
    let isMounted = true;
    (async () => {
      try {
        const [
          path,
          splash,
          behavior,
          updates,
          confirmMode,
          shell,
          savedShortcuts
        ] = await Promise.all([
          getSetting("cortex_default_path", ""),
          getSetting("startup.showSplashAnimation", true),
          getSetting<StartupBehavior>("startup.behavior", "modeSelector"),
          getSetting("startup.checkForUpdatesOnStartup", true),
          getSetting("startup.confirmModeChange", true),
          getSetting("startup.defaultShell", ""),
          getSettingsGroup<ShortcutSettings>('shortcuts', SHORTCUT_DEFAULTS)
        ]);

        if (!isMounted) return;

        setDefaultPath(path);
        setShowSplash(splash);
        setStartupBehavior(behavior);
        setCheckUpdates(updates);
        setConfirmModeChange(confirmMode);
        setDefaultShell(shell);
        setShortcuts(savedShortcuts);
      } catch (err) {
        console.error("Failed to load settings:", err);
      }
    })();
    
    return () => {
      isMounted = false;
    };
  }, [isOpen]); // Run on mount and when open state changes to refresh values

  const handleSetPath = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: "Select Default Workspace Path",
      });
      if (selected && typeof selected === "string") {
        setDefaultPath(selected);
        await setSetting("cortex_default_path", selected);
      }
    } catch (err) {
      console.error("Failed to pick directory:", err);
    }
  };

  const handleStartupToggle = async (key: string, setter: (v: boolean) => void, value: boolean) => {
    setter(value);
    await setSetting(key, value);
  };

  const handleResetStartup = async () => {
    setShowSplash(true);
    setStartupBehavior("modeSelector");
    setCheckUpdates(true);
    setConfirmModeChange(true);
    setDefaultShell("");
    await Promise.all([
      setSetting("startup.showSplashAnimation", true),
      setSetting("startup.behavior", "modeSelector"),
      setSetting("startup.checkForUpdatesOnStartup", true),
      setSetting("startup.confirmModeChange", true),
      setSetting("startup.defaultShell", ""),
    ]);
  };

  const handleShortcutChange = async (key: keyof ShortcutSettings, value: string) => {
    const updated = { ...shortcuts, [key]: value };
    setShortcuts(updated);
    await setSetting(`shortcuts.${key}`, value);
    window.dispatchEvent(new CustomEvent('cortex-settings-changed', {
      detail: { shortcuts: updated }
    }));
  };

  const handleResetShortcuts = async () => {
    setShortcuts(SHORTCUT_DEFAULTS);
    await setSettingsGroup<ShortcutSettings>('shortcuts', SHORTCUT_DEFAULTS);
    window.dispatchEvent(new CustomEvent('cortex-settings-changed', {
      detail: { shortcuts: SHORTCUT_DEFAULTS }
    }));
  };

  const handleFactoryReset = async () => {
    try {
      await clearAllSettings();
      toast.success("Factory reset successful", { description: "The application will now reload." });
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      console.error("Factory reset failed:", err);
      toast.error("Factory reset failed", { description: "An error occurred while clearing data." });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={true}
        isDeep={true}
        open={isOpen}
        className="bg-[var(--surface-color)] border-[var(--border-color)] shadow-2xl flex flex-col"
        style={{
          padding: "2rem 1.5rem 1.5rem",
          maxWidth: "740px",
          width: "calc(100% - 2rem)",
          height: "700px",
          maxHeight: "90vh",
          boxShadow: '0 30px 60px rgba(0, 0, 0, 0.4), 0 0 20px rgba(var(--accent-primary-rgb), 0.05)'
        }}
      >
        <DialogHeader className="gap-2 text-left sm:text-left shrink-0">
          <DialogTitle className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
            Preferences
          </DialogTitle>
          <DialogDescription
            className="text-sm leading-relaxed text-[var(--text-secondary)] font-medium"
          >
            Manage your workspace layout, behavior, and visual appearance.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full flex-1 flex flex-col overflow-hidden mt-4"
        >
          <TabsList className={`w-full grid shrink-0 ${import.meta.env.DEV ? 'grid-cols-5' : 'grid-cols-4'}`}>
            <TabsTrigger value="general" className="gap-1.5 text-[11px] data-[state=active]:text-[var(--accent-primary)] data-[state=active]:bg-[var(--accent-primary)]/10">
              <Settings2 size={13} /> General
            </TabsTrigger>
            <TabsTrigger value="shortcuts" className="gap-1.5 text-[11px] data-[state=active]:text-[var(--accent-primary)] data-[state=active]:bg-[var(--accent-primary)]/10">
              <Keyboard size={13} /> Shortcuts
            </TabsTrigger>
            <TabsTrigger value="terminal" className="gap-1.5 text-[11px] data-[state=active]:text-[var(--accent-primary)] data-[state=active]:bg-[var(--accent-primary)]/10">
              <Terminal size={13} /> Terminal
            </TabsTrigger>
            {import.meta.env.DEV && (
              <TabsTrigger value="demo" className="gap-1.5 text-[11px] data-[state=active]:text-[var(--accent-primary)] data-[state=active]:bg-[var(--accent-primary)]/10">
                <FlaskConical size={13} /> Demo
              </TabsTrigger>
            )}
            <TabsTrigger value="about" className="gap-1.5 text-[11px] data-[state=active]:text-[var(--accent-primary)] data-[state=active]:bg-[var(--accent-primary)]/10">
              <Info size={13} /> About
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="flex-1 overflow-y-auto mt-4 mb-2 scrollbar-none" style={{ paddingRight: "0.25rem" }}>
            <GeneralTab
              colorScheme={colorScheme}
              setColorScheme={setColorScheme}
              uiFontScale={uiFontScale}
              setUiFontScale={setUiFontScale}
              zenPadding={zenPadding}
              setZenPadding={setZenPadding}
              reducedMotion={reducedMotion}
              setReducedMotion={setReducedMotion}
              shimmerPreset={shimmerPreset}
              setShimmerPreset={setShimmerPreset}
              shimmerDuration={shimmerDuration}
              setShimmerDuration={setShimmerDuration}
              onResetAppearance={onResetAppearance}
              showSplash={showSplash}
              setShowSplash={(v) => handleStartupToggle("startup.showSplashAnimation", setShowSplash, v)}
              startupBehavior={startupBehavior}
              setStartupBehavior={async (v) => {
                setStartupBehavior(v);
                await setSetting("startup.behavior", v);
              }}
              checkUpdates={checkUpdates}
              setCheckUpdates={(v) => handleStartupToggle("startup.checkForUpdatesOnStartup", setCheckUpdates, v)}
              confirmModeChange={confirmModeChange}
              setConfirmModeChange={(v) => handleStartupToggle("startup.confirmModeChange", setConfirmModeChange, v)}
              defaultShell={defaultShell}
              setDefaultShell={async (v) => {
                setDefaultShell(v);
                await setSetting("startup.defaultShell", v);
                window.dispatchEvent(new CustomEvent('cortex-settings-changed', {
                  detail: { startup: { defaultShell: v } }
                }));
              }}
              defaultPath={defaultPath}
              onSetPath={handleSetPath}
              onResetStartup={handleResetStartup}
              focusSettings={focusSettings}
              setFocusSetting={setFocusSetting}
              onResetFocus={resetFocus}
              onFactoryReset={handleFactoryReset}
              theme={theme}
              setTheme={setTheme}
              allThemes={allThemes}
            />
          </TabsContent>

          <TabsContent value="shortcuts" className="flex-1 overflow-y-auto mt-4 mb-2 scrollbar-none" style={{ paddingRight: "0.25rem" }}>
            <ShortcutsTab
              shortcuts={shortcuts}
              onShortcutChange={handleShortcutChange}
              onResetShortcuts={handleResetShortcuts}
            />
          </TabsContent>

          <TabsContent value="terminal" className="flex-1 overflow-y-auto mt-4 mb-2 scrollbar-none" style={{ paddingRight: "0.25rem" }}>
            <TerminalTab
              ts={ts}
              demo={demoSettings}
              isLoaded={isLoaded}
              updateSetting={updateSetting}
              updateSettingLive={updateSettingLive}
              commitSettings={commitSettings}
              onResetTerminal={resetTerminal}
              setDemoSetting={setDemoSetting}
            />
          </TabsContent>



           {import.meta.env.DEV && (
            <TabsContent value="demo" className="flex-1 overflow-y-auto mt-4 mb-2 scrollbar-none" style={{ paddingRight: "0.25rem" }}>
              <DemoTab
                demo={demoSettings}
                setDemoSetting={setDemoSetting}
                onResetDemo={resetDemo}
                onFactoryReset={handleFactoryReset}
              />
            </TabsContent>
          )}

          <TabsContent value="about" className="flex-1 overflow-y-auto mt-4 mb-2 scrollbar-none" style={{ paddingRight: "0.25rem" }}>
            <AboutTab />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

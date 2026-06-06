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
  Target,
  Keyboard,
  Terminal,
  Palette,
  FlaskConical,
  Info,
  Cpu
} from "lucide-react";
import { open } from "@tauri-apps/plugin-dialog";

import {
  getSetting,
  setSetting,
  getSettingsGroup,
  setSettingsGroup,
  ShortcutSettings,
  SHORTCUT_DEFAULTS,
  FocusSettings,
  DemoSettings,
  ColorScheme,
  OpenOnLaunch
} from "@/lib/store";

import { useTerminalSettings } from "@/hooks/useTerminalSettings";
import { ThemeName, ThemeDefinition } from "@/hooks/useTheme";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useAgents } from "@/hooks/useAgents";

// Tab Components
import { GeneralTab } from "./components/tabs/GeneralTab";
import { FocusTab } from "./components/tabs/FocusTab";
import { ShortcutsTab } from "./components/tabs/ShortcutsTab";
import { TerminalTab } from "./components/tabs/TerminalTab";
import { ThemesTab } from "./components/tabs/ThemesTab";
import { AgentsTab } from "./components/tabs/AgentsTab";
import { DemoTab } from "./components/tabs/DemoTab";
import { AboutTab } from "./components/tabs/AboutTab";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  allThemes: ThemeDefinition[];
  addCustomTheme: (theme: ThemeDefinition) => Promise<void>;
  removeCustomTheme: (id: string) => Promise<void>;
  previewTheme: (config: ThemeDefinition) => void;
  cancelPreview: () => void;
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => void;
  uiFontScale: number;
  setUiFontScale: (scale: number) => void;
  zenPadding: number;
  setZenPadding: (padding: number) => void;
  reducedMotion: boolean;
  setReducedMotion: (reduced: boolean) => void;
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
  theme,
  setTheme,
  allThemes,
  addCustomTheme,
  removeCustomTheme,
  previewTheme,
  cancelPreview,
  colorScheme,
  setColorScheme,
  uiFontScale,
  setUiFontScale,
  zenPadding,
  setZenPadding,
  reducedMotion,
  setReducedMotion,
  onResetAppearance,
  focusSettings,
  setFocusSetting,
  resetFocus,
  demoSettings,
  setDemoSetting,
  resetDemo,
}: SettingsDialogProps) {
  const { resolvedScheme } = useColorScheme();
  const [defaultPath, setDefaultPath] = useState<string>("");

  // Startup settings (local state, persisted on change)
  const [showSplash, setShowSplash] = useState(true);
  const [rememberMode, setRememberMode] = useState(false);
  const [openOnLaunch, setOpenOnLaunch] = useState<OpenOnLaunch>("modeSelector");
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
    if (!isOpen) return;
    (async () => {
      setDefaultPath(await getSetting("cortex_default_path", ""));
      setShowSplash(await getSetting("startup.showSplashAnimation", true));
      setRememberMode(await getSetting("startup.rememberLastMode", false));
      setOpenOnLaunch(
        await getSetting<OpenOnLaunch>("startup.openOnLaunch", "modeSelector")
      );
      setCheckUpdates(
        await getSetting("startup.checkForUpdatesOnStartup", true)
      );
      setConfirmModeChange(
        await getSetting("startup.confirmModeChange", true)
      );
      setDefaultShell(await getSetting("startup.defaultShell", ""));

      const savedShortcuts = await getSettingsGroup<ShortcutSettings>('shortcuts', SHORTCUT_DEFAULTS);
      setShortcuts(savedShortcuts);
    })();
  }, [isOpen]);

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
    setRememberMode(false);
    setOpenOnLaunch("modeSelector");
    setCheckUpdates(true);
    setConfirmModeChange(true);
    setDefaultShell("");
    await Promise.all([
      setSetting("startup.showSplashAnimation", true),
      setSetting("startup.rememberLastMode", false),
      setSetting("startup.openOnLaunch", "modeSelector"),
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
          defaultValue="general"
          className="w-full flex-1 flex flex-col overflow-hidden mt-4"
        >
          <TabsList className="w-full grid grid-cols-8 shrink-0">
            <TabsTrigger value="general" className="gap-1.5 text-[11px] data-[state=active]:text-[var(--accent-primary)] data-[state=active]:bg-[var(--accent-primary)]/10">
              <Settings2 size={13} /> General
            </TabsTrigger>
            <TabsTrigger value="focus" className="gap-1.5 text-[11px] data-[state=active]:text-[var(--accent-primary)] data-[state=active]:bg-[var(--accent-primary)]/10">
              <Target size={13} /> Focus
            </TabsTrigger>
            <TabsTrigger value="shortcuts" className="gap-1.5 text-[11px] data-[state=active]:text-[var(--accent-primary)] data-[state=active]:bg-[var(--accent-primary)]/10">
              <Keyboard size={13} /> Keys
            </TabsTrigger>
            <TabsTrigger value="terminal" className="gap-1.5 text-[11px] data-[state=active]:text-[var(--accent-primary)] data-[state=active]:bg-[var(--accent-primary)]/10">
              <Terminal size={13} /> Terminal
            </TabsTrigger>
            <TabsTrigger value="themes" className="gap-1.5 text-[11px] data-[state=active]:text-[var(--accent-primary)] data-[state=active]:bg-[var(--accent-primary)]/10">
              <Palette size={13} /> Themes
            </TabsTrigger>
            <TabsTrigger value="agents" className="gap-1.5 text-[11px] data-[state=active]:text-[var(--accent-primary)] data-[state=active]:bg-[var(--accent-primary)]/10">
              <Cpu size={13} /> Agents
            </TabsTrigger>
            <TabsTrigger value="demo" className="gap-1.5 text-[11px] data-[state=active]:text-[var(--accent-primary)] data-[state=active]:bg-[var(--accent-primary)]/10">
              <FlaskConical size={13} /> Demo
            </TabsTrigger>
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
              onResetAppearance={onResetAppearance}
              showSplash={showSplash}
              setShowSplash={(v) => handleStartupToggle("startup.showSplashAnimation", setShowSplash, v)}
              rememberMode={rememberMode}
              setRememberMode={(v) => handleStartupToggle("startup.rememberLastMode", setRememberMode, v)}
              openOnLaunch={openOnLaunch}
              setOpenOnLaunch={async (v) => {
                setOpenOnLaunch(v);
                await setSetting("startup.openOnLaunch", v);
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
            />
          </TabsContent>

          <TabsContent value="focus" className="flex-1 overflow-y-auto mt-4 mb-2 scrollbar-none" style={{ paddingRight: "0.25rem" }}>
            <FocusTab
              focusSettings={focusSettings}
              setFocusSetting={setFocusSetting}
              onResetFocus={resetFocus}
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

          <TabsContent value="themes" className="flex-1 overflow-y-auto mt-4 mb-2 scrollbar-none" style={{ paddingRight: "0.25rem" }}>
            <ThemesTab
              theme={theme}
              allThemes={allThemes}
              resolvedScheme={resolvedScheme}
              setTheme={setTheme}
              addCustomTheme={addCustomTheme}
              removeCustomTheme={removeCustomTheme}
              previewTheme={previewTheme}
              cancelPreview={cancelPreview}
            />
          </TabsContent>

          <TabsContent value="agents" className="flex-1 overflow-y-auto mt-4 mb-2 scrollbar-none" style={{ paddingRight: "0.25rem" }}>
            <AgentsTab />
          </TabsContent>

          <TabsContent value="demo" className="flex-1 overflow-y-auto mt-4 mb-2 scrollbar-none" style={{ paddingRight: "0.25rem" }}>
            <DemoTab
              demo={demoSettings}
              setDemoSetting={setDemoSetting}
              onResetDemo={resetDemo}
            />
          </TabsContent>

          <TabsContent value="about" className="flex-1 overflow-y-auto mt-4 mb-2 scrollbar-none" style={{ paddingRight: "0.25rem" }}>
            <AboutTab />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getSetting, setSetting, getSettingsGroup, setSettingsGroup, ShortcutSettings, SHORTCUT_DEFAULTS, FocusSettings, DemoSettings } from "@/lib/store";
import { useTerminalSettings } from "@/hooks/useTerminalSettings";
import { ThemeName, ThemeDefinition } from "@/hooks/useTheme";
import { useColorScheme } from "@/hooks/useColorScheme";
import { ColorScheme, OpenOnLaunch } from "@/lib/store";
import { open } from "@tauri-apps/plugin-dialog";
import {
  FolderOpen,
  Settings2,
  Palette,
  Info,
  Terminal,
  RotateCcw,
  Target,
  Keyboard,
  FlaskConical,
  Plus,
  Trash2,
  Code,
  Check,
} from "lucide-react";

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

// ─── Re-usable setting row ────────────────────────────────────────────────────
function SettingsRow({
  label,
  description,
  htmlFor,
  children,
}: {
  label: string;
  description?: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <div className="flex flex-col gap-0.5 min-w-0">
        <Label
          htmlFor={htmlFor}
          className="text-[13px] font-medium cursor-pointer"
          style={{ color: "var(--text-primary)" }}
        >
          {label}
        </Label>
        {description && (
          <span className="text-[11px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            {description}
          </span>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────
function SectionHeader({
  title,
  onReset,
}: {
  title: string;
  onReset?: () => void;
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h3
        className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]"
      >
        {title}
      </h3>
      {onReset && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="flex items-center gap-1 text-[10px] transition-colors"
          style={{ color: "var(--text-secondary)" }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.color = "var(--accent-primary)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.color = "var(--text-secondary)")
          }
        >
          <RotateCcw size={8} />
          Reset
        </Button>
      )}
    </div>
  );
}

// ─── Divider ──────────────────────────────────────────────────────────────────
function Divider() {
  return (
    <div
      className="my-5"
      style={{ height: "1px", background: "var(--border-color)" }}
    />
  );
}

// ─── Segmented Control ────────────────────────────────────────────────────────
function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string; disabled?: boolean }[];
  onChange: (v: T) => void;
}) {
  return (
    <div
      className="flex rounded-lg overflow-hidden border"
      style={{ borderColor: "var(--border-color)" }}
    >
      {options.map((opt, i) => (
        <button
          key={opt.value}
          disabled={opt.disabled}
          onClick={() => !opt.disabled && onChange(opt.value)}
          className="text-[11px] font-medium px-3 py-1.5 transition-all"
          style={{
            background:
              value === opt.value
                ? "var(--accent-primary)"
                : "var(--surface-color)",
            color:
              value === opt.value
                ? "var(--accent-contrast)"
                : opt.disabled
                  ? "var(--text-secondary)"
                  : "var(--text-primary)",
            borderRight:
              i < options.length - 1 ? "1px solid var(--border-color)" : "none",
            opacity: opt.disabled ? 0.4 : 1,
            cursor: opt.disabled ? "not-allowed" : "pointer",
            fontFamily: "inherit",
          }}
        >
          {opt.label}
          {opt.disabled && (
            <span
              className="ml-1 text-[9px]"
              style={{ color: "var(--text-secondary)" }}
            >
              soon
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

function normalizeThemeInput(parsed: any): ThemeDefinition {
  if (!parsed || typeof parsed !== 'object') {
    throw new Error("Invalid theme object");
  }
  if (!parsed.id || typeof parsed.id !== 'string') {
    throw new Error("Missing or invalid 'id' property.");
  }
  if (!parsed.name || typeof parsed.name !== 'string') {
    throw new Error("Missing or invalid 'name' property.");
  }

  if (parsed.dark && typeof parsed.dark === 'object') {
    const requiredPalette = ['bg', 'headerBg', 'footerBg', 'surface', 'border', 'textPrimary', 'textSecondary', 'accent'];
    for (const key of requiredPalette) {
      if (!parsed.dark[key]) {
        throw new Error(`Missing required theme palette property under dark: ${key}`);
      }
    }
    return {
      id: parsed.id,
      name: parsed.name,
      dark: parsed.dark,
      light: parsed.light,
      isCustom: true
    };
  } else {
    const required = ['bg', 'headerBg', 'footerBg', 'surface', 'border', 'textPrimary', 'textSecondary', 'accent'];
    for (const key of required) {
      if (!parsed[key]) {
        throw new Error(`Missing required theme property: ${key}`);
      }
    }
    return {
      id: parsed.id,
      name: parsed.name,
      dark: {
        bg: parsed.bg,
        headerBg: parsed.headerBg,
        footerBg: parsed.footerBg,
        surface: parsed.surface,
        border: parsed.border,
        textPrimary: parsed.textPrimary,
        textSecondary: parsed.textSecondary,
        accent: parsed.accent,
        ansi: parsed.ansi
      },
      light: parsed.light,
      isCustom: true
    };
  }
}

// ─── Main Dialog ──────────────────────────────────────────────────────────────
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

  // Custom theme import state
  const [jsonInput, setJsonInput] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);

  // Focus settings
  const focus = focusSettings;

  // Demo settings
  const demo = demoSettings;

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

  // Live Preview Logic
  useEffect(() => {
    if (!isPreviewing || !jsonInput.trim()) {
      if (!isPreviewing) cancelPreview();
      return;
    }

    try {
      const parsed = JSON.parse(jsonInput);
      const normalized = normalizeThemeInput(parsed);
      previewTheme(normalized);
    } catch (e) {
      // Silently fail preview for invalid JSON
    }
  }, [jsonInput, isPreviewing, previewTheme, cancelPreview]);

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

  const handleStartupToggle = async (
    key: string,
    setter: (v: boolean) => void,
    value: boolean
  ) => {
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

  const handleImportTheme = async () => {
    if (!jsonInput.trim()) return;

    try {
      const parsed = JSON.parse(jsonInput);
      const normalized = normalizeThemeInput(parsed);

      await addCustomTheme(normalized);
      toast.success("Theme Imported", { description: `Successfully added "${normalized.name}" to your library.` });
      setJsonInput("");
      setIsImporting(false);
      setIsPreviewing(false);
    } catch (err: any) {
      toast.error("Invalid Theme JSON", { description: err.message || "Please check your formatting and required keys." });
    }
  };

  const handleCopyJson = (t: ThemeDefinition) => {
    const { isCustom, ...rest } = t; // Strip internal flag
    navigator.clipboard.writeText(JSON.stringify(rest, null, 2));
    toast.success("Copied to Clipboard", { description: `Theme JSON for "${t.name}" ready to paste.` });
  };

  const fontFamilies = [
    // Standard monospace fonts
    { value: 'JetBrains Mono', label: 'JetBrains Mono' },
    { value: 'Fira Code', label: 'Fira Code' },
    { value: 'Cascadia Code', label: 'Cascadia Code' },
    { value: 'Courier New', label: 'Courier New' },
    { value: 'Consolas', label: 'Consolas' },
    { value: 'Menlo', label: 'Menlo' },
    // Nerd Fonts (require user installation)
    { value: 'JetBrainsMono Nerd Font', label: 'JetBrainsMono NF' },
    { value: 'FiraCode Nerd Font', label: 'FiraCode NF' },
    { value: 'Hack Nerd Font', label: 'Hack NF' },
    { value: 'MesloLGS NF', label: 'MesloLGS NF' },
    { value: 'CaskaydiaCove Nerd Font', label: 'CaskaydiaCove NF' },
    { value: 'Inconsolata Nerd Font', label: 'Inconsolata NF' },
    { value: 'SauceCodePro Nerd Font', label: 'SauceCodePro NF' },
    { value: 'monospace', label: 'System Monospace' },
  ];

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
          <TabsList className="w-full grid grid-cols-7 shrink-0">
            <TabsTrigger
              value="general"
              className="gap-1.5 text-[11px] data-[state=active]:text-[var(--accent-primary)] data-[state=active]:bg-[var(--accent-primary)]/10"
            >
              <Settings2 size={13} />
              General
            </TabsTrigger>
            <TabsTrigger
              value="focus"
              className="gap-1.5 text-[11px] data-[state=active]:text-[var(--accent-primary)] data-[state=active]:bg-[var(--accent-primary)]/10"
            >
              <Target size={13} />
              Focus
            </TabsTrigger>
            <TabsTrigger
              value="shortcuts"
              className="gap-1.5 text-[11px] data-[state=active]:text-[var(--accent-primary)] data-[state=active]:bg-[var(--accent-primary)]/10"
            >
              <Keyboard size={13} />
              Keys
            </TabsTrigger>
            <TabsTrigger
              value="terminal"
              className="gap-1.5 text-[11px] data-[state=active]:text-[var(--accent-primary)] data-[state=active]:bg-[var(--accent-primary)]/10"
            >
              <Terminal size={13} />
              Terminal
            </TabsTrigger>
            <TabsTrigger
              value="themes"
              className="gap-1.5 text-[11px] data-[state=active]:text-[var(--accent-primary)] data-[state=active]:bg-[var(--accent-primary)]/10"
            >
              <Palette size={13} />
              Themes
            </TabsTrigger>
            <TabsTrigger
              value="demo"
              className="gap-1.5 text-[11px] data-[state=active]:text-[var(--accent-primary)] data-[state=active]:bg-[var(--accent-primary)]/10"
            >
              <FlaskConical size={13} />
              Demo
            </TabsTrigger>
            <TabsTrigger
              value="about"
              className="gap-1.5 text-[11px] data-[state=active]:text-[var(--accent-primary)] data-[state=active]:bg-[var(--accent-primary)]/10"
            >
              <Info size={13} />
              About
            </TabsTrigger>
          </TabsList>

          <div
            className="flex-1 overflow-y-auto mt-4 mb-2 scrollbar-none"
            style={{ paddingRight: "0.25rem" }}
          >
            {/* ── GENERAL TAB ── */}
            <TabsContent
              value="general"
              className="m-0 space-y-0 animate-in fade-in-0 duration-300"
            >
              {/* Appearance — first for quick access */}
              <SectionHeader title="Appearance" onReset={onResetAppearance} />
              <div className="space-y-1">
                <SettingsRow
                  label="Color Scheme"
                  description="Controls the light/dark mode independently of the selected theme."
                >
                  <SegmentedControl<ColorScheme>
                    value={colorScheme}
                    onChange={setColorScheme}
                    options={[
                      { value: "system", label: "System" },
                      { value: "dark", label: "Dark" },
                      { value: "light", label: "Light" },
                    ]}
                  />
                </SettingsRow>
                <SettingsRow
                  label="UI Font Scale"
                  description="Scales global interface text. Does not affect the terminal."
                  htmlFor="font-scale-slider"
                >
                  <div className="flex items-center gap-3 w-[180px]">
                    <Slider
                      id="font-scale-slider"
                      min={80}
                      max={150}
                      step={5}
                      value={[uiFontScale]}
                      onValueChange={([v]) => setUiFontScale(v)}
                      className="flex-1"
                    />
                    <span
                      className="text-[12px] font-mono w-[36px] text-right"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {uiFontScale}%
                    </span>
                  </div>
                </SettingsRow>
                <SettingsRow
                  label="Zen Mode Padding"
                  description="Padding around the terminal in Zen Mode (0–100px)."
                  htmlFor="zen-padding-slider"
                >
                  <div className="flex items-center gap-3 w-[180px]">
                    <Slider
                      id="zen-padding-slider"
                      min={0}
                      max={100}
                      step={4}
                      value={[zenPadding]}
                      onValueChange={([v]) => setZenPadding(v)}
                      className="flex-1"
                    />
                    <span
                      className="text-[12px] font-mono w-[36px] text-right"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {zenPadding}px
                    </span>
                  </div>
                </SettingsRow>
                <SettingsRow
                  label="Reduced Motion"
                  description="Disable or simplify animations across the interface."
                  htmlFor="reduced-motion-toggle"
                >
                  <Switch
                    id="reduced-motion-toggle"
                    checked={reducedMotion}
                    onCheckedChange={setReducedMotion}
                  />
                </SettingsRow>
              </div>

              <Divider />

              {/* Startup Behavior */}
              <SectionHeader title="Startup" onReset={handleResetStartup} />
              <div className="space-y-1">
                <SettingsRow
                  label="Show Splash Animation"
                  description="Display the intro animation on every app launch."
                  htmlFor="splash-toggle"
                >
                  <Switch
                    id="splash-toggle"
                    checked={showSplash}
                    onCheckedChange={(v) =>
                      handleStartupToggle(
                        "startup.showSplashAnimation",
                        setShowSplash,
                        v
                      )
                    }
                  />
                </SettingsRow>
                <SettingsRow
                  label="Remember Last Mode"
                  description="Skip mode selector and resume the previously used mode."
                  htmlFor="remember-mode-toggle"
                >
                  <Switch
                    id="remember-mode-toggle"
                    checked={rememberMode}
                    onCheckedChange={(v) =>
                      handleStartupToggle(
                        "startup.rememberLastMode",
                        setRememberMode,
                        v
                      )
                    }
                  />
                </SettingsRow>
                <SettingsRow
                  label="Open on Launch"
                  description="What screen to open after the splash. Ignored when Remember Last Mode is on."
                  htmlFor="open-on-launch"
                >
                  <Select
                    value={openOnLaunch}
                    onValueChange={async (v) => {
                      const val = v as OpenOnLaunch;
                      setOpenOnLaunch(val);
                      await setSetting("startup.openOnLaunch", val);
                    }}
                  >
                    <SelectTrigger
                      id="open-on-launch"
                      className="w-[160px] text-[12px] border-[var(--border-color)] bg-[var(--surface-color)]"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      <SelectItem value="modeSelector">Mode Selector</SelectItem>
                      <SelectItem value="newTerminal">New Terminal</SelectItem>
                    </SelectContent>
                  </Select>
                </SettingsRow>
                <SettingsRow
                  label="Default Shell"
                  description="Specific shell path (e.g. /bin/zsh). Leave empty for system default."
                  htmlFor="default-shell-input"
                >
                  <Input
                    id="default-shell-input"
                    value={defaultShell}
                    placeholder="Auto"
                    onChange={async (e) => {
                      const v = e.target.value;
                      setDefaultShell(v);
                      await setSetting("startup.defaultShell", v);
                      window.dispatchEvent(new CustomEvent('cortex-settings-changed', {
                        detail: { startup: { defaultShell: v } }
                      }));
                    }}
                    className="w-[160px] h-8 text-[12px] font-mono bg-[var(--bg-color)] border-[var(--border-color)]"
                  />
                </SettingsRow>
                <SettingsRow
                  label="Check for Updates on Startup"
                  description="Automatically check for Cortex Space updates when the app opens."
                  htmlFor="check-updates-toggle"
                >
                  <Switch
                    id="check-updates-toggle"
                    checked={checkUpdates}
                    onCheckedChange={(v) =>
                      handleStartupToggle(
                        "startup.checkForUpdatesOnStartup",
                        setCheckUpdates,
                        v
                      )
                    }
                  />
                </SettingsRow>
                <SettingsRow
                  label="Confirm Mode Change"
                  description="Show a warning before switching back to the mode selection screen."
                  htmlFor="confirm-mode-change-toggle"
                >
                  <Switch
                    id="confirm-mode-change-toggle"
                    checked={confirmModeChange}
                    onCheckedChange={(v) =>
                      handleStartupToggle(
                        "startup.confirmModeChange",
                        setConfirmModeChange,
                        v
                      )
                    }
                  />
                </SettingsRow>
              </div>

              <Divider />

              {/* Paths */}
              <SectionHeader title="Paths" />
              <div className="flex flex-col gap-2 mb-5">
                <label
                  className="text-[13px]"
                  style={{ color: "var(--text-primary)" }}
                >
                  Default Workspace Directory
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={defaultPath || "System Default (Home)"}
                    className="font-mono text-[13px] bg-[var(--bg-color)] text-[var(--text-secondary)] border-[var(--border-color)]"
                  />
                  <Button
                    variant="outline"
                    onClick={handleSetPath}
                    className="shrink-0 h-[38px] px-4 bg-[var(--surface-color)] border-[var(--border-color)] hover:bg-[var(--border-color)] text-[var(--text-primary)]"
                  >
                    <FolderOpen size={16} className="mr-2 opacity-70" />
                    Browse
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* ── FOCUS TAB ── */}
            <TabsContent
              value="focus"
              className="m-0 space-y-0 animate-in fade-in-0 duration-300"
            >
              <SectionHeader title="Zen Mode Preferences" onReset={resetFocus} />
              <div className="space-y-1">
                <SettingsRow
                  label="Persist Zen Mode"
                  description="Keep Zen Mode active across app restarts."
                  htmlFor="zen-persist-toggle"
                >
                  <Switch
                    id="zen-persist-toggle"
                    checked={focus.isZenMode}
                    onCheckedChange={(v) => setFocusSetting("isZenMode", v)}
                  />
                </SettingsRow>
                <SettingsRow
                  label="Show Tabs in Zen Mode"
                  description="Keep the workspace tab bar visible even in Zen Mode."
                  htmlFor="zen-tabs-toggle"
                >
                  <Switch
                    id="zen-tabs-toggle"
                    checked={focus.showTabs}
                    onCheckedChange={(v) => setFocusSetting("showTabs", v)}
                  />
                </SettingsRow>
                <SettingsRow
                  label="Show Status Bar in Zen Mode"
                  description="Keep the bottom status/theme bar visible even in Zen Mode."
                  htmlFor="zen-status-toggle"
                >
                  <Switch
                    id="zen-status-toggle"
                    checked={focus.showStatusBar}
                    onCheckedChange={(v) => setFocusSetting("showStatusBar", v)}
                  />
                </SettingsRow>
              </div>
            </TabsContent>

            {/* ── DEMO TAB ── */}
            <TabsContent
              value="demo"
              className="m-0 space-y-0 animate-in fade-in-0 duration-300"
            >
              <SectionHeader title="Demo Features" onReset={resetDemo} />
              <div className="space-y-1">
                <SettingsRow
                  label="Show Workspaces Tab"
                  description="Toggle visibility of the workspace tabs in the header."
                  htmlFor="demo-workspaces-toggle"
                >
                  <Switch
                    id="demo-workspaces-toggle"
                    checked={demo.showWorkspacesTab}
                    onCheckedChange={(v) => setDemoSetting("showWorkspacesTab", v)}
                  />
                </SettingsRow>
                <SettingsRow
                  label="Show Cortex Library Button"
                  description="Toggle visibility of the Space Templates (Rocket) button in the header."
                  htmlFor="demo-templates-toggle"
                >
                  <Switch
                    id="demo-templates-toggle"
                    checked={demo.showTemplatesButton}
                    onCheckedChange={(v) => setDemoSetting("showTemplatesButton", v)}
                  />
                </SettingsRow>
                <SettingsRow
                  label="Show Keyboard Shortcuts Button"
                  description="Toggle visibility of the Keyboard Shortcuts button in the header."
                  htmlFor="demo-shortcuts-toggle"
                >
                  <Switch
                    id="demo-shortcuts-toggle"
                    checked={demo.showShortcutsButton}
                    onCheckedChange={(v) => setDemoSetting("showShortcutsButton", v)}
                  />
                </SettingsRow>
                <SettingsRow
                  label="Show Mode Shortcut Hints"
                  description="Toggle visibility of the Kbd shortcut hints in the Mode Selector screen."
                  htmlFor="demo-mode-shortcuts-toggle"
                >
                  <Switch
                    id="demo-mode-shortcuts-toggle"
                    checked={demo.showModeShortcutHints}
                    onCheckedChange={(v) => setDemoSetting("showModeShortcutHints", v)}
                  />
                </SettingsRow>
                <SettingsRow
                  label="Show Terminal Shortcut Hints"
                  description="Toggle visibility of the Kbd shortcut hints on terminal panes (e.g. Ctrl+Alt+R)."
                  htmlFor="demo-terminal-shortcuts-toggle"
                >
                  <Switch
                    id="demo-terminal-shortcuts-toggle"
                    checked={demo.showTerminalShortcutHints}
                    onCheckedChange={(v) => setDemoSetting("showTerminalShortcutHints", v)}
                  />
                </SettingsRow>
                <SettingsRow
                  label="Enable Browser Refresh"
                  description="Allow Ctrl+R to reload the application. Keep enabled for development."
                  htmlFor="demo-browser-refresh-toggle"
                >
                  <Switch
                    id="demo-browser-refresh-toggle"
                    checked={demo.enableBrowserRefresh}
                    onCheckedChange={(v) => setDemoSetting("enableBrowserRefresh", v)}
                  />
                </SettingsRow>
              </div>
            </TabsContent>

            {/* ── SHORTCUTS TAB ── */}
            <TabsContent
              value="shortcuts"
              className="m-0 space-y-0 animate-in fade-in-0 duration-300"
            >
              <SectionHeader title="Global Hotkeys" onReset={handleResetShortcuts} />
              <div className="space-y-1">
                <SettingsRow
                  label="Toggle Zen Mode"
                  description="Quickly switch between normal and focus view."
                >
                  <Input
                    value={shortcuts.toggleZenMode}
                    onChange={(e) => handleShortcutChange('toggleZenMode', e.target.value)}
                    className="w-[160px] h-8 text-[12px] font-mono bg-[var(--bg-color)] border-[var(--border-color)] text-right"
                  />
                </SettingsRow>
                <SettingsRow
                  label="New Workspace Flow"
                  description="Open the workspace configuration screen."
                >
                  <Input
                    value={shortcuts.newWorkspace}
                    onChange={(e) => handleShortcutChange('newWorkspace', e.target.value)}
                    className="w-[160px] h-8 text-[12px] font-mono bg-[var(--bg-color)] border-[var(--border-color)] text-right"
                  />
                </SettingsRow>
                <SettingsRow
                  label="Close Active Workspace"
                  description="Instantly terminate the current session."
                >
                  <Input
                    value={shortcuts.closeWorkspace}
                    onChange={(e) => handleShortcutChange('closeWorkspace', e.target.value)}
                    className="w-[160px] h-8 text-[12px] font-mono bg-[var(--bg-color)] border-[var(--border-color)] text-right"
                  />
                </SettingsRow>
                <SettingsRow
                  label="Cycle Next Workspace"
                >
                  <Input
                    value={shortcuts.cycleNextWorkspace}
                    onChange={(e) => handleShortcutChange('cycleNextWorkspace', e.target.value)}
                    className="w-[160px] h-8 text-[12px] font-mono bg-[var(--bg-color)] border-[var(--border-color)] text-right"
                  />
                </SettingsRow>
                <SettingsRow
                  label="Cycle Prev Workspace"
                >
                  <Input
                    value={shortcuts.cyclePrevWorkspace}
                    onChange={(e) => handleShortcutChange('cyclePrevWorkspace', e.target.value)}
                    className="w-[160px] h-8 text-[12px] font-mono bg-[var(--bg-color)] border-[var(--border-color)] text-right"
                  />
                </SettingsRow>
                <SettingsRow
                  label="Quick Switcher"
                  description="Search and jump to any active workspace."
                >
                  <Input
                    value={shortcuts.quickSwitcher}
                    onChange={(e) => handleShortcutChange('quickSwitcher', e.target.value)}
                    className="w-[160px] h-8 text-[12px] font-mono bg-[var(--bg-color)] border-[var(--border-color)] text-right"
                  />
                </SettingsRow>
                <SettingsRow
                  label="Shortcuts Cheatsheet"
                >
                  <Input
                    value={shortcuts.openShortcuts}
                    onChange={(e) => handleShortcutChange('openShortcuts', e.target.value)}
                    className="w-[160px] h-8 text-[12px] font-mono bg-[var(--bg-color)] border-[var(--border-color)] text-right"
                  />
                </SettingsRow>
                <SettingsRow
                  label="Manage Templates"
                >
                  <Input
                    value={shortcuts.openTemplates}
                    onChange={(e) => handleShortcutChange('openTemplates', e.target.value)}
                    className="w-[160px] h-8 text-[12px] font-mono bg-[var(--bg-color)] border-[var(--border-color)] text-right"
                  />
                </SettingsRow>
                <SettingsRow
                  label="Open Preferences"
                >
                  <Input
                    value={shortcuts.openSettings}
                    onChange={(e) => handleShortcutChange('openSettings', e.target.value)}
                    className="w-[160px] h-8 text-[12px] font-mono bg-[var(--bg-color)] border-[var(--border-color)] text-right"
                  />
                </SettingsRow>
              </div>
            </TabsContent>

            {/* ── TERMINAL TAB ── */}
            <TabsContent
              value="terminal"
              className="m-0 animate-in fade-in-0 slide-in-from-bottom-1 duration-300"
            >
              {isLoaded && (
                <>
                  <SectionHeader title="Interface" />
                  <div className="space-y-1">
                    <SettingsRow
                      label="Show Floating Header"
                      description="Toggle the sleek floating action bar on terminal panes."
                      htmlFor="terminal-header-toggle"
                    >
                      <Switch
                        id="terminal-header-toggle"
                        checked={demo.showFloatingTerminalHeader}
                        onCheckedChange={(v) => setDemoSetting("showFloatingTerminalHeader", v)}
                      />
                    </SettingsRow>
                    <SettingsRow
                      label="Header Visibility"
                      description="Choose if the header should be always visible or reveal on hover."
                    >
                      <SegmentedControl<'hover' | 'always'>
                        value={demo.terminalHeaderVisibility || 'hover'}
                        onChange={(v) => setDemoSetting("terminalHeaderVisibility", v)}
                        options={[
                          { value: "hover", label: "Reveal on Hover" },
                          { value: "always", label: "Always Visible" },
                        ]}
                      />
                    </SettingsRow>
                  </div>

                  <Divider />

                  <SectionHeader title="Font" onReset={resetTerminal} />
                  <div className="space-y-1">
                    <SettingsRow
                      label="Font Family"
                      description="Must be a monospace font for correct character alignment."
                      htmlFor="font-family-select"
                    >
                      <Select
                        value={(() => {
                          if (fontFamilies.some((f) => f.value === ts.fontFamily)) return ts.fontFamily;
                          const cleaned = ts.fontFamily.replace(/", monospace$/, '').replace(/^"/, '');
                          if (fontFamilies.some((f) => f.value === cleaned)) return cleaned;
                          return "JetBrains Mono";
                        })()}
                        onValueChange={(v) => updateSetting("fontFamily", v)}
                      >
                        <SelectTrigger
                          id="font-family-select"
                          className="w-[180px] text-[12px] border-[var(--border-color)] bg-[var(--surface-color)] font-mono"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent position="popper">
                          {fontFamilies.map((f) => (
                            <SelectItem
                              key={f.value}
                              value={f.value}
                              className="font-mono text-[12px]"
                            >
                              {f.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </SettingsRow>

                    <SettingsRow
                      label="Font Size"
                      description="Terminal character size in pixels (10–32px)."
                      htmlFor="font-size-slider"
                    >
                      <div className="flex items-center gap-3 w-[180px]">
                        <Slider
                          id="font-size-slider"
                          min={10}
                          max={32}
                          step={1}
                          value={[ts.fontSize]}
                          onValueChange={([v]) => updateSettingLive("fontSize", v)}
                          onValueCommit={([v]) => commitSettings({ fontSize: v })}
                          className="flex-1"
                        />
                        <span
                          className="text-[12px] font-mono w-[32px] text-right"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          {ts.fontSize}px
                        </span>
                      </div>
                    </SettingsRow>

                    <SettingsRow
                      label="Line Height"
                      description="Vertical spacing between terminal lines (1.0–2.0)."
                      htmlFor="line-height-slider"
                    >
                      <div className="flex items-center gap-3 w-[180px]">
                        <Slider
                          id="line-height-slider"
                          min={1.0}
                          max={2.0}
                          step={0.1}
                          value={[ts.lineHeight]}
                          onValueChange={([v]) =>
                            updateSettingLive("lineHeight", Math.round(v * 10) / 10)
                          }
                          onValueCommit={([v]) =>
                            commitSettings({ lineHeight: Math.round(v * 10) / 10 })
                          }
                          className="flex-1"
                        />
                        <span
                          className="text-[12px] font-mono w-[32px] text-right"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          {ts.lineHeight.toFixed(1)}
                        </span>
                      </div>
                    </SettingsRow>

                    <SettingsRow
                      label="Letter Spacing"
                      description="Extra spacing between characters (0–5px)."
                      htmlFor="letter-spacing-slider"
                    >
                      <div className="flex items-center gap-3 w-[180px]">
                        <Slider
                          id="letter-spacing-slider"
                          min={0}
                          max={5}
                          step={0.5}
                          value={[ts.letterSpacing]}
                          onValueChange={([v]) =>
                            updateSettingLive("letterSpacing", v)
                          }
                          onValueCommit={([v]) =>
                            commitSettings({ letterSpacing: v })
                          }
                          className="flex-1"
                        />
                        <span
                          className="text-[12px] font-mono w-[32px] text-right"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          {ts.letterSpacing}px
                        </span>
                      </div>
                    </SettingsRow>
                  </div>

                  <Divider />

                  <SectionHeader title="Cursor" />
                  <div className="space-y-1">
                    <SettingsRow
                      label="Cursor Style"
                      description="Shape of the terminal cursor."
                    >
                      <SegmentedControl
                        value={ts.cursorStyle}
                        onChange={(v) => updateSetting("cursorStyle", v)}
                        options={[
                          { value: "block", label: "Block" },
                          { value: "underline", label: "Under" },
                          { value: "bar", label: "Bar" },
                        ]}
                      />
                    </SettingsRow>
                    <SettingsRow
                      label="Cursor Blink"
                      description="Animate the cursor with a blinking effect."
                      htmlFor="cursor-blink-toggle"
                    >
                      <Switch
                        id="cursor-blink-toggle"
                        checked={ts.cursorBlink}
                        onCheckedChange={(v) => updateSetting("cursorBlink", v)}
                      />
                    </SettingsRow>
                  </div>

                  <Divider />

                  <SectionHeader title="Session" />
                  <div className="space-y-1">
                    <SettingsRow
                      label="Scrollback Lines"
                      description="Lines of terminal history retained per session (100–10,000). Takes effect on new sessions."
                      htmlFor="scrollback-input"
                    >
                      <Input
                        id="scrollback-input"
                        type="number"
                        min={100}
                        max={10000}
                        step={100}
                        value={ts.scrollbackLines}
                        onChange={(e) => {
                          const v = Math.min(
                            10000,
                            Math.max(100, parseInt(e.target.value) || 100)
                          );
                          updateSetting("scrollbackLines", v);
                        }}
                        className="w-[110px] text-[12px] font-mono text-right bg-[var(--bg-color)] border-[var(--border-color)]"
                      />
                    </SettingsRow>
                  </div>

                  {/* No live preview — remove visual noise */}
                </>
              )}
            </TabsContent>

            {/* ── THEMES TAB ── */}
            <TabsContent value="themes" className="m-0 space-y-6">
              <div className="flex items-center justify-between">
                <SectionHeader title="Select Theme" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsImporting(!isImporting)}
                  className="h-7 text-[10px] gap-1.5 bg-[var(--text-primary)]/5 hover:bg-[var(--text-primary)]/10"
                >
                  <Plus size={10} />
                  Import JSON
                </Button>
              </div>

              {isImporting && (
                <Card className="border-[var(--border-color)] bg-[var(--text-primary)]/5 animate-in fade-in slide-in-from-top-2 duration-300">
                  <CardContent className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Code size={14} className="text-[var(--accent-primary)]" />
                        <span className="text-[12px] font-bold">Theme JSON Payload</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-[var(--text-secondary)] font-bold">Live Preview</span>
                          <Switch
                            checked={isPreviewing}
                            onCheckedChange={setIsPreviewing}
                            className="scale-75 origin-right"
                          />
                        </div>
                        <Badge variant="outline" className="text-[9px] border-[var(--border-color)] text-[var(--text-secondary)] font-bold">Standard Schema</Badge>
                      </div>
                    </div>
                    <Textarea
                      placeholder='{ "id": "my-theme", "name": "My Theme", "dark": { "bg": "#...", ... }, "light": { ... } }'
                      value={jsonInput}
                      onChange={(e) => setJsonInput(e.target.value)}
                      className="min-h-[120px] font-mono text-[11px] bg-[var(--bg-color)]/40 border-[var(--text-primary)]/5 focus-visible:ring-1 focus-visible:ring-[var(--accent-primary)] text-[var(--text-primary)]"
                    />
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => { setIsImporting(false); setIsPreviewing(false); cancelPreview(); }} className="text-[11px] text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Cancel</Button>
                      <Button
                        size="sm"
                        onClick={handleImportTheme}
                        className="bg-[var(--accent-primary)] text-[var(--accent-contrast)] text-[11px] gap-1.5"
                      >
                        <Check size={12} />
                        Add to Library
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in-0 slide-in-from-bottom-1 duration-300 pb-2">
                {allThemes.map((t) => {
                  const isActive = theme === t.id;
                  return (
                    <Card
                      key={t.id}
                      onClick={() => setTheme(t.id)}
                      className={`group cursor-pointer transition-all hover:bg-[var(--text-primary)]/5 text-left overflow-hidden ${
                        isActive
                          ? "border-[var(--accent-primary)] bg-[var(--text-primary)]/5 shadow-[0_0_20px_rgba(var(--accent-primary-rgb),0.05)]"
                          : "border-[var(--border-color)] bg-transparent"
                      }`}
                      style={{ padding: 0, gap: 0 }}
                    >
                      <CardContent
                        className="flex flex-col h-full relative"
                        style={{ padding: "1.25rem", gap: 0 }}
                      >
                        <div className="flex items-center w-full mb-4 justify-between">
                          <div className="flex -space-x-2 shrink-0">
                            {(() => {
                              const previewPalette = resolvedScheme === 'light'
                                ? (t.light || {
                                    bg: "#FAFAFA",
                                    surface: "#FFFFFF",
                                    accent: t.dark.accent
                                  })
                                : t.dark;
                              return (
                                <>
                                  <div
                                    className="w-6 h-6 rounded-full border-2 border-[var(--surface-color)] shadow-sm"
                                    style={{ backgroundColor: previewPalette.bg || "transparent", zIndex: 3 }}
                                  />
                                  <div
                                    className="w-6 h-6 rounded-full border-2 border-[var(--surface-color)] shadow-sm"
                                    style={{ backgroundColor: previewPalette.surface || "transparent", zIndex: 2 }}
                                  />
                                  <div
                                    className="w-6 h-6 rounded-full border-2 border-[var(--surface-color)] shadow-sm"
                                    style={{ backgroundColor: previewPalette.accent || "transparent", zIndex: 1 }}
                                  />
                                </>
                              );
                            })()}
                          </div>
                          <div className="flex items-center gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopyJson(t);
                                  }}
                                  className="w-6 h-6 rounded-md opacity-0 group-hover:opacity-100 text-[var(--text-secondary)]/40 hover:text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 transition-all"
                                >
                                  <Code size={12} />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="bottom" sideOffset={4} className="text-xs bg-[var(--surface-color)] border-[var(--border-color)] text-[var(--text-primary)]">
                                Copy JSON to clipboard
                              </TooltipContent>
                            </Tooltip>
                            {t.isCustom && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeCustomTheme(t.id);
                                }}
                                className="w-6 h-6 rounded-md opacity-0 group-hover:opacity-100 text-[var(--text-secondary)]/40 hover:text-ansi-red hover:bg-ansi-red/10 transition-all"
                              >
                                <Trash2 size={12} />
                              </Button>
                            )}
                            {isActive && (
                              <Badge
                                variant="default"
                                className="bg-[var(--accent-primary)] text-[var(--accent-contrast)] hover:bg-[var(--accent-primary)]/90 text-[9px] px-1.5 h-5 ml-1"
                              >
                                Active
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col text-left mt-auto">
                          <span
                            className="text-[13px] font-bold tracking-tight"
                            style={{
                              color: isActive
                                ? "var(--accent-primary)"
                                : "var(--text-primary)",
                            }}
                          >
                            {t.name}
                          </span>
                          <span className="text-[11px] text-[var(--text-secondary)] mt-1.5 leading-relaxed line-clamp-1">
                            {t.isCustom ? "User-imported theme" : "Core Cortex preset"}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            {/* ── ABOUT TAB ── */}
            <TabsContent
              value="about"
              className="m-0 h-full flex flex-col"
            >
              <div className="flex flex-col items-center justify-center flex-1 py-4 text-center space-y-5 animate-in fade-in-0 slide-in-from-bottom-1 duration-300">
                <div className="w-16 h-16 rounded-2xl bg-[var(--border-color)]/40 flex items-center justify-center shadow-inner border border-[var(--border-color)] p-2.5">
                  <img
                    src="/cortex-logo (2).png"
                    alt="Cortex Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">
                    Cortex Space
                  </h2>
                  <p className="text-sm text-[var(--text-secondary)] mt-1 font-mono">
                    v0.1.0-alpha
                  </p>
                </div>
                <p className="text-[13px] text-[var(--text-secondary)] max-w-[280px] text-center leading-relaxed">
                  A highly optimized, modular workspace orchestrator. Designed
                  for maximum throughput and rich aesthetics.
                </p>
                <div className="pt-4 flex gap-3">
                  <Button variant="outline" className="h-8 text-[11px] px-4">
                    View Documentation
                  </Button>
                  <Button variant="outline" className="h-8 text-[11px] px-4">
                    Check for Updates
                  </Button>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>

      </DialogContent>
    </Dialog>
  );
}

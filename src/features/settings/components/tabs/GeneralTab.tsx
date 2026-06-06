import { 
  SectionHeader, 
  SettingsRow, 
  Divider, 
  SegmentedControl 
} from "../ui/SettingsUI";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FolderOpen } from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { ColorScheme, OpenOnLaunch } from "@/lib/store";

interface GeneralTabProps {
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => void;
  uiFontScale: number;
  setUiFontScale: (scale: number) => void;
  zenPadding: number;
  setZenPadding: (padding: number) => void;
  reducedMotion: boolean;
  setReducedMotion: (reduced: boolean) => void;
  onResetAppearance: () => void;
  showSplash: boolean;
  setShowSplash: (v: boolean) => void;
  rememberMode: boolean;
  setRememberMode: (v: boolean) => void;
  openOnLaunch: OpenOnLaunch;
  setOpenOnLaunch: (v: OpenOnLaunch) => void;
  checkUpdates: boolean;
  setCheckUpdates: (v: boolean) => void;
  confirmModeChange: boolean;
  setConfirmModeChange: (v: boolean) => void;
  defaultShell: string;
  setDefaultShell: (v: string) => void;
  defaultPath: string;
  onSetPath: () => void;
  onResetStartup: () => void;
}

export function GeneralTab({
  colorScheme,
  setColorScheme,
  uiFontScale,
  setUiFontScale,
  zenPadding,
  setZenPadding,
  reducedMotion,
  setReducedMotion,
  onResetAppearance,
  showSplash,
  setShowSplash,
  rememberMode,
  setRememberMode,
  openOnLaunch,
  setOpenOnLaunch,
  checkUpdates,
  setCheckUpdates,
  confirmModeChange,
  setConfirmModeChange,
  defaultShell,
  setDefaultShell,
  defaultPath,
  onSetPath,
  onResetStartup,
}: GeneralTabProps) {
  return (
    <div className="space-y-0 animate-in fade-in-0 duration-300">
      {/* Appearance */}
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
      <SectionHeader title="Startup" onReset={onResetStartup} />
      <div className="space-y-1">
        <SettingsRow
          label="Show Splash Animation"
          description="Display the intro animation on every app launch."
          htmlFor="splash-toggle"
        >
          <Switch
            id="splash-toggle"
            checked={showSplash}
            onCheckedChange={setShowSplash}
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
            onCheckedChange={setRememberMode}
          />
        </SettingsRow>
        <SettingsRow
          label="Open on Launch"
          description="What screen to open after the splash. Ignored when Remember Last Mode is on."
          htmlFor="open-on-launch"
        >
          <Select
            value={openOnLaunch}
            onValueChange={(v) => setOpenOnLaunch(v as OpenOnLaunch)}
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
            onChange={(e) => setDefaultShell(e.target.value)}
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
            onCheckedChange={setCheckUpdates}
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
            onCheckedChange={setConfirmModeChange}
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
            onClick={onSetPath}
            className="shrink-0 h-[38px] px-4 bg-[var(--surface-color)] border-[var(--border-color)] hover:bg-[var(--border-color)] text-[var(--text-primary)]"
          >
            <FolderOpen size={16} className="mr-2 opacity-70" />
            Browse
          </Button>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { 
  SettingsCard, 
  SettingsRow, 
  SegmentedControl 
} from "../shared/SettingsUI";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  FolderOpen, 
  Palette, 
  Rocket, 
  Target, 
  Monitor
} from "@/components/ui/icons";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { ColorScheme, StartupBehavior, FocusSettings } from "@/lib/store";
import { motion, Variants } from "framer-motion";
import { ConfirmActionDialog } from "@/components/dialogs/ConfirmActionDialog";
import { invoke } from "@tauri-apps/api/core";

interface GeneralTabProps {
  // Appearance
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => void;
  uiFontScale: number;
  setUiFontScale: (scale: number) => void;
  zenPadding: number;
  setZenPadding: (padding: number) => void;
  reducedMotion: boolean;
  setReducedMotion: (reduced: boolean) => void;
  onResetAppearance: () => void;
  
  // Startup
  showSplash: boolean;
  setShowSplash: (v: boolean) => void;
  startupBehavior: StartupBehavior;
  setStartupBehavior: (v: StartupBehavior) => void;
  checkUpdates: boolean;
  setCheckUpdates: (v: boolean) => void;
  confirmModeChange: boolean;
  setConfirmModeChange: (v: boolean) => void;
  onResetStartup: () => void;

  // Focus (Merged)
  focusSettings: FocusSettings;
  setFocusSetting: <K extends keyof FocusSettings>(key: K, value: FocusSettings[K]) => Promise<void>;
  onResetFocus: () => Promise<void>;

  // Environment
  defaultShell: string;
  setDefaultShell: (v: string) => void;
  defaultPath: string;
  onSetPath: () => void;
  onFactoryReset: () => Promise<void>;
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
  startupBehavior,
  setStartupBehavior,
  checkUpdates,
  setCheckUpdates,
  confirmModeChange,
  setConfirmModeChange,
  onResetStartup,
  focusSettings,
  setFocusSetting,
  onResetFocus,
  defaultShell,
  setDefaultShell,
  defaultPath,
  onSetPath,
  onFactoryReset,
}: GeneralTabProps) {
  const [isAppearanceResetOpen, setIsAppearanceResetOpen] = useState(false);
  const [isStartupResetOpen, setIsStartupResetOpen] = useState(false);
  const [isFocusResetOpen, setIsFocusResetOpen] = useState(false);
  const [isFactoryResetOpen, setIsFactoryResetOpen] = useState(false);
  const [systemShell, setSystemShell] = useState<string>("detecting...");

  useEffect(() => {
    invoke<string>("get_default_shell")
      .then(setSystemShell)
      .catch(() => setSystemShell("unknown"));
  }, []);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 pb-10 pr-2"
    >
      <ConfirmActionDialog
        open={isAppearanceResetOpen}
        onOpenChange={setIsAppearanceResetOpen}
        title="Reset Interface Appearance"
        description="This will reset your UI scale, padding, and motion preferences back to their factory defaults. Are you sure?"
        confirmLabel="Reset Appearance"
        variant="destructive"
        onConfirm={onResetAppearance}
      />

      <ConfirmActionDialog
        open={isStartupResetOpen}
        onOpenChange={setIsStartupResetOpen}
        title="Reset Runtime & Startup"
        description="This will reset all boot sequence preferences (like splash screen and update checks) back to their factory defaults. Are you sure?"
        confirmLabel="Reset Startup"
        variant="destructive"
        onConfirm={onResetStartup}
      />

      <ConfirmActionDialog
        open={isFocusResetOpen}
        onOpenChange={setIsFocusResetOpen}
        title="Reset Focus Settings"
        description="This will reset all Zen Mode and layout visibility preferences. Are you sure?"
        confirmLabel="Reset Focus"
        variant="destructive"
        onConfirm={onResetFocus}
      />

      <ConfirmActionDialog
        open={isFactoryResetOpen}
        onOpenChange={setIsFactoryResetOpen}
        title="Factory Reset Application"
        description="CRITICAL: This will permanently delete ALL settings, workspaces, agents, and snippets. The application will restart in a clean state. This cannot be undone."
        confirmLabel="Perform Factory Reset"
        variant="destructive"
        onConfirm={onFactoryReset}
      />

      {/* 1. Application & Startup */}
      <motion.div variants={itemVariants}>
        <SettingsCard 
          title="Application" 
          icon={<Rocket size={16} />}
          description="Manage how the application boots and updates."
          onReset={() => setIsStartupResetOpen(true)}
        >
          <SettingsRow
            label="Startup Behavior"
            description="Choose the entry point when the application starts."
            htmlFor="startup-behavior"
          >
            <Select
              value={startupBehavior}
              onValueChange={(v) => setStartupBehavior(v as StartupBehavior)}
            >
              <SelectTrigger
                id="startup-behavior"
                className="h-8 w-[160px] text-[11px] font-bold border-[var(--border-color)]/20 bg-[var(--surface-color)]/50"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="modeSelector">Mode Selector</SelectItem>
                <SelectItem value="lastMode">Resume Last Session</SelectItem>
                <SelectItem value="newTerminal">Always Terminal</SelectItem>
                <SelectItem value="newAgents">Always AI Assisted</SelectItem>
              </SelectContent>
            </Select>
          </SettingsRow>
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
            label="Check for Updates"
            description="Automatically check for Cortex Space updates on startup."
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
            description="Warning before switching back to the selector screen."
            htmlFor="confirm-mode-change-toggle"
          >
            <Switch
              id="confirm-mode-change-toggle"
              checked={confirmModeChange}
              onCheckedChange={setConfirmModeChange}
            />
          </SettingsRow>
        </SettingsCard>
      </motion.div>

      {/* 2. Interface Appearance */}
      <motion.div variants={itemVariants}>
        <SettingsCard 
          title="Interface" 
          icon={<Palette size={16} />}
          description="Visual fidelity and scaling options."
          onReset={() => setIsAppearanceResetOpen(true)}
        >
          <SettingsRow
            label="Color Scheme"
            description="System sync or forced Light/Dark mode."
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
            label="UI Scaling"
            description="Scale all interface text and icons globally."
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
              <span className="text-[11px] font-mono w-[36px] text-right text-[var(--text-secondary)]">
                {uiFontScale}%
              </span>
            </div>
          </SettingsRow>
          <SettingsRow
            label="Reduced Motion"
            description="Simplify or disable interface animations."
            htmlFor="reduced-motion-toggle"
          >
            <Switch
              id="reduced-motion-toggle"
              checked={reducedMotion}
              onCheckedChange={setReducedMotion}
            />
          </SettingsRow>
          <SettingsRow
            label="Layout Customization Mode"
            description="Choose the interface mode when configuring custom layouts."
          >
            <SegmentedControl<"grid" | "count">
              value={(focusSettings.customLayoutMode as "grid" | "count") || "grid"}
              onChange={(v) => setFocusSetting("customLayoutMode", v)}
              options={[
                { value: "grid", label: "Grid Mode" },
                { value: "count", label: "Flex Mode" },
              ]}
            />
          </SettingsRow>
        </SettingsCard>
      </motion.div>

      {/* 3. Focus & Zen Mode */}
      <motion.div variants={itemVariants}>
        <SettingsCard 
          title="Focus Mode" 
          icon={<Target size={16} />}
          description="Customize the deep-focus experience (Zen Mode)."
          onReset={() => setIsFocusResetOpen(true)}
        >
          <SettingsRow
            label="Zen Mode Padding"
            description="Empty space around the terminal during focus."
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
              <span className="text-[11px] font-mono w-[36px] text-right text-[var(--text-secondary)]">
                {zenPadding}px
              </span>
            </div>
          </SettingsRow>
          <SettingsRow
            label="Persist Zen State"
            description="Remember if Zen Mode was active on restart."
            htmlFor="zen-persist-toggle"
          >
            <Switch
              id="zen-persist-toggle"
              checked={focusSettings.isZenMode}
              onCheckedChange={(v) => setFocusSetting("isZenMode", v)}
            />
          </SettingsRow>
          <SettingsRow
            label="Show Tabs"
            description="Keep workspace tabs visible in Zen Mode."
            htmlFor="zen-tabs-toggle"
          >
            <Switch
              id="zen-tabs-toggle"
              checked={focusSettings.showTabs}
              onCheckedChange={(v) => setFocusSetting("showTabs", v)}
            />
          </SettingsRow>
          <SettingsRow
            label="Show Status Bar"
            description="Keep the bottom status bar visible in Zen Mode."
            htmlFor="zen-status-toggle"
          >
            <Switch
              id="zen-status-toggle"
              checked={focusSettings.showStatusBar}
              onCheckedChange={(v) => setFocusSetting("showStatusBar", v)}
            />
          </SettingsRow>
          <SettingsRow
            label="Pane Headers"
            description="Display control bars on terminal panes."
            htmlFor="pane-headers-toggle"
          >
            <Switch
              id="pane-headers-toggle"
              checked={focusSettings.showPaneHeaders as boolean}
              onCheckedChange={(v) => setFocusSetting("showPaneHeaders", v)}
            />
          </SettingsRow>
        </SettingsCard>
      </motion.div>

      {/* 4. Environment & Shell */}
      <motion.div variants={itemVariants}>
        <SettingsCard 
          title="Environment" 
          icon={<Monitor size={16} />}
          description="System-level paths and shell configurations."
        >
          <SettingsRow
            label="Default Shell"
            description="Override the system's default shell executable."
            htmlFor="default-shell-input"
          >
            <div className="flex flex-col items-end gap-1.5">
              <Input
                id="default-shell-input"
                value={defaultShell}
                placeholder={`Auto (${systemShell})`}
                onChange={(e) => setDefaultShell(e.target.value)}
                className="w-[180px] h-8 text-[11px] font-mono bg-[var(--bg-color)]/50 border-[var(--border-color)]/20 text-right"
              />
              {!defaultShell && (
                <span className="text-[9px] font-mono text-[var(--text-secondary)]/60 tracking-tighter">
                  Detected: {systemShell}
                </span>
              )}
            </div>
          </SettingsRow>
          
          <div className="px-2 py-3 mt-2 border-t border-[var(--border-color)]/10">
            <label className="text-[10px] font-bold tracking-widest text-[var(--text-secondary)]/60 mb-3 block">
              Default Workspace Path
            </label>
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={defaultPath || "System Default (Home Dir)"}
                className="font-mono text-[11px] bg-[var(--bg-color)]/30 text-[var(--text-secondary)] border-[var(--border-color)]/20 flex-1 h-8"
              />
              <Button
                variant="outline"
                onClick={onSetPath}
                className="shrink-0 h-8 px-3 bg-[var(--accent-primary)]/5 border-[var(--accent-primary)]/20 hover:bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] text-[10px] font-bold tracking-wider transition-all"
              >
                <FolderOpen size={12} className="mr-1.5" />
                Browse
              </Button>
            </div>
          </div>
        </SettingsCard>
      </motion.div>
    </motion.div>
  );
}

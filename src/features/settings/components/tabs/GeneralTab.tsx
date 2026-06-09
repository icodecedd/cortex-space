import { useState } from "react";
import { 
  SettingsCard, 
  SettingsRow, 
  SegmentedControl 
} from "../shared/SettingsUI";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FolderOpen, Palette, Rocket, Database } from "@/components/ui/icons";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { ColorScheme, OpenOnLaunch } from "@/lib/store";
import { motion, Variants } from "framer-motion";
import { ConfirmActionDialog } from "@/components/dialogs/ConfirmActionDialog";

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
  const [isAppearanceResetOpen, setIsAppearanceResetOpen] = useState(false);
  const [isStartupResetOpen, setIsStartupResetOpen] = useState(false);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
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
      className="space-y-0 pb-10 pr-2"
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
        description="This will reset all boot sequence preferences (like splash screen, default shell, and update checks) back to their factory defaults. Are you sure?"
        confirmLabel="Reset Startup"
        variant="destructive"
        onConfirm={onResetStartup}
      />

      {/* Appearance */}
      <motion.div variants={itemVariants}>
        <SettingsCard 
          title="Interface Appearance" 
          icon={<Palette size={16} />}
          description="Customize the visual fidelity and scale of the interface."
          onReset={() => setIsAppearanceResetOpen(true)}
        >
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
              <span className="text-[11px] font-mono w-[36px] text-right text-[var(--text-secondary)]">
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
              <span className="text-[11px] font-mono w-[36px] text-right text-[var(--text-secondary)]">
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
        </SettingsCard>
      </motion.div>

      {/* Startup Behavior */}
      <motion.div variants={itemVariants}>
        <SettingsCard 
          title="Runtime & Startup" 
          icon={<Rocket size={16} />}
          description="Configure the application lifecycle and boot sequence."
          onReset={() => setIsStartupResetOpen(true)}
        >
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
                className="h-8 w-[160px] text-[11px] font-bold border-[var(--border-color)]/20 bg-[var(--surface-color)]/50"
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
              className="w-[160px] h-8 text-[11px] font-mono bg-[var(--bg-color)]/50 border-[var(--border-color)]/20 text-right"
            />
          </SettingsRow>
          <SettingsRow
            label="Check for Updates"
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
        </SettingsCard>
      </motion.div>

      {/* Paths */}
      <motion.div variants={itemVariants}>
        <SettingsCard 
          title="Storage & Paths" 
          icon={<Database size={16} />}
          description="Manage directory mappings and default project roots."
        >
          <div className="px-2 py-3">
            <label className="text-[11px] font-bold tracking-wider text-[var(--text-secondary)] uppercase mb-2 block">
              Default Workspace Directory
            </label>
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={defaultPath || "System Default (Home Dir)"}
                className="font-mono text-[12px] bg-[var(--bg-color)]/30 text-[var(--text-secondary)] border-[var(--border-color)]/20 flex-1 h-9"
              />
              <Button
                variant="outline"
                onClick={onSetPath}
                className="shrink-0 h-9 px-4 bg-[var(--accent-primary)]/5 border-[var(--accent-primary)]/20 hover:bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] text-[11px] font-bold uppercase tracking-wider transition-all"
              >
                <FolderOpen size={14} className="mr-2" />
                Browse
              </Button>
            </div>
          </div>
        </SettingsCard>
      </motion.div>
    </motion.div>
  );
}

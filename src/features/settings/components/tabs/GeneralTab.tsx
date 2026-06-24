import { useState, useEffect } from "react";
import { 
  SettingsCard, 
  SettingsRow 
} from "../shared/SettingsUI";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { 
  Palette, 
  Rocket, 
  Target, 
  AlertTriangle
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
import { Label } from "@/components/ui/label";

function DashboardMockup({ theme }: { theme: "light" | "dark" }) {
  const isLight = theme === "light";
  return (
    <div 
      className={`w-full h-full flex flex-col select-none font-sans transition-colors duration-300 ${
        isLight ? "bg-white text-zinc-800" : "bg-[#18181b] text-zinc-200"
      }`}
    >
      {/* Top window controls */}
      <div 
        className={`h-5 px-2.5 flex items-center gap-1 shrink-0 transition-colors duration-300 ${
          isLight ? "bg-zinc-50 border-b border-zinc-200/50" : "bg-[#111113] border-b border-zinc-800/80"
        }`}
      >
        <div className="w-1.5 h-1.5 rounded-full bg-[#ff5f56]" />
        <div className="w-1.5 h-1.5 rounded-full bg-[#ffbd2e]" />
        <div className="w-1.5 h-1.5 rounded-full bg-[#27c93f]" />
      </div>
      
      {/* Window Body */}
      <div className="flex-1 flex min-h-0">
        {/* Sidebar */}
        <div 
          className={`w-[48px] p-2 flex flex-col gap-2 shrink-0 border-r transition-colors duration-300 ${
            isLight ? "bg-white border-zinc-100" : "bg-[#141416] border-zinc-800/50"
          }`}
        >
          {/* Logo / Profile */}
          <div className="flex items-center gap-1.5">
            <div className={`w-3.5 h-3.5 rounded-full shrink-0 transition-colors duration-300 ${
              isLight ? "bg-blue-600" : "bg-zinc-700"
            }`} />
            <div className="flex flex-col gap-[1px] flex-1">
              <div className={`h-[3px] rounded-full w-5 transition-colors duration-300 ${
                isLight ? "bg-blue-600" : "bg-zinc-700"
              }`} />
              <div className={`h-[2px] rounded-full w-3 transition-colors duration-300 ${
                isLight ? "bg-blue-600/50" : "bg-zinc-700/50"
              }`} />
            </div>
          </div>
          {/* Menu items */}
          <div className="space-y-1.5 mt-1.5">
            <div className={`h-[3px] rounded-full w-7 transition-colors duration-300 ${isLight ? "bg-zinc-200" : "bg-zinc-800"}`} />
            <div className={`h-[3px] rounded-full w-5 transition-colors duration-300 ${isLight ? "bg-zinc-100" : "bg-zinc-800/60"}`} />
            <div className={`h-[3px] rounded-full w-6 transition-colors duration-300 ${isLight ? "bg-zinc-200" : "bg-zinc-800"}`} />
            <div className={`h-[3px] rounded-full w-4 transition-colors duration-300 ${isLight ? "bg-zinc-100" : "bg-zinc-800/60"}`} />
          </div>
        </div>
        
        {/* Main Content Area */}
        <div 
          className={`flex-1 p-2.5 flex flex-col gap-1.5 transition-colors duration-300 ${
            isLight ? "bg-[#f9fafb]" : "bg-[#09090b]"
          }`}
        >
          {/* Main Content Header */}
          <div className="flex items-center justify-between">
            <div className={`text-[8px] font-extrabold tracking-tight transition-colors duration-300 ${
              isLight ? "text-zinc-800" : "text-zinc-200"
            }`}>
              Your dashboard
            </div>
            {/* Top-right pills */}
            <div className="flex gap-1 shrink-0">
              <div className={`h-3 w-5 rounded-sm transition-colors duration-300 ${
                isLight ? "bg-zinc-200/60 border border-zinc-300/30" : "bg-zinc-800/70 border border-zinc-700/30"
              }`} />
              <div className={`h-3 w-5 rounded-sm transition-colors duration-300 ${
                isLight ? "bg-zinc-800" : "bg-zinc-600"
              }`} />
            </div>
          </div>
          
          {/* Subtitle line */}
          <div className={`h-[2px] rounded-full w-12 transition-colors duration-300 ${isLight ? "bg-zinc-200" : "bg-zinc-800"}`} />
          
          {/* Main Card */}
          <div 
            className={`flex-1 rounded-md border p-1 flex flex-col justify-end gap-1 transition-colors duration-300 ${
              isLight ? "bg-white border-zinc-200/50" : "bg-[#18181b] border-zinc-800/60"
            }`}
          >
            <div className={`h-full rounded transition-colors duration-300 ${
              isLight ? "bg-gradient-to-br from-zinc-50 to-zinc-100/50" : "bg-gradient-to-br from-zinc-900 to-zinc-950/50"
            }`} />
          </div>
        </div>
      </div>
    </div>
  );
}

interface ThemeCardProps {
  value: ColorScheme;
  label: string;
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
}

function ThemeCard({ value, label, selected, disabled, onClick }: ThemeCardProps) {
  const handleClick = () => {
    if (!disabled) {
      onClick();
    }
  };

  return (
    <div 
      onClick={handleClick}
      className={`flex flex-col ${disabled ? "cursor-not-allowed" : "cursor-pointer"} group`}
    >
      {/* Window Mockup Card */}
      <div 
        className={`relative w-full h-[110px] rounded-xl overflow-hidden border-2 transition-all duration-300 ease-[var(--ease-out)] ${
          disabled
            ? "border-neutral-200/40 dark:border-zinc-800/40 bg-zinc-950/20 opacity-35"
            : selected 
              ? "border-[var(--accent-primary)] shadow-[0_0_12px_rgba(var(--accent-primary-rgb),0.2)] dark:shadow-[0_0_12px_rgba(var(--accent-primary-rgb),0.15)]" 
              : "border-neutral-200 dark:border-zinc-800 hover:border-neutral-300 dark:hover:border-zinc-700 bg-background hover:-translate-y-[2px]"
        }`}
      >
        {value === "system" ? (
          <div className="relative w-full h-full">
            {/* Base Light theme */}
            <DashboardMockup theme="light" />
            {/* Split Dark theme on the right */}
            <div className="absolute inset-y-0 left-1/2 right-0 overflow-hidden border-l border-zinc-200/80 dark:border-zinc-800/80">
              <div className="absolute inset-y-0 -left-full w-[200%]">
                <DashboardMockup theme="dark" />
              </div>
            </div>
          </div>
        ) : (
          <DashboardMockup theme={value} />
        )}
      </div>
      
      {/* Radio Label */}
      <div className="flex items-center gap-2 mt-2.5 px-1 min-w-0">
        <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all duration-200 shrink-0 ${
          disabled
            ? "border-neutral-200/40 dark:border-zinc-800/40 opacity-40"
            : selected 
              ? "bg-[var(--accent-primary)] border-[var(--accent-primary)] text-[var(--accent-contrast)]" 
              : "border-neutral-300 dark:border-zinc-700 bg-transparent group-hover:border-neutral-400 dark:group-hover:border-zinc-600"
        }`}>
          {selected && (
            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
        <span className={`text-[12px] font-semibold transition-colors duration-200 truncate ${
          disabled
            ? "text-[var(--text-secondary)] opacity-40"
            : selected 
              ? "text-[var(--text-primary)]" 
              : "text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]"
        }`}>
          {label}
        </span>
        {disabled && (
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-zinc-200/50 dark:bg-zinc-800/80 text-zinc-500 dark:text-zinc-400 uppercase tracking-wider shrink-0 select-none">
            Dark only
          </span>
        )}
      </div>
    </div>
  );
}

function LayoutMockup({ type }: { type: "grid" | "count" }) {
  const isGrid = type === "grid";
  return (
    <div className="w-full h-full flex flex-col select-none font-sans bg-[#18181b] text-zinc-200">
      {/* Top window controls */}
      <div className="h-5 px-2.5 flex items-center gap-1 shrink-0 bg-[#111113] border-b border-zinc-800/80">
        <div className="w-1.5 h-1.5 rounded-full bg-[#ff5f56]" />
        <div className="w-1.5 h-1.5 rounded-full bg-[#ffbd2e]" />
        <div className="w-1.5 h-1.5 rounded-full bg-[#27c93f]" />
      </div>
      
      {/* Window Body */}
      <div className="flex-1 flex min-h-0 p-2.5 bg-[#09090b]">
        {isGrid ? (
          /* Grid Mode: 2x2 symmetrical grid of panels */
          <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-1.5">
            <div className="rounded border border-dashed border-zinc-700/60 bg-zinc-900/30 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
            </div>
            <div className="rounded border border-dashed border-zinc-700/60 bg-zinc-900/30 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
            </div>
            <div className="rounded border border-dashed border-zinc-700/60 bg-zinc-900/30 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
            </div>
            <div className="rounded border border-dashed border-zinc-700/60 bg-zinc-900/30 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
            </div>
          </div>
        ) : (
          /* Flex Mode: Asymmetrical splits (1 wide left, 2 vertical stacked right) */
          <div className="flex-1 flex gap-1.5">
            {/* Left wide pane */}
            <div className="w-3/5 rounded border border-dashed border-zinc-700/60 bg-zinc-900/30 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
            </div>
            {/* Right column with two vertical splits */}
            <div className="w-2/5 flex flex-col gap-1.5">
              <div className="flex-1 rounded border border-dashed border-zinc-700/60 bg-zinc-900/30 flex items-center justify-center">
                <div className="w-1 h-1 rounded-full bg-zinc-700" />
              </div>
              <div className="flex-1 rounded border border-dashed border-zinc-700/60 bg-zinc-900/30 flex items-center justify-center">
                <div className="w-1 h-1 rounded-full bg-zinc-700" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface LayoutModeCardProps {
  value: "grid" | "count";
  label: string;
  selected: boolean;
  onClick: () => void;
}

function LayoutModeCard({ value, label, selected, onClick }: LayoutModeCardProps) {
  return (
    <div 
      onClick={onClick}
      className="flex flex-col cursor-pointer group"
    >
      {/* Window Mockup Card */}
      <div 
        className={`relative w-full h-[110px] rounded-xl overflow-hidden border-2 hover:-translate-y-[2px] transition-all duration-300 ease-[var(--ease-out)] ${
          selected 
            ? "border-[var(--accent-primary)] shadow-[0_0_12px_rgba(var(--accent-primary-rgb),0.2)] dark:shadow-[0_0_12px_rgba(var(--accent-primary-rgb),0.15)]" 
            : "border-neutral-200 dark:border-zinc-800 hover:border-neutral-300 dark:hover:border-zinc-700 bg-background"
        }`}
      >
        <LayoutMockup type={value} />
      </div>
      
      {/* Radio Label */}
      <div className="flex items-center gap-2 mt-2.5 px-1 min-w-0">
        <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all duration-200 shrink-0 ${
          selected 
            ? "bg-[var(--accent-primary)] border-[var(--accent-primary)] text-[var(--accent-contrast)]" 
            : "border-neutral-300 dark:border-zinc-700 bg-transparent group-hover:border-neutral-400 dark:group-hover:border-zinc-600"
        }`}>
          {selected && (
            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
        <span className={`text-[12px] font-semibold transition-colors duration-200 truncate ${
          selected 
            ? "text-[var(--text-primary)]" 
            : "text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]"
        }`}>
          {label}
        </span>
      </div>
    </div>
  );
}

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
  shimmerPreset: string;
  setShimmerPreset: (preset: string) => void;
  shimmerDuration: number;
  setShimmerDuration: (v: number) => void;
  onResetAppearance: () => void;
  theme: string;
  setTheme: (theme: any) => void;
  allThemes: any[];
  
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
  shimmerPreset,
  setShimmerPreset,
  shimmerDuration,
  setShimmerDuration,
  onResetAppearance,
  theme,
  setTheme,
  allThemes,
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
  onFactoryReset,
}: GeneralTabProps) {
  const [isAppearanceResetOpen, setIsAppearanceResetOpen] = useState(false);
  const [isStartupResetOpen, setIsStartupResetOpen] = useState(false);
  const [isFocusResetOpen, setIsFocusResetOpen] = useState(false);
  const [isFactoryResetOpen, setIsFactoryResetOpen] = useState(false);

  const activeThemeDef = allThemes?.find((t) => t.id === theme);
  const hasLightMode = activeThemeDef ? (!!activeThemeDef.light || !!activeThemeDef.isLegacy) : true;

  // Auto-fallback from Light scheme to Dark scheme if the active theme only supports Dark mode
  useEffect(() => {
    if (!hasLightMode && colorScheme === "light") {
      setColorScheme("dark");
    }
  }, [theme, hasLightMode, colorScheme, setColorScheme]);

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
        description="This will reset all startup settings (like splash screen and update checks) back to their factory defaults. Are you sure?"
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
          description="Manage how the application starts and updates."
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
              size="sm"
            >
              <SelectTrigger
                id="startup-behavior"
                className="h-9 w-[180px] bg-white/[0.02] border-[var(--border-color)]/25 hover:border-[var(--accent-primary)]/30 focus:bg-[var(--bg-color)] focus:border-[var(--accent-primary)]/40 transition-all duration-500 rounded-lg shadow-none pr-2 pl-2.5 font-bold"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="modeSelector" className="cursor-pointer hover:bg-white/5 transition-all">Mode Selector</SelectItem>
                <SelectItem value="lastMode" className="cursor-pointer hover:bg-white/5 transition-all">Resume Last Session</SelectItem>
                <SelectItem value="newAgents" className="cursor-pointer hover:bg-white/5 transition-all">Always AI Assisted</SelectItem>
                <SelectItem value="newTerminal" className="cursor-pointer hover:bg-white/5 transition-all">Always Terminal</SelectItem>
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
          <div className="group/row flex flex-col gap-3.5 p-2 rounded-lg transition-all duration-300 hover:bg-[var(--text-primary)]/[0.03]">
            <div className="flex flex-col gap-0.5 min-w-0">
              <Label
                className="text-[13px] font-bold cursor-pointer transition-colors group-hover/row:text-[var(--text-primary)]"
                style={{ color: "var(--text-secondary)" }}
              >
                Color Scheme
              </Label>
              <span className="text-[11px] leading-relaxed font-medium" style={{ color: "var(--text-secondary)", opacity: 0.85 }}>
                System sync or forced Light/Dark mode.
              </span>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <ThemeCard
                value="system"
                label="System preference"
                selected={colorScheme === "system"}
                onClick={() => setColorScheme("system")}
              />
              <ThemeCard
                value="light"
                label="Light"
                selected={colorScheme === "light"}
                disabled={!hasLightMode}
                onClick={() => setColorScheme("light")}
              />
              <ThemeCard
                value="dark"
                label="Dark"
                selected={colorScheme === "dark"}
                onClick={() => setColorScheme("dark")}
              />
            </div>
          </div>
          <SettingsRow
            label="Interface Theme"
            description="Select your active workspace visual theme."
            htmlFor="theme-selector"
          >
            <Select
              value={theme}
              onValueChange={(v) => setTheme(v)}
              size="sm"
            >
              <SelectTrigger
                id="theme-selector"
                className="h-9 w-[180px] bg-white/[0.02] border-[var(--border-color)]/25 hover:border-[var(--accent-primary)]/30 focus:bg-[var(--bg-color)] focus:border-[var(--accent-primary)]/40 transition-all duration-500 rounded-lg shadow-none pr-2 pl-2.5 font-bold text-left"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                {allThemes.map((t) => (
                  <SelectItem
                    key={t.id}
                    value={t.id}
                    className="cursor-pointer hover:bg-white/5 transition-all font-bold"
                  >
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SettingsRow>
          <SettingsRow
            label="Shimmer Preset"
            description="Select the gradient style for the title shimmer animation."
            htmlFor="shimmer-preset-selector"
          >
            <Select
              value={shimmerPreset || "tonic"}
              onValueChange={(v) => setShimmerPreset(v)}
              size="sm"
            >
              <SelectTrigger
                id="shimmer-preset-selector"
                className="h-9 w-[180px] bg-white/[0.02] border-[var(--border-color)]/25 hover:border-[var(--accent-primary)]/30 focus:bg-[var(--bg-color)] focus:border-[var(--accent-primary)]/40 transition-all duration-500 rounded-lg shadow-none pr-2 pl-2.5 font-bold text-left"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="tonic" className="cursor-pointer hover:bg-white/5 transition-all font-bold">Tonic</SelectItem>
                <SelectItem value="sunrise" className="cursor-pointer hover:bg-white/5 transition-all font-bold">Sunrise</SelectItem>
                <SelectItem value="bubble" className="cursor-pointer hover:bg-white/5 transition-all font-bold">Bubble</SelectItem>
                <SelectItem value="sunset" className="cursor-pointer hover:bg-white/5 transition-all font-bold">Sunset</SelectItem>
                <SelectItem value="peach" className="cursor-pointer hover:bg-white/5 transition-all font-bold">Peach</SelectItem>
                <SelectItem value="mint" className="cursor-pointer hover:bg-white/5 transition-all font-bold">Mint</SelectItem>
                <SelectItem value="spring" className="cursor-pointer hover:bg-white/5 transition-all font-bold">Spring</SelectItem>
                <SelectItem value="twilight" className="cursor-pointer hover:bg-white/5 transition-all font-bold">Twilight</SelectItem>
                <SelectItem value="bay" className="cursor-pointer hover:bg-white/5 transition-all font-bold">Bay</SelectItem>
              </SelectContent>
            </Select>
          </SettingsRow>
          <SettingsRow
            label="Shimmer Speed"
            description="Adjust the duration of the shimmer sweep in seconds (0.60s - 8s)."
            htmlFor="shimmer-speed-slider"
          >
            <div className="flex items-center gap-3 w-[180px]">
              <Slider
                id="shimmer-speed-slider"
                min={0.6}
                max={8.0}
                step={0.1}
                value={[shimmerDuration || 1.45]}
                onValueChange={([v]) => setShimmerDuration(v)}
                className="flex-1"
              />
              <span className="text-[11px] w-[48px] text-right text-[var(--text-secondary)]">
                {(shimmerDuration || 1.45).toFixed(2)}s
              </span>
            </div>
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
              <span className="text-[11px] w-[36px] text-right text-[var(--text-secondary)]">
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
          <div className="group/row flex flex-col gap-3.5 p-2 rounded-lg transition-all duration-300 hover:bg-[var(--text-primary)]/[0.03]">
            <div className="flex flex-col gap-0.5 min-w-0">
              <Label
                className="text-[13px] font-bold cursor-pointer transition-colors group-hover/row:text-[var(--text-primary)]"
                style={{ color: "var(--text-secondary)" }}
              >
                Layout Customization Mode
              </Label>
              <span className="text-[11px] leading-relaxed font-medium" style={{ color: "var(--text-secondary)", opacity: 0.85 }}>
                Choose the interface mode when configuring custom layouts.
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <LayoutModeCard
                value="grid"
                label="Grid Mode"
                selected={((focusSettings.customLayoutMode as "grid" | "count") || "grid") === "grid"}
                onClick={() => setFocusSetting("customLayoutMode", "grid")}
              />
              <LayoutModeCard
                value="count"
                label="Flex Mode"
                selected={((focusSettings.customLayoutMode as "grid" | "count") || "grid") === "count"}
                onClick={() => setFocusSetting("customLayoutMode", "count")}
              />
            </div>
          </div>
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
            htmlFor="zen-padding-selector"
          >
            <Select
              value={String(zenPadding)}
              onValueChange={(v) => setZenPadding(Number(v))}
              size="sm"
            >
              <SelectTrigger
                id="zen-padding-selector"
                className="h-9 w-[180px] bg-white/[0.02] border-[var(--border-color)]/25 hover:border-[var(--accent-primary)]/30 focus:bg-[var(--bg-color)] focus:border-[var(--accent-primary)]/40 transition-all duration-500 rounded-lg shadow-none pr-2 pl-2.5 font-bold text-left"
              >
                <SelectValue placeholder="Select padding" />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="0" className="cursor-pointer hover:bg-white/5 transition-all font-bold">None (0px)</SelectItem>
                <SelectItem value="16" className="cursor-pointer hover:bg-white/5 transition-all font-bold">Compact (16px)</SelectItem>
                <SelectItem value="32" className="cursor-pointer hover:bg-white/5 transition-all font-bold">Default (32px)</SelectItem>
                <SelectItem value="64" className="cursor-pointer hover:bg-white/5 transition-all font-bold">Relaxed (64px)</SelectItem>
                <SelectItem value="96" className="cursor-pointer hover:bg-white/5 transition-all font-bold">Wide (96px)</SelectItem>
              </SelectContent>
            </Select>
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
          <SettingsRow
            label="Workspace Layout"
            description="Choose between horizontal tabs or a vertical sidebar navigation."
            htmlFor="workspace-layout-selector"
          >
            <Select
              value={focusSettings.sidebarLayout || "horizontal"}
              onValueChange={(v) => setFocusSetting("sidebarLayout", v as any)}
              size="sm"
            >
              <SelectTrigger
                id="workspace-layout-selector"
                className="h-9 w-[180px] bg-white/[0.02] border-[var(--border-color)]/25 hover:border-[var(--accent-primary)]/30 focus:bg-[var(--bg-color)] focus:border-[var(--accent-primary)]/40 transition-all duration-500 rounded-lg shadow-none pr-2 pl-2.5 font-bold text-left"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="horizontal" className="cursor-pointer hover:bg-white/5 transition-all font-bold">Horizontal Tabs</SelectItem>
                <SelectItem value="vertical" className="cursor-pointer hover:bg-white/5 transition-all font-bold">Collapsible Sidebar</SelectItem>
              </SelectContent>
            </Select>
          </SettingsRow>
          {focusSettings.sidebarLayout === "vertical" && (
            <SettingsRow
              label="Collapse Sidebar"
              description="Keep the vertical sidebar collapsed by default."
              htmlFor="sidebar-collapsed-toggle"
            >
              <Switch
                id="sidebar-collapsed-toggle"
                checked={focusSettings.sidebarCollapsed ?? false}
                onCheckedChange={(v) => setFocusSetting("sidebarCollapsed", v)}
              />
            </SettingsRow>
          )}
        </SettingsCard>
      </motion.div>



      {/* 5. Maintenance / Reset */}
      <motion.div variants={itemVariants}>
        <SettingsCard 
          title="Maintenance" 
          icon={<AlertTriangle size={16} className="text-red-500" />}
          description="System resets and configuration wipe options."
        >
          <SettingsRow
            label="Factory Reset"
            description="Completely wipe all application settings back to defaults."
            htmlFor="general-factory-reset"
          >
            <Button 
              id="general-factory-reset"
              variant="destructive" 
              size="xs" 
              onClick={() => setIsFactoryResetOpen(true)}
              className="h-7 text-[10px] font-bold tracking-wider"
            >
              Wipe Everything
            </Button>
          </SettingsRow>
        </SettingsCard>
      </motion.div>
    </motion.div>
  );
}

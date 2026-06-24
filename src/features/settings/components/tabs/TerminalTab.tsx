import { useState, useEffect } from "react";
import { 
  SettingsCard, 
  SettingsRow, 
  SegmentedControl 
} from "../shared/SettingsUI";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { TerminalSettings, DemoSettings } from "@/lib/store";
import { Layout, Type, MousePointer2, History, FolderOpen, Monitor } from "@/components/ui/icons";
import { motion, Variants } from "framer-motion";
import { Label } from "@/components/ui/label";
import { invoke } from "@tauri-apps/api/core";

function HeaderMockup({ type }: { type: "hover" | "always" }) {
  const isHover = type === "hover";
  return (
    <div className="w-full h-full flex flex-col select-none font-sans bg-[#18181b] text-zinc-200">
      {/* Top window controls */}
      <div className="h-5 px-2.5 flex items-center gap-1 shrink-0 bg-[#111113] border-b border-zinc-800/80">
        <div className="w-1.5 h-1.5 rounded-full bg-[#ff5f56]" />
        <div className="w-1.5 h-1.5 rounded-full bg-[#ffbd2e]" />
        <div className="w-1.5 h-1.5 rounded-full bg-[#27c93f]" />
      </div>
      
      {/* Window Body */}
      <div className="flex-1 flex flex-col min-h-0 bg-[#09090b] relative">
        {/* Mock Pane Header */}
        {isHover ? (
          /* Hover mode: faint dotted outline header showing it reveals on hover */
          <div className="h-[18px] border-b border-dashed border-zinc-800/60 bg-zinc-900/10 px-2 flex items-center justify-between opacity-30">
            <div className="h-1 w-8 rounded bg-zinc-700" />
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full bg-zinc-800" />
              <div className="w-2 h-2 rounded-full bg-zinc-800" />
            </div>
          </div>
        ) : (
          /* Always Mode: solid visible header bar */
          <div className="h-[18px] border-b border-zinc-800 bg-[#121214] px-2 flex items-center justify-between">
            <div className="h-1 w-8 rounded bg-zinc-400" />
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded bg-zinc-800" />
              <div className="w-2 h-2 rounded bg-zinc-800" />
            </div>
          </div>
        )}
        
        {/* Terminal Content Mock */}
        <div className="flex-1 p-2 flex flex-col gap-1.5 text-[6px]">
          <div className="flex items-center gap-1">
            <span className="text-emerald-500 font-bold">~</span>
            <div className="h-1.5 w-16 rounded bg-zinc-800" />
          </div>
          <div className="h-1.5 w-24 rounded bg-zinc-900/60" />
          <div className="h-1.5 w-20 rounded bg-zinc-900/60" />
        </div>
        
        {/* Mock cursor arrow hovering near the top right for Hover Mode */}
        {isHover && (
          <div className="absolute top-[10px] right-[16px] pointer-events-none opacity-80">
            <svg className="w-3.5 h-3.5 text-zinc-400 fill-zinc-400 stroke-zinc-900" viewBox="0 0 24 24" strokeWidth="1.5">
              <path d="M4.5 3v15.5l4.5-4.5 4 8.5 2.5-1.2-4-8.3 6.5.5L4.5 3z" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}

interface HeaderVisibilityCardProps {
  value: "hover" | "always";
  label: string;
  selected: boolean;
  onClick: () => void;
}

function HeaderVisibilityCard({ value, label, selected, onClick }: HeaderVisibilityCardProps) {
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
        <HeaderMockup type={value} />
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

interface TerminalTabProps {
  ts: TerminalSettings;
  demo: DemoSettings;
  isLoaded: boolean;
  updateSetting: (key: keyof TerminalSettings, value: any) => void;
  onResetTerminal: () => void;
  setDemoSetting: <K extends keyof DemoSettings>(key: K, value: DemoSettings[K]) => Promise<void>;
  defaultShell: string;
  setDefaultShell: (v: string) => void;
  defaultPath: string;
  onSetPath: () => void;
}

const fontFamilies = [
  { value: 'JetBrains Mono', label: 'JetBrains Mono' },
  { value: 'Fira Code', label: 'Fira Code' },
  { value: 'Cascadia Code', label: 'Cascadia Code' },
  { value: 'Courier New', label: 'Courier New' },
  { value: 'Consolas', label: 'Consolas' },
  { value: 'Menlo', label: 'Menlo' },
  { value: 'JetBrainsMono Nerd Font', label: 'JetBrainsMono NF' },
  { value: 'FiraCode Nerd Font', label: 'FiraCode NF' },
  { value: 'Hack Nerd Font', label: 'Hack NF' },
  { value: 'MesloLGS NF', label: 'MesloLGS NF' },
  { value: 'CaskaydiaCove Nerd Font', label: 'CaskaydiaCove NF' },
  { value: 'Inconsolata Nerd Font', label: 'Inconsolata NF' },
  { value: 'SauceCodePro Nerd Font', label: 'SauceCodePro NF' },
  { value: 'monospace', label: 'System Monospace' },
];

export function TerminalTab({
  ts,
  demo,
  isLoaded,
  updateSetting,
  onResetTerminal,
  setDemoSetting,
  defaultShell,
  setDefaultShell,
  defaultPath,
  onSetPath,
}: TerminalTabProps) {
  const [systemShell, setSystemShell] = useState<string>("detecting...");

  useEffect(() => {
    invoke<string>("get_default_shell")
      .then(setSystemShell)
      .catch(() => setSystemShell("unknown"));
  }, []);

  if (!isLoaded) return null;

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
      <motion.div variants={itemVariants}>
        <SettingsCard 
          title="Viewport interface" 
          icon={<Layout size={16} />}
          description="Customize the pane navigation and visibility behavior."
        >
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
          <div className="group/row flex flex-col gap-3.5 p-2 rounded-lg transition-all duration-300 hover:bg-[var(--text-primary)]/[0.03]">
            <div className="flex flex-col gap-0.5 min-w-0">
              <Label
                className="text-[13px] font-bold cursor-pointer transition-colors group-hover/row:text-[var(--text-primary)]"
                style={{ color: "var(--text-secondary)" }}
              >
                Header Visibility
              </Label>
              <span className="text-[11px] leading-relaxed font-medium" style={{ color: "var(--text-secondary)", opacity: 0.85 }}>
                Choose if the header should be always visible or reveal on hover.
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <HeaderVisibilityCard
                value="hover"
                label="Reveal on Hover"
                selected={(demo.terminalHeaderVisibility || "hover") === "hover"}
                onClick={() => setDemoSetting("terminalHeaderVisibility", "hover")}
              />
              <HeaderVisibilityCard
                value="always"
                label="Always Visible"
                selected={(demo.terminalHeaderVisibility || "hover") === "always"}
                onClick={() => setDemoSetting("terminalHeaderVisibility", "always")}
              />
            </div>
          </div>
        </SettingsCard>
      </motion.div>

      <motion.div variants={itemVariants}>
        <SettingsCard 
          title="Typography & Text" 
          icon={<Type size={16} />}
          description="Configure character rendering and spacing for terminal grids."
          onReset={onResetTerminal}
        >
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
              size="sm"
            >
              <SelectTrigger
                id="font-family-select"
                className="h-9 w-[180px] bg-white/[0.02] border-[var(--border-color)]/25 hover:border-[var(--accent-primary)]/30 focus:bg-[var(--bg-color)] focus:border-[var(--accent-primary)]/40 transition-all duration-500 rounded-lg shadow-none pr-2 pl-2.5 font-bold"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                {fontFamilies.map((f) => (
                  <SelectItem
                    key={f.value}
                    value={f.value}
                    className="cursor-pointer hover:bg-white/5 transition-all"
                  >
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SettingsRow>

          <SettingsRow
            label="Font Size"
            description="Terminal character size in pixels."
            htmlFor="font-size-select"
          >
            <Select
              value={String(ts.fontSize)}
              onValueChange={(v) => {
                const num = parseInt(v, 10);
                updateSetting("fontSize", num);
              }}
              size="sm"
            >
              <SelectTrigger
                id="font-size-select"
                className="h-9 w-[180px] bg-white/[0.02] border-[var(--border-color)]/25 hover:border-[var(--accent-primary)]/30 focus:bg-[var(--bg-color)] focus:border-[var(--accent-primary)]/40 transition-all duration-500 rounded-lg shadow-none pr-2 pl-2.5 font-bold"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                {(() => {
                  const standardSizes = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 24, 26, 28, 30, 32];
                  const fontSizes = standardSizes.includes(ts.fontSize) 
                    ? standardSizes 
                    : [...standardSizes, ts.fontSize].sort((a, b) => a - b);
                  return fontSizes.map((size) => (
                    <SelectItem key={size} value={String(size)} className="cursor-pointer hover:bg-white/5 transition-all">
                      {size}px
                    </SelectItem>
                  ));
                })()}
              </SelectContent>
            </Select>
          </SettingsRow>

          <SettingsRow
            label="Font Weight"
            description="Terminal character font thickness."
            htmlFor="font-weight-select"
          >
            <Select
              value={String(ts.fontWeight || "400")}
              onValueChange={(v) => updateSetting("fontWeight", v)}
              size="sm"
            >
              <SelectTrigger
                id="font-weight-select"
                className="h-9 w-[180px] bg-white/[0.02] border-[var(--border-color)]/25 hover:border-[var(--accent-primary)]/30 focus:bg-[var(--bg-color)] focus:border-[var(--accent-primary)]/40 transition-all duration-500 rounded-lg shadow-none pr-2 pl-2.5 font-bold"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="300" className="cursor-pointer hover:bg-white/5 transition-all">Light (300)</SelectItem>
                <SelectItem value="400" className="cursor-pointer hover:bg-white/5 transition-all">Regular (400)</SelectItem>
                <SelectItem value="500" className="cursor-pointer hover:bg-white/5 transition-all">Medium (500)</SelectItem>
                <SelectItem value="600" className="cursor-pointer hover:bg-white/5 transition-all">Semibold (600)</SelectItem>
                <SelectItem value="700" className="cursor-pointer hover:bg-white/5 transition-all">Bold (700)</SelectItem>
              </SelectContent>
            </Select>
          </SettingsRow>

          <SettingsRow
            label="Line Height"
            description="Vertical spacing between terminal lines."
            htmlFor="line-height-select"
          >
            <Select
              value={String(ts.lineHeight)}
              onValueChange={(v) => updateSetting("lineHeight", parseFloat(v))}
              size="sm"
            >
              <SelectTrigger
                id="line-height-select"
                className="h-9 w-[180px] bg-white/[0.02] border-[var(--border-color)]/25 hover:border-[var(--accent-primary)]/30 focus:bg-[var(--bg-color)] focus:border-[var(--accent-primary)]/40 transition-all duration-500 rounded-lg shadow-none pr-2 pl-2.5 font-bold"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                {(() => {
                  const standardLineHeights = [1.0, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 2.0];
                  const lineHeights = standardLineHeights.includes(ts.lineHeight) 
                    ? standardLineHeights 
                    : [...standardLineHeights, ts.lineHeight].sort((a, b) => a - b);
                  return lineHeights.map((lh) => (
                    <SelectItem key={lh} value={String(lh)} className="cursor-pointer hover:bg-white/5 transition-all">
                      {lh.toFixed(1)}
                    </SelectItem>
                  ));
                })()}
              </SelectContent>
            </Select>
          </SettingsRow>

          <SettingsRow
            label="Letter Spacing"
            description="Extra spacing between characters."
            htmlFor="letter-spacing-select"
          >
            <Select
              value={String(ts.letterSpacing)}
              onValueChange={(v) => updateSetting("letterSpacing", parseFloat(v))}
              size="sm"
            >
              <SelectTrigger
                id="letter-spacing-select"
                className="h-9 w-[180px] bg-white/[0.02] border-[var(--border-color)]/25 hover:border-[var(--accent-primary)]/30 focus:bg-[var(--bg-color)] focus:border-[var(--accent-primary)]/40 transition-all duration-500 rounded-lg shadow-none pr-2 pl-2.5 font-bold"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                {(() => {
                  const standardSpacings = [-1.0, -0.5, 0.0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0];
                  const letterSpacings = standardSpacings.includes(ts.letterSpacing) 
                    ? standardSpacings 
                    : [...standardSpacings, ts.letterSpacing].sort((a, b) => a - b);
                  return letterSpacings.map((ls) => (
                    <SelectItem key={ls} value={String(ls)} className="cursor-pointer hover:bg-white/5 transition-all">
                      {ls >= 0 ? `+${ls.toFixed(1)}` : `${ls.toFixed(1)}`}px
                    </SelectItem>
                  ));
                })()}
              </SelectContent>
            </Select>
          </SettingsRow>
        </SettingsCard>
      </motion.div>

      <motion.div variants={itemVariants}>
        <SettingsCard 
          title="Interaction Marker" 
          icon={<MousePointer2 size={16} />}
          description="Behavior and style of the focused terminal cursor."
        >
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
        </SettingsCard>
      </motion.div>

      <motion.div variants={itemVariants}>
        <SettingsCard 
          title="History Management" 
          icon={<History size={16} />}
          description="Settings for persistent session data and scrollback."
        >
          <SettingsRow
            label="Scrollback Lines"
            description="Lines of terminal history retained per session (100–10,000)."
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
              className="w-[110px] h-8 text-[11px] text-right bg-[var(--bg-color)]/50 border-[var(--border-color)]/20"
            />
          </SettingsRow>
        </SettingsCard>
      </motion.div>

      <motion.div variants={itemVariants}>
        <SettingsCard 
          title="Environment" 
          icon={<Monitor size={16} />}
          description="System-level paths and shell configurations."
        >
          <SettingsRow
            label="Default Shell"
            description="Override the system's default shell executable."
            htmlFor="default-shell-select"
          >
            <div className="flex flex-col items-end gap-2">
              <Select
                value={defaultShell === "" ? "auto" : defaultShell}
                onValueChange={(v) => {
                  if (v === "auto") {
                    setDefaultShell("");
                  } else {
                    setDefaultShell(v);
                  }
                }}
                size="sm"
              >
                <SelectTrigger
                  id="default-shell-select"
                  className="h-9 w-[180px] bg-white/[0.02] border-[var(--border-color)]/25 hover:border-[var(--accent-primary)]/30 focus:bg-[var(--bg-color)] focus:border-[var(--accent-primary)]/40 transition-all duration-500 rounded-lg shadow-none pr-2 pl-2.5 font-bold text-left font-sans"
                >
                  <SelectValue placeholder="Select shell" />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value="auto" className="cursor-pointer hover:bg-white/5 transition-all font-bold font-sans">Auto ({systemShell})</SelectItem>
                  <SelectItem value="powershell" className="cursor-pointer hover:bg-white/5 transition-all font-bold font-sans">PowerShell</SelectItem>
                  <SelectItem value="powershell.exe" className="cursor-pointer hover:bg-white/5 transition-all font-bold font-sans">Windows PowerShell</SelectItem>
                  <SelectItem value="cmd" className="cursor-pointer hover:bg-white/5 transition-all font-bold font-sans">Command Prompt</SelectItem>
                  <SelectItem value="bash" className="cursor-pointer hover:bg-white/5 transition-all font-bold font-sans">Git Bash</SelectItem>
                </SelectContent>
              </Select>
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
                className="text-[11px] bg-[var(--bg-color)]/30 text-[var(--text-secondary)] border-[var(--border-color)]/20 flex-1 h-8"
              />
              <Button
                variant="default"
                onClick={onSetPath}
                className="shrink-0 h-8 px-4 text-[10px] font-bold tracking-wider transition-all"
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

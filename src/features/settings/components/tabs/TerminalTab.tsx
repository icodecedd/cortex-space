import { 
  SettingsCard, 
  SettingsRow, 
  SegmentedControl 
} from "../shared/SettingsUI";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { TerminalSettings, DemoSettings } from "@/lib/store";
import { Layout, Type, MousePointer2, History } from "@/components/ui/icons";
import { motion, Variants } from "framer-motion";

interface TerminalTabProps {
  ts: TerminalSettings;
  demo: DemoSettings;
  isLoaded: boolean;
  updateSetting: (key: keyof TerminalSettings, value: any) => void;
  updateSettingLive: (key: keyof TerminalSettings, value: any) => void;
  commitSettings: (values: Partial<TerminalSettings>) => Promise<void>;
  onResetTerminal: () => void;
  setDemoSetting: <K extends keyof DemoSettings>(key: K, value: DemoSettings[K]) => Promise<void>;
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
  updateSettingLive,
  commitSettings,
  onResetTerminal,
  setDemoSetting,
}: TerminalTabProps) {
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
            >
              <SelectTrigger
                id="font-family-select"
                className="h-8 w-[180px] text-[11px] font-mono border-[var(--border-color)]/20 bg-[var(--surface-color)]/50"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                {fontFamilies.map((f) => (
                  <SelectItem
                    key={f.value}
                    value={f.value}
                    className="font-mono text-[11px]"
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
              <span className="text-[11px] font-mono w-[32px] text-right text-[var(--text-secondary)]">
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
              <span className="text-[11px] font-mono w-[32px] text-right text-[var(--text-secondary)]">
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
              <span className="text-[11px] font-mono w-[32px] text-right text-[var(--text-secondary)]">
                {ts.letterSpacing}px
              </span>
            </div>
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
              className="w-[110px] h-8 text-[11px] font-mono text-right bg-[var(--bg-color)]/50 border-[var(--border-color)]/20"
            />
          </SettingsRow>
        </SettingsCard>
      </motion.div>
    </motion.div>
  );
}

import * as React from "react";
import { 
  SectionHeader, 
  SettingsRow, 
  Divider, 
  SegmentedControl 
} from "../ui/SettingsUI";
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

  return (
    <div className="space-y-0 animate-in fade-in-0 slide-in-from-bottom-1 duration-300">
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

      <SectionHeader title="Font" onReset={onResetTerminal} />
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
    </div>
  );
}

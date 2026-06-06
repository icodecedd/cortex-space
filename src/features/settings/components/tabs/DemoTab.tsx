import { SectionHeader, SettingsRow } from "../shared/SettingsUI";
import { Switch } from "@/components/ui/switch";
import { DemoSettings } from "@/lib/store";

interface DemoTabProps {
  demo: DemoSettings;
  setDemoSetting: <K extends keyof DemoSettings>(key: K, value: DemoSettings[K]) => Promise<void>;
  onResetDemo: () => Promise<void>;
}

export function DemoTab({
  demo,
  setDemoSetting,
  onResetDemo,
}: DemoTabProps) {
  return (
    <div className="space-y-0 animate-in fade-in-0 duration-300">
      <SectionHeader title="Demo Features" onReset={onResetDemo} />
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
    </div>
  );
}

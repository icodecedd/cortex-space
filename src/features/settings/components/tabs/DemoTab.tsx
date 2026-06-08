import { SectionHeader, SettingsRow } from "../shared/SettingsUI";
import { Switch } from "@/components/ui/switch";
import { DemoSettings, setSetting } from "@/lib/store";
import { Button } from "@/components/ui/button";

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
          label="Test Agent Onboarding"
          description="Reset the onboarding flag and agent cache, then reload the app to simulate a new user installation."
          htmlFor="demo-agent-onboarding"
        >
          <Button 
            id="demo-agent-onboarding"
            variant="outline" 
            size="xs" 
            onClick={async () => {
              await setSetting('startup.hasOnboardedAgents', false);
              await setSetting('cortex_agents', null);
              window.location.reload();
            }}
            className="h-7 text-[10px] uppercase font-bold tracking-wider active:scale-[0.97] active:translate-y-0 duration-150"
          >
            Trigger Demo
          </Button>
        </SettingsRow>
        <SettingsRow
          label="Factory Reset Application"
          description="Completely wipe all application data, presets, snippets, templates, and workspace settings back to defaults."
          htmlFor="demo-factory-reset"
        >
          <Button 
            id="demo-factory-reset"
            variant="destructive" 
            size="xs" 
            onClick={async () => {
              const confirm = window.confirm("Are you sure you want to completely wipe all application data? This cannot be undone.");
              if (confirm) {
                const { clearAllSettings } = await import("@/lib/store");
                await clearAllSettings();
                window.location.reload();
              }
            }}
            className="h-7 text-[10px] uppercase font-bold tracking-wider active:scale-[0.97] active:translate-y-0 duration-150"
          >
            Factory Reset
          </Button>
        </SettingsRow>
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

import { SectionHeader, SettingsRow } from "../shared/SettingsUI";
import { Switch } from "@/components/ui/switch";
import { FocusSettings } from "@/lib/store";

interface FocusTabProps {
  focusSettings: FocusSettings;
  setFocusSetting: <K extends keyof FocusSettings>(key: K, value: FocusSettings[K]) => Promise<void>;
  onResetFocus: () => Promise<void>;
}

export function FocusTab({
  focusSettings,
  setFocusSetting,
  onResetFocus,
}: FocusTabProps) {
  return (
    <div className="space-y-0 animate-in fade-in-0 duration-300">
      <SectionHeader title="Zen Mode Preferences" onReset={onResetFocus} />
      <div className="space-y-1">
        <SettingsRow
          label="Persist Zen Mode"
          description="Keep Zen Mode active across app restarts."
          htmlFor="zen-persist-toggle"
        >
          <Switch
            id="zen-persist-toggle"
            checked={focusSettings.isZenMode}
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
            checked={focusSettings.showTabs}
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
            checked={focusSettings.showStatusBar}
            onCheckedChange={(v) => setFocusSetting("showStatusBar", v)}
          />
        </SettingsRow>
        <SettingsRow
          label="Show Pane Headers"
          description="Display the floating header bar on terminal panes."
          htmlFor="pane-headers-toggle"
        >
          <Switch
            id="pane-headers-toggle"
            checked={focusSettings.showPaneHeaders as boolean}
            onCheckedChange={(v) => setFocusSetting("showPaneHeaders", v)}
          />
        </SettingsRow>
      </div>
    </div>
  );
}

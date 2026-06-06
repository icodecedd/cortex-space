import { SectionHeader, SettingsRow } from "../shared/SettingsUI";
import { Input } from "@/components/ui/input";
import { ShortcutSettings } from "@/lib/store";

interface ShortcutsTabProps {
  shortcuts: ShortcutSettings;
  onShortcutChange: (key: keyof ShortcutSettings, value: string) => Promise<void>;
  onResetShortcuts: () => Promise<void>;
}

export function ShortcutsTab({
  shortcuts,
  onShortcutChange,
  onResetShortcuts,
}: ShortcutsTabProps) {
  return (
    <div className="space-y-0 animate-in fade-in-0 duration-300">
      <SectionHeader title="Global Hotkeys" onReset={onResetShortcuts} />
      <div className="space-y-1">
        <SettingsRow
          label="Toggle Zen Mode"
          description="Quickly switch between normal and focus view."
        >
          <Input
            value={shortcuts.toggleZenMode}
            onChange={(e) => onShortcutChange('toggleZenMode', e.target.value)}
            className="w-[160px] h-8 text-[12px] font-mono bg-[var(--bg-color)] border-[var(--border-color)] text-right"
          />
        </SettingsRow>
        <SettingsRow
          label="New Workspace Flow"
          description="Open the workspace configuration screen."
        >
          <Input
            value={shortcuts.newWorkspace}
            onChange={(e) => onShortcutChange('newWorkspace', e.target.value)}
            className="w-[160px] h-8 text-[12px] font-mono bg-[var(--bg-color)] border-[var(--border-color)] text-right"
          />
        </SettingsRow>
        <SettingsRow
          label="Close Active Workspace"
          description="Instantly terminate the current session."
        >
          <Input
            value={shortcuts.closeWorkspace}
            onChange={(e) => onShortcutChange('closeWorkspace', e.target.value)}
            className="w-[160px] h-8 text-[12px] font-mono bg-[var(--bg-color)] border-[var(--border-color)] text-right"
          />
        </SettingsRow>
        <SettingsRow
          label="Cycle Next Workspace"
        >
          <Input
            value={shortcuts.cycleNextWorkspace}
            onChange={(e) => onShortcutChange('cycleNextWorkspace', e.target.value)}
            className="w-[160px] h-8 text-[12px] font-mono bg-[var(--bg-color)] border-[var(--border-color)] text-right"
          />
        </SettingsRow>
        <SettingsRow
          label="Cycle Prev Workspace"
        >
          <Input
            value={shortcuts.cyclePrevWorkspace}
            onChange={(e) => onShortcutChange('cyclePrevWorkspace', e.target.value)}
            className="w-[160px] h-8 text-[12px] font-mono bg-[var(--bg-color)] border-[var(--border-color)] text-right"
          />
        </SettingsRow>
        <SettingsRow
          label="Quick Switcher"
          description="Search and jump to any active workspace."
        >
          <Input
            value={shortcuts.quickSwitcher}
            onChange={(e) => onShortcutChange('quickSwitcher', e.target.value)}
            className="w-[160px] h-8 text-[12px] font-mono bg-[var(--bg-color)] border-[var(--border-color)] text-right"
          />
        </SettingsRow>
        <SettingsRow
          label="Shortcuts Cheatsheet"
        >
          <Input
            value={shortcuts.openShortcuts}
            onChange={(e) => onShortcutChange('openShortcuts', e.target.value)}
            className="w-[160px] h-8 text-[12px] font-mono bg-[var(--bg-color)] border-[var(--border-color)] text-right"
          />
        </SettingsRow>
        <SettingsRow
          label="Manage Templates"
        >
          <Input
            value={shortcuts.openTemplates}
            onChange={(e) => onShortcutChange('openTemplates', e.target.value)}
            className="w-[160px] h-8 text-[12px] font-mono bg-[var(--bg-color)] border-[var(--border-color)] text-right"
          />
        </SettingsRow>
        <SettingsRow
          label="Open Preferences"
        >
          <Input
            value={shortcuts.openSettings}
            onChange={(e) => onShortcutChange('openSettings', e.target.value)}
            className="w-[160px] h-8 text-[12px] font-mono bg-[var(--bg-color)] border-[var(--border-color)] text-right"
          />
        </SettingsRow>
      </div>
    </div>
  );
}

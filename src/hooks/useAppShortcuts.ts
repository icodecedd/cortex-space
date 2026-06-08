import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Workspace } from "../types";
import { getSettingsGroup, SHORTCUT_DEFAULTS, ShortcutSettings } from "@/lib/store";
import { matchesShortcut } from "@/lib/shortcut-utils";

interface UseAppShortcutsProps {
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  isZenMode: boolean;
  onNewWorkspaceFlow: () => void;
  onCloseWorkspace: (id: string) => void;
  onSwitchWorkspace: (id: string) => void;
  onToggleShortcuts: () => void;
  onToggleTemplates: () => void;
  onToggleSettings: () => void;
  onToggleZenMode: () => void;
  onToggleSwitcher: () => void;
}

export function useAppShortcuts({
  workspaces,
  activeWorkspaceId,
  isZenMode,
  onNewWorkspaceFlow,
  onCloseWorkspace,
  onSwitchWorkspace,
  onToggleShortcuts,
  onToggleTemplates,
  onToggleSettings,
  onToggleZenMode,
  onToggleSwitcher
}: UseAppShortcutsProps) {
  const [shortcuts, setShortcuts] = useState<ShortcutSettings>(SHORTCUT_DEFAULTS);

  useEffect(() => {
    getSettingsGroup<ShortcutSettings>('shortcuts', SHORTCUT_DEFAULTS).then(setShortcuts);
    
    // Listen for setting changes
    const handleSettingsChange = (e: Event) => {
      const evt = e as CustomEvent<{ shortcuts?: ShortcutSettings }>;
      if (evt.detail?.shortcuts) {
        setShortcuts(evt.detail.shortcuts);
      }
    };
    window.addEventListener('cortex-settings-changed', handleSettingsChange);
    return () => window.removeEventListener('cortex-settings-changed', handleSettingsChange);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 0. Zen Mode Toggle
      if (matchesShortcut(e, shortcuts.toggleZenMode)) {
        e.preventDefault();
        onToggleZenMode();
        return;
      }

      // 0.1 Escape to Exit Zen Mode
      if (e.key === 'Escape' && isZenMode) {
        e.preventDefault();
        onToggleZenMode();
        return;
      }

      // 1. New workspace setup flow
      if (matchesShortcut(e, shortcuts.newWorkspace)) {
        e.preventDefault();
        onNewWorkspaceFlow();
        toast.info("New Workflow Initiated", { description: "Configure your new separate workspace." });
        return;
      }

      // 2. Terminate active workspace
      if (matchesShortcut(e, shortcuts.closeWorkspace)) {
        e.preventDefault();
        if (activeWorkspaceId && workspaces.length > 1) {
          onCloseWorkspace(activeWorkspaceId);
        }
        return;
      }

      // 3. Tab cycling (Next)
      if (matchesShortcut(e, shortcuts.cycleNextWorkspace)) {
        e.preventDefault();
        if (workspaces.length <= 1) return;
        const currentIndex = workspaces.findIndex(w => w.id === activeWorkspaceId);
        const nextIndex = (currentIndex + 1) % workspaces.length;
        onSwitchWorkspace(workspaces[nextIndex].id);
        return;
      }

      // 3.1 Tab cycling (Prev)
      if (matchesShortcut(e, shortcuts.cyclePrevWorkspace)) {
        e.preventDefault();
        if (workspaces.length <= 1) return;
        const currentIndex = workspaces.findIndex(w => w.id === activeWorkspaceId);
        const prevIndex = (currentIndex - 1 + workspaces.length) % workspaces.length;
        onSwitchWorkspace(workspaces[prevIndex].id);
        return;
      }

      // 4. Keyboard Shortcuts Cheatsheet
      if (matchesShortcut(e, shortcuts.openShortcuts)) {
        e.preventDefault();
        onToggleShortcuts();
        return;
      }

      // 5. Space Templates
      if (matchesShortcut(e, shortcuts.openTemplates)) {
        e.preventDefault();
        onToggleTemplates();
        return;
      }

      // 6. Settings
      if (matchesShortcut(e, shortcuts.openSettings)) {
        e.preventDefault();
        onToggleSettings();
        return;
      }

      // 7. Workspace Quick Switcher
      if (matchesShortcut(e, shortcuts.quickSwitcher)) {
        e.preventDefault();
        onToggleSwitcher();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, workspaces, activeWorkspaceId, isZenMode, onNewWorkspaceFlow, onCloseWorkspace, onSwitchWorkspace, onToggleShortcuts, onToggleTemplates, onToggleSettings, onToggleZenMode, onToggleSwitcher]);
}

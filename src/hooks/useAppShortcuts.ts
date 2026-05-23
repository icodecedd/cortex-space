import { useEffect } from "react";
import { toast } from "sonner";
import { Workspace } from "../types";

interface UseAppShortcutsProps {
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  onNewWorkspaceFlow: () => void;
  onCloseWorkspace: (id: string) => void;
  onSwitchWorkspace: (id: string) => void;
  onToggleShortcuts: () => void;
}

export function useAppShortcuts({
  workspaces,
  activeWorkspaceId,
  onNewWorkspaceFlow,
  onCloseWorkspace,
  onSwitchWorkspace,
  onToggleShortcuts,
}: UseAppShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. New workspace setup flow (Ctrl + Alt + N)
      if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        onNewWorkspaceFlow();
        toast.info("New Workflow Initiated", { description: "Configure your new separate workspace." });
      }

      // 2. Terminate active workspace (Ctrl + Shift + W)
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'w') {
        e.preventDefault();
        if (activeWorkspaceId) {
          onCloseWorkspace(activeWorkspaceId);
        }
      }

      // 3. Tab cycling (Ctrl + Tab / Ctrl + Shift + Tab)
      if (e.ctrlKey && e.key === 'Tab') {
        e.preventDefault();
        if (workspaces.length <= 1) return;
        const currentIndex = workspaces.findIndex(w => w.id === activeWorkspaceId);
        let nextIndex = 0;
        if (e.shiftKey) {
          nextIndex = (currentIndex - 1 + workspaces.length) % workspaces.length;
        } else {
          nextIndex = (currentIndex + 1) % workspaces.length;
        }
        onSwitchWorkspace(workspaces[nextIndex].id);
      }

      // 4. Keyboard Shortcuts Cheatsheet (Ctrl + /)
      if (e.ctrlKey && e.key === '/') {
        e.preventDefault();
        onToggleShortcuts();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [workspaces, activeWorkspaceId, onNewWorkspaceFlow, onCloseWorkspace, onSwitchWorkspace, onToggleShortcuts]);
}

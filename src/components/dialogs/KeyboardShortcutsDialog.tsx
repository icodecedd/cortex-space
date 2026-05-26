import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Kbd } from "@/components/ui/kbd";
import { getSettingsGroup, SHORTCUT_DEFAULTS, ShortcutSettings } from "@/lib/store";

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KeyboardShortcutsDialog({ open, onOpenChange }: KeyboardShortcutsDialogProps) {
  const [shortcuts, setShortcuts] = useState<ShortcutSettings>(SHORTCUT_DEFAULTS);

  useEffect(() => {
    if (open) {
      getSettingsGroup<ShortcutSettings>('shortcuts', SHORTCUT_DEFAULTS).then(setShortcuts);
    }
  }, [open]);

  const groups = [
    {
      title: "Workspace & Navigation",
      items: [
        { label: "Cycle Next Workspace", value: shortcuts.cycleNextWorkspace },
        { label: "Cycle Prev Workspace", value: shortcuts.cyclePrevWorkspace },
        { label: "Quick Switcher", value: shortcuts.quickSwitcher },
        { label: "New Workspace Flow", value: shortcuts.newWorkspace },
        { label: "Close Active Workspace", value: shortcuts.closeWorkspace, critical: true },
        { label: "Shortcuts Cheatsheet", value: shortcuts.openShortcuts },
      ]
    },
    {
      title: "Workspace Setup Flow",
      items: [
        { label: "Next Step / Launch", value: "Ctrl + Enter" },
        { label: "Skip Preview & Launch", value: "Ctrl + Shift + Enter" },
        { label: "Previous Step / Cancel", value: "Esc" },
      ]
    },
    {
      title: "Active Terminal Sessions",
      items: [
        { label: "Focus Pane 1 - 4", value: "Ctrl + 1..4" },
        { label: "Maximize Focused Pane", value: "Ctrl + Shift + M" },
        { label: "Execute / Relaunch Session", value: "Ctrl + Alt + R" },
      ]
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={true}
        className="bg-[var(--surface-color)] border-[var(--border-color)] shadow-2xl overflow-y-auto max-h-[90vh]"
        style={{
          padding: '2rem 1.5rem 1.5rem',
          maxWidth: '460px',
          width: 'calc(100% - 2rem)'
        }}
      >
        <DialogHeader className="gap-1 text-left sm:text-left">
          <DialogTitle className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription
            className="text-xs leading-relaxed"
            style={{ color: 'rgba(255, 255, 255, 0.6)' }}
          >
            System-wide keyboard layout controls.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5 mt-4 mb-2">
          {groups.map((group, idx) => (
            <div key={idx}>
              <h4 className="text-[10px] tracking-wider text-[var(--accent-primary)] font-bold mb-2.5 font-mono uppercase opacity-80">
                {group.title}
              </h4>
              <div className="flex flex-col gap-3 font-mono text-[12px]">
                {group.items.map((item, itemIdx) => (
                  <div 
                    key={itemIdx} 
                    className={`flex items-center justify-between ${itemIdx < group.items.length - 1 ? 'border-b border-[var(--border-color)]/20 pb-2' : ''}`}
                  >
                    <span className="text-[var(--text-secondary)]">{item.label}</span>
                    <Kbd className={item.critical ? "text-[#F85149] border-[#F85149]/20" : ""}>
                      {item.value}
                    </Kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

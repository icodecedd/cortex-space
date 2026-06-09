import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Kbd } from "@/components/ui/kbd";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Settings } from "@/components/ui/icons";
import { getSettingsGroup, SHORTCUT_DEFAULTS, ShortcutSettings } from "@/lib/store";
import { cn } from "@/lib/utils";

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCustomize?: () => void;
}

export function KeyboardShortcutsDialog({ open, onOpenChange, onCustomize }: KeyboardShortcutsDialogProps) {
  const [shortcuts, setShortcuts] = useState<ShortcutSettings>(SHORTCUT_DEFAULTS);

  useEffect(() => {
    if (open) {
      getSettingsGroup<ShortcutSettings>('shortcuts', SHORTCUT_DEFAULTS).then(setShortcuts);
    }
  }, [open]);

  const groups: { title: string, items: { label: string, value: string, critical?: boolean, static?: boolean }[] }[] = [
    {
      title: "Workspace & Navigation",
      items: [
        { label: "Quick Switcher", value: shortcuts.quickSwitcher },
        { label: "New Workspace Flow", value: shortcuts.newWorkspace },
        { label: "Cycle Next Workspace", value: shortcuts.cycleNextWorkspace },
        { label: "Cycle Prev Workspace", value: shortcuts.cyclePrevWorkspace },
        { label: "Close Active Workspace", value: shortcuts.closeWorkspace, critical: true },
        { label: "Shortcuts Cheatsheet", value: shortcuts.openShortcuts },
      ]
    },
    {
      title: "Active Terminal Sessions",
      items: [
        { label: "Split Horizontal", value: shortcuts.splitHorizontal },
        { label: "Split Vertical", value: shortcuts.splitVertical },
        { label: "Reset Pane", value: shortcuts.resetPane },
        { label: "Close Pane", value: shortcuts.closePane, critical: true },
      ]
    },
    {
      title: "System & Overlays",
      items: [
        { label: "Toggle Zen Mode", value: shortcuts.toggleZenMode },
        { label: "Manage Templates", value: shortcuts.openTemplates },
        { label: "Open Preferences", value: shortcuts.openSettings },
      ]
    },
    {
      title: "Setup Flow Hints",
      items: [
        { label: "Next Step / Launch", value: "Ctrl + Enter", static: true },
        { label: "Skip Preview & Launch", value: "Ctrl + Shift + Enter", static: true },
        { label: "Previous Step / Cancel", value: "Esc", static: true },
      ]
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={true}
        open={open}
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="bg-[var(--surface-color)] border-[var(--border-color)] shadow-2xl flex flex-col p-0 overflow-hidden"
        style={{
          maxWidth: '460px',
          width: 'calc(100% - 2rem)',
          height: '600px',
          maxHeight: '85vh'
        }}
      >
        <DialogHeader className="gap-1 text-left sm:text-left p-6 pb-2 shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
              Keyboard Shortcuts
            </DialogTitle>
            {onCustomize && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onCustomize}
                className="h-8 px-2.5 gap-2 text-[10px] font-bold text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 hover:text-[var(--accent-primary)] transition-all uppercase tracking-widest"
              >
                <Settings size={12} strokeWidth={3} /> Customize
              </Button>
            )}
          </div>
          <DialogDescription className="text-xs leading-relaxed text-[var(--text-secondary)]">
            System-wide keyboard layout controls.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-0">
          <div className="flex flex-col gap-6 px-6 py-4 pr-10 pb-8">
            {groups.map((group, idx) => (
              <div key={idx}>
                <h4 className="text-[10px] tracking-wider text-[var(--accent-primary)] font-bold mb-3 font-mono uppercase opacity-80">
                  {group.title}
                </h4>
                <div className="flex flex-col gap-3.5 font-mono text-[12px]">
                  {group.items.map((item, itemIdx) => (
                    <div 
                      key={itemIdx} 
                      className={cn(
                        "flex items-center justify-between pb-2.5",
                        itemIdx < group.items.length - 1 ? 'border-b border-[var(--border-color)]/10' : ''
                      )}
                    >
                      <span className="text-[var(--text-secondary)]/90">{item.label}</span>
                      <Kbd className={cn(
                        "min-w-[40px] flex justify-center",
                        item.critical ? "text-[#F85149] border-[#F85149]/20 bg-[#F85149]/5" : "",
                        item.static ? "bg-transparent border-none text-[var(--text-secondary)] opacity-60 italic" : ""
                      )}>
                        {item.value}
                      </Kbd>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

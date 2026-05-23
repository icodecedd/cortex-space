import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KeyboardShortcutsDialog({ open, onOpenChange }: KeyboardShortcutsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={true}
        className="bg-[var(--surface-color)] border-[var(--border-color)] shadow-2xl"
        style={{
          padding: '2rem 1.5rem 1.5rem',
          maxWidth: '440px',
          width: 'calc(100% - 2rem)'
        }}
      >
        <DialogHeader className="gap-2 text-left sm:text-left">
          <DialogTitle className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription
            className="text-sm leading-relaxed"
            style={{ color: 'rgba(255, 255, 255, 0.7)' }}
          >
            Global keyboard navigation bindings.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 font-mono text-[13px] mt-4 mb-2">
          <div className="flex items-center justify-between border-b border-[var(--border-color)]/30 pb-3">
            <span className="text-[var(--text-secondary)]">Cycle Next Tab</span>
            <kbd className="px-3 py-1 bg-[#141418] border border-[var(--border-color)] rounded-md text-[11px] text-[var(--accent-primary)] font-bold shadow-sm">Ctrl + Tab</kbd>
          </div>
          <div className="flex items-center justify-between border-b border-[var(--border-color)]/30 pb-3">
            <span className="text-[var(--text-secondary)]">Cycle Prev Tab</span>
            <kbd className="px-3 py-1 bg-[#141418] border border-[var(--border-color)] rounded-md text-[11px] text-[var(--accent-primary)] font-bold shadow-sm">Ctrl + Shift + Tab</kbd>
          </div>
          <div className="flex items-center justify-between border-b border-[var(--border-color)]/30 pb-3">
            <span className="text-[var(--text-secondary)]">New Setup Flow</span>
            <kbd className="px-3 py-1 bg-[#141418] border border-[var(--border-color)] rounded-md text-[11px] text-[var(--accent-primary)] font-bold shadow-sm">Ctrl + Alt + N</kbd>
          </div>
          <div className="flex items-center justify-between border-b border-[var(--border-color)]/30 pb-3">
            <span className="text-[var(--text-secondary)]">Close Active Workspace</span>
            <kbd className="px-3 py-1 bg-[#141418] border border-[var(--border-color)] rounded-md text-[11px] text-[#F85149] font-bold shadow-sm">Ctrl + Shift + W</kbd>
          </div>
          <div className="flex items-center justify-between pb-1">
            <span className="text-[var(--text-secondary)]">Shortcuts Guide</span>
            <kbd className="px-3 py-1 bg-[#141418] border border-[var(--border-color)] rounded-md text-[11px] text-[var(--accent-primary)] font-bold shadow-sm">Ctrl + /</kbd>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

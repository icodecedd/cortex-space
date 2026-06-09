import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ReactNode } from "react";

interface ConfirmActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string | ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  variant?: 'default' | 'destructive';
}

export function ConfirmActionDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  variant = 'default'
}: ConfirmActionDialogProps) {
  const handleConfirm = (e: React.MouseEvent) => {
    e.preventDefault();
    onConfirm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        open={open}
        onInteractOutside={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        className="bg-[var(--surface-color)] border-[var(--border-color)] shadow-2xl"
        style={{
          padding: '2rem 1.5rem 1.5rem',
          maxWidth: '400px',
          width: 'calc(100% - 2rem)',
        }}
      >
        <DialogHeader className="gap-2 text-left sm:text-left">
          <DialogTitle className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
            {title}
          </DialogTitle>
          <DialogDescription className="text-[13px] leading-relaxed text-[var(--text-secondary)]">
            {description}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.75rem',
            margin: '1.5rem -1.5rem -1.5rem -1.5rem',
            padding: '1.25rem 1.5rem',
            borderTop: '1px solid var(--border-color)/30',
            marginTop: '1rem',
            backgroundColor: 'var(--text-primary)/[0.02]'
          }}
        >
          <DialogClose asChild>
            <Button
              variant="ghost"
              className="btn-tactile hover:bg-[var(--text-primary)]/[0.05]"
              style={{
                fontSize: '0.85rem',
                fontWeight: 600,
                height: '40px',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-secondary)'
              }}
            >
              {cancelLabel}
            </Button>
          </DialogClose>
          <Button
            onClick={handleConfirm}
            className={`btn-tactile ${variant === 'destructive' ? '' : 'primary'}`}
            style={{
              fontSize: '0.85rem',
              fontWeight: 600,
              height: '40px',
              borderRadius: 'var(--radius-sm)',
              ...(variant === 'destructive' ? {
                backgroundColor: 'rgba(248, 81, 73, 0.1)',
                color: '#F85149',
                border: '1px solid rgba(248, 81, 73, 0.2)'
              } : {
                color: 'var(--accent-contrast)'
              })
            }}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

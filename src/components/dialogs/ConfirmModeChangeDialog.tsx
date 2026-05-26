import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ConfirmModeChangeDialogProps {
  step: number;
  onConfirm: () => void;
}

export function ConfirmModeChangeDialog({ step, onConfirm }: ConfirmModeChangeDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="xs"
          className="btn-tactile text-[0.65rem] py-[0.4rem] px-[0.8rem] opacity-90 flex items-center justify-center gap-2 border border-[var(--border-color)] bg-[var(--surface-color)] h-8 min-w-[120px] tracking-[0.04em] font-semibold transition-all duration-300 ease-[var(--ease-out)]"
        >
          <ChevronLeft size={14} />
          {step > 1 ? 'SWITCH MODE' : 'CHANGE OPERATION MODE'}
        </Button>
      </DialogTrigger>
      <DialogContent
        showCloseButton={true}
        open={open}
        className="bg-[var(--surface-color)] border-[var(--border-color)] shadow-2xl"
        style={{
          padding: '2rem 1.5rem 1.5rem',
          maxWidth: '400px',
          width: 'calc(100% - 2rem)'
        }}
      >
        <DialogHeader className="gap-2 text-left sm:text-left">
          <DialogTitle className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
            Confirm Mode Change
          </DialogTitle>
          <DialogDescription
            className="text-sm leading-relaxed"
            style={{ color: 'rgba(255, 255, 255, 0.7)' }}
          >
            This action will reset your current workspace progress and return you to the initial mode selection screen. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.75rem',
            margin: '1.5rem -1.5rem -1.5rem -1.5rem',
            padding: '1.25rem 1.5rem',
            borderTop: '1px solid var(--border-color)',
            background: 'rgba(255, 255, 255, 0.015)'
          }}
        >
          <DialogClose asChild>
            <Button
              variant="ghost"
              className="btn-tactile"
              style={{
                fontSize: '0.85rem',
                fontWeight: 600,
                height: '40px',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-secondary)'
              }}
            >
              Stay Here
            </Button>
          </DialogClose>
          <DialogClose asChild>
            <Button
              onClick={onConfirm}
              className="primary btn-tactile"
              style={{
                fontSize: '0.85rem',
                fontWeight: 600,
                height: '40px',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--accent-contrast)'
              }}
            >
              Confirm & Reset
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

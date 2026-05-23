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
  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="xs"
            className="btn-tactile"
            style={{
              fontSize: '0.65rem',
              padding: '0.4rem 0.8rem',
              opacity: 0.9,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              border: '1px solid var(--border-color)',
              background: 'var(--surface-color)',
              height: '32px',
              minWidth: '120px',
              justifyContent: 'center',
              letterSpacing: '0.04em',
              fontWeight: 600,
              transition: 'all 0.3s var(--ease-out)'
            }}
          />
        }
      >
        <ChevronLeft size={14} />
        {step > 1 ? 'SWITCH MODE' : 'CHANGE OPERATION MODE'}
      </DialogTrigger>
      <DialogContent
        showCloseButton={true}
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
          <DialogClose
            render={
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
              />
            }
          >
            Stay Here
          </DialogClose>
          <DialogClose
            render={
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
              />
            }
          >
            Confirm & Reset
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

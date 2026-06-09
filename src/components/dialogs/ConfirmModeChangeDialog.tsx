import { useState, useEffect } from "react";
import { ChevronLeft } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { getSetting, setSetting } from "@/lib/store";
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
  const [shouldConfirm, setShouldConfirm] = useState(true);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    (async () => {
      const val = await getSetting('startup.confirmModeChange', true);
      setShouldConfirm(val);
    })();
  }, [open]);

  const handleConfirm = async () => {
    if (dontShowAgain) {
      await setSetting('startup.confirmModeChange', false);
      setShouldConfirm(false);
    }
    onConfirm();
    setOpen(false);
  };

  const handleTriggerClick = (e: React.MouseEvent) => {
    if (!shouldConfirm) {
      // If user opted out, bypass the dialog and confirm immediately
      e.preventDefault();
      e.stopPropagation();
      onConfirm();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="xs"
          onClick={handleTriggerClick}
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
          <DialogDescription className="text-sm leading-relaxed">
            This action will reset your current workspace progress and return you to the initial mode selection screen. This cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-3 mt-4 py-2 px-1">
          <Switch 
            id="dont-show-again" 
            checked={dontShowAgain}
            onCheckedChange={setDontShowAgain}
          />
          <Label 
            htmlFor="dont-show-again"
            className="text-[13px] font-medium cursor-pointer"
            style={{ color: "var(--text-secondary)" }}
          >
            Don't show this warning again
          </Label>
        </div>

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
              className="btn-tactile"
              style={{
                fontSize: '0.85rem',
                fontWeight: 600,
                height: '40px',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-secondary)'
              }}
            >
              Cancel
            </Button>
          </DialogClose>
          <Button
            onClick={handleConfirm}
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

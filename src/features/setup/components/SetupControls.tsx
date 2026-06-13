import { ChevronLeft, ChevronRight, Play } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";

interface SetupControlsProps {
  step: number;
  isStepValid: boolean;
  onPrev: () => void;
  onNext: () => void;
  onLaunch: () => void;
  mode: 'normal' | 'agents';
}

export function SetupControls({ step, isStepValid, onPrev, onNext, onLaunch, mode }: SetupControlsProps) {
  const isLaunch = step === 3;
  
  return (
    <div className="animate-in mt-12 pt-8 border-t border-[var(--border-color)] flex justify-between items-center transition-all duration-500">
      <Button
        variant="ghost"
        onClick={onPrev}
        className={`btn-tactile ${step === 1 ? 'invisible opacity-0' : 'visible opacity-100'}`}
      >
        <ChevronLeft size={16} />
        <span>Previous</span>
      </Button>

      <div className="flex items-center gap-6">
        {!isLaunch && (
          <div className="hidden sm:flex items-center gap-2 text-[10px] text-[var(--text-secondary)] font-medium opacity-40">
            <span>Press</span>
            <Kbd className="bg-[var(--text-primary)]/5 border-[var(--border-color)] text-[10px]">Enter</Kbd>
            <span>to continue</span>
          </div>
        )}

        {isLaunch ? (
          <Button
            className="btn-tactile primary h-11 px-8 text-base shadow-2xl shadow-[var(--accent-primary)]/20"
            onClick={onLaunch}
            disabled={!isStepValid}
          >
            <Play size={18} fill="currentColor" />
            <span>Initialize Space</span>
          </Button>
        ) : (
          <Button
            onClick={onNext}
            disabled={!isStepValid && step !== 1}
            className="btn-tactile primary h-10 px-6"
          >
            <span>Next: {step === 1 ? (mode === 'agents' ? 'Assign' : 'Commands') : 'Preview'}</span>
            <ChevronRight size={16} />
          </Button>
        )}
      </div>
    </div>
  );
}

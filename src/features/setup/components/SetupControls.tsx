import { ChevronLeft, ChevronRight, Play } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";

interface SetupControlsProps {
  step: number;
  isStepValid: boolean;
  onPrev: () => void;
  onNext: () => void;
  onLaunch: () => void;
  mode: 'normal' | 'agents';
}

export function SetupControls({ step, isStepValid, onPrev, onNext, onLaunch, mode }: SetupControlsProps) {
  return (
    <div className="animate-in" style={{
      marginTop: '3rem',
      paddingTop: '2rem',
      borderTop: '1px solid var(--border-color)',
      display: 'flex',
      justifyContent: 'space-between',
      transitionDelay: '250ms'
    }}>
      <Button
        variant="ghost"
        onClick={onPrev}
        className="btn-tactile"
        style={{ visibility: step === 1 ? 'hidden' : 'visible', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
      >
        <ChevronLeft size={16} />
        PREVIOUS
      </Button>

      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        {step < 3 ? (
          <Button
            onClick={onNext}
            disabled={!isStepValid && step !== 1}
            className="btn-tactile primary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              opacity: (isStepValid || step === 1) ? 1 : 0.5,
              cursor: (isStepValid || step === 1) ? 'pointer' : 'not-allowed'
            }}
          >
            NEXT: {step === 1 ? (mode === 'agents' ? 'ASSIGN' : 'COMMANDS') : 'PREVIEW'}
            <ChevronRight size={16} />
          </Button>
        ) : (
          <Button
            className="btn-tactile primary"
            onClick={onLaunch}
            disabled={!isStepValid}
            style={{
              padding: '0.6rem 2.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              opacity: isStepValid ? 1 : 0.5,
              cursor: isStepValid ? 'pointer' : 'not-allowed'
            }}
          >
            <Play size={16} fill="currentColor" />
            INITIALIZE SPACE
          </Button>
        )}
      </div>
    </div>
  );
}

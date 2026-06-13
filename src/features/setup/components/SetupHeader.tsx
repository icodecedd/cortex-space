import { ConfirmModeChangeDialog } from "@/components/dialogs/ConfirmModeChangeDialog";
import { SETUP_CONTENT, ASSETS } from "@/lib/content";

interface SetupHeaderProps {
  step: number;
  mode: 'normal' | 'agents';
  onBack: () => void;
}

export function SetupHeader({ step, mode, onBack }: SetupHeaderProps) {
  return (
    <div
      className="animate-in flex justify-between items-center transition-all duration-500 ease-[var(--ease-out)]"
      style={{
        marginBottom: step > 1 ? '2rem' : '4rem',
      }}
    >
      <div className="flex items-center gap-6">
        <div className="relative group">
          <div className="absolute inset-0 bg-[var(--accent-primary)] blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
          <div 
            className="relative z-10 bg-[var(--accent-primary)] flex items-center justify-center overflow-hidden transition-all duration-500"
            style={{
              width: step > 1 ? '32px' : '48px',
              height: step > 1 ? '32px' : '48px',
              borderRadius: step > 1 ? '8px' : '12px',
            }}
          >
            <img
              src={ASSETS.LOGO}
              alt="Cortex"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = ASSETS.LOGO_FALLBACK;
              }}
            />
          </div>
        </div>

        <div className="flex flex-col justify-center transition-all duration-500">
          <div className="flex items-center gap-4">
            <h2 
              className="font-bold tracking-tight m-0 leading-tight transition-all duration-500"
              style={{
                fontSize: step > 1 ? '1.1rem' : '1.75rem',
              }}
            >
              {SETUP_CONTENT.TITLE}<span className="text-[var(--accent-primary)]"> {SETUP_CONTENT.SUBTITLE}</span>
            </h2>
            <span 
              className="px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 text-[var(--accent-primary)] transition-all duration-500"
            >
              {mode === 'agents' ? 'AI Assisted Mode' : 'Terminal Mode'}
            </span>
          </div>
          {step === 1 && (
            <p className="animate-in text-[10px] text-[var(--text-secondary)] font-semibold uppercase tracking-[0.2em] mt-2 opacity-60">
              {SETUP_CONTENT.WORKSPACE_SETUP}
            </p>
          )}
        </div>

        <ConfirmModeChangeDialog step={step} onConfirm={onBack} />
      </div>

      <nav className="flex items-center gap-8">
        {[1, 2, 3].map(i => (
          <div 
            key={i} 
            className={`flex items-center gap-3 transition-all duration-300 ${step === i ? 'opacity-100' : 'opacity-40'}`}
          >
            <div 
              className={`w-6 h-6 flex items-center justify-center rounded-md border text-[10px] font-bold transition-all duration-300 ${
                step === i ? 'border-[var(--accent-primary)] text-[var(--accent-primary)] shadow-[0_0_12px_rgba(var(--accent-primary-rgb),0.2)]' : 'border-[var(--border-color)] text-[var(--text-secondary)]'
              }`}
            >
              {i}
            </div>
            <span className="text-[11px] font-bold uppercase tracking-widest hidden sm:inline-block">
              {i === 1 && SETUP_CONTENT.STEPS.WORKSPACE}
              {i === 2 && (mode === 'agents' ? SETUP_CONTENT.STEPS.ASSIGN : SETUP_CONTENT.STEPS.COMMANDS)}
              {i === 3 && SETUP_CONTENT.STEPS.PREVIEW}
            </span>
          </div>
        ))}
      </nav>
    </div>
  );
}

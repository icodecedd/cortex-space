import { ConfirmModeChangeDialog } from "@/components/dialogs/ConfirmModeChangeDialog";
import { SETUP_CONTENT, ASSETS } from "@/lib/content";
import { m } from "framer-motion";

interface SetupHeaderProps {
  step: number;
  mode: 'normal' | 'agents';
  onBack: () => void;
}

export function SetupHeader({ step, mode, onBack }: SetupHeaderProps) {
  return (
    <div
      className="animate-in grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-8 items-start transition-all duration-700 ease-[var(--ease-out)]"
      style={{
        marginBottom: step > 1 ? '2rem' : '3rem',
      }}
    >
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-6">
          <div className="relative">
            <m.div
              layout
              className="relative z-10 flex items-center justify-center overflow-hidden transition-all duration-700"
              style={{
                width: step > 1 ? '32px' : '48px',
                height: step > 1 ? '32px' : '48px',
                borderRadius: step > 1 ? '10px' : '14px',
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
            </m.div>
          </div>

          <div className="flex flex-col justify-center">
            <m.h2
              layout
              className="font-bold tracking-tighter m-0 leading-none transition-all duration-700 text-[var(--text-primary)]"
              style={{
                fontSize: step > 1 ? '1.25rem' : '1.75rem',
              }}
            >
              {SETUP_CONTENT.TITLE}<span className="text-[var(--accent-primary)] brightness-110"> {SETUP_CONTENT.SUBTITLE}</span>
            </m.h2>
            {step === 1 && (
              <m.p
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 0.5, x: 0 }}
                className="text-[9px] text-[var(--text-secondary)] font-bold uppercase tracking-[0.2em] mt-2"
              >
                {SETUP_CONTENT.WORKSPACE_SETUP}
              </m.p>
            )}
          </div>
        </div>

        <m.div
          layout
          className="flex items-center gap-3"
        >
          <span
            className="px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 text-[var(--accent-primary)]"
          >
            {mode === 'agents' ? 'AI Assisted' : 'Terminal Mode'}
          </span>
          <div className="w-6 h-px bg-[var(--border-color)]" />
          <ConfirmModeChangeDialog step={step} onConfirm={onBack} />
        </m.div>
      </div>

      <nav className="flex flex-col gap-4 lg:items-end lg:pt-2">
        <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-secondary)] opacity-30 lg:text-right">
          Progression
        </p>
        <div className="flex items-center gap-3">
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className={`group flex items-center gap-3 transition-all duration-500 ${step === i ? 'opacity-100' : 'opacity-30 hover:opacity-50'}`}
            >
              <div
                className={`w-8 h-8 flex items-center justify-center rounded-xl border text-[10px] font-bold transition-all duration-500 ${
                  step === i
                    ? 'border-[var(--accent-primary)] text-[var(--accent-primary)] bg-[var(--accent-primary)]/5'
                    : 'border-[var(--border-color)] text-[var(--text-secondary)]'
                }`}
              >
                0{i}
              </div>
              {step === i && (
                <m.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-primary)] whitespace-nowrap"
                >
                  {i === 1 && SETUP_CONTENT.STEPS.WORKSPACE}
                  {i === 2 && (mode === 'agents' ? SETUP_CONTENT.STEPS.ASSIGN : SETUP_CONTENT.STEPS.COMMANDS)}
                  {i === 3 && SETUP_CONTENT.STEPS.PREVIEW}
                </m.span>
              )}
            </div>
          ))}
        </div>
      </nav>
    </div>
  );
}

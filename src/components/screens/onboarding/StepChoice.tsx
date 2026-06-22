import { m } from 'framer-motion';
import {
  Zap, Settings, ArrowRight, AlertCircle
} from '@/components/ui/icons';
import type { FlowMode } from '@/types/onboarding';

// Step 2: Configuration Choice (Starter Profiles vs Custom Setup)
export function StepChoice({
  onSelect,
  disabled,
  disabledReason,
}: {
  onSelect: (mode: FlowMode) => void;
  disabled?: boolean;
  disabledReason?: string;
}) {
  return (
    <div className="flex flex-col gap-6 w-full max-w-xl">
      <div className="flex flex-col gap-1.5 text-center">
        <span className="text-[10px] font-bold tracking-widest text-[var(--accent-primary)] uppercase">
          Onboarding Blueprint
        </span>
        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[var(--text-primary)] uppercase select-none">
          Choose Setup Strategy
        </h2>
        <p className="text-sm text-[var(--text-secondary)] max-w-[50ch] mx-auto">
          Opt for pre-engineered settings profiles for instant startup, or custom-tune every detail of your environment.
        </p>
      </div>

      <div className="w-full h-[1px] bg-[var(--border-color)] opacity-20" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Starter Profiles Option */}
        <m.div
          whileHover={disabled ? undefined : { scale: 1.01, y: -2 }}
          whileTap={disabled ? undefined : { scale: 0.99 }}
          onClick={() => {
            if (!disabled) onSelect('starter');
          }}
          className={`group rounded-xl border border-[var(--border-color)] bg-[var(--surface-color)]/30 p-6 flex flex-col justify-between transition-all duration-300 shadow-lg text-left ${
            disabled
              ? 'cursor-not-allowed opacity-45'
              : 'cursor-pointer hover:bg-[var(--surface-color)]/80 hover:border-[var(--accent-primary)]/40'
          }`}
        >
          <div className="flex flex-col gap-4">
            <div className="w-10 h-10 rounded-lg bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] flex items-center justify-center">
              <Zap size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors">
                Option A: Starter Profiles
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-1.5 leading-relaxed">
                Choose a pre-configured template (Zen, AI-First, or Power User) to immediately launch with customized settings.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--accent-primary)] mt-6 opacity-80 group-hover:opacity-100 transition-opacity">
            Select Profiles <ArrowRight size={10} />
          </div>
        </m.div>

        {/* Custom Setup Option */}
        <m.div
          whileHover={disabled ? undefined : { scale: 1.01, y: -2 }}
          whileTap={disabled ? undefined : { scale: 0.99 }}
          onClick={() => {
            if (!disabled) onSelect('custom');
          }}
          className={`group rounded-xl border border-[var(--border-color)] bg-[var(--surface-color)]/30 p-6 flex flex-col justify-between transition-all duration-300 shadow-lg text-left ${
            disabled
              ? 'cursor-not-allowed opacity-45'
              : 'cursor-pointer hover:bg-[var(--surface-color)]/80 hover:border-[var(--accent-primary)]/40'
          }`}
        >
          <div className="flex flex-col gap-4">
            <div className="w-10 h-10 rounded-lg bg-[var(--text-primary)]/5 text-[var(--text-secondary)] group-hover:text-[var(--accent-primary)] flex items-center justify-center transition-colors">
              <Settings size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors">
                Option B: Custom Setup
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-1.5 leading-relaxed">
                Manually configure shell executables, download intelligence agents, switch visual themes, and adjust typography sizing.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--accent-primary)] mt-6 opacity-80 group-hover:opacity-100 transition-opacity">
            Customize Environment <ArrowRight size={10} />
          </div>
        </m.div>
      </div>

      {disabled && disabledReason && (
        <div className="flex items-start gap-2 rounded-lg border border-[var(--ansi-red,#EF4444)]/30 bg-[var(--ansi-red,#EF4444)]/10 p-3 text-left">
          <AlertCircle size={14} className="mt-0.5 text-[var(--ansi-red,#EF4444)] shrink-0" />
          <span className="text-xs font-semibold text-[var(--ansi-red,#EF4444)]">{disabledReason}</span>
        </div>
      )}
    </div>
  );
}

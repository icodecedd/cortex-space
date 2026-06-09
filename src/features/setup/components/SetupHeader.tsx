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
      className="animate-in"
      style={{
        marginBottom: step > 1 ? '1.5rem' : '3rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        transitionDelay: '0ms'
      }}
    >
      <div style={{
        display: 'flex',
        flexDirection: step > 1 ? 'row' : 'column',
        alignItems: step > 1 ? 'center' : 'flex-start',
        gap: step > 1 ? '1.5rem' : '1.5rem'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: step > 1 ? '0.75rem' : '1rem',
          transition: 'all 0.4s ease'
        }}>
          <div style={{
            width: step > 1 ? '28px' : '44px',
            height: step > 1 ? '28px' : '44px',
            background: 'var(--accent-primary)',
            borderRadius: step > 1 ? '6px' : '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            transition: 'all 0.4s ease'
          }}>
            <img
              src={ASSETS.LOGO}
              alt="Cortex"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => {
                e.currentTarget.src = ASSETS.LOGO_FALLBACK;
              }}
            />
          </div>
          <div style={{ 
            transition: 'all 0.4s ease',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.75rem',
              height: 'fit-content'
            }}>
              <h2 style={{
                fontSize: step > 1 ? '1rem' : '1.5rem',
                margin: 0,
                letterSpacing: '0.1em',
                transition: 'all 0.4s ease',
                lineHeight: 1.2
              }}>
                {SETUP_CONTENT.TITLE}<span style={{ color: 'var(--accent-primary)' }}> {SETUP_CONTENT.SUBTITLE}</span>
              </h2>
              <span 
                className="bg-[var(--accent-primary)]/15 border border-[var(--accent-primary)]/30 text-[var(--accent-primary)]"
                style={{
                  fontSize: step > 1 ? '8px' : '9px',
                  fontWeight: 700,
                  padding: step > 1 ? '0.1rem 0.4rem' : '0.15rem 0.5rem',
                  borderRadius: '9999px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  transition: 'all 0.4s ease',
                  whiteSpace: 'nowrap'
                }}
              >
                {mode === 'agents' ? 'AI Assisted Mode' : 'Terminal Mode'}
              </span>
            </div>
            {step === 1 && (
              <p className="animate-in" style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.1em', marginTop: '0.25rem' }}>
                {SETUP_CONTENT.WORKSPACE_SETUP}
              </p>
            )}
          </div>
        </div>

        <ConfirmModeChangeDialog step={step} onConfirm={onBack} />
      </div>

      <div className="stepper-nav" style={{
        margin: 0,
        border: 'none',
        gap: step > 1 ? '1.5rem' : '2rem',
        transition: 'all 0.4s ease'
      }}>
        {[1, 2, 3].map(i => (
          <div key={i} className={`step-indicator ${step === i ? 'active' : ''}`} style={{ transition: 'all 0.3s ease' }}>
            <span style={{
              width: step > 1 ? '18px' : '20px',
              height: step > 1 ? '18px' : '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: `1px solid ${step === i ? 'var(--accent-primary)' : 'var(--border-color)'}`,
              fontSize: step > 1 ? '0.6rem' : '0.7rem',
              transition: 'all 0.4s ease'
            }}>{i}</span>
            <span style={{
              fontSize: step > 1 ? '0.65rem' : 'inherit',
              transition: 'all 0.4s ease'
            }}>
              {i === 1 && SETUP_CONTENT.STEPS.WORKSPACE}
              {i === 2 && (mode === 'agents' ? SETUP_CONTENT.STEPS.ASSIGN : SETUP_CONTENT.STEPS.COMMANDS)}
              {i === 3 && SETUP_CONTENT.STEPS.PREVIEW}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

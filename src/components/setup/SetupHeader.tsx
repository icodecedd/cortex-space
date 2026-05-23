import { ConfirmModeChangeDialog } from "@/components/dialogs/ConfirmModeChangeDialog";

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
              src="/cortex-logo (2).png"
              alt="Cortex"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => {
                e.currentTarget.src = "/tauri.svg";
              }}
            />
          </div>
          <div style={{ transition: 'all 0.4s ease' }}>
            <h2 style={{
              fontSize: step > 1 ? '1rem' : '1.5rem',
              marginBottom: step > 1 ? '0' : '0.25rem',
              letterSpacing: '0.1em',
              transition: 'all 0.4s ease'
            }}>
              CORTEX<span style={{ color: 'var(--accent-primary)' }}> SPACE</span>
            </h2>
            {step === 1 && (
              <p className="animate-in" style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.1em' }}>
                WORKSPACE SETUP
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
              {i === 1 && "WORKSPACE"}
              {i === 2 && (mode === 'agents' ? "AGENTS" : "COMMANDS")}
              {i === 3 && "PREVIEW"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

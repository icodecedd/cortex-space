import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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

        <AlertDialog>
          <AlertDialogTrigger
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
          </AlertDialogTrigger>
          <AlertDialogContent
            className="bg-[var(--surface-color)] border-[var(--border-color)] shadow-2xl"
            style={{
              padding: '1.5rem',
              maxWidth: '400px',
              width: 'calc(100% - 2rem)'
            }}
          >
            <AlertDialogHeader className="gap-2 text-left sm:text-left">
              <AlertDialogTitle className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">
                Confirm Mode Change
              </AlertDialogTitle>
              <AlertDialogDescription
                className="text-sm leading-relaxed"
                style={{ color: 'rgba(255, 255, 255, 0.7)' }}
              >
                This action will reset your current workspace progress and return you to the initial mode selection screen. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter
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
              <AlertDialogCancel
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
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={onBack}
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
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
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

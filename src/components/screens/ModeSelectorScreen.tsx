import { Terminal, Users, Cpu } from "lucide-react";
import { Mode } from "@/types";
import { setSetting } from "@/lib/store";

interface ModeSelectorScreenProps {
  onSelectMode: (mode: Mode) => void;
}

export function ModeSelectorScreen({ onSelectMode }: ModeSelectorScreenProps) {
  const handleSelectMode = async (mode: Mode) => {
    await setSetting('startup.lastMode', mode);
    onSelectMode(mode);
  };
  return (
    <div style={{
      display: 'flex',
      width: '100%',
      maxWidth: '600px',
      padding: '2rem',
      margin: '0 auto',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div className="step-container" style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: '3rem', alignItems: 'center', width: '100%' }}>
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
          <div
            className="animate-in"
            style={{
              background: 'var(--accent-primary)',
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              transitionDelay: '100ms'
            }}
          >
            <img
              src="/cortex-logo (2).png"
              alt="Cortex Logo"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => {
                e.currentTarget.src = "/tauri.svg";
              }}
            />
          </div>
          <div className="animate-in" style={{ transitionDelay: '200ms' }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', letterSpacing: '0.05em', color: 'var(--text-primary)' }}>CORTEX SPACE</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', letterSpacing: '0.05em', opacity: 0.7, maxWidth: '400px', lineHeight: '1.4' }}>
              THE COMMAND CENTER FOR YOUR AGENTS AND TERMINAL WORKFLOWS
            </p>
          </div>
          <div className="animate-in" style={{ width: '30px', height: '1px', background: 'var(--border-color)', transitionDelay: '300ms' }} />
          <p className="animate-in" style={{ color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 500, letterSpacing: '0.02em', transitionDelay: '400ms' }}>
            Select your operational workflow.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
          <div className="mode-card animate-in" onClick={() => handleSelectMode('normal')} style={{ flexDirection: 'row', padding: '1.5rem 2rem', justifyContent: 'flex-start', gap: '1.5rem', borderRadius: 'var(--radius-md)', transitionDelay: '500ms', cursor: 'pointer' }}>
            <Terminal size={32} color="var(--text-secondary)" />
            <div style={{ textAlign: 'left' }}>
              <h3 style={{ fontSize: '1.1rem', letterSpacing: '0.1em', color: 'var(--text-primary)' }}>NORMAL MODE</h3>
              <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '0.25rem', fontFamily: 'JetBrains Mono' }}>
                MANUAL CONTROL OVER MULTIPLE TERMINAL PANES
              </p>
            </div>
          </div>

          <div className="mode-card animate-in" onClick={() => handleSelectMode('agents')} style={{ flexDirection: 'row', padding: '1.5rem 2rem', justifyContent: 'flex-start', gap: '1.5rem', borderRadius: 'var(--radius-md)', borderColor: 'var(--accent-primary)', background: 'rgba(255,255,255,0.02)', transitionDelay: '600ms', cursor: 'pointer' }}>
            <div style={{ position: 'relative' }}>
              <Users size={32} color="var(--accent-primary)" />
              <Cpu size={16} color="var(--accent-primary)" style={{ position: 'absolute', bottom: -2, right: -2, background: 'var(--bg-color)', borderRadius: '50%', padding: '1px' }} />
            </div>
            <div style={{ textAlign: 'left' }}>
              <h3 style={{ color: 'var(--accent-primary)', fontSize: '1.1rem', letterSpacing: '0.1em' }}>AGENTS MODE</h3>
              <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '0.25rem', fontFamily: 'JetBrains Mono' }}>
                AI AGENTS ASSISTING AND COORDINATING YOUR WORKSPACE
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { Terminal as TerminalIcon, RotateCcw, Maximize2 } from "lucide-react";
import { XtermTerminal } from "./XtermTerminal";

interface TerminalPaneProps {
  pane: any;
  isFocused: boolean;
  onFocus: () => void;
  rootPath?: string;
  onMaximize?: () => void;
}

export function TerminalPane({ pane, isFocused, onFocus, rootPath, onMaximize }: TerminalPaneProps) {
  return (
    <div 
      className="pane" 
      onClick={() => {
        onFocus();
        // The XtermTerminal component already handles focus when isFocused changes,
        // but ensuring onFocus is called on click is key.
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onFocus();
      }}
      tabIndex={0}
      role="region"
      aria-label={`Terminal Pane: ${pane.command || 'Idle'}`}
      style={{ 
        background: 'var(--bg-color)', 
        borderRadius: 0,
        transition: 'all var(--duration-normal) var(--ease-out)',
        boxShadow: isFocused ? 'inset 0 0 40px rgba(255,255,255,0.01)' : 'none',
        position: 'relative',
        overflow: 'hidden',
        outline: 'none',
        display: 'flex',
        flexDirection: 'column',
        height: '100%'
      }}
    >
      {/* Focus Overlay for Animated Ring */}
      <div className="focus-overlay" style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 5,
        border: isFocused ? '1px solid var(--accent-primary)' : '1px solid transparent',
        transition: 'border var(--duration-fast) var(--ease-out)'
      }} />

      <div className="pane-header" style={{ 
        background: isFocused ? 'rgba(255,255,255,0.03)' : 'var(--surface-color)', 
        borderRadius: 0, 
        padding: '0.4rem 0.75rem',
        borderBottom: isFocused ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
        opacity: isFocused ? 1 : 0.8,
        position: 'relative',
        zIndex: 6,
        transition: 'all var(--duration-fast) var(--ease-out)',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <TerminalIcon size={12} style={{ color: isFocused ? 'var(--accent-primary)' : 'var(--text-secondary)' }} />
          <span style={{ fontSize: '0.7rem', fontWeight: 700, fontFamily: 'JetBrains Mono', color: isFocused ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
            {pane.command || "IDLE"}
          </span>
          <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono', opacity: 0.5 }}>
            // P{String(pane.id).padStart(2, '0')}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button className="icon-action-button" aria-label="Restart Process">
            <RotateCcw size={12} />
            <span className="custom-tooltip">Restart Process</span>
          </button>
          <button 
            className="icon-action-button" 
            aria-label="Expand Pane"
            onClick={(e) => {
              e.stopPropagation();
              onMaximize?.();
            }}
          >
            <Maximize2 size={12} />
            <span className="custom-tooltip">Expand Pane</span>
          </button>
        </div>
      </div>
      
      <div 
        className="pane-content" 
        style={{ 
          borderRadius: 0, 
          position: 'relative',
          overflow: 'hidden',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          background: isFocused ? 'rgba(255,255,255,0.01)' : 'transparent',
          transition: 'background var(--duration-normal) var(--ease-out)'
        }}
      >
        <XtermTerminal 
          id={String(pane.id)} 
          isFocused={isFocused} 
          command={pane.command}
          cwd={rootPath}
        />
      </div>
    </div>
  );
}

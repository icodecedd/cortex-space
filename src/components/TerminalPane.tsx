import { XtermTerminal } from "./XtermTerminal";

interface TerminalPaneProps {
  workspaceId: string;
  pane: any;
  isFocused: boolean;
  isMultiPane?: boolean;
  onFocus: () => void;
  rootPath?: string;
}

export function TerminalPane({ workspaceId, pane, isFocused, isMultiPane = true, onFocus, rootPath }: TerminalPaneProps) {
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
        border: (isFocused && isMultiPane) ? '1px solid var(--accent-primary)' : '1px solid transparent',
        transition: 'border var(--duration-fast) var(--ease-out)'
      }} />

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
          id={`${workspaceId}-${pane.id}`} 
          isFocused={isFocused} 
          command={pane.command}
          cwd={rootPath}
        />
      </div>
    </div>
  );
}

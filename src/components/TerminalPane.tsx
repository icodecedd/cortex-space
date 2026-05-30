import { XtermTerminal } from "./XtermTerminal";

interface TerminalPaneProps {
  workspaceId: string;
  pane: any;
  isFocused: boolean;
  index: number;
  isMultiPane?: boolean;
  onFocus: () => void;
  rootPath?: string;
  isZenMode?: boolean;
  showPaneHeader?: boolean;
  onSplit?: (id: string, direction: 'horizontal' | 'vertical') => void;
  onKill?: (id: string) => void;
  onRename?: (id: string, newName: string) => void;
  onSaveSnippet?: (command: string) => void;
}

export function TerminalPane({ 
  workspaceId, 
  pane, 
  isFocused, 
  index,
  isMultiPane = true, 
  onFocus, 
  rootPath,
  isZenMode = false,
  showPaneHeader = true,
  onSplit,
  onKill,
  onRename,
  onSaveSnippet
}: TerminalPaneProps) {
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
      aria-label={`Terminal Pane: ${pane.name || pane.command || 'Idle'}`}
      style={{ 
        background: 'var(--bg-color)', 
        borderRadius: 0,
        transition: 'all var(--duration-normal) var(--ease-out)',
        boxShadow: isFocused 
          ? 'inset 0 0 60px rgba(var(--accent-primary-rgb), 0.05), 0 0 20px rgba(0, 0, 0, 0.3)' 
          : 'none',
        position: 'relative',
        overflow: 'hidden',
        outline: 'none',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        zIndex: isFocused ? 10 : 1
      }}
      >
      {/* Focus Overlay for Animated Ring */}
      <div className="focus-overlay" style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 5,
        border: (isFocused && isMultiPane) ? '1.5px solid var(--accent-primary)' : '1px solid transparent',
        opacity: isFocused ? 1 : 0,
        transition: 'all var(--duration-fast) var(--ease-out)',
        boxShadow: isFocused ? 'inset 0 0 15px rgba(var(--accent-primary-rgb), 0.1)' : 'none'
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
          background: (isFocused && !isZenMode) ? 'rgba(255,255,255,0.01)' : 'transparent',
          transition: 'background var(--duration-normal) var(--ease-out)'
        }}
      >
        <XtermTerminal 
          id={`${workspaceId}-${pane.id}`} 
          paneId={pane.id}
          isFocused={isFocused} 
          index={index}
          command={pane.command}
          cwd={rootPath}
          isZenMode={isZenMode}
          name={pane.name}
          onSplit={onSplit}
          onKill={onKill}
          onRename={onRename}
          onSaveSnippet={onSaveSnippet}
        />
      </div>
    </div>
  );
}

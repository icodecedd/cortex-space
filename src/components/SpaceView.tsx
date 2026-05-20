import { Terminal, Square, RotateCcw, Maximize2 } from "lucide-react";

interface SpaceViewProps {
  config: any;
  onStop: () => void;
}

export function SpaceView({ config, onStop }: SpaceViewProps) {
  const getGridTemplate = () => {
    switch (config.layout) {
      case '1x1': return '1fr';
      case '1x2': return '1fr / 1fr 1fr';
      case '2x1': return '1fr 1fr / 1fr';
      case '2x2': return '1fr 1fr / 1fr 1fr';
      case '3x3': return '1fr 1fr 1fr / 1fr 1fr 1fr';
      default: return '1fr 1fr / 1fr 1fr';
    }
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%', flex: 1, padding: '0 1rem 1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', padding: '0 1rem' }}>
        <div>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Root: </span>
          <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>{config.rootPath || 'Not set'}</span>
        </div>
        <button onClick={onStop} style={{ padding: '0.4rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' }}>
          <Square size={14} fill="#ef4444" />
          Stop Space
        </button>
      </div>

      <div className="layout-grid" style={{ gridTemplate: getGridTemplate() }}>
        {config.panes.slice(0, getPaneCount(config.layout)).map((pane: any) => (
          <div key={pane.id} className="pane glass">
            <div className="pane-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Terminal size={14} className="accent-text" style={{ color: 'var(--accent-primary)' }} />
                <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{pane.name}</span>
                <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>- {pane.command}</span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <RotateCcw size={12} style={{ cursor: 'pointer', opacity: 0.7 }} />
                <Maximize2 size={12} style={{ cursor: 'pointer', opacity: 0.7 }} />
              </div>
            </div>
            <div className="pane-content">
              <div style={{ color: 'var(--accent-secondary)' }}>$ {pane.command}</div>
              <div style={{ marginTop: '0.5rem', color: '#888' }}>
                [Cortex] Starting process...<br />
                [Cortex] Process attached to PTY.<br />
                <br />
                <span style={{ color: '#aaa' }}>{pane.name} output will appear here.</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function getPaneCount(layout: string) {
  switch (layout) {
    case '1x1': return 1;
    case '1x2':
    case '2x1': return 2;
    case '2x2': return 4;
    case '3x3': return 9;
    default: return 4;
  }
}

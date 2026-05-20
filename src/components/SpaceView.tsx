import { useState, useEffect } from "react";
import { Square, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TerminalPane } from "./TerminalPane";

interface SpaceViewProps {
  config: any;
  onStop: () => void;
}

export function SpaceView({ config, onStop }: SpaceViewProps) {
  const [focusedPaneId, setFocusedPaneId] = useState<number | null>(config.panes[0]?.id || null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getGridTemplate = () => {
    if (isMobile) return '1fr / 1fr';
    switch (config.layout) {
      case '1x1': return '1fr / 1fr';
      case '1x2': return '1fr / 1fr 1fr';
      case '2x1': return '1fr 1fr / 1fr';
      case '2x2': return '1fr 1fr / 1fr 1fr';
      case '3x3': return '1fr 1fr 1fr / 1fr 1fr 1fr';
      default: return '1fr 1fr / 1fr 1fr';
    }
  };

  return (
    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', height: '100%', flex: 1, padding: 0 }}>
      {/* HEADER SECTION IN-SPACE */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '0.5rem 1rem',
        borderBottom: '1px solid var(--border-color)',
        background: 'var(--surface-color)',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity 
              size={12} 
              color="var(--accent-primary)" 
              className="pulse-animation"
              style={{ filter: 'drop-shadow(0 0 4px var(--accent-primary))' }}
            />
            <span style={{ fontSize: '0.65rem', fontWeight: 700, fontFamily: 'JetBrains Mono', letterSpacing: '0.05em' }}>ACTIVE SESSION</span>
          </div>
        </div>
        
        <Button 
          onClick={onStop} 
          variant="destructive"
          size="sm"
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            fontWeight: 700,
            height: '24px',
            fontSize: '0.65rem',
            padding: '0 0.75rem'
          }}
        >
          <Square size={10} fill="currentColor" />
          TERMINATE SPACE
        </Button>
      </div>

      <div className="layout-grid" style={{ 
        gridTemplate: getGridTemplate(), 
        gap: '1px', 
        background: 'var(--border-color)', 
        flex: 1,
        overflowY: isMobile ? 'auto' : 'hidden'
      }}>
        {config.panes.map((pane: any) => (
          <TerminalPane 
            key={pane.id}
            pane={pane}
            isFocused={focusedPaneId === pane.id}
            onFocus={() => setFocusedPaneId(pane.id)}
            rootPath={config.rootPath}
          />
        ))}
      </div>

      {/* SESSION STATUS BAR */}
      <div style={{ 
        padding: '0.4rem 1rem', 
        background: 'var(--surface-color)', 
        borderTop: '1px solid var(--border-color)',
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '0.65rem',
        fontFamily: 'JetBrains Mono',
        color: 'var(--text-secondary)',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ opacity: 0.5 }}>ROOT:</span>
            <span style={{ color: 'var(--text-primary)' }}>{config.rootPath || 'DEFAULT DIR'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ opacity: 0.5 }}>LAYOUT:</span>
            <span style={{ color: 'var(--text-primary)' }}>{isMobile ? 'MOBILE STACK' : config.layout}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
           <span style={{ color: 'var(--accent-primary)', opacity: 0.8, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
             <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor', boxShadow: '0 0 8px currentColor' }} className="pulse-animation" />
             SYSTEM READY
           </span>
        </div>
      </div>
    </div>
  );
}

import { Square, Activity } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";

interface SpaceHeaderProps {
  onStop: () => void;
}

export function SpaceHeader({ onStop }: SpaceHeaderProps) {
  return (
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
  );
}

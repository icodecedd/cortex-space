interface SpaceStatusBarProps {
  rootPath: string;
  layout: string;
  isMobile: boolean;
}

export function SpaceStatusBar({ rootPath, layout, isMobile }: SpaceStatusBarProps) {
  return (
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
          <span style={{ color: 'var(--text-primary)' }}>{rootPath || 'DEFAULT DIR'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ opacity: 0.5 }}>LAYOUT:</span>
          <span style={{ color: 'var(--text-primary)' }}>{isMobile ? 'MOBILE STACK' : layout}</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '1rem' }}>
         <span style={{ color: 'var(--accent-primary)', opacity: 0.8, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
           <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor', boxShadow: '0 0 8px currentColor' }} className="pulse-animation" />
           SYSTEM READY
         </span>
      </div>
    </div>
  );
}

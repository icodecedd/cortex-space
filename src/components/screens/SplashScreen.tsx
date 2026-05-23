interface SplashScreenProps {
  splashKey: number;
}

export function SplashScreen({ splashKey }: SplashScreenProps) {
  return (
    <div style={{
      flex: 1,
      width: '100%',
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        position: 'absolute',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'opacity 800ms var(--ease-out), transform 800ms var(--ease-out), filter 800ms var(--ease-out)',
        opacity: 1,
        transform: 'scale(1)',
        filter: 'blur(0px)',
      }}>
        <div key={`title-${splashKey}`} className="splash-text">CORTEX<span style={{ opacity: 0.5 }}> SPACE</span></div>
        <div key={`sub-${splashKey}`} className="splash-subtext animate-dots">
          AWAKENING SYSTEM<span>.</span><span>.</span><span>.</span>
        </div>
      </div>
    </div>
  );
}

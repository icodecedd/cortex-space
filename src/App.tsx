import { useState, useEffect } from "react";
import { SetupView } from "./components/SetupView";
import { SpaceView } from "./components/SpaceView";
import { Terminal, Users, Cpu, Palette } from "lucide-react";
import { useTheme, ThemeName } from "./hooks/useTheme";
import { Toaster } from "@/components/ui/sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

type AppState = 'splash' | 'mode-select' | 'setup' | 'active';
type Mode = 'normal' | 'agents';

function App() {
  const [appState, setAppState] = useState<AppState>('splash');
  const [splashKey, setSplashKey] = useState(0);
  const [mode, setMode] = useState<Mode>('normal');
  const [config, setConfig] = useState<any>(null);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    if (appState === 'splash') {
      setSplashKey(prev => prev + 1);
      const timer = setTimeout(() => {
        setAppState('mode-select');
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [appState]);

  const handleLaunch = (newConfig: any) => {
    setConfig(newConfig);
    setAppState('active');
  };

  const handleStop = () => {
    setAppState('mode-select');
  };

  const selectMode = (m: Mode) => {
    setMode(m);
    setAppState('setup');
  };

  return (
    <div id="root">
      {/* THEME ENGINE DROPDOWN */}
      {appState !== 'splash' && appState !== 'active' && (
        <div className="animate-in" style={{ 
          position: 'fixed', 
          top: '1.5rem', 
          right: '1.5rem', 
          zIndex: 1000,
        }}>
          <DropdownMenu>
            <DropdownMenuTrigger render={
              <Button 
                variant="ghost"
                size="sm"
                className="btn-tactile group"
                style={{ 
                  background: 'var(--surface-color)', 
                  border: '1px solid var(--border-color)', 
                  padding: '0.6rem',
                  width: '40px',
                  height: '40px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  transition: 'all 300ms var(--ease-out)'
                }}
              />
            }>
              <Palette size={16} />
              <div className="absolute right-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" style={{ whiteSpace: 'nowrap' }}>
                 <span style={{ fontSize: '0.65rem', fontFamily: 'JetBrains Mono', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>THEME ENGINE</span>
              </div>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent 
              align="end" 
              className="w-56 bg-[var(--surface-color)] border-[var(--border-color)] animate-in p-1.5"
              style={{ boxShadow: '0 10px 40px rgba(0,0,0,0.6)' }}
            >
              <DropdownMenuGroup>
                <DropdownMenuLabel style={{ 
                  fontSize: '0.6rem', 
                  color: 'var(--text-secondary)', 
                  letterSpacing: '0.12em',
                  padding: '0.75rem 0.75rem 0.5rem',
                  fontWeight: 700
                }}>
                  INTERFACE THEME
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-[var(--border-color)] opacity-50 mx-2 mb-1" />
                {(['ayu', 'catppuccin', 'iceberg', 'nvim', 'monochrome', 'soft-monochrome'] as ThemeName[]).map(t => (
                  <DropdownMenuItem 
                    key={t}
                    onClick={() => setTheme(t)}
                    style={{ 
                      fontSize: '0.7rem', 
                      fontFamily: 'JetBrains Mono',
                      color: theme === t ? 'var(--accent-primary)' : 'var(--text-primary)',
                      background: theme === t ? 'rgba(255,255,255,0.04)' : 'transparent',
                      cursor: 'pointer',
                      padding: '0.6rem 0.75rem',
                      margin: '0.1rem 0',
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 150ms ease'
                    }}
                  >
                    <span>{t.toUpperCase().replace('-', ' ')}</span>
                    {theme === t && (
                      <div className="animate-in" style={{ 
                        width: '5px', 
                        height: '5px', 
                        borderRadius: '50%', 
                        background: 'var(--accent-primary)',
                        boxShadow: '0 0 8px var(--accent-primary)'
                      }} />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      <main style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: appState === 'active' ? 'stretch' : 'center',
        alignItems: appState === 'active' ? 'stretch' : 'center'
      }}>
        {(appState === 'splash' || appState === 'mode-select') ? (
          <div style={{ 
            flex: 1, 
            width: '100%', 
            position: 'relative', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}>
            {/* Splash Screen */}
            <div style={{ 
              position: 'absolute', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              transition: 'opacity 800ms var(--ease-out), transform 800ms var(--ease-out), filter 800ms var(--ease-out)',
              opacity: appState === 'splash' ? 1 : 0,
              transform: appState === 'splash' ? 'scale(1)' : 'scale(1.05)',
              filter: appState === 'splash' ? 'blur(0px)' : 'blur(8px)',
              pointerEvents: appState === 'splash' ? 'auto' : 'none'
            }}>
              <div key={`title-${splashKey}`} className="splash-text">CORTEX<span style={{ opacity: 0.5 }}> SPACE</span></div>
              <div key={`sub-${splashKey}`} className="splash-subtext animate-dots">
                AWAKENING SYSTEM<span>.</span><span>.</span><span>.</span>
              </div>
            </div>

            {/* Mode Select (Operational Workflow) */}
            <div style={{ 
              position: 'absolute',
              width: '100%',
              maxWidth: '600px',
              padding: '2rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'opacity 800ms var(--ease-out), transform 800ms var(--ease-out), filter 800ms var(--ease-out)',
              opacity: appState === 'mode-select' ? 1 : 0,
              transform: appState === 'mode-select' ? 'scale(1)' : 'scale(0.95)',
              filter: appState === 'mode-select' ? 'blur(0px)' : 'blur(8px)',
              pointerEvents: appState === 'mode-select' ? 'auto' : 'none'
            }}>
              {appState === 'mode-select' && (
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
                        src="/logo.png" 
                        alt="Cortex Logo" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => {
                          e.currentTarget.src = "/tauri.svg";
                        }}
                      />
                    </div>
                    <div className="animate-in" style={{ transitionDelay: '200ms' }}>
                      <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>CORTEX SPACE</h1>
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
                    <div className="mode-card animate-in" onClick={() => selectMode('normal')} style={{ flexDirection: 'row', padding: '1.5rem 2rem', justifyContent: 'flex-start', gap: '1.5rem', borderRadius: 'var(--radius-md)', transitionDelay: '500ms' }}>
                      <Terminal size={32} color="var(--text-secondary)" />
                      <div style={{ textAlign: 'left' }}>
                        <h3 style={{ fontSize: '1.1rem', letterSpacing: '0.1em' }}>NORMAL MODE</h3>
                        <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '0.25rem', fontFamily: 'JetBrains Mono' }}>
                          MANUAL CONTROL OVER MULTIPLE TERMINAL PANES
                        </p>
                      </div>
                    </div>

                    <div className="mode-card animate-in" onClick={() => selectMode('agents')} style={{ flexDirection: 'row', padding: '1.5rem 2rem', justifyContent: 'flex-start', gap: '1.5rem', borderRadius: 'var(--radius-md)', borderColor: 'var(--accent-primary)', background: 'rgba(255,255,255,0.02)', transitionDelay: '600ms' }}>
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
              )}
            </div>
          </div>
        ) : appState === 'setup' ? (
          <SetupView mode={mode} onLaunch={handleLaunch} onBack={() => setAppState('mode-select')} />
        ) : appState === 'active' ? (
          <SpaceView config={config} onStop={handleStop} />
        ) : null}
      </main>
      
      {appState !== 'splash' && (
        <footer style={{ 
          padding: '1.5rem', 
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '2rem',
          fontSize: '0.65rem', 
          fontFamily: 'JetBrains Mono, monospace',
          color: 'var(--text-secondary)',
          opacity: 0.4,
          letterSpacing: '0.1em',
          textTransform: 'uppercase'
        }}>
          <div>Cortex Space v0.1.0 // Engine: {mode.toUpperCase()} MODE // UI: {theme.toUpperCase()}</div>
          <button 
            onClick={() => setAppState('splash')}
            className="btn-tactile"
            style={{ 
              background: 'transparent', 
              border: '1px solid var(--border-color)', 
              padding: '0.2rem 0.5rem',
              fontSize: '0.6rem',
              cursor: 'pointer',
              opacity: 0.6
            }}
          >
            [REPLAY SPLASH]
          </button>
        </footer>
      )}
      <Toaster position="bottom-right" theme="dark" closeButton richColors />
    </div>
  );
}

export default App;

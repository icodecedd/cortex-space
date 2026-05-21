import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { SetupView } from "./components/SetupView";
import { SpaceView } from "./components/SpaceView";
import { 
  Terminal, 
  Users, 
  Cpu, 
  Palette, 
  Keyboard, 
  Settings, 
  Minus, 
  Square, 
  X, 
  Plus, 
  Trash2
} from "lucide-react";
import { useTheme, ThemeName } from "./hooks/useTheme";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
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
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/dialog";
declare global {
  interface Window {
    __TAURI_INTERNALS__?: any;
  }
}

type AppState = 'splash' | 'running';
export type WorkspaceStatus = 'mode-select' | 'setup' | 'active';
type Mode = 'normal' | 'agents';

export interface Workspace {
  id: string;
  name: string;
  mode: Mode;
  config: any; // { rootPath, layout, panes }
  theme: ThemeName;
  status: WorkspaceStatus;
}

function App() {
  const [appState, setAppState] = useState<AppState>('splash');
  const [splashKey, setSplashKey] = useState(0);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  
  // Font family and size settings that synchronize with xterm
  const [fontSize, setFontSize] = useState<number>(12);
  const [fontFamily, setFontFamily] = useState<string>('JetBrains Mono');
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId);

  // Verify Tauri PATH environment on startup
  useEffect(() => {
    invoke<string>('debug_env')
      .then(path => {
        console.log('Tauri PATH:', path);
      })
      .catch(err => {
        console.error('Failed to get Tauri PATH:', err);
      });
  }, []);

  useEffect(() => {
    if (appState === 'splash') {
      setSplashKey(prev => prev + 1);
      const timer = setTimeout(() => {
        setAppState('running');
        const initialId = Date.now().toString();
        setWorkspaces([{
          id: initialId,
          name: '',
          mode: 'normal',
          config: null,
          theme,
          status: 'mode-select'
        }]);
        setActiveWorkspaceId(initialId);
      }, 2500);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appState]);

  // Decoupled settings synchronization with xterm.js via custom events
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--terminal-font-size', `${fontSize}`);
    root.style.setProperty(
      '--terminal-font-family', 
      fontFamily === 'JetBrains Mono' 
        ? '"JetBrains Mono", monospace' 
        : fontFamily === 'Fira Code' 
          ? '"Fira Code", monospace' 
          : '"SF Mono", monospace'
    );
    window.dispatchEvent(new Event('cortex-settings-changed'));
  }, [fontSize, fontFamily]);

  const handleLaunch = (newConfig: any) => {
    const rootName = newConfig.rootPath.split(/[/\\]/).filter(Boolean).pop() || newConfig.rootPath;
    
    setWorkspaces(prev => prev.map(w => {
      if (w.id === activeWorkspaceId) {
        return {
          ...w,
          name: rootName,
          config: newConfig,
          status: 'active'
        };
      }
      return w;
    }));
    
    // We can't use activeWorkspace.mode here immediately because activeWorkspace is from the previous render, 
    // but we can find it in the current workspaces array.
    const currentWs = workspaces.find(w => w.id === activeWorkspaceId);
    const m = currentWs ? currentWs.mode : 'normal';

    toast.success("Workspace Activated", {
      description: `Loaded ${rootName} successfully in ${m.toUpperCase()} mode.`,
    });
  };

  const handleSwitchWorkspace = (id: string) => {
    const ws = workspaces.find(w => w.id === id);
    if (ws) {
      setActiveWorkspaceId(id);
      setTheme(ws.theme);
    }
  };

  const handleCloseWorkspace = (id: string) => {
    const index = workspaces.findIndex(w => w.id === id);
    if (index === -1) return;
    
    const updated = workspaces.filter(w => w.id !== id);
    
    if (activeWorkspaceId === id) {
      if (updated.length > 0) {
        const nextActive = updated[Math.max(0, index - 1)];
        setActiveWorkspaceId(nextActive.id);
        setTheme(nextActive.theme);
      } else {
        // If closing the last workspace, instantly spawn a new draft
        const newId = Date.now().toString();
        updated.push({
          id: newId,
          name: '',
          mode: 'normal',
          config: null,
          theme,
          status: 'mode-select'
        });
        setActiveWorkspaceId(newId);
      }
    }
    
    setWorkspaces(updated);

    toast.warning("Workspace Closed", {
      description: "PTY process connections terminated cleanly.",
    });
  };

  const handleNewWorkspaceFlow = () => {
    const newId = Date.now().toString();
    setWorkspaces(prev => [...prev, {
      id: newId,
      name: '',
      mode: 'normal',
      config: null,
      theme,
      status: 'mode-select'
    }]);
    setActiveWorkspaceId(newId);
  };

  const handleSetWorkspaceTheme = (id: string, newTheme: ThemeName) => {
    setWorkspaces(prev => prev.map(w => w.id === id ? { ...w, theme: newTheme } : w));
    if (id === activeWorkspaceId) {
      setTheme(newTheme);
    }
  };

  // Keyboard Navigation & Shortcuts Capture
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. New workspace setup flow (Ctrl + Alt + N)
      if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        handleNewWorkspaceFlow();
        toast.info("New Workflow Initiated", { description: "Configure your new separate workspace." });
      }
      
      // 2. Terminate active workspace (Ctrl + Shift + W)
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'w') {
        e.preventDefault();
        if (activeWorkspaceId) {
          handleCloseWorkspace(activeWorkspaceId);
        }
      }

      // 3. Tab cycling (Ctrl + Tab / Ctrl + Shift + Tab)
      if (e.ctrlKey && e.key === 'Tab') {
        e.preventDefault();
        if (workspaces.length <= 1) return;
        const currentIndex = workspaces.findIndex(w => w.id === activeWorkspaceId);
        let nextIndex = 0;
        if (e.shiftKey) {
          nextIndex = (currentIndex - 1 + workspaces.length) % workspaces.length;
        } else {
          nextIndex = (currentIndex + 1) % workspaces.length;
        }
        handleSwitchWorkspace(workspaces[nextIndex].id);
      }

      // 4. Keyboard Shortcuts Cheatsheet (Ctrl + /)
      if (e.ctrlKey && e.key === '/') {
        e.preventDefault();
        setShortcutsOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [workspaces, activeWorkspaceId]);

  // Safe Tauri OS Windows Control Interceptors
  const handleMinimize = async () => {
    if (window.__TAURI_INTERNALS__) {
      try {
        const { getCurrentWindow } = await import("@tauri-apps/api/window");
        await getCurrentWindow().minimize();
      } catch (err) {
        console.error("Failed to minimize window:", err);
      }
    } else {
      toast.info("Simulated OS Action", { description: "Minimize window (Web Mode)" });
    }
  };

  const handleMaximize = async () => {
    if (window.__TAURI_INTERNALS__) {
      try {
        const { getCurrentWindow } = await import("@tauri-apps/api/window");
        await getCurrentWindow().toggleMaximize();
      } catch (err) {
        console.error("Failed to maximize window:", err);
      }
    } else {
      toast.info("Simulated OS Action", { description: "Maximize window (Web Mode)" });
    }
  };

  const handleClose = async () => {
    if (window.__TAURI_INTERNALS__) {
      try {
        const { getCurrentWindow } = await import("@tauri-apps/api/window");
        await getCurrentWindow().close();
      } catch (err) {
        console.error("Failed to close window:", err);
      }
    } else {
      toast.info("Simulated OS Action", { description: "Close window (Web Mode)" });
    }
  };


  return (
    <div id="root" className="h-screen w-screen flex flex-col overflow-hidden bg-[#09090E]">
      
      {/* 1. Global App Chrome Title & Tab Bar */}
      {appState === 'running' && (
        <div 
          data-tauri-drag-region
          className="h-10 bg-[#1C1C22] flex items-center justify-between px-4 border-b border-[#2A2A35] select-none flex-shrink-0 z-50 cursor-default"
          style={{ 
            boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
            WebkitAppRegion: 'drag'
          } as any}
        >
          {/* Left Area: Workspace Tabs */}
          <div className="flex items-center gap-3 overflow-hidden flex-1 h-full mr-4">
            <div 
              style={{ WebkitAppRegion: 'no-drag' } as any}
              className="flex items-center h-full gap-1.5 overflow-x-auto scrollbar-none"
            >
              {workspaces.map((ws, idx) => {
                const isActive = activeWorkspaceId === ws.id;
                const isDraft = ws.status !== 'active';

                return (
                  <div
                    key={ws.id}
                    onClick={() => handleSwitchWorkspace(ws.id)}
                    style={{ WebkitAppRegion: 'no-drag' } as any}
                    className={`btn-tactile group h-7 px-2.5 rounded-md flex items-center gap-2 text-[10px] font-mono tracking-wide cursor-pointer transition-all duration-150 border select-none ${
                      isActive && !isDraft
                        ? "bg-[#09090E] border-[var(--accent-primary)] text-[var(--text-primary)] font-bold shadow-[0_0_8px_rgba(63,185,80,0.1)]"
                        : isActive && isDraft
                          ? "bg-[#09090E] border-dashed border-[var(--accent-primary)] text-[var(--accent-primary)] font-bold shadow-[0_0_8px_rgba(63,185,80,0.1)]"
                        : isDraft
                          ? "bg-[#141418] border-dashed border-[#2A2A35] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[#1C1C22]"
                          : "bg-[#141418] border-[#2A2A35] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[#1C1C22]"
                    }`}
                  >
                    {isActive && <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] shadow-[0_0_4px_var(--accent-primary)] shrink-0 animate-in fade-in zoom-in duration-300" />}
                    {isDraft && !isActive && <div className="w-1.5 h-1.5 rounded-full bg-[#2A2A35] shrink-0" />}
                    
                    <Terminal size={10} className={isActive ? "text-[var(--accent-primary)]" : "text-[var(--text-secondary)]"} />
                    <span className="max-w-[120px] truncate">{ws.name ? `Workspace ${idx + 1} - ${ws.name}` : `Workspace ${idx + 1}`}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCloseWorkspace(ws.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 hover:bg-[#2A2A35] hover:text-[#F85149] rounded p-0.5 transition-all text-xs flex items-center justify-center w-3.5 h-3.5 text-[var(--text-secondary)] cursor-pointer"
                    >
                      <X size={8} />
                    </button>
                  </div>
                );
              })}

              {/* Spawn Setup Button */}
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleNewWorkspaceFlow}
                style={{ WebkitAppRegion: 'no-drag' } as any}
                className="w-6 h-6 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[#2A2A35] rounded-md transition-all cursor-pointer ml-1"
                title="Configure New Workspace (Ctrl+Alt+N)"
              >
                <Plus size={13} />
              </Button>
            </div>
          </div>

          {/* Right Area: Workspace Configuration, Settings & OS Window Buttons */}
          <div className="flex items-center gap-2 flex-shrink-0 h-full" style={{ WebkitAppRegion: 'no-drag' } as any}>
            
            {/* Keyboard Shortcuts Dialog Trigger */}
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setShortcutsOpen(true)}
              className="btn-tactile w-7 h-7 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[#2A2A35] rounded cursor-pointer"
              title="Keyboard Shortcuts (Ctrl+/)"
            >
              <Keyboard size={13} />
            </Button>

            {/* Terminal Configuration Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="btn-tactile w-7 h-7 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[#2A2A35] rounded cursor-pointer"
                  title="Terminal Layout Settings"
                />
              }>
                <Settings size={13} />
              </DropdownMenuTrigger>
              
              <DropdownMenuContent 
                align="end" 
                className="w-56 bg-[var(--surface-color)] border-[var(--border-color)] animate-in p-1.5"
                style={{ boxShadow: '0 10px 40px rgba(0,0,0,0.6)', zIndex: 1100 }}
              >
                <DropdownMenuGroup>
                  <DropdownMenuLabel style={{ 
                    fontSize: '0.6rem', 
                    color: 'var(--text-secondary)', 
                    letterSpacing: '0.12em',
                    padding: '0.75rem 0.75rem 0.5rem',
                    fontWeight: 700
                  }}>
                    TERMINAL CONFIG
                  </DropdownMenuLabel>
                  
                  <DropdownMenuSeparator className="bg-[var(--border-color)] opacity-50 mx-2 mb-1" />
                  
                  <DropdownMenuLabel style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', padding: '0.25rem 0.75rem' }}>FONT SIZE</DropdownMenuLabel>
                  {[12, 13, 14, 16].map(sz => (
                    <DropdownMenuItem
                      key={sz}
                      onClick={() => setFontSize(sz)}
                      style={{
                        fontSize: '0.7rem',
                        fontFamily: 'JetBrains Mono',
                        color: fontSize === sz ? 'var(--accent-primary)' : 'var(--text-primary)',
                        background: fontSize === sz ? 'rgba(255,255,255,0.04)' : 'transparent',
                        cursor: 'pointer',
                        padding: '0.4rem 0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <span>{sz}px</span>
                      {fontSize === sz && <div className="w-1 h-1 rounded-full bg-[var(--accent-primary)] shadow-[0_0_4px_var(--accent-primary)]" />}
                    </DropdownMenuItem>
                  ))}

                  <DropdownMenuSeparator className="bg-[var(--border-color)] opacity-50 mx-2 my-1" />

                  <DropdownMenuLabel style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', padding: '0.25rem 0.75rem' }}>FONT FAMILY</DropdownMenuLabel>
                  {['JetBrains Mono', 'Fira Code', 'SF Mono'].map(ff => (
                    <DropdownMenuItem
                      key={ff}
                      onClick={() => setFontFamily(ff)}
                      style={{
                        fontSize: '0.7rem',
                        fontFamily: ff === 'JetBrains Mono' ? '"JetBrains Mono"' : ff === 'Fira Code' ? '"Fira Code"' : '"SF Mono"',
                        color: fontFamily === ff ? 'var(--accent-primary)' : 'var(--text-primary)',
                        background: fontFamily === ff ? 'rgba(255,255,255,0.04)' : 'transparent',
                        cursor: 'pointer',
                        padding: '0.4rem 0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <span>{ff}</span>
                      {fontFamily === ff && <div className="w-1 h-1 rounded-full bg-[var(--accent-primary)] shadow-[0_0_4px_var(--accent-primary)]" />}
                    </DropdownMenuItem>
                  ))}
                  
                  <DropdownMenuSeparator className="bg-[var(--border-color)] opacity-50 mx-2 my-1" />
                  
                  <DropdownMenuItem
                    onClick={() => {
                      window.dispatchEvent(new Event('cortex-purge-scrollback'));
                      toast.success("Terminal Purge Executed", { description: "Purged scrollback of active terminals." });
                    }}
                    style={{
                      fontSize: '0.7rem',
                      color: '#F85149',
                      cursor: 'pointer',
                      padding: '0.5rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <Trash2 size={12} />
                    <span>PURGE SCROLLBACK</span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="w-[1px] h-3 bg-[#2A2A35] ml-1" />

            {/* Standard Window controls */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleMinimize}
                className="w-7 h-7 flex items-center justify-center hover:bg-[#2A2A35] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded transition-all cursor-pointer"
                title="Minimize"
              >
                <Minus size={13} />
              </button>
              <button
                onClick={handleMaximize}
                className="w-7 h-7 flex items-center justify-center hover:bg-[#2A2A35] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded transition-all cursor-pointer"
                title="Maximize"
              >
                <Square size={11} />
              </button>
              <button
                onClick={handleClose}
                className="w-7 h-7 flex items-center justify-center hover:bg-[#E81123] hover:text-white text-[var(--text-secondary)] rounded transition-all cursor-pointer"
                title="Close"
              >
                <X size={13} />
              </button>
            </div>

          </div>

        </div>
      )}

      {/* 2. Main Workspace/Client Shell Container */}
      <main style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: activeWorkspace?.status === 'active' ? 'stretch' : 'center',
        alignItems: activeWorkspace?.status === 'active' ? 'stretch' : 'center',
        overflow: 'hidden'
      }}>
        {appState === 'splash' && (
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
        )}

        {appState === 'running' && workspaces.map(ws => {
          const isCurrent = activeWorkspaceId === ws.id;

          // Optimization: Skip rendering mode-select/setup for inactive drafts
          if (!isCurrent && ws.status !== 'active') return null;

          if (ws.status === 'mode-select') {
            return (
              <div key={ws.id} style={{ 
                display: isCurrent ? 'flex' : 'none',
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
                        src="/logo.png" 
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
                    <div className="mode-card animate-in" onClick={() => { 
                      setWorkspaces(prev => prev.map(w => w.id === ws.id ? { ...w, mode: 'normal', status: 'setup' } : w));
                    }} style={{ flexDirection: 'row', padding: '1.5rem 2rem', justifyContent: 'flex-start', gap: '1.5rem', borderRadius: 'var(--radius-md)', transitionDelay: '500ms', cursor: 'pointer' }}>
                      <Terminal size={32} color="var(--text-secondary)" />
                      <div style={{ textAlign: 'left' }}>
                        <h3 style={{ fontSize: '1.1rem', letterSpacing: '0.1em', color: 'var(--text-primary)' }}>NORMAL MODE</h3>
                        <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '0.25rem', fontFamily: 'JetBrains Mono' }}>
                          MANUAL CONTROL OVER MULTIPLE TERMINAL PANES
                        </p>
                      </div>
                    </div>

                    <div className="mode-card animate-in" onClick={() => { 
                      setWorkspaces(prev => prev.map(w => w.id === ws.id ? { ...w, mode: 'agents', status: 'setup' } : w));
                    }} style={{ flexDirection: 'row', padding: '1.5rem 2rem', justifyContent: 'flex-start', gap: '1.5rem', borderRadius: 'var(--radius-md)', borderColor: 'var(--accent-primary)', background: 'rgba(255,255,255,0.02)', transitionDelay: '600ms', cursor: 'pointer' }}>
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

          if (ws.status === 'setup') {
            return (
              <div key={ws.id} style={{ display: isCurrent ? 'block' : 'none', width: '100%', maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
                <SetupView 
                  mode={ws.mode} 
                  onLaunch={handleLaunch} 
                  onBack={() => {
                    setWorkspaces(prev => prev.map(w => w.id === ws.id ? { ...w, status: 'mode-select' } : w));
                  }} 
                />
              </div>
            );
          }

          if (ws.status === 'active') {
            return (
              <div 
                key={ws.id} 
                style={{ 
                  display: isCurrent ? 'flex' : 'none',
                  flex: 1,
                  flexDirection: 'column',
                  height: '100%',
                  width: '100%',
                  overflow: 'hidden'
                }}
              >
                <SpaceView 
                  config={ws.config} 
                  mode={ws.mode} 
                  theme={ws.theme} 
                  setTheme={(t) => handleSetWorkspaceTheme(ws.id, t)} 
                  onStop={() => handleCloseWorkspace(ws.id)} 
                />
              </div>
            );
          }

          return null;
        })}
      </main>
      
      {/* Dynamic bottom absolute overlay shortcuts list */}
      <Dialog open={shortcutsOpen} onOpenChange={setShortcutsOpen}>
        <DialogPortal>
          <DialogOverlay className="fixed inset-0 isolate z-[1500] bg-black/60 duration-100 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
          <div className="fixed inset-0 z-[1600] flex items-center justify-center p-4">
            <DialogContent className="w-full max-w-sm rounded-xl bg-[var(--surface-color)] border border-[var(--border-color)] p-6 text-sm text-[var(--text-primary)] outline-none duration-100 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 shadow-2xl">
              <DialogHeader className="mb-4">
                <DialogTitle className="text-base font-bold text-[var(--text-primary)] tracking-wide font-mono flex items-center gap-2">
                  <Keyboard size={16} className="text-[#3FB950]" />
                  KEYBOARD SHORTCUTS
                </DialogTitle>
                <DialogDescription className="text-xs text-[var(--text-secondary)] mt-1">
                  Keyboard navigation bindings.
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-col gap-3 font-mono text-[11px] mt-4">
                <div className="flex items-center justify-between border-b border-[var(--border-color)]/30 pb-2">
                  <span className="text-[var(--text-secondary)]">Cycle Next Tab</span>
                  <kbd className="px-2 py-0.5 bg-[#141418] border border-[var(--border-color)] rounded text-[9px] text-[var(--accent-primary)] font-bold">Ctrl + Tab</kbd>
                </div>
                <div className="flex items-center justify-between border-b border-[var(--border-color)]/30 pb-2">
                  <span className="text-[var(--text-secondary)]">Cycle Prev Tab</span>
                  <kbd className="px-2 py-0.5 bg-[#141418] border border-[var(--border-color)] rounded text-[9px] text-[var(--accent-primary)] font-bold">Ctrl + Shift + Tab</kbd>
                </div>
                <div className="flex items-center justify-between border-b border-[var(--border-color)]/30 pb-2">
                  <span className="text-[var(--text-secondary)]">New Setup Flow</span>
                  <kbd className="px-2 py-0.5 bg-[#141418] border border-[var(--border-color)] rounded text-[9px] text-[var(--accent-primary)] font-bold">Ctrl + Alt + N</kbd>
                </div>
                <div className="flex items-center justify-between border-b border-[var(--border-color)]/30 pb-2">
                  <span className="text-[var(--text-secondary)]">Close Active Workspace</span>
                  <kbd className="px-2 py-0.5 bg-[#141418] border border-[var(--border-color)] rounded text-[9px] text-[#F85149] font-bold">Ctrl + Shift + W</kbd>
                </div>
                <div className="flex items-center justify-between pb-1">
                  <span className="text-[var(--text-secondary)]">Shortcuts Guide</span>
                  <kbd className="px-2 py-0.5 bg-[#141418] border border-[var(--border-color)] rounded text-[9px] text-[var(--accent-primary)] font-bold">Ctrl + /</kbd>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <DialogClose render={
                  <Button 
                    variant="outline" 
                    className="h-8 text-[10px] font-mono border-[var(--border-color)] hover:bg-[#2A2A35] text-[var(--text-primary)] cursor-pointer"
                  />
                }>
                  CLOSE
                </DialogClose>
              </div>
            </DialogContent>
          </div>
        </DialogPortal>
      </Dialog>

      {/* Global Fallback Footer for Splash Screen / Setup flow */}
      {appState === 'running' && activeWorkspace?.status !== 'active' && (
        <footer className="h-9 bg-[#1C1C22] border-t border-[#2A2A35] flex items-center justify-between px-4 flex-shrink-0 select-none">
          {/* Left Side: Version, Engine, Active UI & Replay Action */}
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#6B6B80] tracking-wider">
            <span>Cortex Space v0.1.0</span>
            <span className="opacity-40">//</span>
            <span>Engine: {activeWorkspace?.mode.toUpperCase()} MODE</span>
            <span className="opacity-40">//</span>
            <span>UI: {theme.toUpperCase().replace('-', ' ')}</span>
            <button 
              onClick={() => setAppState('splash')}
              className="ml-2.5 px-2 py-0.5 bg-[#1F1F28] hover:bg-[#2A2A35] hover:text-[#E2E2EC] transition-all border border-[#2A2A35] rounded text-[10px] text-[#6B6B80] cursor-pointer"
            >
              [REPLAY SPLASH]
            </button>
          </div>

          {/* Right Side: Theme Switcher */}
          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger render={
                <button 
                  className="h-6 px-2.5 bg-[#1F1F28] hover:bg-[#2A2A35] transition-all border border-[#2A2A35] rounded-md text-[10px] font-mono text-[#E2E2EC] flex items-center gap-1.5 cursor-pointer"
                >
                  <Palette size={12} className="text-[#3FB950]" />
                  <span>THEME</span>
                </button>
              }>
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
        </footer>
      )}

      <Toaster position="bottom-right" theme="dark" closeButton richColors />
    </div>
  );
}

export default App;
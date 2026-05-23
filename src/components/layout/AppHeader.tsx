import { useState, useEffect } from "react";
import { SquareTerminal, Keyboard, Settings, Minus, Square, X, Plus, Trash2, XCircle, ArrowRightCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Workspace } from "@/types";

interface AppHeaderProps {
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  isWindowMaximized: boolean;
  onSwitchWorkspace: (id: string) => void;
  onCloseWorkspace: (id: string) => void;
  onCloseWorkspaces: (ids: string[]) => void;
  onNewWorkspaceFlow: () => void;
  onOpenShortcuts: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  onClose: () => void;
}

export function AppHeader({
  workspaces,
  activeWorkspaceId,
  isWindowMaximized,
  onSwitchWorkspace,
  onCloseWorkspace,
  onCloseWorkspaces,
  onNewWorkspaceFlow,
  onOpenShortcuts,
  onMinimize,
  onMaximize,
  onClose
}: AppHeaderProps) {
  const [fontSize, setFontSize] = useState<number>(12);
  const [fontFamily, setFontFamily] = useState<string>('JetBrains Mono');

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--terminal-font-size', `${fontSize}`);
    root.style.setProperty(
      '--terminal-font-family',
      fontFamily === 'JetBrains Mono'
        ? '"JetBrainsMono Nerd Font", "JetBrains Mono", monospace'
        : fontFamily === 'Fira Code'
          ? '"FiraCode Nerd Font", "Fira Code", monospace'
          : '"MesloLGS NF", "SF Mono", monospace'
    );
    window.dispatchEvent(new Event('cortex-settings-changed'));
  }, [fontSize, fontFamily]);

  const handleCloseOthers = (id: string) => {
    const idsToClose = workspaces.filter(ws => ws.id !== id).map(ws => ws.id);
    if (idsToClose.length > 0) {
      onCloseWorkspaces(idsToClose);
    }
  };

  const handleCloseToRight = (id: string) => {
    const index = workspaces.findIndex(ws => ws.id === id);
    if (index === -1) return;
    const toClose = workspaces.slice(index + 1);
    const idsToClose = toClose.map(ws => ws.id);
    if (idsToClose.length > 0) {
      onCloseWorkspaces(idsToClose);
    }
  };

  return (
    <div
      data-tauri-drag-region
      className="h-9 bg-[var(--header-bg)] flex items-center justify-between border-b border-[var(--border-color)] select-none flex-shrink-0 z-50 cursor-default"
      style={{
        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
        WebkitAppRegion: 'drag',
        paddingLeft: '8px',
        paddingRight: '8px'
      } as any}
    >
      {/* Left Area: Workspace Tabs */}
      <div className="flex items-center gap-1 overflow-hidden flex-1 h-full mr-2">
        <div
          style={{
            maskImage: 'linear-gradient(to right, black 95%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to right, black 95%, transparent 100%)'
          } as any}
          className="flex items-center h-full gap-0.5 overflow-x-auto scrollbar-none flex-1"
        >
          {workspaces.map((ws, idx) => {
            const isActive = activeWorkspaceId === ws.id;
            const isDraft = ws.status !== 'active';

            return (
              <DropdownMenu key={ws.id}>
                <DropdownMenuTrigger>
                  <div
                    onClick={() => onSwitchWorkspace(ws.id)}
                    style={{ WebkitAppRegion: 'no-drag' } as any}
                    className={`btn-tactile group h-7 px-2.5 rounded-md flex items-center gap-2 text-[10px] font-mono tracking-wide cursor-pointer transition-all duration-150 border select-none shrink-0 max-w-[180px] ${
                      isActive && !isDraft
                        ? "bg-[var(--bg-color)] border-[var(--accent-primary)] text-[var(--text-primary)] font-bold shadow-[0_0_8px_rgba(63,185,80,0.1)]"
                        : isActive && isDraft
                          ? "bg-[var(--bg-color)] border-dashed border-[var(--accent-primary)] text-[var(--accent-primary)] font-bold shadow-[0_0_8px_rgba(63,185,80,0.1)]"
                        : "bg-transparent border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-color)]/20 hover:border-[var(--border-color)]/30"
                    }`}
                  >
                    {isActive && <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] shadow-[0_0_4px_var(--accent-primary)] shrink-0 animate-in fade-in zoom-in duration-300" />}

                    <SquareTerminal size={11} className={isActive ? "text-[var(--accent-primary)] shrink-0" : "text-[var(--text-secondary)] shrink-0 opacity-70 group-hover:opacity-100"} />
                    <span className="truncate text-left flex-1">{ws.name ? ws.name : `WS ${idx + 1}`}</span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onCloseWorkspace(ws.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 hover:bg-[var(--border-color)] hover:text-[#F85149] rounded p-0.5 transition-all flex items-center justify-center w-4 h-4 text-[var(--text-secondary)] cursor-pointer shrink-0 ml-auto"
                    >
                      <X size={10} strokeWidth={2.5} />
                    </button>
                  </div>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="start"
                  className="w-56 bg-[var(--surface-color)] border-[var(--border-color)] animate-in p-1.5"
                  style={{ boxShadow: '0 10px 40px rgba(0,0,0,0.6)', zIndex: 1100 }}
                >
                  <DropdownMenuGroup>
                    <DropdownMenuLabel style={{
                      fontSize: '0.65rem',
                      color: 'var(--text-secondary)',
                      letterSpacing: '0.12em',
                      padding: '0.75rem 0.85rem 0.5rem',
                      fontWeight: 700
                    }}>
                      WORKSPACE ACTIONS
                    </DropdownMenuLabel>

                    <DropdownMenuSeparator className="bg-[var(--border-color)] opacity-50 mx-2 mb-1" />

                    <DropdownMenuItem
                      onClick={() => onCloseWorkspace(ws.id)}
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                        padding: '0.6rem 0.85rem',
                        margin: '0.15rem 0',
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        transition: 'all 150ms ease'
                      }}
                      className="hover:bg-[#F85149]/10 hover:text-[#F85149]"
                    >
                      <XCircle size={14} />
                      <span>Close Tab</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => handleCloseOthers(ws.id)}
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                        padding: '0.6rem 0.85rem',
                        margin: '0.15rem 0',
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        transition: 'all 150ms ease'
                      }}
                      className="hover:bg-[var(--border-color)]/40"
                    >
                      <X size={14} />
                      <span>Close Other Tabs</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => handleCloseToRight(ws.id)}
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                        padding: '0.6rem 0.85rem',
                        margin: '0.15rem 0',
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        transition: 'all 150ms ease'
                      }}
                      className="hover:bg-[var(--border-color)]/40"
                    >
                      <ArrowRightCircle size={14} />
                      <span>Close Tabs to the Right</span>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            );
          })}
        </div>

        {/* Fixed New Workspace Button */}
        <div className="flex-shrink-0 flex items-center px-1 border-l border-[var(--border-color)]/30 h-6 ml-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onNewWorkspaceFlow}
            style={{ WebkitAppRegion: 'no-drag' } as any}
            className="w-7 h-7 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-color)] rounded-md transition-all cursor-pointer"
            title="Configure New Workspace (Ctrl+Alt+N)"
          >
            <Plus size={14} />
          </Button>
        </div>

        {/* Global Separator */}
        <div className="w-[1px] h-4 bg-[var(--border-color)] mx-2 opacity-60" />
      </div>

      {/* Right Area: Workspace Configuration, Settings & OS Window Buttons */}
      <div className="flex items-center gap-2 flex-shrink-0 h-full" style={{ WebkitAppRegion: 'no-drag' } as any}>

        {/* Keyboard Shortcuts Dialog Trigger */}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onOpenShortcuts}
          className="btn-tactile w-7 h-7 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-color)] rounded cursor-pointer"
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
              className="btn-tactile w-7 h-7 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-color)] rounded cursor-pointer"
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

        {/* Global Separator */}
        <div className="w-[1px] h-4 bg-[var(--border-color)] mx-2 opacity-60" />

        {/* Standard Window controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onMinimize}
            className="w-7 h-7 flex items-center justify-center hover:bg-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded transition-all cursor-pointer"
            title="Minimize"
          >
            <Minus size={13} />
          </button>
          <button
            onClick={onMaximize}
            className="w-7 h-7 flex items-center justify-center hover:bg-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded transition-all cursor-pointer"
            title={isWindowMaximized ? "Restore" : "Maximize"}
          >
            {isWindowMaximized ? (
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.2">
                <path d="M2.5 1.5h6v6" />
                <rect x="1.5" y="2.5" width="6" height="6" />
              </svg>
            ) : (
              <Square size={11} />
            )}
          </button>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center hover:bg-[#E81123] hover:text-white text-[var(--text-secondary)] rounded transition-all cursor-pointer"
            title="Close"
          >
            <X size={13} />
          </button>
        </div>

      </div>

    </div>
  );
}

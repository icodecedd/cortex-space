import { useState, useMemo } from "react";
import { 
  Minimize2, 
  Palette
} from "lucide-react";
import { TerminalPane } from "./TerminalPane";
import { useIsMobile } from "@/hooks/useIsMobile";
import { getGridTemplate } from "@/lib/setup-utils";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { ThemeName } from "@/hooks/useTheme";

interface SpaceViewProps {
  config: any;
  mode: 'normal' | 'agents';
  theme: string;
  setTheme: (theme: ThemeName) => void;
  onStop: () => void;
}

export function SpaceView({ config, mode, theme, setTheme, onStop }: SpaceViewProps) {
  const [focusedPaneId, setFocusedPaneId] = useState<number | null>(config.panes[0]?.id || null);
  const [isMaximized, setIsMaximized] = useState(false);
  const isMobile = useIsMobile();

  // Find currently focused pane
  const focusedPane = useMemo(() => {
    return config.panes.find((p: any) => p.id === focusedPaneId) || config.panes[0];
  }, [config.panes, focusedPaneId]);

  return (
    <div className="w-full h-full flex flex-col bg-[#09090E] overflow-hidden text-[#C9C9D4] font-sans">
      
      {/* Main Workspace Shell Layout — Terminal Occupies 100% Width */}
      <div className="flex-1 bg-[#09090E] overflow-hidden flex flex-col relative">
        {isMaximized ? (
          <div className="w-full h-full flex flex-col relative">
            <div className="absolute top-2 right-4 z-20 flex items-center gap-1.5">
              <span className="text-[10px] font-mono text-[#6B6B80] bg-[#1C1C22]/80 px-2 py-0.5 rounded border border-[#2A2A35]">
                MAXIMIZED VIEW
              </span>
              <button
                onClick={() => setIsMaximized(false)}
                className="p-1 bg-[#1C1C22] border border-[#2A2A35] hover:bg-[#2A2A35] transition-colors rounded text-[#C9C9D4]"
              >
                <Minimize2 size={11} />
              </button>
            </div>
            <TerminalPane 
              pane={focusedPane}
              isFocused={true}
              onFocus={() => {}}
              rootPath={config.rootPath}
            />
          </div>
        ) : (
          <div className="layout-grid h-full" style={{ 
            gridTemplate: getGridTemplate(config.layout, isMobile), 
            gap: '1px', 
            background: '#2A2A35', 
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
                onMaximize={() => {
                  setFocusedPaneId(pane.id);
                  setIsMaximized(true);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Bottom Footer Bar */}
      <div className="h-9 bg-[#1C1C22] border-t border-[#2A2A35] flex items-center justify-between px-4 flex-shrink-0 select-none">
        
        {/* Left Side: Version, Engine, Active UI & Replay Action */}
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#6B6B80] tracking-wider">
          <span>Cortex Space v0.1.0</span>
          <span className="opacity-40">//</span>
          <span>Engine: {mode.toUpperCase()} MODE</span>
          <span className="opacity-40">//</span>
          <span>UI: {theme.toUpperCase().replace('-', ' ')}</span>
          <button 
            onClick={onStop}
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

      </div>

    </div>
  );
}

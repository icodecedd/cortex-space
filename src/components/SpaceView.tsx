import { useState, useMemo } from "react";
import {
  Minimize2
} from "lucide-react";
import { TerminalPane } from "./TerminalPane";
import { useIsMobile } from "@/hooks/useIsMobile";
import { getGridTemplate } from "@/lib/setup-utils";
import { ThemeName } from "@/hooks/useTheme";

interface SpaceViewProps {
  workspaceId: string;
  config: any;
  mode: 'normal' | 'agents';
  theme: string;
  setTheme: (theme: ThemeName) => void;
  onStop: () => void;
}

export function SpaceView({ workspaceId, config }: SpaceViewProps) {
  const [focusedPaneId, setFocusedPaneId] = useState<number | null>(config.panes[0]?.id || null);
  const [isMaximized, setIsMaximized] = useState(false);
  const isMobile = useIsMobile();

  // Find currently focused pane
  const focusedPane = useMemo(() => {
    return config.panes.find((p: any) => p.id === focusedPaneId) || config.panes[0];
  }, [config.panes, focusedPaneId]);

  return (
    <div className="w-full h-full flex flex-col bg-[var(--bg-color)] overflow-hidden text-[#C9C9D4] font-sans">

      {/* Main Workspace Shell Layout — Terminal Occupies 100% Width */}
      <div className="flex-1 bg-[var(--bg-color)] overflow-hidden flex flex-col relative">
        {isMaximized ? (
          <div className="w-full h-full flex flex-col relative">
            <div className="absolute top-2 right-4 z-20 flex items-center gap-1.5">
              <span className="text-[10px] font-mono text-[var(--text-secondary)] bg-[var(--header-bg)]/80 px-2 py-0.5 rounded border border-[var(--border-color)]">
                MAXIMIZED VIEW
              </span>
              <button
                onClick={() => setIsMaximized(false)}
                className="p-1 bg-[var(--header-bg)] border border-[var(--border-color)] hover:bg-[var(--border-color)] transition-colors rounded text-[var(--text-primary)]"
              >
                <Minimize2 size={11} />
              </button>
            </div>
            <TerminalPane
              workspaceId={workspaceId}
              pane={focusedPane}
              isFocused={true}
              isMultiPane={false}
              onFocus={() => {}}
              rootPath={config.rootPath}
            />
          </div>
        ) : (
          <div className="layout-grid h-full" style={{
            gridTemplate: getGridTemplate(config.layout, isMobile),
            gap: '1px',
            background: 'var(--border-color)',
            flex: 1,
            overflowY: isMobile ? 'auto' : 'hidden'
          }}>
            {config.panes.map((pane: any) => (
              <TerminalPane
                workspaceId={workspaceId}
                key={pane.id}
                pane={pane}
                isFocused={focusedPaneId === pane.id}
                isMultiPane={config.panes.length > 1}
                onFocus={() => setFocusedPaneId(pane.id)}
                rootPath={config.rootPath}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

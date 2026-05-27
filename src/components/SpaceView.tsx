import * as React from "react";
import { useState, useMemo, useEffect } from "react";
import {
  Minimize2
} from "lucide-react";
import { TerminalPane } from "./TerminalPane";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/useIsMobile";
import { gridToLayoutNode, findNeighborPane } from "@/lib/setup-utils";
import { LayoutConfig } from "@/lib/setup-constants";
import { ThemeName } from "@/hooks/useTheme";
import { LayoutNode, PaneNode } from "@/types";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

interface SpaceViewProps {
  workspaceId: string;
  config: {
    rootPath: string;
    layout: string | LayoutNode;
    panes?: any[];
  };
  mode: 'normal' | 'agents';
  theme: string;
  setTheme: (theme: ThemeName) => void;
  onStop: () => void;
  isZenMode: boolean;
  setIsZenMode: (val: boolean) => void;
  zenPadding?: number;
  showPaneHeaders?: boolean;
}

export function SpaceView({ 
  workspaceId, 
  config, 
  isZenMode, 
  zenPadding = 32,
  showPaneHeaders = true
}: SpaceViewProps) {
  // Normalize layout to LayoutNode tree
  const layoutTree = useMemo(() => {
    if (typeof config.layout === 'string') {
      const configObj: LayoutConfig = { rows: 2, cols: 2 };
      if (config.layout === '1x1') { configObj.rows = 1; configObj.cols = 1; }
      else if (config.layout === '1x2') { configObj.rows = 1; configObj.cols = 2; }
      else if (config.layout === '2x1') { configObj.rows = 2; configObj.cols = 1; }
      else if (config.layout === '3x3') { configObj.rows = 3; configObj.cols = 3; }
      return gridToLayoutNode(configObj, config.panes || []);
    }
    return config.layout;
  }, [config.layout, config.panes]);

  const [focusedPaneId, setFocusedPaneId] = useState<string | null>(null);
  const [isMaximized, setIsMaximized] = useState(false);
  const isMobile = useIsMobile();

  // Find all panes to manage focus and maximization
  const allPanes = useMemo(() => {
    const panes: PaneNode[] = [];
    const traverse = (node: LayoutNode) => {
      if (node.type === 'pane') panes.push(node);
      else node.children.forEach(traverse);
    };
    traverse(layoutTree);
    return panes;
  }, [layoutTree]);

  // Set initial focus if not set
  useEffect(() => {
    if (!focusedPaneId && allPanes.length > 0) {
      setFocusedPaneId(allPanes[0].id);
    }
  }, [allPanes, focusedPaneId]);

  const focusedPane = useMemo(() => {
    return allPanes.find(p => p.id === focusedPaneId) || allPanes[0];
  }, [allPanes, focusedPaneId]);

  // Global active session workspace keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Focus Pane (Ctrl/Cmd + [1-9])
      const isNumKey = e.key >= '1' && e.key <= '9';
      if ((e.ctrlKey || e.metaKey) && isNumKey && !e.shiftKey && !e.altKey) {
        const paneNum = parseInt(e.key, 10);
        const targetPane = allPanes[paneNum - 1];
        if (targetPane) {
          e.preventDefault();
          setFocusedPaneId(targetPane.id);
        }
      }

      // 2. Toggle Maximize (Ctrl/Cmd + Shift + M)
      const isM = e.key.toLowerCase() === 'm';
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && isM) {
        e.preventDefault();
        setIsMaximized(prev => !prev);
      }

      // 3. Directional Navigation (Cmd/Ctrl + Opt + Arrows)
      const isArrow = e.key.startsWith('Arrow');
      const isMod = (e.ctrlKey || e.metaKey) && e.altKey;
      if (isMod && isArrow && focusedPaneId) {
        e.preventDefault();
        const dir = e.key.slice(5).toLowerCase() as 'up' | 'down' | 'left' | 'right';
        const neighborId = findNeighborPane(layoutTree, focusedPaneId, dir);
        if (neighborId) {
          setFocusedPaneId(neighborId);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [allPanes, focusedPaneId, layoutTree]);

  // Recursive Layout Renderer
  const renderLayout = (node: LayoutNode): React.ReactNode => {
    if (node.type === 'pane') {
      return (
        <TerminalPane
          workspaceId={workspaceId}
          pane={{
            id: parseInt(node.id),
            name: node.name,
            command: node.command,
            isCustom: true
          }}
          isFocused={focusedPaneId === node.id}
          isMultiPane={allPanes.length > 1}
          onFocus={() => setFocusedPaneId(node.id)}
          rootPath={config.rootPath}
          isZenMode={isZenMode}
          showPaneHeader={showPaneHeaders}
        />
      );
    }

    const orientation = node.direction === 'horizontal' ? 'horizontal' : 'vertical';

    return (
      <ResizablePanelGroup orientation={orientation} className="h-full w-full">
        <ResizablePanel defaultSize={node.ratio * 100}>
          {renderLayout(node.children[0])}
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={(1 - node.ratio) * 100}>
          {renderLayout(node.children[1])}
        </ResizablePanel>
      </ResizablePanelGroup>
    );
  };

  return (
    <div className="w-full h-full flex flex-col bg-[var(--bg-color)] overflow-hidden text-[#C9C9D4] font-sans">
      <div className="flex-1 bg-[var(--bg-color)] overflow-hidden flex flex-col relative">
        {isZenMode ? (
          <div 
            className="w-full h-full flex flex-col relative animate-in fade-in duration-300"
            style={{ padding: `${zenPadding}px` }}
          >
            {focusedPane && (
              <TerminalPane
                workspaceId={workspaceId}
                pane={{
                  id: parseInt(focusedPane.id),
                  name: focusedPane.name,
                  command: focusedPane.command,
                  isCustom: true
                }}
                isFocused={true}
                isMultiPane={false}
                onFocus={() => {}}
                rootPath={config.rootPath}
                isZenMode={true}
                showPaneHeader={showPaneHeaders}
              />
            )}
          </div>
        ) : isMaximized ? (
          <div className="w-full h-full flex flex-col relative">
            <div className="absolute top-2 right-4 z-20 flex items-center gap-1.5">
              <span className="text-[10px] font-mono text-[var(--text-secondary)] bg-[var(--header-bg)]/80 px-2 py-0.5 rounded border border-[var(--border-color)]">
                MAXIMIZED VIEW
              </span>
              <Button
                variant="outline"
                size="icon-xs"
                onClick={() => setIsMaximized(false)}
                className="p-1 bg-[var(--header-bg)] border-[var(--border-color)] hover:bg-[var(--border-color)] transition-colors rounded text-[var(--text-primary)]"
              >
                <Minimize2 size={11} />
              </Button>
            </div>
            {focusedPane && (
              <TerminalPane
                workspaceId={workspaceId}
                pane={{
                  id: parseInt(focusedPane.id),
                  name: focusedPane.name,
                  command: focusedPane.command,
                  isCustom: true
                }}
                isFocused={true}
                isMultiPane={false}
                onFocus={() => {}}
                rootPath={config.rootPath}
                showPaneHeader={showPaneHeaders}
              />
            )}
          </div>
        ) : (
          <div className="flex-1 overflow-hidden">
            {isMobile ? (
               <div className="h-full overflow-y-auto bg-[var(--border-color)] flex flex-col gap-[1px]">
                  {allPanes.map(pane => (
                    <div key={pane.id} className="h-[300px] shrink-0">
                      <TerminalPane
                        workspaceId={workspaceId}
                        pane={{
                          id: parseInt(pane.id),
                          name: pane.name,
                          command: pane.command,
                          isCustom: true
                        }}
                        isFocused={focusedPaneId === pane.id}
                        isMultiPane={allPanes.length > 1}
                        onFocus={() => setFocusedPaneId(pane.id)}
                        rootPath={config.rootPath}
                        showPaneHeader={showPaneHeaders}
                      />
                    </div>
                  ))}
               </div>
            ) : (
              renderLayout(layoutTree)
            )}
          </div>
        )}
      </div>
    </div>
  );
}

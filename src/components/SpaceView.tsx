import * as React from "react";
import { useState, useMemo, useEffect } from "react";
import { TerminalPane } from "./TerminalPane";
import { useIsMobile } from "@/hooks/useIsMobile";
import { gridToLayoutNode, findNeighborPane } from "@/lib/setup-utils";
import { LayoutConfig } from "@/lib/setup-constants";
import { ThemeName } from "@/hooks/useTheme";
import { LayoutNode, PaneNode } from "@/types";
import { getSettingsGroup, SHORTCUT_DEFAULTS, ShortcutSettings } from "@/lib/store";
import { matchesShortcut } from "@/lib/shortcut-utils";
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
  onSplitPane?: (paneId: string, direction: 'horizontal' | 'vertical') => void;
  onKillPane?: (paneId: string) => void;
  onRenamePane?: (paneId: string, newName: string) => void;
  onSaveSnippet?: (command: string) => void;
}

export function SpaceView({
  workspaceId,
  config,
  isZenMode,
  zenPadding = 32,
  onSplitPane,
  onKillPane,
  onRenamePane,
  onSaveSnippet
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
  const [shortcuts, setShortcuts] = useState<ShortcutSettings>(SHORTCUT_DEFAULTS);
  const isMobile = useIsMobile();

  useEffect(() => {
    getSettingsGroup<ShortcutSettings>('shortcuts', SHORTCUT_DEFAULTS).then(setShortcuts);
  }, []);

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

      // 3. Directional Navigation (Alt + Arrows)
      const isArrow = e.key.startsWith('Arrow');
      const isAlt = e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey;
      if (isAlt && isArrow && focusedPaneId) {
        e.preventDefault();
        const dir = e.key.slice(5).toLowerCase() as 'up' | 'down' | 'left' | 'right';
        const neighborId = findNeighborPane(layoutTree, focusedPaneId, dir);
        if (neighborId) {
          setFocusedPaneId(neighborId);
        }
      }

      // 4. Pane Management (Reset / Close)
      if (focusedPaneId) {
        if (matchesShortcut(e, shortcuts.resetPane)) {
          // Reset is handled by the terminal itself via its own listener
          // but we can add it here if we had a way to trigger it.
          // Since it's handled in XtermTerminal, we don't necessarily need it here
          // UNLESS the terminal is not focused.
        } else if (matchesShortcut(e, shortcuts.closePane)) {
          e.preventDefault();
          onKillPane?.(focusedPaneId);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [allPanes, focusedPaneId, layoutTree, shortcuts, onKillPane]);

  const renderTerminalPane = (pane: PaneNode, isForcedFocus = false) => {
    const pIndex = allPanes.findIndex(p => p.id === pane.id);
    return (
      <TerminalPane
        key={pane.id}
        workspaceId={workspaceId}
        pane={{
          id: pane.id,
          name: pane.name,
          command: pane.command,
          isCustom: true
        }}
        isFocused={isForcedFocus || focusedPaneId === pane.id}
        index={pIndex}
        isMultiPane={allPanes.length > 1}
        onFocus={() => setFocusedPaneId(pane.id)}
        rootPath={config.rootPath}
        isZenMode={isZenMode}
        zenPadding={zenPadding}
        isMaximized={isMaximized}
        onMaximize={() => {
          setFocusedPaneId(pane.id);
          setIsMaximized(!isMaximized);
        }}
        onSplit={onSplitPane}
        onKill={onKillPane}
        onRename={onRenamePane}
        onSaveSnippet={onSaveSnippet}
      />
    );
  };

  // Recursive Layout Renderer
  const renderLayout = (node: LayoutNode): React.ReactNode => {
    if (node.type === 'pane') {
      return renderTerminalPane(node);
    }

    const direction = node.direction;
    const orientation = direction === 'horizontal' ? 'horizontal' : 'vertical';

    const getFirstPaneId = (n: LayoutNode): string => {
      if (n.type === 'pane') return n.id;
      return getFirstPaneId(n.children[0]);
    };

    const collectPanes = (
      currentNode: LayoutNode,
      targetDir: 'horizontal' | 'vertical',
      ratioMultiplier: number = 1
    ): { node: LayoutNode; size: number }[] => {
      if (currentNode.type === 'pane') {
        return [{ node: currentNode, size: ratioMultiplier * 100 }];
      }

      if (currentNode.direction === targetDir) {
        return [
          ...collectPanes(currentNode.children[0], targetDir, ratioMultiplier * currentNode.ratio),
          ...collectPanes(currentNode.children[1], targetDir, ratioMultiplier * (1 - currentNode.ratio))
        ];
      }

      return [{ node: currentNode, size: ratioMultiplier * 100 }];
    };

    const flatPanes = collectPanes(node, direction);

    return (
      <ResizablePanelGroup orientation={orientation} className="h-full w-full">
        {flatPanes.map((item, index) => {
          const key = item.node.type === 'pane' ? item.node.id : `split-${getFirstPaneId(item.node)}`;
          return (
            <React.Fragment key={key}>
              <ResizablePanel defaultSize={item.size} minSize={100}>
                {renderLayout(item.node)}
              </ResizablePanel>
              {index < flatPanes.length - 1 && <ResizableHandle />}
            </React.Fragment>
          );
        })}
      </ResizablePanelGroup>
    );
  };

  return (
    <div className="space-view-container w-full h-full flex flex-col bg-[var(--bg-color)] overflow-hidden text-[var(--text-secondary)] font-sans">
      <div className="flex-1 bg-[var(--bg-color)] overflow-hidden flex flex-col relative">
        {isMobile ? (
           <div className="h-full overflow-y-auto bg-[var(--border-color)] flex flex-col gap-[1px]">
              {allPanes.map((pane) => (
                <div key={pane.id} className="h-[300px] shrink-0">
                  {renderTerminalPane(pane)}
                </div>
              ))}
           </div>
        ) : (
          renderLayout(layoutTree)
        )}
      </div>
    </div>
  );
}

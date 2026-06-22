import * as React from "react";
import { useState, useMemo, useEffect, useCallback } from "react";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { TerminalPane } from "../terminal/TerminalPane";
import { DropZone } from "./components/DropZone";
import { useIsMobile } from "@/hooks/useIsMobile";
import { findNeighborPane } from "@/lib/setup-utils";
import { ThemeName } from "@/hooks/useTheme";
import { LayoutNode, PaneNode } from "@/lib";
import {
  getSettingsGroup,
  SHORTCUT_DEFAULTS,
  ShortcutSettings,
} from "@/lib/store";
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
  mode: "normal" | "agents";
  theme: string;
  setTheme: (theme: ThemeName) => void;
  onStop: () => void;
  isZenMode: boolean;
  setIsZenMode: (val: boolean) => void;
  zenPadding?: number;
  showPaneHeaders?: boolean;
  onSplitPane?: (paneId: string, direction: "horizontal" | "vertical") => void;
  onMovePane?: (
    dragId: string,
    dropId: string,
    direction: "top" | "bottom" | "left" | "right",
  ) => void;
  onKillPane?: (paneId: string) => void;
  onRenamePane?: (paneId: string, newName: string) => void;
}

interface DropData {
  direction: "top" | "bottom" | "left" | "right";
}

export const SpaceView = React.memo(
  ({
    workspaceId,
    config,
    isZenMode,
    zenPadding = 32,
    onSplitPane,
    onMovePane,
    onKillPane,
    onRenamePane,
    isCurrent,
  }: SpaceViewProps & { isCurrent: boolean }) => {
    const isMobile = useIsMobile();
    const [activeDragId, setActiveDragId] = useState<string | null>(null);
    const [focusedPaneId, setFocusedPaneId] = useState<string | null>(null);
    const [isMaximized, setIsMaximized] = useState(false);
    const [shortcuts, setShortcuts] =
      useState<ShortcutSettings>(SHORTCUT_DEFAULTS);

    useEffect(() => {
      getSettingsGroup<ShortcutSettings>("shortcuts", SHORTCUT_DEFAULTS).then(
        setShortcuts,
      );
    }, []);

    const sensors = useSensors(
      useSensor(PointerSensor, {
        activationConstraint: {
          distance: 8,
        },
      }),
    );

    const layoutTree = useMemo(() => {
      if (typeof config.layout === "string") {
        try {
          return JSON.parse(config.layout) as LayoutNode;
        } catch (e) {
          console.error("Failed to parse layout JSON", e);
          return {
            type: "pane",
            id: "1",
            name: "Terminal",
            command: "",
          } as PaneNode;
        }
      }
      return config.layout as LayoutNode;
    }, [config.layout]);

    const allPanes = useMemo(() => {
      const panes: PaneNode[] = [];
      const traverse = (node: LayoutNode) => {
        if (node.type === "pane") {
          panes.push(node);
        } else {
          node.children.forEach(traverse);
        }
      };
      traverse(layoutTree);
      return panes;
    }, [layoutTree]);

    // Set initial focus if none
    useEffect(() => {
      if (!focusedPaneId && allPanes.length > 0) {
        setFocusedPaneId(allPanes[0].id);
      }
    }, [allPanes, focusedPaneId]);

    // Global active session workspace keyboard shortcuts
    useEffect(() => {
      if (!isCurrent) return; // ONLY attach listener if this is the visible workspace

      const handleKeyDown = (e: KeyboardEvent) => {
        // ...
        // 1. Focus Pane (Ctrl/Cmd + [1-9])
        const isNumKey = e.key >= "1" && e.key <= "9";
        if ((e.ctrlKey || e.metaKey) && isNumKey && !e.shiftKey && !e.altKey) {
          const paneNum = parseInt(e.key, 10);
          const targetPane = allPanes[paneNum - 1];
          if (targetPane) {
            e.preventDefault();
            setFocusedPaneId(targetPane.id);
          }
        }

        // 2. Toggle Maximize (Ctrl/Cmd + Shift + M)
        const isM = e.key.toLowerCase() === "m";
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && isM) {
          e.preventDefault();
          setIsMaximized((prev) => !prev);
        }

        // 3. Directional Navigation (Alt + Arrows)
        const isArrow = e.key.startsWith("Arrow");
        const isAlt = e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey;
        if (isAlt && isArrow && focusedPaneId) {
          e.preventDefault();
          const dir = e.key.slice(5).toLowerCase() as
            | "up"
            | "down"
            | "left"
            | "right";
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

      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }, [allPanes, focusedPaneId, layoutTree, shortcuts, onKillPane]);

    const handleDragStart = (event: DragStartEvent) => {
      setActiveDragId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveDragId(null);

      if (over && active.id !== over.id) {
        const overData = over.data.current as unknown as DropData;
        const dropDirection = overData?.direction || "right";

        onMovePane?.(active.id as string, over.id as string, dropDirection);
      }
    };

    const renderTerminalPane = useCallback(
      (pane: PaneNode, isForcedFocus = false) => {
        const pIndex = allPanes.findIndex((p) => p.id === pane.id);
        return (
          <DropZone id={pane.id} activeDragId={activeDragId}>
            <TerminalPane
              key={pane.id}
              workspaceId={workspaceId}
              pane={{
                id: pane.id,
                name: pane.name,
                command: pane.command,
                isCustom: true,
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
            />
          </DropZone>
        );
      },
      [
        workspaceId,
        activeDragId,
        allPanes,
        focusedPaneId,
        config.rootPath,
        isZenMode,
        zenPadding,
        isMaximized,
        onSplitPane,
        onKillPane,
        onRenamePane,
      ],
    );

    // Recursive Layout Renderer
    const renderLayout = (node: LayoutNode): React.ReactNode => {
      if (node.type === "pane") {
        return renderTerminalPane(node);
      }

      const direction = node.direction;
      const orientation =
        direction === "horizontal" ? "horizontal" : "vertical";

      const getFirstPaneId = (n: LayoutNode): string => {
        if (n.type === "pane") return n.id;
        return getFirstPaneId(n.children[0]);
      };

      const collectPanes = (
        currentNode: LayoutNode,
        targetDir: "horizontal" | "vertical",
        ratioMultiplier: number = 1,
      ): { node: LayoutNode; size: number }[] => {
        if (currentNode.type === "pane") {
          return [{ node: currentNode, size: ratioMultiplier * 100 }];
        }

        if (currentNode.direction === targetDir) {
          return [
            ...collectPanes(
              currentNode.children[0],
              targetDir,
              ratioMultiplier * currentNode.ratio,
            ),
            ...collectPanes(
              currentNode.children[1],
              targetDir,
              ratioMultiplier * (1 - currentNode.ratio),
            ),
          ];
        }

        return [{ node: currentNode, size: ratioMultiplier * 100 }];
      };

      const flatPanes = collectPanes(node, direction);

      return (
        <ResizablePanelGroup
          orientation={orientation}
          className="h-full w-full"
        >
          {flatPanes.map((item, index) => {
            const key =
              item.node.type === "pane"
                ? item.node.id
                : `split-${getFirstPaneId(item.node)}`;
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
          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            {isMobile ? (
              <div className="h-full overflow-y-auto bg-[var(--border-color)] flex flex-col gap-[1px]">
                {allPanes.map((pane) => (
                  <div key={pane.id} className="h-[300px] shrink-0">
                    {renderTerminalPane(pane)}
                  </div>
                ))}
              </div>
            ) : isMaximized && focusedPaneId ? (
              // Maximized mode: render only the focused pane at full size, bypassing
              // the resizable layout so handles and non-focused panes don't appear.
              (() => {
                const focusedPane = allPanes.find(
                  (p) => p.id === focusedPaneId,
                );
                if (focusedPane) {
                  return renderTerminalPane(focusedPane, true);
                }
                return renderLayout(layoutTree);
              })()
            ) : (
              renderLayout(layoutTree)
            )}
          </DndContext>
        </div>
      </div>
    );
  },
);

import * as React from "react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { XtermTerminal } from "./components/XtermTerminal";

interface TerminalPaneProps {
  workspaceId: string;
  pane: any;
  isFocused: boolean;
  index: number;
  isMultiPane?: boolean;
  onFocus: () => void;
  rootPath?: string;
  isZenMode?: boolean;
  zenPadding?: number;
  isMaximized?: boolean;
  onMaximize?: () => void;
  onSplit?: (id: string, direction: 'horizontal' | 'vertical') => void;
  onKill?: (id: string) => void;
  onRename?: (id: string, newName: string) => void;
  }

  export const TerminalPane = React.memo(({
  workspaceId,
  pane,
  isFocused,
  index,
  isMultiPane,
  onFocus,
  rootPath,
  isZenMode,
  zenPadding,
  isMaximized,
  onMaximize,
  onSplit,
  onKill,
  onRename,
  }: TerminalPaneProps) => {

  const [fixedCoords, setFixedCoords] = useState<{ top: number; left: number; width: number; height: number } | null>(null);

  useEffect(() => {
    if ((isMaximized || isZenMode) && isFocused) {
      const updateCoords = () => {
        const el = document.querySelector('.space-view-container');
        if (el) {
          const rect = el.getBoundingClientRect();
          setFixedCoords({
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height
          });
        }
      };

      updateCoords();
      window.addEventListener('resize', updateCoords);

      const timer = setTimeout(updateCoords, 100);

      return () => {
        window.removeEventListener('resize', updateCoords);
        clearTimeout(timer);
      };
    } else {
      setFixedCoords(null);
    }
  }, [isMaximized, isZenMode, isFocused]);

  const isHidden = (isMaximized || isZenMode) && !isFocused;

  const paneContent = (
    <div
      className="pane"
      onClick={() => {
        onFocus();
        // The XtermTerminal component already handles focus when isFocused changes,
        // but ensuring onFocus is called on click is key.
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onFocus();
      }}
      tabIndex={isHidden ? -1 : 0}
      role="region"
      aria-label={`Terminal Pane: ${pane.name || pane.command || 'Idle'}`}
      style={{
        background: 'var(--bg-color)',
        borderRadius: 0,
        transition: 'all var(--duration-normal) var(--ease-out)',
        boxShadow: isFocused
          ? 'inset 0 0 60px rgba(var(--accent-primary-rgb), 0.05)'
          : 'none',
        outline: 'none',
        display: 'flex',
        flexDirection: 'column',

        // CSS Positioning overrides for maximize/zen mode
        position: isZenMode ? 'fixed' : (fixedCoords ? 'fixed' : 'relative'),
        top: isZenMode ? '0px' : (fixedCoords ? `${fixedCoords.top}px` : 'auto'),
        left: isZenMode ? '0px' : (fixedCoords ? `${fixedCoords.left}px` : 'auto'),
        width: isZenMode ? '100vw' : (fixedCoords ? `${fixedCoords.width}px` : '100%'),
        height: isZenMode ? '100vh' : (fixedCoords ? `${fixedCoords.height}px` : '100%'),
        zIndex: isZenMode ? 99999 : (fixedCoords ? 1000 : (isFocused ? 10 : 1)),
        padding: isZenMode ? `${zenPadding}px` : '0px',
        visibility: isHidden ? 'hidden' : 'visible',
        overflow: 'hidden'
      }}
      >
      {/* Focus Overlay for Animated Ring */}
      <div className="focus-overlay" style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 5,
        border: (isFocused && isMultiPane && !isMaximized) ? '1.5px solid var(--accent-primary)' : '1px solid transparent',
        opacity: isFocused ? 1 : 0,
        transition: 'all var(--duration-fast) var(--ease-out)',
        boxShadow: (isFocused && !isMaximized) ? 'inset 0 0 15px rgba(var(--accent-primary-rgb), 0.1)' : 'none'
      }} />


      <div
        className="pane-content"
        style={{
          borderRadius: 0,
          position: 'relative',
          overflow: 'hidden',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          background: (isFocused && !isZenMode) ? 'rgba(255,255,255,0.01)' : 'transparent',
          transition: 'background var(--duration-normal) var(--ease-out)'
        }}
      >
        <XtermTerminal
          id={`${workspaceId}-${pane.id}`}
          paneId={pane.id}
          isFocused={isFocused}
          index={index}
          command={pane.command}
          cwd={rootPath}
          isZenMode={isZenMode}
          isMaximized={isMaximized}
          onMaximize={onMaximize}
          name={pane.name}
          onSplit={onSplit}
          onKill={onKill}
          onRename={onRename}
        />
      </div>
    </div>
  );

  if (isZenMode && !isHidden) {
    return createPortal(paneContent, document.body);
  }

  return paneContent;
});

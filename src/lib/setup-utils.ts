export function getPaneCount(layout: string) {
  switch (layout) {
    case '1x1': return 1;
    case '1x2':
    case '2x1': return 2;
    case '2x2': return 4;
    case '3x3': return 9;
    default: return 4;
  }
}

export function getGridCols(layout: string) {
  if (layout === '1x1') return '1fr';
  if (layout === '1x2') return '1fr 1fr';
  if (layout === '2x1') return '1fr';
  if (layout === '2x2') return '1fr 1fr';
  if (layout === '3x3') return '1fr 1fr 1fr';
  return '1fr 1fr';
}

export function getGridRows(layout: string) {
  if (layout === '1x1') return '1fr';
  if (layout === '1x2') return '1fr';
  if (layout === '2x1') return '1fr 1fr';
  if (layout === '2x2') return '1fr 1fr';
  if (layout === '3x3') return '1fr 1fr 1fr';
  return '1fr 1fr';
}

export function getGridTemplate(layout: string, isMobile: boolean) {
  if (isMobile) return '1fr / 1fr';
  switch (layout) {
    case '1x1': return '1fr / 1fr';
    case '1x2': return '1fr / 1fr 1fr';
    case '2x1': return '1fr 1fr / 1fr';
    case '2x2': return '1fr 1fr / 1fr 1fr';
    case '3x3': return '1fr 1fr 1fr / 1fr 1fr 1fr';
    default: return '1fr 1fr / 1fr 1fr';
  }
}

import { LayoutNode, PaneNode } from "@/types";
import { PaneConfig } from "./setup-constants";

export function flattenLayoutToGrid(layout: LayoutNode): { panes: PaneConfig[], layout: string } {
  const panes: PaneConfig[] = [];
  
  const traverse = (node: LayoutNode) => {
    if (node.type === 'pane') {
      const paneNode = node as PaneNode;
      panes.push({
        id: parseInt(paneNode.id) || panes.length + 1,
        name: paneNode.name,
        command: paneNode.command,
        isCustom: true
      });
    } else {
      node.children.forEach(traverse);
    }
  };

  traverse(layout);

  // Map count back to rigid grid strings
  let layoutStr = '2x2';
  if (panes.length === 1) layoutStr = '1x1';
  else if (panes.length === 2) layoutStr = '1x2'; // Default to 2 columns
  else if (panes.length <= 4) layoutStr = '2x2';
  else layoutStr = '3x3';

  return { panes, layout: layoutStr };
}

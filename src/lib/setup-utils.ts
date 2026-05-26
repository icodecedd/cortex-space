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

import { LayoutNode, SplitNode } from "@/types";
import { PaneConfig } from "./setup-constants";

export function gridToLayoutNode(layout: string, panes: PaneConfig[]): LayoutNode {
  if (layout === '1x1' || panes.length <= 1) {
    return {
      type: 'pane',
      id: panes[0]?.id.toString() || '1',
      name: panes[0]?.name || 'Pane 1',
      command: panes[0]?.command || ''
    };
  }

  if (layout === '1x2') {
    return {
      type: 'split',
      direction: 'horizontal',
      ratio: 0.5,
      children: [
        { type: 'pane', id: panes[0].id.toString(), name: panes[0].name, command: panes[0].command },
        { type: 'pane', id: panes[1].id.toString(), name: panes[1].name, command: panes[1].command }
      ]
    };
  }

  if (layout === '2x1') {
    return {
      type: 'split',
      direction: 'vertical',
      ratio: 0.5,
      children: [
        { type: 'pane', id: panes[0].id.toString(), name: panes[0].name, command: panes[0].command },
        { type: 'pane', id: panes[1].id.toString(), name: panes[1].name, command: panes[1].command }
      ]
    };
  }

  if (layout === '2x2') {
    return {
      type: 'split',
      direction: 'vertical',
      ratio: 0.5,
      children: [
        {
          type: 'split',
          direction: 'horizontal',
          ratio: 0.5,
          children: [
            { type: 'pane', id: panes[0].id.toString(), name: panes[0].name, command: panes[0].command },
            { type: 'pane', id: panes[1].id.toString(), name: panes[1].name, command: panes[1].command }
          ]
        },
        {
          type: 'split',
          direction: 'horizontal',
          ratio: 0.5,
          children: [
            { type: 'pane', id: panes[2].id.toString(), name: panes[2].name, command: panes[2].command },
            { type: 'pane', id: panes[3].id.toString(), name: panes[3].name, command: panes[3].command }
          ]
        }
      ]
    };
  }

  // Fallback for 3x3 or others: just return a nested mess or the first pane
  return {
    type: 'pane',
    id: panes[0]?.id.toString() || '1',
    name: panes[0]?.name || 'Pane 1',
    command: panes[0]?.command || ''
  };
}

export function findNeighborPane(
  root: LayoutNode,
  currentId: string,
  direction: 'up' | 'down' | 'left' | 'right'
): string | null {
  // 1. Build a map of parent pointers and find the current node
  const parentMap = new Map<LayoutNode, { parent: LayoutNode, index: number }>();
  let currentNode: LayoutNode | null = null;

  const traverse = (node: LayoutNode, parent?: LayoutNode, index?: number) => {
    if (parent !== undefined && index !== undefined) {
      parentMap.set(node, { parent, index });
    }
    if (node.type === 'pane' && node.id === currentId) {
      currentNode = node;
    }
    if (node.type === 'split') {
      node.children.forEach((child, i) => traverse(child, node, i));
    }
  };

  traverse(root);

  if (!currentNode) return null;

  // 2. Map directions to split types and sibling indices
  // 'left'/'right' -> orientation 'horizontal', move between index 0 and 1
  // 'up'/'down' -> orientation 'vertical', move between index 0 and 1
  const targetDirection = (direction === 'left' || direction === 'right') ? 'horizontal' : 'vertical';
  const targetIndex = (direction === 'left' || direction === 'up') ? 1 : 0; // If moving left/up, we want to be coming from index 1 to go to index 0

  let searchNode: LayoutNode = currentNode;
  while (true) {
    const parentInfo = parentMap.get(searchNode);
    if (!parentInfo) break; // Reached root

    const { parent, index } = parentInfo;
    const split = parent as SplitNode;

    if (split.direction === targetDirection && index === targetIndex) {
      // Found the split level where we can move to the sibling
      const siblingIndex = targetIndex === 1 ? 0 : 1;
      const siblingNode = split.children[siblingIndex];

      // 3. Find the most "logical" leaf pane in the sibling branch
      // If we move right, we want the leftmost pane of the right sibling.
      // If we move left, we want the rightmost pane of the left sibling.
      return findDeepestPane(siblingNode, direction);
    }

    searchNode = parent;
  }

  return null;
}

function findDeepestPane(node: LayoutNode, fromDirection: 'up' | 'down' | 'left' | 'right'): string {
  if (node.type === 'pane') return node.id;

  // Heuristic: If we moved 'right' into a new branch, we want the 'leftmost' pane.
  // If we moved 'left', we want the 'rightmost'.
  // If we moved 'down', we want the 'topmost' (index 0).
  // If we moved 'up', we want the 'bottommost' (index 1).
  
  let nextIndex = 0;
  if (fromDirection === 'left' || fromDirection === 'up') {
    nextIndex = 1; // We want the one closest to where we came from
  } else {
    nextIndex = 0;
  }

  return findDeepestPane(node.children[nextIndex], fromDirection);
}

import { LayoutConfig, PaneConfig } from "./setup-constants";
import { LayoutNode, SplitNode, PaneNode } from "@/types";

export function getPaneCount(layout: LayoutConfig) {
  return layout.rows * layout.cols;
}

export function getGridCols(layout: LayoutConfig) {
  return `repeat(${layout.cols}, 1fr)`;
}

export function getGridRows(layout: LayoutConfig) {
  return `repeat(${layout.rows}, 1fr)`;
}

export function getGridTemplate(layout: LayoutConfig, isMobile: boolean) {
  if (isMobile) return '1fr / 1fr';
  return `repeat(${layout.rows}, 1fr) / repeat(${layout.cols}, 1fr)`;
}

export function gridToLayoutNode(config: LayoutConfig, panes: PaneConfig[]): LayoutNode {
  const { rows, cols } = config;

  if (rows === 1 && cols === 1) {
    return {
      type: 'pane',
      id: panes[0]?.id.toString() || '1',
      name: panes[0]?.name || 'Pane 1',
      command: panes[0]?.command || ''
    };
  }

  // Helper to build a tree from a slice of panes
  const buildGridTree = (paneSlice: PaneConfig[], r: number, c: number): LayoutNode => {
    if (paneSlice.length === 1) {
      return {
        type: 'pane',
        id: paneSlice[0].id.toString(),
        name: paneSlice[0].name,
        command: paneSlice[0].command
      };
    }

    // If more than 1 row, split vertically first
    if (r > 1) {
      const splitRow = Math.ceil(r / 2);
      const topCount = splitRow * c;
      return {
        type: 'split',
        direction: 'vertical',
        ratio: splitRow / r,
        children: [
          buildGridTree(paneSlice.slice(0, topCount), splitRow, c),
          buildGridTree(paneSlice.slice(topCount), r - splitRow, c)
        ]
      };
    }

    // If only 1 row but multiple columns, split horizontally
    const splitCol = Math.ceil(c / 2);
    return {
      type: 'split',
      direction: 'horizontal',
      ratio: splitCol / c,
      children: [
        buildGridTree(paneSlice.slice(0, splitCol), 1, splitCol),
        buildGridTree(paneSlice.slice(splitCol), 1, c - splitCol)
      ]
    };
  };

  return buildGridTree(panes.slice(0, rows * cols), rows, cols);
}

/**
 * Recursively find a pane by ID and replace it with a split containing the original and a new pane.
 */
export function splitNode(root: LayoutNode, targetId: string, direction: 'horizontal' | 'vertical'): LayoutNode {
  if (root.type === 'pane') {
    if (root.id === targetId) {
      const newPane: LayoutNode = {
        type: 'pane',
        id: `${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        name: 'New Pane',
        command: ''
      };
      return {
        type: 'split',
        direction,
        ratio: 0.5,
        children: [root, newPane]
      };
    }
    return root;
  }

  return {
    ...root,
    children: [
      splitNode(root.children[0], targetId, direction),
      splitNode(root.children[1], targetId, direction)
    ]
  };
}

/**
 * Recursively find and remove a pane by ID. 
 * If the parent is a split, replace the split with the sibling of the removed pane.
 */
export function removeNode(root: LayoutNode, targetId: string): LayoutNode | null {
  if (root.type === 'pane') {
    return root.id === targetId ? null : root;
  }

  const left = removeNode(root.children[0], targetId);
  const right = removeNode(root.children[1], targetId);

  if (left === null) return right;
  if (right === null) return left;

  return {
    ...root,
    children: [left, right]
  };
}

/**
 * Recursively find a pane by ID and apply updates.
 */
export function updatePaneNode(root: LayoutNode, targetId: string, updates: Partial<PaneNode>): LayoutNode {
  if (root.type === 'pane') {
    if (root.id === targetId) {
      return { ...root, ...updates };
    }
    return root;
  }

  return {
    ...root,
    children: [
      updatePaneNode(root.children[0], targetId, updates),
      updatePaneNode(root.children[1], targetId, updates)
    ]
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
  const targetDirection = (direction === 'left' || direction === 'right') ? 'horizontal' : 'vertical';
  const targetIndex = (direction === 'left' || direction === 'up') ? 1 : 0;

  let searchNode: LayoutNode = currentNode;
  while (true) {
    const parentInfo = parentMap.get(searchNode);
    if (!parentInfo) break; // Reached root

    const { parent, index } = parentInfo;
    const split = parent as SplitNode;

    if (split.direction === targetDirection && index === targetIndex) {
      const siblingIndex = targetIndex === 1 ? 0 : 1;
      const siblingNode = split.children[siblingIndex];
      return findDeepestPane(siblingNode, direction);
    }

    searchNode = parent;
  }

  return null;
}

function findDeepestPane(node: LayoutNode, fromDirection: 'up' | 'down' | 'left' | 'right'): string {
  if (node.type === 'pane') return node.id;

  let nextIndex = 0;
  if (fromDirection === 'left' || fromDirection === 'up') {
    nextIndex = 1; 
  } else {
    nextIndex = 0;
  }

  return findDeepestPane(node.children[nextIndex], fromDirection);
}

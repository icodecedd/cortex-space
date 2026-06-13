import { LayoutConfig, PaneConfig } from "./setup-constants";
import { LayoutNode, SplitNode, PaneNode, Agent } from "@/types";
import { PANE_SEMANTICS } from "./content";
import { SemanticsSettings, SEMANTICS_DEFAULTS } from "./store";

export function getPaneCount(layout: LayoutConfig) {
  if (!layout) return 1;
  if (layout.type === 'grid') {
    return (layout.rows || 1) * (layout.cols || 1);
  }
  if (layout.type === 'count') {
    return layout.value || 1;
  }
  // Legacy fallback
  if ('rows' in layout && 'cols' in layout) {
    return (layout as any).rows * (layout as any).cols;
  }
  return 1;
}

export function getGridCols(layout: LayoutConfig) {
  if (!layout) return '1fr';
  if (layout.type === 'grid') {
    return `repeat(${layout.rows || 1}, 1fr)`;
  }
  return '1fr';
}

export function getGridRows(layout: LayoutConfig) {
  if (!layout) return '1fr';
  if (layout.type === 'grid') {
    return `repeat(${layout.rows || 1}, 1fr)`;
  }
  return '1fr';
}

export function getGridTemplate(layout: LayoutConfig, isMobile: boolean) {
  if (isMobile) return '1fr / 1fr';
  if (layout.type === 'grid') {
    return `repeat(${layout.rows}, 1fr) / repeat(${layout.cols}, 1fr)`;
  }
  return '1fr / 1fr';
}

export function configToLayoutNode(config: LayoutConfig, panes: PaneConfig[]): LayoutNode {
  if (config.type === 'grid') {
    return gridToLayoutNode(config.rows, config.cols, panes);
  } else {
    return countToLayoutNode(config.value, panes);
  }
}

function gridToLayoutNode(rows: number, cols: number, panes: PaneConfig[]): LayoutNode {
  if (rows === 1 && cols === 1) {
    return {
      type: 'pane',
      id: panes[0]?.id.toString() || '1',
      name: panes[0]?.name || `${PANE_SEMANTICS.NEW_PANE} 1`,
      command: panes[0]?.command || ''
    };
  }

  const buildGridTree = (paneSlice: PaneConfig[], r: number, c: number): LayoutNode => {
    if (paneSlice.length === 1) {
      return {
        type: 'pane',
        id: paneSlice[0].id.toString(),
        name: paneSlice[0].name,
        command: paneSlice[0].command
      };
    }

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

function countToLayoutNode(count: number, panes: PaneConfig[]): LayoutNode {
  const splitHorizontally = (left: LayoutNode, right: LayoutNode, ratio: number): LayoutNode => {
    return {
      type: "split",
      direction: "horizontal",
      ratio,
      children: [left, right]
    };
  };

  const buildBalancedTree = (paneSlice: PaneConfig[], depth: number = 0): LayoutNode => {
    if (paneSlice.length === 1) {
      return {
        type: "pane",
        id: paneSlice[0].id.toString(),
        name: paneSlice[0].name,
        command: paneSlice[0].command
      };
    }

    const mid = Math.ceil(paneSlice.length / 2);
    const leftSlice = paneSlice.slice(0, mid);
    const rightSlice = paneSlice.slice(mid);
    
    // Alternate direction based on depth for a more "square" look
    const direction = depth % 2 === 0 ? "horizontal" : "vertical";

    return {
      type: "split",
      direction,
      ratio: mid / paneSlice.length,
      children: [
        buildBalancedTree(leftSlice, depth + 1),
        buildBalancedTree(rightSlice, depth + 1)
      ]
    };
  };

  const paneSlice = panes.slice(0, count);

  switch (count) {
    case 1:
      return gridToLayoutNode(1, 1, paneSlice);
    case 2:
      return gridToLayoutNode(1, 2, paneSlice);
    case 3:
      return splitHorizontally(
        gridToLayoutNode(2, 1, paneSlice.slice(0, 2)),
        gridToLayoutNode(1, 1, paneSlice.slice(2, 3)),
        0.5
      );
    case 4:
      return gridToLayoutNode(2, 2, paneSlice);
    case 5:
      return splitHorizontally(
        gridToLayoutNode(2, 2, paneSlice.slice(0, 4)),
        gridToLayoutNode(1, 1, paneSlice.slice(4, 5)),
        2 / 3
      );
    case 6:
      return gridToLayoutNode(2, 3, paneSlice);
    case 7:
      return splitHorizontally(
        gridToLayoutNode(2, 3, paneSlice.slice(0, 6)),
        gridToLayoutNode(1, 1, paneSlice.slice(6, 7)),
        3 / 4
      );
    case 8:
      return gridToLayoutNode(2, 4, paneSlice);
    case 9:
      return gridToLayoutNode(3, 3, paneSlice);
    case 10:
      return splitHorizontally(
        gridToLayoutNode(3, 3, paneSlice.slice(0, 9)),
        gridToLayoutNode(1, 1, paneSlice.slice(9, 10)),
        3 / 4
      );
    case 11:
      return splitHorizontally(
        gridToLayoutNode(3, 3, paneSlice.slice(0, 9)),
        gridToLayoutNode(2, 1, paneSlice.slice(9, 11)),
        3 / 4
      );
    case 12:
      return gridToLayoutNode(3, 4, paneSlice);
    case 13:
      return splitHorizontally(
        gridToLayoutNode(3, 4, paneSlice.slice(0, 12)),
        gridToLayoutNode(1, 1, paneSlice.slice(12, 13)),
        4 / 5
      );
    case 14:
      return splitHorizontally(
        gridToLayoutNode(3, 4, paneSlice.slice(0, 12)),
        gridToLayoutNode(2, 1, paneSlice.slice(12, 14)),
        4 / 5
      );
    case 15:
      return splitHorizontally(
        gridToLayoutNode(3, 4, paneSlice.slice(0, 12)),
        gridToLayoutNode(3, 1, paneSlice.slice(12, 15)),
        4 / 5
      );
    case 16:
      return gridToLayoutNode(4, 4, paneSlice);
    default:
      return buildBalancedTree(paneSlice);
  }
}

export function countPanes(node: LayoutNode | null): number {
  if (!node) return 0;
  if (node.type === 'pane') return 1;
  return countPanes(node.children[0]) + countPanes(node.children[1]);
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
        name: PANE_SEMANTICS.NEW_PANE,
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

/**
 * Recursively find and remove a node, returning BOTH the new tree and the removed node.
 */
export function extractNode(root: LayoutNode, targetId: string): { newRoot: LayoutNode | null, extracted: PaneNode | null } {
  if (root.type === 'pane') {
    if (root.id === targetId) {
      return { newRoot: null, extracted: root };
    }
    return { newRoot: root, extracted: null };
  }

  const { newRoot: left, extracted: leftExtracted } = extractNode(root.children[0], targetId);
  const { newRoot: right, extracted: rightExtracted } = extractNode(root.children[1], targetId);

  const extracted = leftExtracted || rightExtracted;

  if (left === null) return { newRoot: right, extracted };
  if (right === null) return { newRoot: left, extracted };

  return {
    newRoot: {
      ...root,
      children: [left, right]
    },
    extracted
  };
}

/**
 * Re-inserts a node relative to a target node.
 */
export function insertNode(
  root: LayoutNode,
  targetId: string,
  nodeToInsert: PaneNode,
  direction: 'top' | 'bottom' | 'left' | 'right'
): LayoutNode {
  if (root.type === 'pane') {
    if (root.id === targetId) {
      const isVerticalSplit = direction === 'top' || direction === 'bottom';
      const isFirst = direction === 'top' || direction === 'left';
      
      return {
        type: 'split',
        direction: isVerticalSplit ? 'vertical' : 'horizontal',
        ratio: 0.5,
        children: isFirst ? [nodeToInsert, root] : [root, nodeToInsert]
      };
    }
    return root;
  }

  return {
    ...root,
    children: [
      insertNode(root.children[0], targetId, nodeToInsert, direction),
      insertNode(root.children[1], targetId, nodeToInsert, direction)
    ]
  };
}

/**
 * High-level function to move a pane from one position to another.
 */
export function repositionNode(
  root: LayoutNode,
  dragId: string,
  dropId: string,
  direction: 'top' | 'bottom' | 'left' | 'right'
): LayoutNode {
  // 1. Extract the node
  const { newRoot, extracted } = extractNode(root, dragId);
  
  if (!extracted || !newRoot) return root; // Should not happen in valid drag-drop

  // 2. Re-insert into the modified tree
  return insertNode(newRoot, dropId, extracted, direction);
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

/**
 * Derives a semantic name for a terminal pane based on its command.
 * Uses a tiered matching system:
 * 1. User/Default Tool Mapping (e.g. 'npm' -> 'NPM')
 * 2. Active Agent Mapping (e.g. 'gemini' -> 'Gemini Agent')
 * 3. Pattern Matching (e.g. 'cargo run' -> 'Run')
 * 4. Fallback (e.g. 'command' -> 'COMMAND')
 */
export function derivePaneName(
  command: string, 
  defaultName: string, 
  agents: Agent[] = [],
  settings: SemanticsSettings = SEMANTICS_DEFAULTS
): string {
  if (!command || command.trim() === "") return defaultName;

  const cmd = command.trim();
  const parts = cmd.split(/\s+/);
  const base = parts[0].toLowerCase();

  // 1. Tool Mapping (User defined or Defaults)
  const mappedTool = settings.tools[base];
  if (mappedTool) {
    // Check for common sub-command patterns within this tool
    const pattern = settings.patterns.find(p => p.bin.includes(base));
    if (pattern) {
      // Find the first part that matches a sub-command (excluding flags)
      const sub = parts.find(p => !p.startsWith('-') && pattern.sub.includes(p.toLowerCase()));
      if (sub) {
        return `${mappedTool} ${sub.charAt(0).toUpperCase() + sub.slice(1)}`;
      }
    }
    
    // File extraction for script runners (node script.js -> Script)
    if (base === 'node' || base === 'python' || base === 'python3') {
      const file = parts.find(p => p.includes('.') && !p.startsWith('-'));
      if (file) {
        return file.split(/[\\/]/).pop()?.split('.')[0] || mappedTool;
      }
    }

    return mappedTool;
  }

  // 1.5 Special Handling for Standard Names
  if (base === 'freebuff') {
    const sub = parts.find(p => !p.startsWith('-') && p !== base);
    const suffix = sub ? ` ${sub.charAt(0).toUpperCase() + sub.slice(1)}` : '';
    return `Freebuff${suffix}`;
  }

  // 2. Dynamic Agent Mapping
  const matchedAgent = agents.find(a => a.command.toLowerCase() === base);
  if (matchedAgent) {
    let label = matchedAgent.label;
    // Normalize if it's 'freebuff'
    if (label.toLowerCase() === 'freebuff') {
      label = 'Freebuff';
    }
    return `${label.charAt(0).toUpperCase() + label.slice(1).toLowerCase()} ${PANE_SEMANTICS.AGENT_SUFFIX}`;
  }

  // 3. Pattern Matching for Generic Tools (bin run -> Run)
  for (const pattern of settings.patterns) {
    if (pattern.bin.includes(base)) {
      const sub = parts.find(p => !p.startsWith('-') && pattern.sub.includes(p.toLowerCase()));
      if (sub) return sub.charAt(0).toUpperCase() + sub.slice(1);
    }
  }

  // 4. Generic Fallback
  // If the command is just a single short word, use it
  if (parts.length === 1 && cmd.length < 12) return cmd.toUpperCase();
  
  // Use base command if short
  if (base.length < 10) return base.toUpperCase();

  return defaultName;
}

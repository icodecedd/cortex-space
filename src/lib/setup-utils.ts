import { LayoutConfig, PaneConfig } from "./setup-constants";
import { LayoutNode, SplitNode, PaneNode, Agent } from "@/types";
import { PANE_SEMANTICS } from "./content";

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
      name: panes[0]?.name || `${PANE_SEMANTICS.NEW_PANE} 1`,
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
 */
export function derivePaneName(command: string, defaultName: string, agents: Agent[] = []): string {
  if (!command || command.trim() === "") return defaultName;

  const cmd = command.trim().toLowerCase();
  const parts = cmd.split(/\s+/);
  const base = parts[0];

  // 1. Specific Tool Mapping
  if (base === 'npm' || base === 'pnpm' || base === 'yarn' || base === 'bun') {
    if (parts.includes('run')) {
      const script = parts[parts.indexOf('run') + 1];
      if (script) return script.charAt(0).toUpperCase() + script.slice(1);
    }
    if (parts[1] === 'start' || parts[1] === 'dev' || parts[1] === 'build' || parts[1] === 'test') {
      return parts[1].charAt(0).toUpperCase() + parts[1].slice(1);
    }
    return base.toUpperCase();
  }

  if (base === 'docker-compose' || base === 'docker') {
    if (parts.includes('up')) return PANE_SEMANTICS.DOCKER_UP;
    if (parts.includes('build')) return PANE_SEMANTICS.DOCKER_BUILD;
    return PANE_SEMANTICS.DOCKER;
  }

  if (base === 'git') {
    if (parts[1] === 'status') return PANE_SEMANTICS.GIT_STATUS;
    if (parts[1] === 'log') return PANE_SEMANTICS.GIT_LOG;
    if (parts[1] === 'pull' || parts[1] === 'push') return `Git ${parts[1].charAt(0).toUpperCase() + parts[1].slice(1)}`;
    return PANE_SEMANTICS.GIT;
  }

  if (base === 'python' || base === 'python3') {
    const file = parts.find(p => p.endsWith('.py'));
    if (file) return file.split(/[\\/]/).pop()?.replace('.py', '') || PANE_SEMANTICS.PYTHON;
    return PANE_SEMANTICS.PYTHON;
  }

  if (base === 'node') {
    const file = parts.find(p => p.endsWith('.js') || p.endsWith('.ts'));
    if (file) return file.split(/[\\/]/).pop()?.replace(/\.(js|ts)$/, '') || PANE_SEMANTICS.NODE;
    return PANE_SEMANTICS.NODE;
  }

  // 2. Dynamic Agent Mapping
  const matchedAgent = agents.find(a => a.command.toLowerCase() === base);
  if (matchedAgent) {
    return `${matchedAgent.label.charAt(0).toUpperCase() + matchedAgent.label.slice(1).toLowerCase()} ${PANE_SEMANTICS.AGENT_SUFFIX}`;
  }

  // 3. Fallback for hardcoded common agents
  if (base === 'gemini' || base === 'claude' || base === 'gpt' || base === 'codex') {
    return `${base.charAt(0).toUpperCase() + base.slice(1)} ${PANE_SEMANTICS.AGENT_SUFFIX}`;
  }

  // 4. Generic Fallback: Use the command itself if short, or the base command
  if (cmd.length < 12) return cmd.toUpperCase();
  return base.toUpperCase();
}

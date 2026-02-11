import { SiteNode } from '../types';

/**
 * Build hierarchical tree from flat list of nodes
 */
export function buildTree(nodes: SiteNode[]): SiteNode[] {
  // Create a map for O(1) lookup
  const nodeMap = new Map<string, SiteNode>();

  // Deep clone nodes to avoid mutating originals
  nodes.forEach(node => {
    nodeMap.set(node.id, { ...node, children: [] });
  });

  const roots: SiteNode[] = [];

  // Build the tree
  nodeMap.forEach(node => {
    if (node.parent_id === null || node.parent_id === '0') {
      // Root node
      roots.push(node);
    } else {
      // Child node
      const parent = nodeMap.get(node.parent_id);
      if (parent) {
        if (!parent.children) {
          parent.children = [];
        }
        parent.children.push(node);
      } else {
        // Orphaned node (parent doesn't exist) - make it a root
        roots.push(node);
      }
    }
  });

  return roots;
}

/**
 * Find a node by ID in the tree
 */
export function findNode(tree: SiteNode[], nodeId: string): SiteNode | null {
  for (const node of tree) {
    if (node.id === nodeId) {
      return node;
    }
    if (node.children && node.children.length > 0) {
      const found = findNode(node.children, nodeId);
      if (found) {
        return found;
      }
    }
  }
  return null;
}

/**
 * Find a node in flat list
 */
export function findNodeInList(nodes: SiteNode[], nodeId: string): SiteNode | null {
  return nodes.find(n => n.id === nodeId) || null;
}

/**
 * Get all ancestor IDs for a given node (for auto-expand)
 */
export function getAncestorIds(nodes: SiteNode[], nodeId: string): string[] {
  const ancestors: string[] = [];
  let currentNode = nodes.find(n => n.id === nodeId);

  while (currentNode && currentNode.parent_id) {
    ancestors.push(currentNode.parent_id);
    currentNode = nodes.find(n => n.id === currentNode!.parent_id);
  }

  return ancestors;
}

/**
 * Get all descendant nodes for a given node
 */
export function getDescendants(nodes: SiteNode[], nodeId: string): SiteNode[] {
  const descendants: SiteNode[] = [];
  const children = nodes.filter(n => n.parent_id === nodeId);

  children.forEach(child => {
    descendants.push(child);
    descendants.push(...getDescendants(nodes, child.id));
  });

  return descendants;
}

/**
 * Flatten tree back to array
 */
export function flattenTree(tree: SiteNode[]): SiteNode[] {
  const flattened: SiteNode[] = [];

  function traverse(nodes: SiteNode[]) {
    nodes.forEach(node => {
      const { children, ...nodeWithoutChildren } = node;
      flattened.push(nodeWithoutChildren as SiteNode);
      if (children && children.length > 0) {
        traverse(children);
      }
    });
  }

  traverse(tree);
  return flattened;
}

/**
 * Filter tree based on search term and return expanded IDs
 */
export function filterTree(
  nodes: SiteNode[],
  searchTerm: string,
  filters?: { types?: string[]; tags?: string[] }
): { matchedNodeIds: string[]; expandedIds: string[] } {
  const term = searchTerm.toLowerCase().trim();
  const matchedNodeIds: string[] = [];

  // If no search term and no filters, return empty
  if (!term && !filters?.types?.length && !filters?.tags?.length) {
    return { matchedNodeIds: [], expandedIds: [] };
  }

  // Find matching nodes
  nodes.forEach(node => {
    let matches = true;

    // Search term matching
    if (term) {
      const titleMatch = node.title.toLowerCase().includes(term);
      const slugMatch = node.slug.toLowerCase().includes(term);
      const urlMatch = node.url.toLowerCase().includes(term);
      matches = titleMatch || slugMatch || urlMatch;
    }

    // Type filter
    if (matches && filters?.types?.length) {
      matches = filters.types.includes(node.type);
    }

    // Tag filter
    if (matches && filters?.tags?.length) {
      matches = filters.tags.some(tag => node.manual_tags.includes(tag));
    }

    if (matches) {
      matchedNodeIds.push(node.id);
    }
  });

  // Get all ancestors of matched nodes to auto-expand
  const expandedIds = new Set<string>();
  matchedNodeIds.forEach(nodeId => {
    const ancestors = getAncestorIds(nodes, nodeId);
    ancestors.forEach(id => expandedIds.add(id));
  });

  return {
    matchedNodeIds,
    expandedIds: Array.from(expandedIds)
  };
}

/**
 * Group non-hierarchical nodes by type (for CPTs)
 */
export function groupByType(nodes: SiteNode[]): Map<string, SiteNode[]> {
  const groups = new Map<string, SiteNode[]>();

  nodes.forEach(node => {
    if (!groups.has(node.type)) {
      groups.set(node.type, []);
    }
    groups.get(node.type)!.push(node);
  });

  return groups;
}

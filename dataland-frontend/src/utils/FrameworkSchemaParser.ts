import type { TreeNode } from 'primevue/treenode';

/**
 * Converts the nested schema of a framework into PrimeVue tree nodes.
 * Objects become expandable nodes, leaves (objects with `id` and `ref`) carry the data point type id in `data`.
 *
 * @param schema the schema as JSON string or already parsed object
 * @returns the root nodes of the tree
 * @throws Error if the schema is a string that is no valid JSON
 */
export function buildFrameworkSchemaTree(schema: unknown): TreeNode[] {
  const parsed: unknown = typeof schema === 'string' ? JSON.parse(schema) : schema;
  return buildChildren(parsed, '');
}

export interface DataPointLeafData {
  id: string;
  aliasExport?: string;
}

/**
 * Checks whether a schema node is a leaf, i.e. an object with a data point type id and reference.
 *
 * @param node the schema node
 * @returns true if the node is a leaf
 */
function isDataPointLeaf(node: unknown): node is { id: string; ref: string; aliasExport?: string | null } {
  if (node === null || typeof node !== 'object') return false;
  const candidate = node as Record<string, unknown>;
  return typeof candidate.id === 'string' && typeof candidate.ref === 'string';
}

/**
 * Builds the child nodes of a schema node.
 *
 * @param node current schema node
 * @param parentKey key of the parent tree node
 * @returns the child tree nodes
 */
function buildChildren(node: unknown, parentKey: string): TreeNode[] {
  if (node === null || typeof node !== 'object') return [];
  const nodes: TreeNode[] = [];
  for (const [name, child] of Object.entries(node)) {
    const key = parentKey ? `${parentKey}.${name}` : name;
    if (isDataPointLeaf(child)) {
      nodes.push({ key, label: name, data: { id: child.id, aliasExport: child.aliasExport ?? undefined }, leaf: true });
    } else if (child !== null && typeof child === 'object') {
      nodes.push({ key, label: name, selectable: false, children: buildChildren(child, key) });
    }
  }
  return nodes;
}

import type {
  TreeFormNode,
  TreePickerOption,
  TreeSelectionPreset,
  TreeSelectStrategy,
} from '../../models/form-config.model';
import type {
  SelectedTreeItem,
  TreeFilterMode,
  TreeNodeSelectionState,
  TreeViewNode,
} from './field-tree-renderer.types';

type TreeReplaceBehavior = 'keep-children' | 'drop-children' | 'ask' | undefined;
type TreeNodeIdFactory = () => string;

const defaultTreeNodeId: TreeNodeIdFactory = () => crypto.randomUUID();

export function buildVisibleTreeNodes(
  nodes: TreeFormNode[],
  query: string,
  mode: TreeFilterMode,
  strategy: TreeSelectStrategy,
  parentPath = '',
): TreeViewNode[] {
  return nodes.flatMap((node) => {
    const path = treeNodePath(node, parentPath);
    const code = treeNodeCode(node);
    const children = buildVisibleTreeNodes(node.children ?? [], query, mode, strategy, path);
    const state = treeNodeSelectionState(node, strategy);
    const leaf = (node.children?.length ?? 0) === 0;
    const ownFilterMatch = matchesFilterMode(node, state, leaf, mode);
    const ownQueryMatch = !query || treeNodeSearchText(node, path, code).includes(query);
    const includeNode = (ownFilterMatch && ownQueryMatch) || children.length > 0;

    if (!includeNode) {
      return [];
    }

    return [
      {
        node,
        path,
        code,
        children,
        matched: !!query && ownFilterMatch && ownQueryMatch,
        forceExpanded: children.length > 0 && (!!query || mode !== 'all'),
        checked: state.checked,
        indeterminate: state.indeterminate,
        leaf,
      },
    ];
  });
}

export function collectSelectedTreeItems(
  nodes: TreeFormNode[],
  strategy: TreeSelectStrategy,
  parentPath = '',
): SelectedTreeItem[] {
  return nodes.flatMap((node) => {
    const path = treeNodePath(node, parentPath);
    const leaf = (node.children?.length ?? 0) === 0;
    const current =
      node.checked === true && (strategy !== 'leafOnly' || leaf)
        ? [{ node, path, code: treeNodeCode(node), leaf }]
        : [];
    return [...current, ...collectSelectedTreeItems(node.children ?? [], strategy, path)];
  });
}

export function collectSelectedTreeAncestorIds(
  nodes: TreeFormNode[],
  strategy: TreeSelectStrategy,
): Set<string> {
  const result = new Set<string>();
  collectSelectedAncestors(nodes, strategy, [], result);
  return result;
}

export function treeNodeSelectionState(
  node: TreeFormNode,
  strategy: TreeSelectStrategy,
): TreeNodeSelectionState {
  const selectable = isTreeNodeSelectable(node);
  const children = node.children ?? [];
  const childStates = children.map((child) => treeNodeSelectionState(child, strategy));
  const hasChildSelection = childStates.some((state) => state.checked || state.indeterminate);
  const allChildrenChecked =
    childStates.length > 0 && childStates.every((state) => state.checked && !state.indeterminate);

  if (strategy === 'leafOnly') {
    if (!children.length) {
      return {
        checked: node.checked === true,
        indeterminate: false,
        selectable,
      };
    }
    return {
      checked: allChildrenChecked,
      indeterminate: hasChildSelection && !allChildrenChecked,
      selectable,
    };
  }

  if (strategy === 'all') {
    const checked = selectable && node.checked === true;
    return {
      checked,
      indeterminate: !checked && hasChildSelection,
      selectable,
    };
  }

  if (!children.length) {
    return {
      checked: selectable && node.checked === true,
      indeterminate: false,
      selectable,
    };
  }

  const selfChecked = selectable && node.checked === true;
  const checked = allChildrenChecked && (selfChecked || hasChildSelection);
  return {
    checked,
    indeterminate: (selfChecked || hasChildSelection) && !checked,
    selectable,
  };
}

export function updateTreeNodeSelection(
  nodes: TreeFormNode[],
  nodeId: string,
  checked: boolean,
  strategy: TreeSelectStrategy,
): TreeFormNode[] {
  return nodes.map((node) => {
    if (node.id === nodeId) {
      return applyTreeNodeSelection(node, checked, true, strategy);
    }

    return {
      ...node,
      children: node.children
        ? updateTreeNodeSelection(node.children, nodeId, checked, strategy)
        : node.children,
    };
  });
}

export function clearTreeSelection(nodes: TreeFormNode[]): TreeFormNode[] {
  return nodes.map((node) => ({
    ...node,
    checked: false,
    indeterminate: false,
    children: node.children ? clearTreeSelection(node.children) : node.children,
  }));
}

export function updateTreeSelectionForIds(
  nodes: TreeFormNode[],
  ids: Set<string>,
  checked: boolean,
  strategy: TreeSelectStrategy,
): TreeFormNode[] {
  return nodes.map((node) => {
    const next = ids.has(node.id) ? setTreeNodeCheckedOnly(node, checked, strategy) : node;
    return {
      ...next,
      children: next.children
        ? updateTreeSelectionForIds(next.children, ids, checked, strategy)
        : next.children,
    };
  });
}

export function updateTreeDescendantsSelection(
  nodes: TreeFormNode[],
  nodeId: string,
  checked: boolean,
  strategy: TreeSelectStrategy,
): TreeFormNode[] {
  return nodes.map((node) => {
    if (node.id === nodeId) {
      return {
        ...node,
        children: node.children
          ? setTreeSubtreeSelection(node.children, checked, strategy)
          : node.children,
      };
    }

    return {
      ...node,
      children: node.children
        ? updateTreeDescendantsSelection(node.children, nodeId, checked, strategy)
        : node.children,
    };
  });
}

export function applyTreeSelectionPreset(
  nodes: TreeFormNode[],
  preset: TreeSelectionPreset,
  strategy: TreeSelectStrategy,
): TreeFormNode[] {
  return nodes.map((node) => {
    const children = node.children
      ? applyTreeSelectionPreset(node.children, preset, strategy)
      : node.children;
    const next = { ...node, children };
    return matchesTreeSelectionPreset(next, preset)
      ? applyTreeNodeSelection(next, true, strategy !== 'all', strategy)
      : next;
  });
}

export function flattenTreeViewNodes(nodes: TreeViewNode[]): TreeViewNode[] {
  return nodes.flatMap((node) => [node, ...flattenTreeViewNodes(node.children)]);
}

export function findTreeNodePath(
  nodes: TreeFormNode[],
  nodeId: string,
  path: string[] = [],
): string[] | null {
  for (const node of nodes) {
    const nextPath = [...path, node.id];
    if (node.id === nodeId) {
      return nextPath;
    }
    const childPath = findTreeNodePath(node.children ?? [], nodeId, nextPath);
    if (childPath) {
      return childPath;
    }
  }
  return null;
}

export function removeTreeNode(nodes: TreeFormNode[], nodeId: string): TreeFormNode[] {
  return nodes
    .filter((node) => node.id !== nodeId)
    .map((node) => ({
      ...node,
      children: node.children ? removeTreeNode(node.children, nodeId) : undefined,
    }));
}

export function treePickerOptionToNode(
  option: TreePickerOption,
  createId: TreeNodeIdFactory = defaultTreeNodeId,
): TreeFormNode {
  return {
    id: createId(),
    label: option.label,
    value: option.value,
    subtitle: option.subtitle,
    description: option.description,
    icon: option.icon,
    badges: option.badges,
    data: {
      ...(option.data ?? {}),
      sourceOptionId: option.id,
    },
    disabled: option.disabled,
    disabledReason: option.disabledReason,
    children: option.children?.map((child) => treePickerOptionToNode(child, createId)) ?? [],
  };
}

export function addTreeNode(
  nodes: TreeFormNode[],
  node: TreeFormNode,
  parentId: string | null,
): TreeFormNode[] {
  if (!parentId) {
    return [...nodes, node];
  }

  return nodes.map((current) => {
    if (current.id === parentId) {
      return {
        ...current,
        children: [...(current.children ?? []), node],
      };
    }

    return {
      ...current,
      children: current.children ? addTreeNode(current.children, node, parentId) : current.children,
    };
  });
}

export function replaceTreeNode(
  nodes: TreeFormNode[],
  nodeId: string,
  replacement: TreeFormNode,
  replaceBehavior: TreeReplaceBehavior,
): TreeFormNode[] {
  return nodes.map((node) => {
    if (node.id === nodeId) {
      const dropChildren = shouldDropReplacementChildren(replacement, replaceBehavior);
      return {
        ...replacement,
        children: dropChildren ? replacement.children : (node.children ?? replacement.children),
      };
    }

    return {
      ...node,
      children: node.children
        ? replaceTreeNode(node.children, nodeId, replacement, replaceBehavior)
        : node.children,
    };
  });
}

export function moveTreeNode(
  nodes: TreeFormNode[],
  nodeId: string,
  direction: -1 | 1,
): TreeFormNode[] {
  const index = nodes.findIndex((node) => node.id === nodeId);
  if (index >= 0) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= nodes.length) {
      return nodes;
    }
    const next = [...nodes];
    const [item] = next.splice(index, 1);
    next.splice(targetIndex, 0, item);
    return next;
  }

  return nodes.map((node) => ({
    ...node,
    children: node.children ? moveTreeNode(node.children, nodeId, direction) : node.children,
  }));
}

export function canMoveTreeNode(nodes: TreeFormNode[], nodeId: string, direction: -1 | 1): boolean {
  const index = nodes.findIndex((node) => node.id === nodeId);
  if (index >= 0) {
    const targetIndex = index + direction;
    return targetIndex >= 0 && targetIndex < nodes.length;
  }
  return nodes.some((node) =>
    node.children ? canMoveTreeNode(node.children, nodeId, direction) : false,
  );
}

export function duplicateTreeNode(
  nodes: TreeFormNode[],
  nodeId: string,
  createId: TreeNodeIdFactory = defaultTreeNodeId,
): TreeFormNode[] {
  const index = nodes.findIndex((node) => node.id === nodeId);
  if (index >= 0) {
    const duplicate = cloneTreeNode(nodes[index], createId);
    const next = [...nodes];
    next.splice(index + 1, 0, duplicate);
    return next;
  }
  return nodes.map((node) => ({
    ...node,
    children: node.children ? duplicateTreeNode(node.children, nodeId, createId) : node.children,
  }));
}

export function flattenTreeNodes(nodes: TreeFormNode[]): TreeFormNode[] {
  return nodes.flatMap((node) => [node, ...flattenTreeNodes(node.children ?? [])]);
}

export function normalizeJsonTreeNodes(
  value: unknown[],
  createId: TreeNodeIdFactory = defaultTreeNodeId,
): TreeFormNode[] | null {
  const result: TreeFormNode[] = [];
  for (const item of value) {
    const normalized = normalizeJsonTreeNode(item, createId);
    if (!normalized) {
      return null;
    }
    result.push(normalized);
  }
  return result;
}

export function treeNodeCode(node: TreeFormNode): string | undefined {
  const valueRecord =
    node.value && typeof node.value === 'object' && !Array.isArray(node.value)
      ? (node.value as Record<string, unknown>)
      : {};
  return nonEmptyString(
    node.code ?? node.key ?? node.data?.['code'] ?? valueRecord['code'] ?? valueRecord['id'],
  );
}

export function isTreeNodeSelectable(node: TreeFormNode): boolean {
  return !(node.disabled || node.readonly || node.selectable === false);
}

export function nonEmptyString(value: unknown): string | undefined {
  if (typeof value === 'string') {
    const normalized = value.trim();
    return normalized || undefined;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return undefined;
}

export function treeNodeErrorPrefix(nodeId: string): string {
  return `node:${nodeId}:`;
}

function collectSelectedAncestors(
  nodes: TreeFormNode[],
  strategy: TreeSelectStrategy,
  ancestors: string[],
  result: Set<string>,
): void {
  nodes.forEach((node) => {
    const state = treeNodeSelectionState(node, strategy);
    if (state.checked || state.indeterminate || node.checked === true) {
      ancestors.forEach((id) => result.add(id));
    }
    collectSelectedAncestors(node.children ?? [], strategy, [...ancestors, node.id], result);
  });
}

function applyTreeNodeSelection(
  node: TreeFormNode,
  checked: boolean,
  cascade: boolean,
  strategy: TreeSelectStrategy,
): TreeFormNode {
  const children = node.children ?? [];

  if (strategy === 'leafOnly') {
    if (children.length && cascade) {
      return {
        ...node,
        checked: false,
        indeterminate: false,
        children: setTreeSubtreeSelection(children, checked, strategy),
      };
    }
    return setTreeNodeCheckedOnly(node, checked, strategy);
  }

  if (strategy === 'parentAndChildren' && cascade) {
    return {
      ...setTreeNodeCheckedOnly(node, checked, strategy),
      children: children.length
        ? setTreeSubtreeSelection(children, checked, strategy)
        : node.children,
    };
  }

  return setTreeNodeCheckedOnly(node, checked, strategy);
}

function setTreeSubtreeSelection(
  nodes: TreeFormNode[],
  checked: boolean,
  strategy: TreeSelectStrategy,
): TreeFormNode[] {
  return nodes.map((node) => {
    const children = node.children ?? [];
    if (strategy === 'leafOnly' && children.length) {
      return {
        ...node,
        checked: false,
        indeterminate: false,
        children: setTreeSubtreeSelection(children, checked, strategy),
      };
    }

    return {
      ...setTreeNodeCheckedOnly(node, checked, strategy),
      children: children.length
        ? setTreeSubtreeSelection(children, checked, strategy)
        : node.children,
    };
  });
}

function setTreeNodeCheckedOnly(
  node: TreeFormNode,
  checked: boolean,
  strategy: TreeSelectStrategy,
): TreeFormNode {
  if (!isTreeNodeSelectable(node)) {
    return node;
  }
  if (strategy === 'leafOnly' && (node.children?.length ?? 0) > 0) {
    return {
      ...node,
      checked: false,
      indeterminate: false,
    };
  }
  return {
    ...node,
    checked,
    indeterminate: false,
  };
}

function matchesFilterMode(
  node: TreeFormNode,
  state: TreeNodeSelectionState,
  leaf: boolean,
  mode: TreeFilterMode,
): boolean {
  switch (mode) {
    case 'selected':
      return state.checked || state.indeterminate || node.checked === true;
    case 'leaf':
      return leaf;
    case 'all':
    default:
      return true;
  }
}

function treeNodePath(node: TreeFormNode, parentPath: string): string {
  const explicitPath = nonEmptyString(node.path);
  if (explicitPath) {
    return explicitPath;
  }
  return parentPath ? `${parentPath} / ${node.label}` : node.label;
}

function treeNodeSearchText(node: TreeFormNode, path: string, code?: string): string {
  return [
    node.label,
    code,
    path,
    node.type,
    node.status,
    node.severity,
    node.subtitle,
    node.description,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function matchesTreeSelectionPreset(node: TreeFormNode, preset: TreeSelectionPreset): boolean {
  if (preset.nodeIds?.includes(node.id)) {
    return true;
  }
  const match = preset.match;
  if (!match) {
    return false;
  }
  if (match.leafOnly && (node.children?.length ?? 0) > 0) {
    return false;
  }
  const label = node.label.toLowerCase();
  const code = (treeNodeCode(node) ?? '').toLowerCase();
  return (
    includesAny(label, match.labelIncludes) ||
    includesAny(code, match.codeIncludes) ||
    !!(node.type && match.typeIn?.includes(node.type)) ||
    !!(node.status && match.statusIn?.includes(node.status)) ||
    !!(node.severity && match.severityIn?.includes(node.severity))
  );
}

function includesAny(value: string, needles?: string[]): boolean {
  return !!needles?.some((needle) => value.includes(needle.toLowerCase()));
}

function cloneTreeNode(node: TreeFormNode, createId: TreeNodeIdFactory): TreeFormNode {
  return {
    ...node,
    id: createId(),
    children: node.children?.map((child) => cloneTreeNode(child, createId)),
  };
}

function shouldDropReplacementChildren(
  replacement: TreeFormNode,
  replaceBehavior: TreeReplaceBehavior,
): boolean {
  const behavior = replaceBehavior ?? 'keep-children';
  const replacementAllowsChildren = replacement.data?.['allowChildren'] !== false;
  if (!replacementAllowsChildren) {
    return true;
  }
  return behavior === 'drop-children';
}

function normalizeJsonTreeNode(value: unknown, createId: TreeNodeIdFactory): TreeFormNode | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const raw = value as Record<string, unknown>;
  const label = treeNodeLabel(raw);
  if (!label) {
    return null;
  }

  const rawChildren = raw['children'];
  const children = Array.isArray(rawChildren) ? normalizeJsonTreeNodes(rawChildren, createId) : [];
  if (!children) {
    return null;
  }

  return {
    id: nonEmptyString(raw['id']) ?? createId(),
    key: nonEmptyString(raw['key']),
    label,
    value: 'value' in raw ? raw['value'] : {},
    code: nonEmptyString(raw['code']),
    path: nonEmptyString(raw['path']),
    type: nonEmptyString(raw['type']),
    status: nonEmptyString(raw['status']) as TreeFormNode['status'],
    severity: nonEmptyString(raw['severity']) as TreeFormNode['severity'],
    subtitle: nonEmptyString(raw['subtitle']),
    description: nonEmptyString(raw['description']),
    icon: nonEmptyString(raw['icon']),
    badges: Array.isArray(raw['badges']) ? (raw['badges'] as TreeFormNode['badges']) : undefined,
    data:
      raw['data'] && typeof raw['data'] === 'object' && !Array.isArray(raw['data'])
        ? (raw['data'] as Record<string, unknown>)
        : undefined,
    meta:
      raw['meta'] && typeof raw['meta'] === 'object' && !Array.isArray(raw['meta'])
        ? (raw['meta'] as Record<string, unknown>)
        : undefined,
    children,
    selectable: raw['selectable'] === false ? false : undefined,
    checked: raw['checked'] === true,
    indeterminate: raw['indeterminate'] === true,
    expanded: raw['expanded'] === true,
    loading: raw['loading'] === true,
    hasChildren: raw['hasChildren'] === true,
    disabled: raw['disabled'] === true,
    disabledReason: nonEmptyString(raw['disabledReason']),
    readonly: raw['readonly'] === true,
  };
}

function treeNodeLabel(value: Record<string, unknown>): string | null {
  const explicit = nonEmptyString(value['label']);
  if (explicit) {
    return explicit;
  }

  const nodeValue = value['value'];
  if (nodeValue && typeof nodeValue === 'object' && !Array.isArray(nodeValue)) {
    const record = nodeValue as Record<string, unknown>;
    return nonEmptyString(record['code'] ?? record['id']) ?? null;
  }

  return nonEmptyString(nodeValue) ?? null;
}

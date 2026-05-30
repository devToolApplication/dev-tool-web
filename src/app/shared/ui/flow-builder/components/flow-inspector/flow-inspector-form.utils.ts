import type { FormConfig, FormContext, FieldConfig } from '../../../form-input/models/form-config.model';
import type { FlowNode } from '../../models';
import { cloneFlowValue } from '../../core/flow-serialization';

export interface FlowInspectorFormChange {
  value: Record<string, unknown>;
  fieldPaths: string[];
  valid?: boolean;
}

const SUPPORTED_NODE_FIELD_KEYS = new Set(['label', 'status', 'disabled', 'readonly']);

export function compactFlowInspectorFormConfig(config: FormConfig): FormConfig {
  return {
    ...config,
    layout: {
      mode: 'simple',
      density: 'compact',
      labelPlacement: 'top',
      sectionNavigation: 'none',
      showStatusPanel: false,
      stickyFooter: false,
      autoScrollToError: false,
      showValidationSummary: true,
      readonlyMode: 'disabled-controls',
      ...(config.layout ?? {}),
    },
    actions: {
      showCancel: false,
      showReset: false,
      disableSubmitWhenInvalid: false,
      ...(config.actions ?? {}),
    },
  };
}

export function flowNodeToInspectorFormValue(node: FlowNode): Record<string, unknown> {
  const data = cloneFlowValue(node.data ?? {});
  return {
    ...data,
    data,
    node: {
      label: node.label ?? '',
      status: node.status ?? 'default',
      disabled: node.disabled === true,
      readonly: node.readonly === true,
    },
  };
}

export function resolveFlowInspectorFormContext(
  context: FormContext | null | undefined,
  readonly: boolean
): FormContext {
  return {
    user: context?.user ?? null,
    ...(context ?? {}),
    mode: readonly ? 'view' : context?.mode ?? 'edit',
  };
}

export function extractFlowInspectorFieldPaths(config: FormConfig | null | undefined): string[] {
  if (!config?.fields?.length) {
    return [];
  }
  return uniqueFieldPaths(extractFieldPaths(config.fields));
}

export function flowInspectorFieldSignature(value: Record<string, unknown>, fieldPaths: string[]): string {
  const signatureValue = fieldPaths.length
    ? fieldPaths.map(path => [path, readPath(value, path)])
    : value;
  return stringifyStable(signatureValue);
}

export function createFlowInspectorNodePatch(
  node: FlowNode,
  value: Record<string, unknown>,
  fieldPaths: string[]
): Partial<FlowNode> {
  const patch: Partial<FlowNode> = {};
  let data = cloneFlowValue(node.data ?? {}) as Record<string, unknown>;
  let dataChanged = false;

  for (const path of fieldPaths) {
    if (!hasPath(value, path)) {
      continue;
    }

    if (path.startsWith('node.')) {
      applyNodeFieldPatch(patch, path.slice('node.'.length), readPath(value, path));
      continue;
    }

    const dataPath = path.startsWith('data.') ? path.slice('data.'.length) : path;
    if (!dataPath) {
      continue;
    }
    data = writePath(data, dataPath, readPath(value, path));
    dataChanged = true;
  }

  if (dataChanged) {
    patch.data = data;
  }

  return patch;
}

function extractFieldPaths(fields: FieldConfig[], parentPath = ''): string[] {
  return fields.flatMap(field => {
    const path = parentPath ? `${parentPath}.${field.name}` : field.name;

    if (field.type === 'group') {
      return extractFieldPaths(field.children, field.flat ? parentPath : path);
    }

    return [path];
  });
}

function uniqueFieldPaths(paths: string[]): string[] {
  return Array.from(new Set(paths.filter(Boolean)));
}

function applyNodeFieldPatch(patch: Partial<FlowNode>, key: string, value: unknown): void {
  if (!SUPPORTED_NODE_FIELD_KEYS.has(key)) {
    return;
  }

  switch (key) {
    case 'label':
      patch.label = String(value ?? '');
      break;
    case 'status':
      patch.status = value as FlowNode['status'];
      break;
    case 'disabled':
      patch.disabled = value === true;
      break;
    case 'readonly':
      patch.readonly = value === true;
      break;
    default:
      break;
  }
}

function readPath(source: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((current, segment) => {
    if (current && typeof current === 'object' && segment in current) {
      return (current as Record<string, unknown>)[segment];
    }
    return null;
  }, source);
}

function hasPath(source: unknown, path: string): boolean {
  let cursor = source;
  for (const segment of path.split('.')) {
    if (!cursor || typeof cursor !== 'object' || !(segment in cursor)) {
      return false;
    }
    cursor = (cursor as Record<string, unknown>)[segment];
  }
  return true;
}

function writePath(source: Record<string, unknown>, path: string, value: unknown): Record<string, unknown> {
  const segments = path.split('.').filter(Boolean);
  if (!segments.length) {
    return source;
  }

  const result = cloneFlowValue(source) as Record<string, unknown>;
  let cursor: Record<string, unknown> | unknown[] = result;

  segments.slice(0, -1).forEach((segment, index) => {
    const nextSegment = segments[index + 1];
    const current = readSegment(cursor, segment);
    const nextValue = cloneContainer(current, isNumericSegment(nextSegment));
    writeSegment(cursor, segment, nextValue);
    cursor = nextValue;
  });

  writeSegment(cursor, segments[segments.length - 1], value);
  return result;
}

function readSegment(source: Record<string, unknown> | unknown[], segment: string): unknown {
  if (Array.isArray(source) && isNumericSegment(segment)) {
    return source[Number(segment)];
  }
  return (source as Record<string, unknown>)[segment];
}

function writeSegment(target: Record<string, unknown> | unknown[], segment: string, value: unknown): void {
  if (Array.isArray(target) && isNumericSegment(segment)) {
    target[Number(segment)] = value;
    return;
  }
  (target as Record<string, unknown>)[segment] = value;
}

function cloneContainer(value: unknown, preferArray: boolean): Record<string, unknown> | unknown[] {
  if (Array.isArray(value)) {
    return [...value];
  }
  if (value && typeof value === 'object') {
    return { ...(value as Record<string, unknown>) };
  }
  return preferArray ? [] : {};
}

function isNumericSegment(segment: string | undefined): boolean {
  return segment != null && segment.trim() !== '' && Number.isInteger(Number(segment));
}

function stringifyStable(value: unknown): string {
  try {
    return JSON.stringify(value, (_key, item) =>
      typeof item === 'function' ? `[function:${item.name || 'anonymous'}]` : item
    ) ?? '';
  } catch {
    return String(value ?? '');
  }
}

import { FormValidationHelpers, TreeFormNode } from '../models/form-config.model';

export const formValidationHelpers: FormValidationHelpers = {
  flattenTree(value: unknown): TreeFormNode[] {
    const roots = normalizeTreeNodes(value);
    const result: TreeFormNode[] = [];

    const visit = (node: TreeFormNode): void => {
      result.push(node);
      normalizeTreeNodes(node.children).forEach(visit);
    };

    roots.forEach(visit);
    return result;
  },

  countTreeNodes(value: unknown): number {
    return this.flattenTree(value).length;
  },

  treeDepth(value: unknown): number {
    const roots = normalizeTreeNodes(value);
    const depthOf = (node: TreeFormNode): number => {
      const children = normalizeTreeNodes(node.children);
      return children.length ? 1 + Math.max(...children.map(depthOf)) : 1;
    };
    return roots.length ? Math.max(...roots.map(depthOf)) : 0;
  },

  hasDuplicate(value: unknown, key: string): boolean {
    const seen = new Set<string>();
    return this.flattenTree(value).some((node) => {
      const rawValue = resolveTreeNodeValue(node, key);
      if (rawValue == null || rawValue === '') {
        return false;
      }
      const normalized = JSON.stringify(rawValue ?? null);
      if (seen.has(normalized)) {
        return true;
      }
      seen.add(normalized);
      return false;
    });
  },

  hasDisabledNode(value: unknown): boolean {
    return this.flattenTree(value).some((node) => node.disabled === true);
  },

  findTreeNode(value: unknown, predicate: (node: TreeFormNode) => boolean): TreeFormNode | null {
    return this.flattenTree(value).find(predicate) ?? null;
  }
};

export class ExpressionEngine {

  private cache = new Map<string, Function>();

  private compile(expression: string) {
    let fn: Function;

    try {
      fn = new Function(
        'model',
        'context',
        'value',
        'helpers',
        `return (${expression});`
      );
    } catch (err) {
      console.error('[Compile Error]', {
        expression,
        error: err
      });
      return () => undefined;
    }

    return (model: any, context: any, value: any) => {
      try {
        return fn(model, context, value, formValidationHelpers);
      } catch (err) {
        console.error('[Runtime Error]', {
          expression,
          model,
          context,
          value,
          error: err
        });
        return undefined;
      }
    };
  }

  evaluate(expression: string, ctx: {
    model: any;
    context: any;
    value?: any;
  }): any {

    if (!this.cache.has(expression)) {
      this.cache.set(expression, this.compile(expression));
    }

    const fn = this.cache.get(expression)!;

    return fn(
      ctx.model,
      ctx.context,
      ctx.value
    );
  }

  renderTemplate(template: string, ctx: {
    model: any;
    context: any;
    value?: any;
  }): string {

    return template.replace(/\$\{([^}]+)\}/g, (_, expr) => {
      try {

        if (!this.cache.has(expr)) {
          this.cache.set(expr, this.compile(expr));
        }

        const fn = this.cache.get(expr)!;

        const result = fn(
          ctx.model,
          ctx.context,
          ctx.value,
          formValidationHelpers
        );

        return result ?? '';

      } catch (err) {
        console.error('[Template Error]', {
          expression: expr,
          error: err
        });
        return '';
      }
    });
  }
}

function normalizeTreeNodes(value: unknown): TreeFormNode[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is TreeFormNode => !!item && typeof item === 'object' && 'id' in item && 'label' in item);
}

function resolveTreeNodeValue(node: TreeFormNode, key: string): unknown {
  if (key.includes('.')) {
    return getByPath(node as unknown as Record<string, unknown>, key);
  }

  const record = node as unknown as Record<string, unknown>;
  if (key in record) {
    return record[key];
  }
  if (node.data && key in node.data) {
    return node.data[key];
  }
  if (node.value && typeof node.value === 'object' && !Array.isArray(node.value)) {
    const valueRecord = node.value as Record<string, unknown>;
    if (key in valueRecord) {
      return valueRecord[key];
    }
  }
  return undefined;
}

function getByPath(source: Record<string, unknown>, path: string): unknown {
  return path
    .split('.')
    .filter(Boolean)
    .reduce<unknown>((current, segment) => {
      if (!current || typeof current !== 'object' || Array.isArray(current)) {
        return undefined;
      }
      return (current as Record<string, unknown>)[segment];
    }, source);
}

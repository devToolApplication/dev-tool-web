import { TreeFormNode } from '../models/form-config.model';
import { ExpressionEngine, formValidationHelpers } from './expression.engine';
import { Rules } from './validation-rules';

describe('formValidationHelpers', () => {
  const tree: TreeFormNode[] = [
    {
      id: 'root',
      label: 'Root',
      value: { code: 'ROOT' },
      children: [
        {
          id: 'child-a',
          label: 'Child A',
          value: { code: 'DUPLICATE' },
          disabled: true,
        },
        {
          id: 'child-b',
          label: 'Child B',
          value: { code: 'DUPLICATE' },
          children: [
            {
              id: 'leaf',
              label: 'Leaf',
              value: { code: 'LEAF' },
              data: { alias: 'target' },
            },
          ],
        },
      ],
    },
  ];

  it('flattens and counts tree nodes without depending on domain models', () => {
    expect(formValidationHelpers.flattenTree(tree).map((node) => node.id)).toEqual([
      'root',
      'child-a',
      'child-b',
      'leaf',
    ]);
    expect(formValidationHelpers.countTreeNodes(tree)).toBe(4);
    expect(formValidationHelpers.treeDepth(tree)).toBe(3);
  });

  it('handles null, empty and partial tree values safely', () => {
    expect(formValidationHelpers.flattenTree(null)).toEqual([]);
    expect(formValidationHelpers.countTreeNodes(undefined)).toBe(0);
    expect(formValidationHelpers.treeDepth([])).toBe(0);
    expect(
      formValidationHelpers.flattenTree([{ id: 'partial', label: 'Partial', value: null }]),
    ).toHaveLength(1);
  });

  it('detects duplicate, disabled and matching nodes through generic helpers', () => {
    expect(formValidationHelpers.hasDuplicate(tree, 'value.code')).toBe(true);
    expect(formValidationHelpers.hasDisabledNode(tree)).toBe(true);
    expect(
      formValidationHelpers.findTreeNode(tree, (node) => node.data?.['alias'] === 'target')?.id,
    ).toBe('leaf');
  });
});

describe('ExpressionEngine tree helper integration', () => {
  it('exposes tree helpers to validation expressions and swallows runtime errors', () => {
    const engine = new ExpressionEngine();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const value: TreeFormNode[] = [
      {
        id: 'root',
        label: 'Root',
        value: 'root',
      },
    ];

    expect(
      engine.evaluate('helpers.countTreeNodes(value) === 1', { model: {}, context: {}, value }),
    ).toBe(true);
    expect(
      engine.evaluate('helpers.countTreeNodes(value) <= 5', { model: {}, context: {}, value }),
    ).toBe(true);
    expect(
      engine.evaluate('model.missing.call()', { model: {}, context: {}, value }),
    ).toBeUndefined();
    expect(consoleError).toHaveBeenCalledWith('[Runtime Error]', expect.any(Object));

    consoleError.mockRestore();
  });

  it('evaluates the safe expression subset used by forms and filters', () => {
    const engine = new ExpressionEngine();
    const options = [{ label: 'Enabled', value: true }];

    expect(
      engine.evaluate('model.enabled && context.mode === "edit" && value >= 3', {
        model: { enabled: true },
        context: { mode: 'edit' },
        value: 5,
      }),
    ).toBe(true);
    expect(
      engine.evaluate('value == null || String(value).trim() === ""', {
        model: {},
        context: {},
        value: '   ',
      }),
    ).toBe(true);
    expect(
      engine.evaluate('context.options', {
        model: {},
        context: { options },
      }),
    ).toEqual(options);
  });

  it('blocks constructor escape expressions instead of executing arbitrary JavaScript', () => {
    const engine = new ExpressionEngine();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const key = '__expressionEnginePwned';
    const globals = globalThis as Record<string, unknown>;
    delete globals[key];

    try {
      expect(
        engine.evaluate(`model.constructor.constructor("globalThis.${key} = true")()`, {
          model: {},
          context: {},
        }),
      ).toBeUndefined();
      expect(globals[key]).toBeUndefined();
      expect(consoleError).toHaveBeenCalledWith('[Runtime Error]', expect.any(Object));
    } finally {
      consoleError.mockRestore();
      delete globals[key];
    }
  });

  it('rejects regex literals so expressions cannot run unbounded regular expressions', () => {
    const engine = new ExpressionEngine();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(
      engine.evaluate('/(a+)+$/.test(value)', { model: {}, context: {}, value: 'aaaa!' }),
    ).toBeUndefined();
    expect(consoleError).toHaveBeenCalledWith('[Compile Error]', expect.any(Object));

    consoleError.mockRestore();
  });

  it('rejects constructor syntax including Date constructors', () => {
    const engine = new ExpressionEngine();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(
      engine.evaluate('new Date(value)', { model: {}, context: {}, value: '2026-01-01' }),
    ).toBeUndefined();
    expect(Rules.before('"2026-01-01"').expression).not.toContain('new ');
    expect(Rules.after('"2026-01-01"').expression).not.toContain('new ');
    expect(consoleError).toHaveBeenCalledWith('[Compile Error]', expect.any(Object));

    consoleError.mockRestore();
  });

  it('supports generated validation rule expressions without broad JavaScript execution', () => {
    const engine = new ExpressionEngine();
    const ctx = (value: unknown) => ({ model: {}, context: {}, value });

    expect(engine.evaluate(Rules.required().expression ?? 'false', ctx('   '))).toBe(true);
    expect(engine.evaluate(Rules.requiredArray().expression ?? 'false', ctx([]))).toBe(true);
    expect(engine.evaluate(Rules.email().expression ?? 'false', ctx('bad-email'))).toBe(true);
    expect(engine.evaluate(Rules.pattern('^[A-Z]+$').expression ?? 'false', ctx('abc'))).toBe(true);
    expect(
      engine.evaluate(Rules.before('"2026-01-01"').expression ?? 'false', ctx('2026-02-01')),
    ).toBe(true);
    expect(
      engine.evaluate(Rules.after('"2026-01-01"').expression ?? 'false', ctx('2025-12-31')),
    ).toBe(true);
  });
});

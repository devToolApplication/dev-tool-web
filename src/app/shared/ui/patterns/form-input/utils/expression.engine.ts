import type { FormValidationHelpers, TreeFormNode } from '../models/form-config.model';

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

  isEmail(value: unknown): boolean {
    if (typeof value !== 'string') {
      return false;
    }

    const trimmed = value.trim();
    if (trimmed.length > 320) {
      return false;
    }

    const atIndex = trimmed.indexOf('@');
    if (atIndex <= 0 || atIndex !== trimmed.lastIndexOf('@')) {
      return false;
    }

    const localPart = trimmed.slice(0, atIndex);
    const domainPart = trimmed.slice(atIndex + 1);
    return (
      localPart.length > 0 &&
      domainPart.includes('.') &&
      !domainPart.startsWith('.') &&
      !domainPart.endsWith('.') &&
      !/\s/.test(trimmed)
    );
  },

  matchesPattern(value: unknown, pattern: string): boolean {
    if (typeof value !== 'string' || value.length > 512 || !isSafeRegexPattern(pattern)) {
      return false;
    }

    return new RegExp(pattern).test(value);
  },

  isBeforeDate(value: unknown, date: unknown): boolean {
    const valueTime = parseComparableDate(value);
    const dateTime = parseComparableDate(date);
    return valueTime !== null && dateTime !== null && valueTime < dateTime;
  },

  isAfterDate(value: unknown, date: unknown): boolean {
    const valueTime = parseComparableDate(value);
    const dateTime = parseComparableDate(date);
    return valueTime !== null && dateTime !== null && valueTime > dateTime;
  },

  findTreeNode(value: unknown, predicate: (node: TreeFormNode) => boolean): TreeFormNode | null {
    return this.flattenTree(value).find(predicate) ?? null;
  },
};

export class ExpressionEngine {
  private cache = new Map<string, CompiledExpression>();

  private compile(expression: string): CompiledExpression {
    let ast: ExpressionNode;

    try {
      ast = new ExpressionParser(tokenizeExpression(expression)).parse();
    } catch (err) {
      console.error('[Compile Error]', {
        expression,
        error: err,
      });
      return () => undefined;
    }

    return (model: unknown, context: unknown, value: unknown) => {
      try {
        return evaluateExpressionNode(ast, { model, context, value });
      } catch (err) {
        console.error('[Runtime Error]', {
          expression,
          model,
          context,
          value,
          error: err,
        });
        return undefined;
      }
    };
  }

  evaluate(
    expression: string,
    ctx: {
      model?: unknown;
      context?: unknown;
      value?: unknown;
    },
  ): unknown {
    const cacheKey = expression.trim();

    if (!this.cache.has(cacheKey)) {
      this.cache.set(cacheKey, this.compile(cacheKey));
    }

    const fn = this.cache.get(cacheKey)!;

    return fn(ctx.model, ctx.context, ctx.value);
  }

  renderTemplate(
    template: string,
    ctx: {
      model?: unknown;
      context?: unknown;
      value?: unknown;
    },
  ): string {
    return template.replace(/\$\{([^}]+)\}/g, (_: string, expr: string): string => {
      try {
        const cacheKey = expr.trim();

        if (!this.cache.has(cacheKey)) {
          this.cache.set(cacheKey, this.compile(cacheKey));
        }

        const fn = this.cache.get(cacheKey)!;

        const result = fn(ctx.model, ctx.context, ctx.value);

        return String(result ?? '');
      } catch (err) {
        console.error('[Template Error]', {
          expression: expr,
          error: err,
        });
        return '';
      }
    });
  }
}

type CompiledExpression = (model: unknown, context: unknown, value: unknown) => unknown;

type Token =
  | { type: 'identifier'; value: string }
  | { type: 'number'; value: number }
  | { type: 'string'; value: string }
  | { type: 'operator' | 'punctuation'; value: string }
  | { type: 'eof'; value: '' };

type ExpressionNode =
  | { kind: 'literal'; value: unknown }
  | { kind: 'identifier'; name: string }
  | { kind: 'array'; elements: ExpressionNode[] }
  | { kind: 'object'; properties: Array<{ key: string; value: ExpressionNode }> }
  | { kind: 'member'; object: ExpressionNode; property: string }
  | { kind: 'call'; callee: ExpressionNode; args: ExpressionNode[] }
  | { kind: 'unary'; operator: '!' | 'typeof' | '-' | '+'; argument: ExpressionNode }
  | { kind: 'binary'; operator: BinaryOperator; left: ExpressionNode; right: ExpressionNode }
  | {
      kind: 'conditional';
      test: ExpressionNode;
      consequent: ExpressionNode;
      alternate: ExpressionNode;
    };

type BinaryOperator = '||' | '&&' | '===' | '!==' | '==' | '!=' | '>' | '>=' | '<' | '<=';

interface ExpressionContext {
  model: unknown;
  context: unknown;
  value: unknown;
}

function tokenizeExpression(expression: string): Token[] {
  const tokens: Token[] = [];
  let index = 0;

  while (index < expression.length) {
    const char = expression[index];

    if (/\s/.test(char)) {
      index += 1;
      continue;
    }

    if (char === '"' || char === "'") {
      const { value, nextIndex } = readString(expression, index);
      tokens.push({ type: 'string', value });
      index = nextIndex;
      continue;
    }

    if (/\d/.test(char)) {
      const match = /^[0-9]+(?:\.[0-9]+)?/.exec(expression.slice(index));
      if (!match) {
        throw new Error('Invalid number literal');
      }
      tokens.push({ type: 'number', value: Number(match[0]) });
      index += match[0].length;
      continue;
    }

    if (/[A-Za-z_$]/.test(char)) {
      const match = /^[A-Za-z_$][\w$]*/.exec(expression.slice(index));
      if (!match) {
        throw new Error('Invalid identifier');
      }
      tokens.push({ type: 'identifier', value: match[0] });
      index += match[0].length;
      continue;
    }

    const threeChar = expression.slice(index, index + 3);
    if (threeChar === '===' || threeChar === '!==') {
      tokens.push({ type: 'operator', value: threeChar });
      index += 3;
      continue;
    }

    const twoChar = expression.slice(index, index + 2);
    if (['&&', '||', '==', '!=', '>=', '<='].includes(twoChar)) {
      tokens.push({ type: 'operator', value: twoChar });
      index += 2;
      continue;
    }

    if (['!', '>', '<', '-', '+'].includes(char)) {
      tokens.push({ type: 'operator', value: char });
      index += 1;
      continue;
    }

    if (['(', ')', '.', ',', '?', ':', '[', ']', '{', '}'].includes(char)) {
      tokens.push({ type: 'punctuation', value: char });
      index += 1;
      continue;
    }

    throw new Error(`Unsupported token "${char}"`);
  }

  tokens.push({ type: 'eof', value: '' });
  return tokens;
}

function readString(expression: string, startIndex: number): { value: string; nextIndex: number } {
  const quote = expression[startIndex];
  let value = '';
  let index = startIndex + 1;

  while (index < expression.length) {
    const char = expression[index];

    if (char === quote) {
      return { value, nextIndex: index + 1 };
    }

    if (char === '\\') {
      const next = expression[index + 1];
      if (next === undefined) {
        throw new Error('Unterminated string literal');
      }
      value += decodeEscape(next);
      index += 2;
      continue;
    }

    value += char;
    index += 1;
  }

  throw new Error('Unterminated string literal');
}

function decodeEscape(char: string): string {
  switch (char) {
    case 'n':
      return '\n';
    case 'r':
      return '\r';
    case 't':
      return '\t';
    case 'b':
      return '\b';
    case 'f':
      return '\f';
    case 'v':
      return '\v';
    case '0':
      return '\0';
    default:
      return char;
  }
}

class ExpressionParser {
  private index = 0;

  constructor(private readonly tokens: Token[]) {}

  parse(): ExpressionNode {
    const expression = this.parseConditional();
    this.expect('eof', '');
    return expression;
  }

  private parseConditional(): ExpressionNode {
    const test = this.parseLogicalOr();
    if (!this.match('punctuation', '?')) {
      return test;
    }

    const consequent = this.parseConditional();
    this.expect('punctuation', ':');
    const alternate = this.parseConditional();
    return { kind: 'conditional', test, consequent, alternate };
  }

  private parseLogicalOr(): ExpressionNode {
    let node = this.parseLogicalAnd();
    while (this.match('operator', '||')) {
      node = { kind: 'binary', operator: '||', left: node, right: this.parseLogicalAnd() };
    }
    return node;
  }

  private parseLogicalAnd(): ExpressionNode {
    let node = this.parseEquality();
    while (this.match('operator', '&&')) {
      node = { kind: 'binary', operator: '&&', left: node, right: this.parseEquality() };
    }
    return node;
  }

  private parseEquality(): ExpressionNode {
    let node = this.parseRelational();

    while (isOperator(this.current(), ['===', '!==', '==', '!='])) {
      const operator = this.advance().value as BinaryOperator;
      node = { kind: 'binary', operator, left: node, right: this.parseRelational() };
    }

    return node;
  }

  private parseRelational(): ExpressionNode {
    let node = this.parseUnary();

    while (isOperator(this.current(), ['>', '>=', '<', '<='])) {
      const operator = this.advance().value as BinaryOperator;
      node = { kind: 'binary', operator, left: node, right: this.parseUnary() };
    }

    return node;
  }

  private parseUnary(): ExpressionNode {
    if (this.match('operator', '!')) {
      return { kind: 'unary', operator: '!', argument: this.parseUnary() };
    }
    if (this.match('operator', '-')) {
      return { kind: 'unary', operator: '-', argument: this.parseUnary() };
    }
    if (this.match('operator', '+')) {
      return { kind: 'unary', operator: '+', argument: this.parseUnary() };
    }
    if (this.match('identifier', 'typeof')) {
      return { kind: 'unary', operator: 'typeof', argument: this.parseUnary() };
    }
    return this.parseCallMember();
  }

  private parseCallMember(): ExpressionNode {
    let node = this.parsePrimary();

    while (true) {
      if (this.match('punctuation', '.')) {
        const property = String(this.expect('identifier').value);
        node = { kind: 'member', object: node, property };
        continue;
      }

      if (this.match('punctuation', '(')) {
        node = { kind: 'call', callee: node, args: this.parseArguments() };
        continue;
      }

      return node;
    }
  }

  private parsePrimary(): ExpressionNode {
    const token = this.current();

    if (token.type === 'number' || token.type === 'string') {
      this.advance();
      return { kind: 'literal', value: token.value };
    }

    if (token.type === 'identifier') {
      this.advance();
      switch (token.value) {
        case 'true':
          return { kind: 'literal', value: true };
        case 'false':
          return { kind: 'literal', value: false };
        case 'null':
          return { kind: 'literal', value: null };
        case 'undefined':
          return { kind: 'literal', value: undefined };
        default:
          return { kind: 'identifier', name: token.value };
      }
    }

    if (this.match('punctuation', '(')) {
      const expression = this.parseConditional();
      this.expect('punctuation', ')');
      return expression;
    }

    if (this.match('punctuation', '[')) {
      return this.parseArray();
    }

    if (this.match('punctuation', '{')) {
      return this.parseObject();
    }

    throw new Error(`Unexpected token "${token.value}"`);
  }

  private parseArray(): ExpressionNode {
    const elements: ExpressionNode[] = [];
    if (this.match('punctuation', ']')) {
      return { kind: 'array', elements };
    }

    do {
      elements.push(this.parseConditional());
    } while (this.match('punctuation', ','));

    this.expect('punctuation', ']');
    return { kind: 'array', elements };
  }

  private parseObject(): ExpressionNode {
    const properties: Array<{ key: string; value: ExpressionNode }> = [];
    if (this.match('punctuation', '}')) {
      return { kind: 'object', properties };
    }

    do {
      const keyToken = this.current();
      if (keyToken.type !== 'identifier' && keyToken.type !== 'string') {
        throw new Error('Object literal keys must be identifiers or strings');
      }
      this.advance();
      this.expect('punctuation', ':');
      properties.push({ key: keyToken.value, value: this.parseConditional() });
    } while (this.match('punctuation', ','));

    this.expect('punctuation', '}');
    return { kind: 'object', properties };
  }

  private parseArguments(): ExpressionNode[] {
    const args: ExpressionNode[] = [];
    if (this.match('punctuation', ')')) {
      return args;
    }

    do {
      args.push(this.parseConditional());
    } while (this.match('punctuation', ','));

    this.expect('punctuation', ')');
    return args;
  }

  private current(): Token {
    return this.tokens[this.index] ?? { type: 'eof', value: '' };
  }

  private advance(): Token {
    const token = this.current();
    this.index += 1;
    return token;
  }

  private match(type: Token['type'], value: string): boolean {
    const token = this.current();
    if (token.type !== type || token.value !== value) {
      return false;
    }
    this.advance();
    return true;
  }

  private expect(type: Token['type'], value?: string): Token {
    const token = this.current();
    if (token.type !== type || (value !== undefined && token.value !== value)) {
      throw new Error(`Expected ${value ?? type}`);
    }
    return this.advance();
  }
}

function isOperator(
  token: Token,
  operators: string[],
): token is Extract<Token, { type: 'operator' }> {
  return token.type === 'operator' && operators.includes(token.value);
}

function evaluateExpressionNode(node: ExpressionNode, ctx: ExpressionContext): unknown {
  switch (node.kind) {
    case 'literal':
      return node.value;
    case 'identifier':
      return evaluateIdentifier(node.name, ctx);
    case 'array':
      return node.elements.map((element) => evaluateExpressionNode(element, ctx));
    case 'object':
      return node.properties.reduce<Record<string, unknown>>((result, property) => {
        result[property.key] = evaluateExpressionNode(property.value, ctx);
        return result;
      }, {});
    case 'member':
      return readSafeProperty(evaluateExpressionNode(node.object, ctx), node.property);
    case 'call':
      return evaluateCall(node, ctx);
    case 'unary':
      return evaluateUnary(node, ctx);
    case 'binary':
      return evaluateBinary(node, ctx);
    case 'conditional':
      return evaluateExpressionNode(
        isTruthy(evaluateExpressionNode(node.test, ctx)) ? node.consequent : node.alternate,
        ctx,
      );
    default:
      return undefined;
  }
}

function evaluateIdentifier(name: string, ctx: ExpressionContext): unknown {
  switch (name) {
    case 'model':
      return ctx.model;
    case 'context':
      return ctx.context;
    case 'value':
      return ctx.value;
    case 'helpers':
      return formValidationHelpers;
    case 'String':
    case 'Number':
    case 'Boolean':
      return name;
    default:
      throw new Error(`Unknown identifier "${name}"`);
  }
}

function evaluateUnary(
  node: Extract<ExpressionNode, { kind: 'unary' }>,
  ctx: ExpressionContext,
): unknown {
  const value = evaluateExpressionNode(node.argument, ctx);
  switch (node.operator) {
    case '!':
      return !isTruthy(value);
    case 'typeof':
      return typeof value;
    case '-':
      return -Number(value);
    case '+':
      return Number(value);
  }
}

function evaluateBinary(
  node: Extract<ExpressionNode, { kind: 'binary' }>,
  ctx: ExpressionContext,
): unknown {
  if (node.operator === '&&') {
    const left = evaluateExpressionNode(node.left, ctx);
    return isTruthy(left) ? evaluateExpressionNode(node.right, ctx) : left;
  }

  if (node.operator === '||') {
    const left = evaluateExpressionNode(node.left, ctx);
    return isTruthy(left) ? left : evaluateExpressionNode(node.right, ctx);
  }

  const left = evaluateExpressionNode(node.left, ctx);
  const right = evaluateExpressionNode(node.right, ctx);

  switch (node.operator) {
    case '===':
      return left === right;
    case '!==':
      return left !== right;
    case '==':
      return safelyLooselyEqual(left, right);
    case '!=':
      return !safelyLooselyEqual(left, right);
    case '>':
    case '>=':
    case '<':
    case '<=':
      return compareValues(left, right, node.operator);
  }
}

function evaluateCall(
  node: Extract<ExpressionNode, { kind: 'call' }>,
  ctx: ExpressionContext,
): unknown {
  if (node.callee.kind === 'identifier') {
    const args = node.args.map((arg) => evaluateExpressionNode(arg, ctx));
    return callSafeIntrinsic(node.callee.name, args);
  }

  if (node.callee.kind !== 'member') {
    throw new Error('Only whitelisted function and method calls are allowed');
  }

  const object = evaluateExpressionNode(node.callee.object, ctx);
  const args = node.args.map((arg) => evaluateExpressionNode(arg, ctx));

  if (object === formValidationHelpers) {
    return callHelper(node.callee.property, args);
  }

  if (typeof object === 'string') {
    return callStringMethod(object, node.callee.property, args);
  }

  throw new Error(`Method "${node.callee.property}" is not allowed`);
}

function callSafeIntrinsic(name: string, args: unknown[]): unknown {
  switch (name) {
    case 'String':
      return String(args[0] ?? '');
    case 'Number':
      return Number(args[0]);
    case 'Boolean':
      return Boolean(args[0]);
    default:
      throw new Error(`Function "${name}" is not allowed`);
  }
}

function callHelper(name: string, args: unknown[]): unknown {
  if (!isSafeExpressionHelper(name)) {
    throw new Error(`Helper "${name}" is not allowed`);
  }
  switch (name) {
    case 'flattenTree':
      return formValidationHelpers.flattenTree(args[0]);
    case 'countTreeNodes':
      return formValidationHelpers.countTreeNodes(args[0]);
    case 'treeDepth':
      return formValidationHelpers.treeDepth(args[0]);
    case 'hasDuplicate':
      return formValidationHelpers.hasDuplicate(args[0], String(args[1] ?? ''));
    case 'hasDisabledNode':
      return formValidationHelpers.hasDisabledNode(args[0]);
    case 'isEmail':
      return formValidationHelpers.isEmail(args[0]);
    case 'matchesPattern':
      return formValidationHelpers.matchesPattern(args[0], String(args[1] ?? ''));
    case 'isBeforeDate':
      return formValidationHelpers.isBeforeDate(args[0], args[1]);
    case 'isAfterDate':
      return formValidationHelpers.isAfterDate(args[0], args[1]);
  }
}

function callStringMethod(value: string, method: string, args: unknown[]): unknown {
  switch (method) {
    case 'trim':
      return value.trim();
    case 'toLowerCase':
      return value.toLowerCase();
    case 'toUpperCase':
      return value.toUpperCase();
    case 'includes':
      return value.includes(String(args[0] ?? ''));
    default:
      throw new Error(`String method "${method}" is not allowed`);
  }
}

function readSafeProperty(source: unknown, property: string): unknown {
  if (property === 'constructor' || property === 'prototype' || property === '__proto__') {
    throw new Error(`Property "${property}" is not allowed`);
  }

  if (source == null) {
    return undefined;
  }

  if (typeof source === 'string' || Array.isArray(source)) {
    return property === 'length' ? source.length : undefined;
  }

  if (source instanceof Date) {
    return property === 'getTime' ? source.getTime() : undefined;
  }

  if (typeof source !== 'object') {
    return undefined;
  }

  const record = source as Record<string, unknown>;
  return Object.prototype.hasOwnProperty.call(record, property) ? record[property] : undefined;
}

function safelyLooselyEqual(left: unknown, right: unknown): boolean {
  if ((left === null || left === undefined) && (right === null || right === undefined)) {
    return true;
  }
  if (typeof left === typeof right) {
    return left === right;
  }
  if (typeof left === 'number' && typeof right === 'string') {
    return left === Number(right);
  }
  if (typeof left === 'string' && typeof right === 'number') {
    return Number(left) === right;
  }
  if (typeof left === 'boolean') {
    return Number(left) === right;
  }
  if (typeof right === 'boolean') {
    return left === Number(right);
  }
  return false;
}

function compareValues(left: unknown, right: unknown, operator: '>' | '>=' | '<' | '<='): boolean {
  const leftValue = comparableValue(left);
  const rightValue = comparableValue(right);

  if (leftValue === undefined || rightValue === undefined) {
    return false;
  }

  switch (operator) {
    case '>':
      return leftValue > rightValue;
    case '>=':
      return leftValue >= rightValue;
    case '<':
      return leftValue < rightValue;
    case '<=':
      return leftValue <= rightValue;
  }
}

function comparableValue(value: unknown): number | string | undefined {
  if (value instanceof Date) {
    const time = value.getTime();
    return Number.isFinite(time) ? time : undefined;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }

  if (typeof value === 'string') {
    const numericValue = Number(value);
    return value.trim() !== '' && Number.isFinite(numericValue) ? numericValue : value;
  }

  if (typeof value === 'boolean') {
    return Number(value);
  }

  return undefined;
}

function isSafeExpressionHelper(
  name: string,
): name is keyof Pick<
  FormValidationHelpers,
  | 'flattenTree'
  | 'countTreeNodes'
  | 'treeDepth'
  | 'hasDuplicate'
  | 'hasDisabledNode'
  | 'isEmail'
  | 'matchesPattern'
  | 'isBeforeDate'
  | 'isAfterDate'
> {
  return (
    name === 'flattenTree' ||
    name === 'countTreeNodes' ||
    name === 'treeDepth' ||
    name === 'hasDuplicate' ||
    name === 'hasDisabledNode' ||
    name === 'isEmail' ||
    name === 'matchesPattern' ||
    name === 'isBeforeDate' ||
    name === 'isAfterDate'
  );
}

function parseComparableDate(value: unknown): number | null {
  if (value instanceof Date) {
    const time = value.getTime();
    return Number.isFinite(time) ? time : null;
  }

  if (typeof value !== 'string' && typeof value !== 'number') {
    return null;
  }

  if (typeof value === 'string' && value.trim() === '') {
    return null;
  }

  const time = Date.parse(String(value));
  return Number.isFinite(time) ? time : null;
}

function isSafeRegexPattern(pattern: string): boolean {
  if (!pattern || pattern.length > 128) {
    return false;
  }

  if (/[{}]/.test(pattern) || /\([^)]*[+*][^)]*\)[+*]/.test(pattern)) {
    return false;
  }

  try {
    new RegExp(pattern);
    return true;
  } catch {
    return false;
  }
}

function isTruthy(value: unknown): boolean {
  return Boolean(value);
}

function normalizeTreeNodes(value: unknown): TreeFormNode[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter(
    (item): item is TreeFormNode =>
      !!item && typeof item === 'object' && 'id' in item && 'label' in item,
  );
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

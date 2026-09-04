import type {
  BpmnWorkflowNode,
  BpmnWorkflowNodeType,
  JsonValue,
  WorkflowNodePosition,
  WorkflowCompareCondition,
  WorkflowCondition,
  WorkflowEdge,
  WorkflowGraph,
  WorkflowValidationIssue,
} from '../model/workflow-studio.model';

const BPMN_NS = 'http://www.omg.org/spec/BPMN/20100524/MODEL';
const XSI_NS = 'http://www.w3.org/2001/XMLSchema-instance';
const FLOWABLE_NS = 'http://flowable.org/bpmn';
const DEVTOOL_NS = 'http://devtool.vn/workflow/ui';
const BPMNDI_NS = 'http://www.omg.org/spec/BPMN/20100524/DI';
const DI_NS = 'http://www.omg.org/spec/DD/20100524/DI';
const DC_NS = 'http://www.omg.org/spec/DD/20100524/DC';

const TAG_BY_TYPE: Record<BpmnWorkflowNodeType, string> = {
  START_EVENT: 'startEvent',
  END_EVENT: 'endEvent',
  SERVICE_TASK: 'serviceTask',
  CALL_ACTIVITY: 'callActivity',
  USER_TASK: 'userTask',
  EXCLUSIVE_GATEWAY: 'exclusiveGateway',
  INCLUSIVE_GATEWAY: 'inclusiveGateway',
  PARALLEL_GATEWAY: 'parallelGateway',
  EVENT_BASED_GATEWAY: 'eventBasedGateway',
  INTERMEDIATE_CATCH_EVENT: 'intermediateCatchEvent',
};

const TYPE_BY_TAG: Record<string, BpmnWorkflowNodeType | undefined> = {
  startEvent: 'START_EVENT',
  endEvent: 'END_EVENT',
  serviceTask: 'SERVICE_TASK',
  callActivity: 'CALL_ACTIVITY',
  userTask: 'USER_TASK',
  exclusiveGateway: 'EXCLUSIVE_GATEWAY',
  inclusiveGateway: 'INCLUSIVE_GATEWAY',
  parallelGateway: 'PARALLEL_GATEWAY',
  eventBasedGateway: 'EVENT_BASED_GATEWAY',
  intermediateCatchEvent: 'INTERMEDIATE_CATCH_EVENT',
};

export interface WorkflowBpmnAdapterResult {
  graph: WorkflowGraph;
  issues: WorkflowValidationIssue[];
  processId: string | null;
}

export interface WorkflowBpmnXmlOptions {
  processId?: string;
  processName?: string | null;
  positions?: Record<string, WorkflowNodePosition>;
}

export function workflowGraphToBpmnXml(
  graph: WorkflowGraph,
  options: WorkflowBpmnXmlOptions = {},
): string {
  const processId = safeXmlId(options.processId || 'workflow_draft');
  const processName = options.processName ? ` name="${escapeAttr(options.processName)}"` : '';
  const outgoing = indexOutgoing(graph.edges);

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<definitions xmlns="${BPMN_NS}" xmlns:xsi="${XSI_NS}" xmlns:flowable="${FLOWABLE_NS}" xmlns:devtool="${DEVTOOL_NS}" xmlns:bpmndi="${BPMNDI_NS}" xmlns:di="${DI_NS}" xmlns:dc="${DC_NS}" targetNamespace="http://devtool.vn/workflow">`,
    `  <process id="${processId}"${processName} isExecutable="true">`,
    ...graph.nodes.map((node) => renderNode(node as BpmnWorkflowNode, outgoing.get(node.id) ?? [])),
    ...graph.edges.map(renderSequenceFlow),
    '  </process>',
    ...renderDiagram(processId, graph, options.positions ?? {}),
    '</definitions>',
    '',
  ].join('\n');
}

export function workflowGraphFromBpmnXml(xml: string): WorkflowBpmnAdapterResult {
  const issues: WorkflowValidationIssue[] = [];
  const document = new DOMParser().parseFromString(xml, 'application/xml');
  const parserError = firstByLocalName(document, 'parsererror');

  if (parserError) {
    return {
      graph: { nodes: [], edges: [] },
      issues: [issue('BPMN_XML_INVALID', parserError.textContent || 'BPMN XML is invalid')],
      processId: null,
    };
  }

  const process = firstByLocalName(document, 'process');
  if (!process) {
    return {
      graph: { nodes: [], edges: [] },
      issues: [issue('BPMN_PROCESS_REQUIRED', 'BPMN process is required')],
      processId: null,
    };
  }

  const defaultFlowIds = new Set(
    elementChildren(process)
      .map((element) => attr(element, 'default'))
      .filter((value): value is string => !!value),
  );

  const nodes: BpmnWorkflowNode[] = [];
  const edges: WorkflowEdge[] = [];
  for (const element of elementChildren(process)) {
    if (element.localName === 'sequenceFlow') {
      edges.push(parseSequenceFlow(element, defaultFlowIds, issues));
      continue;
    }

    const node = parseNode(element, issues);
    if (node) {
      nodes.push(node);
    }
  }

  return {
    graph: { nodes, edges },
    issues,
    processId: attr(process, 'id'),
  };
}

export function workflowConditionToExpression(condition: WorkflowCondition | null | undefined): string | null {
  if (!condition) {
    return null;
  }

  return `\${${compileCondition(condition)}}`;
}

function renderNode(node: BpmnWorkflowNode, outgoing: WorkflowEdge[]): string {
  const tag = TAG_BY_TYPE[node.type];
  const attrs = [
    `id="${escapeAttr(node.id)}"`,
    node.name ? `name="${escapeAttr(node.name)}"` : null,
    renderDefaultFlowAttr(node, outgoing),
    ...renderAttributePairs(node.attributes),
  ].filter(Boolean);
  const children = renderNodeChildren(node);

  if (!children.length) {
    return `    <${tag} ${attrs.join(' ')} />`;
  }

  return [
    `    <${tag} ${attrs.join(' ')}>`,
    ...children,
    `    </${tag}>`,
  ].join('\n');
}

function renderNodeChildren(node: BpmnWorkflowNode): string[] {
  const children: string[] = [];
  if (node.extensionElementsXml) {
    children.push(indentXml(node.extensionElementsXml, 6));
  }
  if (node.incoming?.length) {
    children.push(...node.incoming.map((value) => `      <incoming>${escapeText(value)}</incoming>`));
  }
  if (node.outgoing?.length) {
    children.push(...node.outgoing.map((value) => `      <outgoing>${escapeText(value)}</outgoing>`));
  }
  if (node.eventDefinitionsXml) {
    children.push(indentXml(node.eventDefinitionsXml, 6));
  }
  return children;
}

function indentXml(xml: string, spaces: number): string {
  const indent = ' '.repeat(spaces);
  return xml
    .trim()
    .split('\n')
    .map((line) => `${indent}${line.trim()}`)
    .join('\n');
}

function renderDefaultFlowAttr(node: BpmnWorkflowNode, outgoing: WorkflowEdge[]): string | null {
  if (node.type !== 'EXCLUSIVE_GATEWAY' && node.type !== 'INCLUSIVE_GATEWAY') {
    return null;
  }

  const defaultFlow = outgoing.find((edge) => edge.defaultFlow);
  return defaultFlow ? `default="${escapeAttr(edgeXmlId(defaultFlow))}"` : null;
}

function renderSequenceFlow(edge: WorkflowEdge): string {
  const attrs = [
    `id="${escapeAttr(edgeXmlId(edge))}"`,
    `sourceRef="${escapeAttr(edge.source)}"`,
    `targetRef="${escapeAttr(edge.target)}"`,
    edge.name ? `name="${escapeAttr(edge.name)}"` : null,
    edge.defaultFlow ? 'devtool:defaultFlow="true"' : null,
    edge.condition ? `devtool:conditionJson="${escapeAttr(JSON.stringify(edge.condition))}"` : null,
  ].filter(Boolean);
  const expression = workflowConditionToExpression(edge.condition) ?? edge.conditionExpression ?? null;

  if (!expression) {
    return `    <sequenceFlow ${attrs.join(' ')} />`;
  }

  return [
    `    <sequenceFlow ${attrs.join(' ')}>`,
    `      <conditionExpression xsi:type="tFormalExpression">${escapeText(expression)}</conditionExpression>`,
    '    </sequenceFlow>',
  ].join('\n');
}

function renderDiagram(
  processId: string,
  graph: WorkflowGraph,
  positions: Record<string, WorkflowNodePosition>,
): string[] {
  const nodePosition = (nodeId: string, index: number): WorkflowNodePosition =>
    positions[nodeId] ?? { x: 160 + index * 200, y: 140 };
  const indexedNodes = new Map(graph.nodes.map((node, index) => [node.id, { node, index }]));

  return [
    `  <bpmndi:BPMNDiagram id="${processId}_diagram">`,
    `    <bpmndi:BPMNPlane id="${processId}_plane" bpmnElement="${processId}">`,
    ...graph.nodes.map((node, index) => {
      const bounds = boundsForNode(node as BpmnWorkflowNode, nodePosition(node.id, index));
      return [
        `      <bpmndi:BPMNShape id="${escapeAttr(node.id)}_di" bpmnElement="${escapeAttr(node.id)}">`,
        `        <dc:Bounds x="${bounds.x}" y="${bounds.y}" width="${bounds.width}" height="${bounds.height}" />`,
        '      </bpmndi:BPMNShape>',
      ].join('\n');
    }),
    ...graph.edges.map((edge) => {
      const source = indexedNodes.get(edge.source);
      const target = indexedNodes.get(edge.target);
      const sourceBounds = boundsForNode(source?.node as BpmnWorkflowNode, nodePosition(edge.source, source?.index ?? 0));
      const targetBounds = boundsForNode(target?.node as BpmnWorkflowNode, nodePosition(edge.target, target?.index ?? 0));
      return [
        `      <bpmndi:BPMNEdge id="${escapeAttr(edgeXmlId(edge))}_di" bpmnElement="${escapeAttr(edgeXmlId(edge))}">`,
        `        <di:waypoint x="${sourceBounds.x + sourceBounds.width}" y="${sourceBounds.y + Math.round(sourceBounds.height / 2)}" />`,
        `        <di:waypoint x="${targetBounds.x}" y="${targetBounds.y + Math.round(targetBounds.height / 2)}" />`,
        '      </bpmndi:BPMNEdge>',
      ].join('\n');
    }),
    '    </bpmndi:BPMNPlane>',
    '  </bpmndi:BPMNDiagram>',
  ];
}

function boundsForNode(
  node: BpmnWorkflowNode | undefined,
  position: WorkflowNodePosition,
): WorkflowNodePosition & { width: number; height: number } {
  if (node?.type === 'START_EVENT' || node?.type === 'END_EVENT' || node?.type === 'INTERMEDIATE_CATCH_EVENT') {
    return { ...position, width: 36, height: 36 };
  }
  if (
    node?.type === 'EXCLUSIVE_GATEWAY' ||
    node?.type === 'INCLUSIVE_GATEWAY' ||
    node?.type === 'PARALLEL_GATEWAY' ||
    node?.type === 'EVENT_BASED_GATEWAY'
  ) {
    return { ...position, width: 50, height: 50 };
  }
  return { ...position, width: 160, height: 80 };
}

function parseNode(element: Element, issues: WorkflowValidationIssue[]): BpmnWorkflowNode | null {
  const id = attr(element, 'id') || element.localName;
  const type = TYPE_BY_TAG[element.localName];

  if (!type) {
    issues.push(issue('BPMN_ELEMENT_UNSUPPORTED', `Unsupported BPMN element: ${element.localName}`, { nodeId: id }));
    return null;
  }

  const node: BpmnWorkflowNode = {
    id,
    type,
    name: attr(element, 'name'),
    ...taskConfigFromServiceTask(element, issues, id),
    ...nodeMetadata(element),
  };

  return node;
}

function nodeMetadata(element: Element): Partial<BpmnWorkflowNode> {
  const metadata: Partial<BpmnWorkflowNode> = {};
  const attributes = preservedAttributes(element);
  if (Object.keys(attributes).length) {
    metadata.attributes = attributes;
  }
  const incoming = childTextValues(element, 'incoming');
  if (incoming.length) {
    metadata.incoming = incoming;
  }
  const outgoing = childTextValues(element, 'outgoing');
  if (outgoing.length) {
    metadata.outgoing = outgoing;
  }
  const extensionElements = firstByLocalName(element, 'extensionElements');
  if (extensionElements) {
    metadata.extensionElementsXml = serializeElement(extensionElements);
  }
  const eventDefinitions = elementChildren(element).filter((child) => child.localName.endsWith('EventDefinition'));
  if (eventDefinitions.length) {
    metadata.eventDefinitionsXml = eventDefinitions.map((child) => serializeElement(child)).join('\n');
  }
  return metadata;
}

function parseSequenceFlow(
  element: Element,
  defaultFlowIds: Set<string>,
  issues: WorkflowValidationIssue[],
): WorkflowEdge {
  const edgeId = attr(element, 'id') || '';
  const condition = conditionFromAttribute(element, issues, edgeId);
  const conditionExprEl = firstByLocalName(element, 'conditionExpression');
  const rawConditionExpr = conditionExprEl ? conditionExprEl.textContent?.trim() || null : null;

  const edge: WorkflowEdge = {
    id: edgeId || null,
    source: attr(element, 'sourceRef') || '',
    target: attr(element, 'targetRef') || '',
    defaultFlow: defaultFlowIds.has(edgeId) || attr(element, 'devtool:defaultFlow') === 'true',
  };
  const name = attr(element, 'name');
  if (name !== null) {
    edge.name = name;
  }
  if (condition) {
    edge.condition = condition;
  }
  if (rawConditionExpr && !condition) {
    edge.conditionExpression = rawConditionExpr;
  }
  return edge;
}

function taskConfigFromServiceTask(
  element: Element,
  issues: WorkflowValidationIssue[],
  nodeId: string,
): Partial<BpmnWorkflowNode> {
  if (element.localName !== 'serviceTask') {
    return {};
  }

  void issues;
  void nodeId;
  return { config: {}, inputMapping: {}, outputMapping: {}, retryPolicy: {}, timeoutPolicy: {} };
}

function conditionFromAttribute(
  element: Element,
  issues: WorkflowValidationIssue[],
  edgeId: string,
): WorkflowCondition | null {
  const raw = attr(element, 'devtool:conditionJson') || element.getAttributeNS(DEVTOOL_NS, 'conditionJson');
  if (!raw) {
    return null;
  }
  return parseJsonObject(raw, issues, {
    code: 'BPMN_CONDITION_INVALID',
    message: 'Sequence flow condition JSON is invalid',
    edgeId,
  }) as WorkflowCondition | null;
}

function compileCondition(condition: WorkflowCondition): string {
  if (condition.type === 'COMPOSITE') {
    const joiner = condition.operator === 'OR' ? ' || ' : ' && ';
    return `(${condition.conditions.map(compileCondition).join(joiner)})`;
  }

  return compileCompare(condition);
}

function compileCompare(condition: WorkflowCompareCondition): string {
  const left = compileValue(condition.left);
  const right = compileValue(condition.right);
  switch (condition.operator) {
    case 'EQ':
      return `${left} == ${right}`;
    case 'NE':
      return `${left} != ${right}`;
    case 'GT':
      return `${left} > ${right}`;
    case 'GTE':
      return `${left} >= ${right}`;
    case 'LT':
      return `${left} < ${right}`;
    case 'LTE':
      return `${left} <= ${right}`;
    case 'IN':
      return `${right}.contains(${left})`;
    case 'NOT_IN':
      return `!${right}.contains(${left})`;
    case 'CONTAINS':
      return `${left}.contains(${right})`;
    case 'NOT_CONTAINS':
      return `!${left}.contains(${right})`;
    case 'IS_NULL':
      return `${left} == null`;
    case 'IS_NOT_NULL':
      return `${left} != null`;
    case 'STARTS_WITH':
      return `${left}.startsWith(${right})`;
    case 'ENDS_WITH':
      return `${left}.endsWith(${right})`;
    case 'MATCHES':
      return `${left}.matches(${right})`;
  }
}

function compileValue(value: { path?: string | null; literal?: JsonValue }): string {
  if (value.path) {
    return value.path.replace(/^\$\{(.+)}$/, '$1');
  }
  return JSON.stringify(value.literal ?? null);
}

function parseJsonObject(
  raw: string,
  issues: WorkflowValidationIssue[],
  error: Pick<WorkflowValidationIssue, 'code' | 'message' | 'nodeId' | 'edgeId'>,
): Record<string, JsonValue> | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (isJsonObject(parsed)) {
      return cloneJson(parsed) as Record<string, JsonValue>;
    }
  } catch {
    // handled below
  }
  issues.push(issue(error.code, error.message, error));
  return null;
}

function indexOutgoing(edges: WorkflowEdge[]): Map<string, WorkflowEdge[]> {
  const outgoing = new Map<string, WorkflowEdge[]>();
  for (const edge of edges) {
    outgoing.set(edge.source, [...(outgoing.get(edge.source) ?? []), edge]);
  }
  return outgoing;
}

function firstByLocalName(root: ParentNode, localName: string): Element | null {
  return Array.from(root.querySelectorAll('*')).find((element) => element.localName === localName) ?? null;
}

function elementChildren(element: Element): Element[] {
  return Array.from(element.children);
}

function childTextValues(element: Element, localName: string): string[] {
  return elementChildren(element)
    .filter((child) => child.localName === localName)
    .map((child) => child.textContent?.trim() ?? '')
    .filter((value) => !!value);
}

function preservedAttributes(element: Element): Record<string, string> {
  return Array.from(element.attributes).reduce<Record<string, string>>((result, attribute) => {
    if (attribute.name === 'id' || attribute.name === 'name' || attribute.name === 'default') {
      return result;
    }
    result[attribute.name] = attribute.value;
    return result;
  }, {});
}

function attr(element: Element, name: string): string | null {
  return element.getAttribute(name);
}

function edgeXmlId(edge: WorkflowEdge): string {
  return edge.id || safeXmlId(`${edge.source}_to_${edge.target}`);
}

function safeXmlId(value: string): string {
  const sanitized = value.replace(/[^A-Za-z0-9_]/g, '_');
  return /^[A-Za-z_]/.test(sanitized) ? sanitized : `wf_${sanitized || 'workflow'}`;
}

function isJsonObject(value: unknown): value is Record<string, JsonValue> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function cloneJson<T extends JsonValue>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function escapeAttr(value: string): string {
  return escapeText(value).replace(/"/g, '&quot;');
}

function escapeText(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function renderAttributePairs(attributes?: Record<string, string>): string[] {
  return Object.entries(attributes ?? {}).map(([name, value]) => `${name}="${escapeAttr(value)}"`);
}

function serializeElement(element: Element): string {
  const attrs = Array.from(element.attributes)
    .map((attribute) => `${attribute.name}="${escapeAttr(attribute.value)}"`)
    .join(' ');
  const openTag = attrs ? `<${element.tagName} ${attrs}>` : `<${element.tagName}>`;
  const children = elementChildren(element);
  const text = element.textContent?.trim() ?? '';

  if (!children.length && !text) {
    return attrs ? `<${element.tagName} ${attrs} />` : `<${element.tagName} />`;
  }

  if (!children.length) {
    return `${openTag}${escapeText(text)}</${element.tagName}>`;
  }

  return [
    openTag,
    ...children.map((child) => serializeElement(child)),
    `</${element.tagName}>`,
  ].join('\n');
}

function issue(
  code: string,
  message: string,
  ref: Partial<WorkflowValidationIssue> = {},
): WorkflowValidationIssue {
  return {
    code,
    message,
    severity: 'error',
    ...ref,
  };
}

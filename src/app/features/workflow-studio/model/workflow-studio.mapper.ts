import {
  AiGateWorkflowNodeDto,
  BpmnWorkflowNodeDto,
  CodeGateWorkflowNodeDto,
  EndWorkflowNodeDto,
  StartWorkflowNodeDto,
  LogicWorkflowNodeDto,
  WorkflowDetailDto,
  WorkflowGraphDto,
  WorkflowNodeDto,
  WorkflowRunDto,
  WorkflowUpsertDto,
  WorkflowVersionDto,
} from './workflow-studio.dto';
import {
  AiGateWorkflowNode,
  BpmnWorkflowNode,
  BpmnWorkflowNodeType,
  CodeGateWorkflowNode,
  EndWorkflowNode,
  JsonValue,
  LogicWorkflowNode,
  StartWorkflowNode,
  WorkflowDetail,
  WorkflowEdge,
  WorkflowGraph,
  WorkflowNode,
  WorkflowRun,
  WorkflowUpsertPayload,
  WorkflowValidationIssue,
  WorkflowVersion,
} from './workflow-studio.model';
import { WorkflowValidationResponseDto } from './workflow-studio.dto';

export function mapWorkflowDetailDto(dto: WorkflowDetailDto): WorkflowDetail {
  return {
    definition: { ...dto.definition },
    versions: dto.versions.map(mapWorkflowVersionDto),
  };
}

export function mapWorkflowRunDto(dto: WorkflowRunDto): WorkflowRun {
  return {
    ...dto,
    engineType: dto.engineType ?? 'LEGACY',
    input: cloneJson(dto.input),
    finalOutput: cloneJson(dto.finalOutput),
    nodes: dto.nodes.map((node) => ({
      ...node,
      inputSnapshot: cloneJson(node.inputSnapshot),
      output: cloneJson(node.output),
      evidence: cloneJson(node.evidence),
    })),
  };
}

export function mapWorkflowDetailToUpsertDto(detail: WorkflowDetail): WorkflowUpsertDto {
  const version = draftVersionForUpsert(detail);

  return {
    name: detail.definition.name,
    description: detail.definition.description,
    definition: mapWorkflowGraphToDto(version.definition),
    runtime: version.runtime ? { ...version.runtime } : null,
    engineType: version.engineType ?? 'LEGACY',
    editor: version.editor ? mapWorkflowEditorMetadataToDto(version.editor) : null,
  };
}

export function mapWorkflowUpsertPayloadToDto(payload: WorkflowUpsertPayload): WorkflowUpsertDto {
  return {
    name: payload.name,
    description: payload.description,
    definition: mapWorkflowGraphToDto(payload.definition),
    runtime: payload.runtime ? { ...payload.runtime } : null,
    engineType: payload.engineType ?? 'LEGACY',
    editor: payload.editor ? mapWorkflowEditorMetadataToDto(payload.editor) : null,
  };
}

export function mapWorkflowValidationResponseDto(dto: WorkflowValidationResponseDto): {
  valid: boolean;
  issues: WorkflowValidationIssue[];
} {
  return {
    valid: dto.valid,
    issues: dto.issues.map((issue) => ({
      ...issue,
      severity: issue.severity.toLowerCase() as WorkflowValidationIssue['severity'],
    })),
  };
}

function mapWorkflowVersionDto(dto: WorkflowVersionDto): WorkflowVersion {
  return {
    ...dto,
    engineType: dto.engineType ?? 'LEGACY',
    definition: mapWorkflowGraphDto(dto.definition),
    runtime: dto.runtime ? { ...dto.runtime } : null,
    compiledPlan: dto.compiledPlan
      ? {
          ...dto.compiledPlan,
          nodes: cloneRecord(dto.compiledPlan.nodes),
          dependencies: cloneStringArrayRecord(dto.compiledPlan.dependencies),
          dependents: cloneStringArrayRecord(dto.compiledPlan.dependents),
          entryNodes: [...dto.compiledPlan.entryNodes],
          terminalNodes: [...dto.compiledPlan.terminalNodes],
        }
      : null,
    editor: dto.editor
      ? {
          viewport: dto.editor.viewport ? { ...dto.editor.viewport } : undefined,
          nodes: dto.editor.nodes ? cloneEditorNodePositions(dto.editor.nodes) : undefined,
        }
      : undefined,
  };
}

function mapWorkflowGraphDto(dto: WorkflowGraphDto): WorkflowGraph {
  return {
    nodes: dto.nodes.map(mapWorkflowNodeDto),
    edges: dto.edges.map(cloneWorkflowEdge),
  };
}

function mapWorkflowGraphToDto(graph: WorkflowGraph): WorkflowGraphDto {
  return {
    nodes: graph.nodes.map(mapWorkflowNodeToDto),
    edges: graph.edges.map(cloneWorkflowEdge),
  };
}

function mapWorkflowNodeDto(dto: WorkflowNodeDto): WorkflowNode {
  switch (dto.type) {
    case 'START':
      return mapStartNode(dto);
    case 'END':
      return mapEndNode(dto);
    case 'CODE_GATE':
      return mapCodeGateNode(dto);
    case 'AI_GATE':
      return mapAiGateNode(dto);
    case 'LOGIC':
      return mapLogicNode(dto);
    default:
      return mapBpmnNode(dto);
  }
}

function mapWorkflowNodeToDto(node: WorkflowNode): WorkflowNodeDto {
  switch (node.type) {
    case 'START':
      return mapStartNodeToDto(node);
    case 'END':
      return mapEndNodeToDto(node);
    case 'CODE_GATE':
      return mapCodeGateNodeToDto(node);
    case 'AI_GATE':
      return mapAiGateNodeToDto(node);
    case 'LOGIC':
      return mapLogicNodeToDto(node);
    default:
      return mapBpmnNodeToDto(node);
  }
}

function mapStartNode(dto: StartWorkflowNode): StartWorkflowNode {
  return { id: dto.id, type: 'START' };
}

function mapEndNode(dto: EndWorkflowNode): EndWorkflowNode {
  return { id: dto.id, type: 'END' };
}

function mapStartNodeToDto(node: StartWorkflowNode): StartWorkflowNodeDto {
  return { id: node.id, type: 'START' };
}

function mapEndNodeToDto(node: EndWorkflowNode): EndWorkflowNodeDto {
  return { id: node.id, type: 'END' };
}

function mapCodeGateNode(dto: CodeGateWorkflowNodeDto): CodeGateWorkflowNode {
  return {
    id: dto.id,
    type: 'CODE_GATE',
    handler: dto.handler,
    config: cloneJson(dto.config),
    inputMapping: { mapping: cloneJson(dto.inputMapping.mapping) },
    retryPolicy: { maxAttempts: dto.retryPolicy.maxAttempts },
    timeoutPolicy: { timeoutSeconds: dto.timeoutPolicy.timeoutSeconds },
  };
}

function mapCodeGateNodeToDto(node: CodeGateWorkflowNode): CodeGateWorkflowNodeDto {
  return {
    id: node.id,
    type: 'CODE_GATE',
    handler: node.handler,
    config: cloneJson(node.config),
    inputMapping: { mapping: cloneJson(node.inputMapping.mapping) },
    retryPolicy: { maxAttempts: node.retryPolicy.maxAttempts },
    timeoutPolicy: { timeoutSeconds: node.timeoutPolicy.timeoutSeconds },
  };
}

function mapAiGateNode(dto: AiGateWorkflowNodeDto): AiGateWorkflowNode {
  return {
    id: dto.id,
    type: 'AI_GATE',
    instruction: dto.instruction,
    criteria: cloneJson(dto.criteria),
    inputMapping: { mapping: cloneJson(dto.inputMapping.mapping) },
    provider: dto.provider,
    agentCode: dto.agentCode,
    workingDirectory: dto.workingDirectory,
    outputSchema: dto.outputSchema,
    retryPolicy: { maxAttempts: dto.retryPolicy.maxAttempts },
    timeoutPolicy: { timeoutSeconds: dto.timeoutPolicy.timeoutSeconds },
  };
}

function mapAiGateNodeToDto(node: AiGateWorkflowNode): AiGateWorkflowNodeDto {
  return {
    id: node.id,
    type: 'AI_GATE',
    instruction: node.instruction,
    criteria: cloneJson(node.criteria),
    inputMapping: { mapping: cloneJson(node.inputMapping.mapping) },
    provider: node.provider,
    agentCode: node.agentCode,
    workingDirectory: node.workingDirectory,
    outputSchema: node.outputSchema,
    retryPolicy: { maxAttempts: node.retryPolicy.maxAttempts },
    timeoutPolicy: { timeoutSeconds: node.timeoutPolicy.timeoutSeconds },
  };
}

function mapLogicNode(dto: LogicWorkflowNodeDto): LogicWorkflowNode {
  return {
    id: dto.id,
    type: 'LOGIC',
    operator: dto.operator,
    config: cloneJson(dto.config),
  };
}

function mapLogicNodeToDto(node: LogicWorkflowNode): LogicWorkflowNodeDto {
  return {
    id: node.id,
    type: 'LOGIC',
    operator: node.operator,
    config: cloneJson(node.config),
  };
}

function mapBpmnNode(dto: BpmnWorkflowNodeDto): BpmnWorkflowNode {
  return {
    id: dto.id,
    type: dto.type,
    name: dto.name ?? null,
    config: cloneOptionalJson(dto.config),
    inputMapping: cloneOptionalJson(dto.inputMapping),
    outputMapping: cloneOptionalJson(dto.outputMapping),
    retryPolicy: cloneOptionalJson(dto.retryPolicy),
    timeoutPolicy: cloneOptionalJson(dto.timeoutPolicy),
  };
}

function mapBpmnNodeToDto(node: BpmnWorkflowNode): BpmnWorkflowNodeDto {
  return {
    id: node.id,
    type: node.type,
    name: node.name ?? null,
    config: cloneOptionalJson(node.config),
    inputMapping: cloneOptionalJson(node.inputMapping),
    outputMapping: cloneOptionalJson(node.outputMapping),
    retryPolicy: cloneOptionalJson(node.retryPolicy),
    timeoutPolicy: cloneOptionalJson(node.timeoutPolicy),
  };
}

function cloneJson(value: JsonValue): JsonValue {
  return value === null ? null : (JSON.parse(JSON.stringify(value)) as JsonValue);
}

function cloneOptionalJson(value: JsonValue | undefined): JsonValue | undefined {
  return value === undefined ? undefined : cloneJson(value);
}

function cloneWorkflowEdge<T extends WorkflowEdge>(edge: T): T {
  return cloneJson(edge as unknown as JsonValue) as unknown as T;
}

function cloneRecord<T extends JsonValue>(record: Record<string, T>): Record<string, T> {
  return Object.fromEntries(
    Object.entries(record).map(([key, value]) => [key, cloneJson(value) as T]),
  );
}

function cloneStringArrayRecord(record: Record<string, string[]>): Record<string, string[]> {
  return Object.fromEntries(Object.entries(record).map(([key, value]) => [key, [...value]]));
}

function cloneEditorNodePositions(
  nodes: NonNullable<WorkflowVersion['editor']>['nodes'],
): NonNullable<WorkflowVersion['editor']>['nodes'] {
  return Object.fromEntries(
    Object.entries(nodes ?? {}).map(([id, position]) => [id, { ...position }]),
  );
}

function mapWorkflowEditorMetadataToDto(
  editor: NonNullable<WorkflowVersion['editor']>,
): NonNullable<WorkflowUpsertDto['editor']> {
  return {
    viewport: editor.viewport ? { ...editor.viewport } : undefined,
    nodes: editor.nodes ? cloneEditorNodePositions(editor.nodes) : undefined,
  };
}

function draftVersionForUpsert(detail: WorkflowDetail): WorkflowVersion {
  const version =
    detail.versions.find((item) => item.id === detail.definition.currentDraftVersionId) ??
    detail.versions.find((item) => item.status === 'DRAFT') ??
    detail.versions[0];

  if (!version) {
    throw new Error('Workflow detail has no version to save');
  }

  return version;
}

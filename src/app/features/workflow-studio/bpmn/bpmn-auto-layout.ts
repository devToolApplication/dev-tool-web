import {
  WorkflowNodePosition,
  WorkflowEdge,
  WorkflowGraph,
  WorkflowValidationIssue,
} from '../model/workflow-studio.model';
import { workflowGraphFromBpmnXml, workflowGraphToBpmnXml } from '../bpmn/workflow-bpmn-adapter';

export function ensureBpmnDiagramLayout(xml: string, processName?: string | null): string {
  if (!xml || !xml.trim()) {
    return xml;
  }
  if (xml.includes('bpmndi:BPMNDiagram') || xml.includes('<BPMNDiagram') || xml.includes(':BPMNDiagram')) {
    return xml;
  }
  const result = workflowGraphFromBpmnXml(xml);
  if (!result.graph || result.graph.nodes.length === 0) {
    return xml;
  }
  return workflowGraphToBpmnXml(result.graph, {
    processId: result.processId || 'workflow_process',
    processName: processName || result.processId || 'workflow_process',
  });
}
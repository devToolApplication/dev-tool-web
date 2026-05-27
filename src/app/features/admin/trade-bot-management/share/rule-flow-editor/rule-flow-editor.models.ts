import { RuleExpressionNodeType, RuleExpressionGroupOperator } from '../rule-expression-builder/rule-expression.models';

export type RuleFlowNodeCategory = RuleExpressionNodeType | 'start';

export interface RuleFlowNodeMeta {
  id: string;
  category: RuleFlowNodeCategory;
  label: string;
  operator?: RuleExpressionGroupOperator;
  ruleCode?: string;
  disabled?: boolean;
}

export interface RuleFlowPortDef {
  id: string;
  group: 'in' | 'out-true' | 'out-false' | 'out';
  label?: string;
}

export interface RuleFlowLink {
  sourceId: string;
  sourcePort: string;
  targetId: string;
  targetPort: string;
}

export interface RuleFlowGraphData {
  nodes: RuleFlowNodeMeta[];
  links: RuleFlowLink[];
}

export interface RuleFlowTraceStatus {
  nodeId: string;
  status: 'passed' | 'failed' | 'unknown';
  message?: string;
}

export const RULE_FLOW_COLORS: Record<RuleFlowNodeCategory, string> = {
  start: '#22c55e',
  group: '#3b82f6',
  condition: '#f97316',
  ruleRef: '#a855f7',
  not: '#ef4444',
};

export const RULE_FLOW_DIMENSIONS = {
  nodeWidth: 180,
  nodeHeight: 60,
  portRadius: 6,
  horizontalGap: 80,
  verticalGap: 60,
};

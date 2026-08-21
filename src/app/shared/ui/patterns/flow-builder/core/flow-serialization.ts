import { FlowDefinition } from '../models';

export function cloneFlowValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function cloneFlowDefinition(definition: FlowDefinition): FlowDefinition {
  return cloneFlowValue(definition);
}

export function areFlowDefinitionsEqual(left: FlowDefinition | null, right: FlowDefinition | null): boolean {
  if (left === right) return true;
  if (!left || !right) return false;
  return JSON.stringify(left) === JSON.stringify(right);
}

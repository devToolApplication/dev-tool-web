import { FlowDefinition } from '../models';
import { areFlowDefinitionsEqual, cloneFlowDefinition } from './flow-serialization';

export class FlowHistory {
  private past: FlowDefinition[] = [];
  private future: FlowDefinition[] = [];
  private present: FlowDefinition | null = null;

  reset(definition: FlowDefinition | null): void {
    this.past = [];
    this.future = [];
    this.present = definition ? cloneFlowDefinition(definition) : null;
  }

  commit(definition: FlowDefinition): void {
    if (this.present && areFlowDefinitionsEqual(this.present, definition)) {
      return;
    }

    if (this.present) {
      this.past.push(cloneFlowDefinition(this.present));
    }

    this.present = cloneFlowDefinition(definition);
    this.future = [];
  }

  undo(): FlowDefinition | null {
    if (!this.present || this.past.length === 0) {
      return null;
    }

    this.future.unshift(cloneFlowDefinition(this.present));
    this.present = this.past.pop() ?? null;
    return this.present ? cloneFlowDefinition(this.present) : null;
  }

  redo(): FlowDefinition | null {
    if (!this.present || this.future.length === 0) {
      return null;
    }

    this.past.push(cloneFlowDefinition(this.present));
    this.present = this.future.shift() ?? null;
    return this.present ? cloneFlowDefinition(this.present) : null;
  }

  canUndo(): boolean {
    return this.past.length > 0;
  }

  canRedo(): boolean {
    return this.future.length > 0;
  }

  current(): FlowDefinition | null {
    return this.present ? cloneFlowDefinition(this.present) : null;
  }
}

import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import type { FormConfig, FormContext } from '../../../form-input/models/form-config.model';
import type { FlowNode } from '../../models';
import {
  compactFlowInspectorFormConfig,
  extractFlowInspectorFieldPaths,
  flowInspectorFieldSignature,
  FlowInspectorFormChange,
  flowNodeToInspectorFormValue,
  resolveFlowInspectorFormContext,
} from './flow-inspector-form.utils';

@Component({
  selector: 'app-flow-inspector-form-panel',
  standalone: false,
  templateUrl: './flow-inspector-form-panel.component.html',
  styleUrls: ['./flow-inspector-form-panel.component.css'],
})
export class FlowInspectorFormPanelComponent implements OnChanges {
  @Input() node: FlowNode | null = null;
  @Input() config: FormConfig | null = null;
  @Input() context: FormContext | null = null;
  @Input() readonly = false;

  @Output() readonly formValueChange = new EventEmitter<FlowInspectorFormChange>();
  @Output() readonly formValidChange = new EventEmitter<boolean>();

  resolvedConfig: FormConfig | null = null;
  resolvedContext: FormContext = { user: null, mode: 'edit' };
  initialValue: Record<string, unknown> = {};
  fieldPaths: string[] = [];

  private activeNodeId: string | null = null;
  private lastEmittedFieldSignature = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['config']) {
      this.resolvedConfig = this.config ? compactFlowInspectorFormConfig(this.config) : null;
      this.fieldPaths = extractFlowInspectorFieldPaths(this.config);
      this.activeNodeId = null;
      this.lastEmittedFieldSignature = '';
    }

    if (changes['context'] || changes['readonly']) {
      this.resolvedContext = resolveFlowInspectorFormContext(this.context, this.readonly);
    }

    if (!this.node) {
      this.initialValue = {};
      this.activeNodeId = null;
      return;
    }

    const nextValue = flowNodeToInspectorFormValue(this.node);
    const nextSignature = flowInspectorFieldSignature(nextValue, this.fieldPaths);
    const nodeChanged = this.activeNodeId !== this.node.id;
    const externalChange = nextSignature !== this.lastEmittedFieldSignature;

    if (nodeChanged || changes['config'] || externalChange) {
      this.initialValue = nextValue;
      this.activeNodeId = this.node.id;
    }
  }

  onFormValueChange(value: Record<string, unknown>): void {
    this.lastEmittedFieldSignature = flowInspectorFieldSignature(value, this.fieldPaths);
    this.formValueChange.emit({
      value,
      fieldPaths: this.fieldPaths,
    });
  }

  onFormValidChange(valid: boolean): void {
    this.formValidChange.emit(valid);
  }
}

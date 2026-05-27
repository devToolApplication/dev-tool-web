import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
  signal,
} from '@angular/core';
import * as joint from '@joint/core';
import {
  RuleExpressionGroupOperator,
  RuleExpressionNode,
  RuleLogicFormValue,
} from '../rule-expression-builder/rule-expression.models';
import {
  addRuleExpressionChild,
  createRuleExpressionCondition,
  createRuleExpressionGroup,
  createRuleExpressionNot,
  createRuleExpressionRuleRef,
  removeRuleExpressionNode,
} from '../rule-expression-builder/rule-expression-factory';
import { RuleFlowTraceStatus } from './rule-flow-editor.models';
import { applyAutoLayout, ruleExpressionToGraph } from './rule-flow-serializer';

@Component({
  selector: 'app-rule-flow-editor',
  standalone: false,
  templateUrl: './rule-flow-editor.component.html',
  styleUrl: './rule-flow-editor.component.css',
})
export class RuleFlowEditorComponent implements OnChanges, OnDestroy {
  @ViewChild('paperContainer', { static: true }) paperContainer!: ElementRef<HTMLDivElement>;

  @Input() value: RuleLogicFormValue | null | undefined;
  @Input() readonly = false;
  @Input() traceStatuses: RuleFlowTraceStatus[] = [];

  @Output() readonly valueChange = new EventEmitter<RuleLogicFormValue>();
  @Output() readonly nodeSelected = new EventEmitter<string | null>();

  readonly selectedNodeId = signal<string | null>(null);

  private graph!: joint.dia.Graph;
  private paper!: joint.dia.Paper;
  private nodeMap = new Map<string, string>();
  private currentExpression: RuleLogicFormValue = { root: null };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['value'] || changes['traceStatuses']) {
      this.currentExpression = this.value ? { ...this.value } : { root: null };
      this.renderGraph();
    }
  }

  ngOnDestroy(): void {
    this.paper?.remove();
  }

  addCondition(): void {
    if (this.readonly) return;
    this.addNodeToExpression(createRuleExpressionCondition());
  }

  addGroup(operator: RuleExpressionGroupOperator): void {
    if (this.readonly) return;
    this.addNodeToExpression(createRuleExpressionGroup(operator));
  }

  addNot(): void {
    if (this.readonly) return;
    this.addNodeToExpression(createRuleExpressionNot());
  }

  addRuleRef(): void {
    if (this.readonly) return;
    this.addNodeToExpression(createRuleExpressionRuleRef(''));
  }

  deleteSelected(): void {
    if (this.readonly) return;
    const nodeId = this.selectedNodeId();
    if (!nodeId || !this.currentExpression.root) return;

    if (this.currentExpression.root.id === nodeId) {
      this.currentExpression = { root: null };
    } else {
      this.currentExpression = { root: removeRuleExpressionNode(this.currentExpression.root, nodeId) };
    }

    this.selectedNodeId.set(null);
    this.emitAndRender();
  }

  private addNodeToExpression(node: RuleExpressionNode): void {
    const selectedId = this.selectedNodeId();

    if (!this.currentExpression.root) {
      this.currentExpression = { root: node };
    } else if (selectedId) {
      this.currentExpression = { root: addRuleExpressionChild(this.currentExpression.root, selectedId, node) };
    } else {
      this.currentExpression = {
        root: addRuleExpressionChild(this.currentExpression.root, this.currentExpression.root.id, node),
      };
    }

    this.emitAndRender();
  }

  private emitAndRender(): void {
    this.valueChange.emit({ ...this.currentExpression });
    this.renderGraph();
  }

  private renderGraph(): void {
    if (!this.graph) {
      this.initGraph();
    }

    this.graph.clear();

    const expression = this.currentExpression;
    const { elements, links, nodeMap } = ruleExpressionToGraph(expression);
    this.nodeMap = nodeMap;

    for (const el of elements) {
      this.graph.addCell(el);
    }
    for (const link of links) {
      this.graph.addCell(link);
    }

    applyAutoLayout(this.graph);
    this.applyThemeColors();
    this.applyTraceHighlights();
    this.paper.fitToContent({ padding: 40, allowNewOrigin: 'any' });
  }

  private initGraph(): void {
    this.graph = new joint.dia.Graph();

    const computedStyle = getComputedStyle(this.paperContainer.nativeElement);
    const bgColor = computedStyle.getPropertyValue('--p-surface-50').trim() || '#f8fafc';
    const gridColor = computedStyle.getPropertyValue('--p-surface-200').trim() || '#e2e8f0';

    this.paper = new joint.dia.Paper({
      el: this.paperContainer.nativeElement,
      model: this.graph,
      width: '100%',
      height: 500,
      gridSize: 10,
      drawGrid: { name: 'dot', args: { color: gridColor } },
      background: { color: bgColor },
      interactive: !this.readonly
        ? { linkMove: true, elementMove: true }
        : false,
      defaultConnector: { name: 'rounded' },
      defaultRouter: { name: 'manhattan' },
    });

    this.paper.on('element:pointerclick', (elementView: joint.dia.ElementView) => {
      const elementId = elementView.model.id as string;
      const ruleNodeId = this.findRuleNodeId(elementId);
      this.selectedNodeId.set(ruleNodeId);
      this.nodeSelected.emit(ruleNodeId);
      this.highlightSelected(elementId);
    });

    this.paper.on('blank:pointerclick', () => {
      this.selectedNodeId.set(null);
      this.nodeSelected.emit(null);
      this.clearHighlights();
    });
  }

  private findRuleNodeId(elementId: string): string | null {
    for (const [ruleId, elId] of this.nodeMap.entries()) {
      if (elId === elementId) return ruleId;
    }
    return null;
  }

  private highlightSelected(elementId: string): void {
    this.clearHighlights();
    const el = this.graph.getCell(elementId);
    if (el && el.isElement()) {
      (el as joint.dia.Element).attr('body/strokeWidth', 4);
    }
  }

  private clearHighlights(): void {
    for (const el of this.graph.getElements()) {
      el.attr('body/strokeWidth', 2);
    }
  }

  private applyThemeColors(): void {
    const computedStyle = getComputedStyle(this.paperContainer.nativeElement);
    const nodeFill = computedStyle.getPropertyValue('--p-surface-0').trim() || '#ffffff';
    const textColor = computedStyle.getPropertyValue('--p-surface-900').trim() || '#1e293b';
    const linkColor = computedStyle.getPropertyValue('--p-surface-400').trim() || '#94a3b8';

    for (const el of this.graph.getElements()) {
      el.attr('body/fill', nodeFill);
      el.attr('label/fill', textColor);
    }

    for (const link of this.graph.getLinks()) {
      link.attr('line/stroke', linkColor);
      link.attr('line/targetMarker/fill', linkColor);
    }
  }

  private applyTraceHighlights(): void {
    if (!this.traceStatuses.length) return;

    for (const trace of this.traceStatuses) {
      const elementId = this.nodeMap.get(trace.nodeId);
      if (!elementId) continue;

      const el = this.graph.getCell(elementId);
      if (!el || !el.isElement()) continue;

      const element = el as joint.dia.Element;
      switch (trace.status) {
        case 'passed':
          element.attr('body/fill', '#dcfce7');
          element.attr('body/stroke', '#22c55e');
          break;
        case 'failed':
          element.attr('body/fill', '#fee2e2');
          element.attr('body/stroke', '#ef4444');
          break;
        case 'unknown':
          element.attr('body/fill', '#f1f5f9');
          element.attr('body/stroke', '#94a3b8');
          break;
      }
    }
  }

  zoomIn(): void {
    const scale = this.paper.scale();
    this.paper.scale(scale.sx * 1.2, scale.sy * 1.2);
  }

  zoomOut(): void {
    const scale = this.paper.scale();
    this.paper.scale(scale.sx / 1.2, scale.sy / 1.2);
  }

  fitContent(): void {
    this.paper.fitToContent({ padding: 40, allowNewOrigin: 'any' });
  }

  resetZoom(): void {
    this.paper.scale(1, 1);
    this.fitContent();
  }
}

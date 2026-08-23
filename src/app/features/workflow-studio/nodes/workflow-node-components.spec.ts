import { CommonModule } from '@angular/common';
import { Type } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AiGateNodeComponent } from './ai-gate-node.component';
import { CodeGateNodeComponent } from './code-gate-node.component';
import { EndNodeComponent } from './end-node.component';
import { LogicNodeComponent } from './logic-node.component';
import { StartNodeComponent } from './start-node.component';
import { WorkflowNodeShellComponent } from './workflow-node-shell.component';
import { createWorkflowNode } from '../model/workflow-node-catalog';

describe('workflow node components', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonModule],
      declarations: [
        WorkflowNodeShellComponent,
        StartNodeComponent,
        CodeGateNodeComponent,
        AiGateNodeComponent,
        LogicNodeComponent,
        EndNodeComponent,
      ],
    }).compileComponents();
  });

  it('renders common shell state for selection, validation and runtime status', () => {
    const fixture = TestBed.createComponent(WorkflowNodeShellComponent);
    fixture.componentInstance.view = {
      id: 'ai-1',
      type: 'AI_GATE',
      title: 'AI Gate',
      subtitle: 'Review profile',
      iconLabel: 'AI',
      ports: [
        { id: 'in', direction: 'in', label: 'In' },
        { id: 'out', direction: 'out', label: 'Out' },
      ],
      selected: true,
      runtimeStatus: 'RUNNING',
      validationSeverity: 'error',
    };

    fixture.detectChanges();

    const host: HTMLElement = fixture.nativeElement;
    expect(host.textContent).toContain('AI Gate');
    expect(host.textContent).toContain('Review profile');
    expect(host.querySelectorAll('.workflow-node-shell__port')).toHaveLength(2);
    expect(host.querySelector('[data-testid="workflow-node-AI_GATE"]')).toBeTruthy();
    expect(host.querySelector('[data-node-id="ai-1"]')).toBeTruthy();
    expect(host.querySelector('[data-node-type="AI_GATE"]')).toBeTruthy();
    expect(host.querySelector('.workflow-node-shell')?.classList).toContain('workflow-node-shell--selected');
    expect(host.querySelector('.workflow-node-shell')?.classList).toContain('workflow-node-shell--error');
  });

  it('keeps node-specific components presentational', () => {
    const start = render(StartNodeComponent, createWorkflowNode('START', 'start-1'));
    const codeGate = render(CodeGateNodeComponent, {
      ...createWorkflowNode('CODE_GATE', 'code-1'),
      handler: 'NUMBER_COMPARE',
    });
    const aiGate = render(AiGateNodeComponent, {
      ...createWorkflowNode('AI_GATE', 'ai-1'),
      instruction: 'Review profile',
    });
    const logic = render(LogicNodeComponent, {
      ...createWorkflowNode('LOGIC', 'logic-1'),
      operator: 'OR',
    });
    const end = render(EndNodeComponent, createWorkflowNode('END', 'end-1'));

    expect(start.textContent).toContain('Start');
    expect(codeGate.textContent).toContain('NUMBER_COMPARE');
    expect(aiGate.textContent).toContain('Review profile');
    expect(logic.textContent).toContain('OR');
    expect(end.textContent).toContain('End');
  });
});

function render<T extends {
  node: unknown;
  selected: boolean;
  runtimeStatus: unknown;
  validationSeverity: unknown;
}>(
  component: Type<T>,
  node: T['node'],
): HTMLElement {
  const fixture: ComponentFixture<T> = TestBed.createComponent(component);
  fixture.componentInstance.node = node;
  fixture.componentInstance.selected = false;
  fixture.componentInstance.runtimeStatus = null;
  fixture.componentInstance.validationSeverity = null;
  fixture.detectChanges();
  return fixture.nativeElement;
}

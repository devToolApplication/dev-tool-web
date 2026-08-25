import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Component, EventEmitter, Input, NO_ERRORS_SCHEMA, Output, Pipe, PipeTransform } from '@angular/core';
import type { FormConfig, FormContext } from '@shared/ui/patterns/form-input/models/form-config.model';
import { of, throwError } from 'rxjs';

import { WorkflowApiService } from '../api/workflow-api.service';
import { WorkflowEditorStore } from '../store/workflow-editor.store';
import { InputMapping, WorkflowDetail } from '../model/workflow-studio.model';
import { AiGateInspectorComponent } from './ai-gate-inspector.component';
import { CodeGateInspectorComponent } from './code-gate-inspector.component';
import { EndInspectorComponent } from './end-inspector.component';
import { LogicInspectorComponent } from './logic-inspector.component';
import { StartInspectorComponent } from './start-inspector.component';
import { WorkflowNodeInspectorComponent } from './workflow-node-inspector.component';

@Pipe({ name: 'translateContent', standalone: false })
class TranslateContentPipeStub implements PipeTransform {
  transform(value: string): string {
    return value;
  }
}

@Component({
  selector: 'app-form-input',
  standalone: false,
  template: '',
})
class FormInputStubComponent {
  @Input() config!: FormConfig;
  @Input() context!: FormContext;
  @Input() initialValue: Record<string, unknown> = {};

  @Output() readonly valueChange = new EventEmitter<Record<string, unknown>>();
}

@Component({
  selector: 'app-workflow-input-mapping-editor',
  standalone: false,
  template: '',
})
class InputMappingEditorStubComponent {
  @Input() value: InputMapping = { mapping: {} };
  @Input() readonly = false;
  @Output() readonly valueChange = new EventEmitter<InputMapping>();
}

describe('WorkflowNodeInspectorComponent', () => {
  let fixture: ComponentFixture<WorkflowNodeInspectorComponent>;
  let store: WorkflowEditorStore;
  let api: {
    getAgents: ReturnType<typeof vi.fn>;
    getAiGateOutputSchemas: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    api = {
      getAgents: vi.fn(() => of([
        {
          agentCode: 'koc-rule-evaluator',
          displayName: 'KOC Rule Evaluator',
          defaultProvider: 'codex',
          supportedProviders: [{ provider: 'codex', available: true, health: 'HEALTHY' }],
          requiredDependencies: [],
          health: 'HEALTHY',
        },
        {
          agentCode: 'facebook-candidate-discovery',
          displayName: 'Facebook Candidate Discovery',
          defaultProvider: 'claude',
          supportedProviders: [
            { provider: 'codex', available: true, health: 'HEALTHY' },
            { provider: 'claude', available: true, health: 'HEALTHY' },
          ],
          requiredDependencies: ['FACEBOOK_MCP'],
          health: 'HEALTHY',
        },
      ])),
      getAiGateOutputSchemas: vi.fn(() => of([
        {
          value: 'gate-result-v1',
          label: 'Gate result v1',
          description: 'Standard PASS/FAIL/BLOCKED gate output.',
          isDefault: true,
        },
      ])),
    };

    TestBed.configureTestingModule({
      declarations: [
        WorkflowNodeInspectorComponent,
        AiGateInspectorComponent,
        CodeGateInspectorComponent,
        LogicInspectorComponent,
        StartInspectorComponent,
        EndInspectorComponent,
        TranslateContentPipeStub,
        FormInputStubComponent,
        InputMappingEditorStubComponent,
      ],
      providers: [
        WorkflowEditorStore,
        { provide: WorkflowApiService, useValue: api },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });

    fixture = TestBed.createComponent(WorkflowNodeInspectorComponent);
    store = TestBed.inject(WorkflowEditorStore);
    store.loadWorkflow(sampleDetail());
  });

  it('renders the correct inspector for the selected node type', () => {
    const expectations = [
      ['start', 'app-start-inspector'],
      ['code', 'app-code-gate-inspector'],
      ['ai', 'app-ai-gate-inspector'],
      ['logic', 'app-logic-inspector'],
      ['end', 'app-end-inspector'],
    ] as const;

    for (const [nodeId, selector] of expectations) {
      store.selectNode(nodeId);
      fixture.detectChanges();

      expect(fixture.debugElement.query(By.css(selector))).toBeTruthy();
    }
  });

  it('applies inspector patches through the editor store', () => {
    store.selectNode('ai');
    fixture.detectChanges();

    const inspector = fixture.debugElement.query(By.directive(AiGateInspectorComponent))
      .componentInstance as AiGateInspectorComponent;

    inspector.nodePatch.emit({ instruction: 'Updated instruction' });
    fixture.detectChanges();

    expect(store.nodes().find((node) => node.id === 'ai')).toMatchObject({
      id: 'ai',
      type: 'AI_GATE',
      instruction: 'Updated instruction',
    });
    expect(store.dirty()).toBe(true);
  });

  it('keeps app-form-input initial value stable while inspector edits update the store', () => {
    store.selectNode('ai');
    fixture.detectChanges();

    const form = fixture.debugElement.query(By.directive(FormInputStubComponent))
      .componentInstance as FormInputStubComponent;
    const initialValue = form.initialValue;

    form.valueChange.emit({
      ...initialValue,
      instruction: 'Draft prompt',
    });
    fixture.detectChanges();

    expect(form.initialValue).toBe(initialValue);
    expect(store.nodes().find((node) => node.id === 'ai')).toMatchObject({
      id: 'ai',
      type: 'AI_GATE',
      instruction: 'Draft prompt',
    });
    expect(store.dirty()).toBe(true);
  });

  it('populates agent, provider and output schema options into form context', () => {
    store.selectNode('ai');
    fixture.detectChanges();

    const form = fixture.debugElement.query(By.directive(FormInputStubComponent))
      .componentInstance as FormInputStubComponent;

    expect(api.getAgents).toHaveBeenCalledTimes(1);
    expect(api.getAiGateOutputSchemas).toHaveBeenCalledTimes(1);
    expect(form.context.extra).toMatchObject({
      agentOptions: [
        { label: 'KOC Rule Evaluator', value: 'koc-rule-evaluator' },
        { label: 'Facebook Candidate Discovery', value: 'facebook-candidate-discovery' },
      ],
      outputSchemaOptions: [{ label: 'Gate result v1', value: 'gate-result-v1' }],
    });

    const extra = form.context.extra as { providerOptions: Array<{ value: unknown; label: string }> };
    expect(extra.providerOptions.some((p) => p.value === 'claude')).toBe(true);

    form.valueChange.emit({
      ...form.initialValue,
      agentCode: 'facebook-candidate-discovery',
      provider: '',
    });
    fixture.detectChanges();

    expect(store.nodes().find((node) => node.id === 'ai')).toMatchObject({
      id: 'ai',
      type: 'AI_GATE',
      agentCode: 'facebook-candidate-discovery',
      provider: 'claude',
    });
  });

  it('handles agent API error state and retry without collapsing to empty', () => {
    api.getAgents.mockReturnValue(throwError(() => new Error('Network error')));
    store.selectNode('ai');
    fixture.detectChanges();

    const inspector = fixture.debugElement.query(By.directive(AiGateInspectorComponent))
      .componentInstance as AiGateInspectorComponent;

    expect(inspector.agentState()).toBe('error');

    api.getAgents.mockReturnValue(of([
      {
        agentCode: 'koc-rule-evaluator',
        displayName: 'KOC Rule Evaluator',
        defaultProvider: 'codex',
        supportedProviders: [{ provider: 'codex', available: true, health: 'HEALTHY' }],
        requiredDependencies: [],
        health: 'HEALTHY',
      },
    ]));

    inspector.retryAgents();
    expect(inspector.agentState()).toBe('ready');
    expect(inspector.agents().length).toBe(1);
  });

  it('marks unhealthy agents and unavailable providers as disabled with labels', () => {
    api.getAgents.mockReturnValue(of([
      {
        agentCode: 'unhealthy-agent',
        displayName: 'Unhealthy Agent',
        defaultProvider: 'codex',
        supportedProviders: [{ provider: 'codex', available: false, health: 'UNHEALTHY' }],
        requiredDependencies: [],
        health: 'UNHEALTHY',
      },
    ]));

    store.selectNode('ai');
    fixture.detectChanges();

    const form = fixture.debugElement.query(By.directive(FormInputStubComponent))
      .componentInstance as FormInputStubComponent;

    const extra = form.context.extra as { agentOptions: Array<{ disabled?: boolean; label: string }> };
    expect(extra.agentOptions.find((a) => a.label.includes('Unhealthy Agent'))?.disabled).toBe(true);
  });

  it('ignores invalid form payloads so advanced JSON cannot corrupt editor state', () => {
    store.selectNode('code');
    fixture.detectChanges();

    const inspector = fixture.debugElement.query(By.directive(CodeGateInspectorComponent))
      .componentInstance as CodeGateInspectorComponent;

    inspector.formValueChange({
      id: 'code',
      handler: 'NUMBER_COMPARE',
      config: '{bad json',
      inputMapping: '{"mapping":{}}',
      maxAttempts: 1,
      timeoutSeconds: 5,
    });

    expect(store.nodes().find((node) => node.id === 'code')).toMatchObject({
      id: 'code',
      type: 'CODE_GATE',
      config: { operator: 'LT' },
    });
    expect(store.dirty()).toBe(false);
  });

  it('switches form initial value and reference when selecting another node of same type', () => {
    store.addNode({
      id: 'ai-2',
      type: 'AI_GATE',
      instruction: 'Second AI instruction',
      criteria: {},
      inputMapping: { mapping: {} },
      provider: 'codex',
      agentCode: 'facebook-candidate-discovery',
      workingDirectory: 'D:\\Code',
      outputSchema: 'gate-result-v1',
      retryPolicy: { maxAttempts: 1 },
      timeoutPolicy: { timeoutSeconds: 60 },
    }, { x: 100, y: 100 });

    store.selectNode('ai');
    fixture.detectChanges();

    const formFirstNode = fixture.debugElement.query(By.directive(FormInputStubComponent))
      .componentInstance as FormInputStubComponent;
    const initialFirstNode = formFirstNode.initialValue;
    expect(initialFirstNode['id']).toBe('ai');
    expect(initialFirstNode['instruction']).toBe('Review profile');

    store.selectNode('ai-2');
    fixture.detectChanges();

    const formSecondNode = fixture.debugElement.query(By.directive(FormInputStubComponent))
      .componentInstance as FormInputStubComponent;
    const initialSecondNode = formSecondNode.initialValue;

    expect(initialSecondNode).not.toBe(initialFirstNode);
    expect(initialSecondNode['id']).toBe('ai-2');
    expect(initialSecondNode['instruction']).toBe('Second AI instruction');
  });

  it('provides readonly view context to form input when editor is in readonly mode', () => {
    store.setMode('readonly');
    store.selectNode('ai');
    fixture.detectChanges();

    const form = fixture.debugElement.query(By.directive(FormInputStubComponent))
      .componentInstance as FormInputStubComponent;

    expect(form.context.mode).toBe('view');
  });
});

function sampleDetail(): WorkflowDetail {
  return {
    definition: {
      id: 'wf-1',
      name: 'KOC screening',
      description: null,
      status: 'DRAFT',
      currentDraftVersionId: 'ver-1',
      currentPublishedVersionId: null,
    },
    versions: [
      {
        id: 'ver-1',
        workflowDefinitionId: 'wf-1',
        version: 1,
        status: 'DRAFT',
        bpmnXml: '<definitions />',
        runtime: { maxParallel: 1 },
      },
    ],
  };
}

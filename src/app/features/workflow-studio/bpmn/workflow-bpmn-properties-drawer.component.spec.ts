import { WorkflowBpmnPropertiesDrawerComponent } from './workflow-bpmn-properties-drawer.component';
import type { WorkflowBpmnElementConfig } from './workflow-bpmn-canvas.component';

describe('WorkflowBpmnPropertiesDrawerComponent', () => {
  let component: WorkflowBpmnPropertiesDrawerComponent;

  beforeEach(() => {
    component = new WorkflowBpmnPropertiesDrawerComponent();
  });

  it('updates preset and flowable topic for service task and emits changes', () => {
    const emitted: WorkflowBpmnElementConfig[] = [];
    component.configChange.subscribe((cfg) => emitted.push(cfg));

    component.config = {
      id: 'service-task-1',
      type: 'bpmn:ServiceTask',
      name: 'Task 1',
      flowableTopic: 'ai-task',
      flowableType: 'external-worker',
      taskConfigJson: '{"agentCode":"koc"}',
    };
    component.ngOnChanges({
      config: {
        currentValue: component.config,
        previousValue: null,
        firstChange: true,
        isFirstChange: () => true,
      },
    });

    component.updatePreset('HTTP_TASK');

    expect(component.preset).toBe('HTTP_TASK');
    expect(component.flowableTopic).toBe('http-task');
    expect(emitted).toHaveLength(1);
    expect(emitted[0]).toMatchObject({
      id: 'service-task-1',
      flowableTopic: 'http-task',
      taskConfigJson: '{"agentCode":"koc"}',
    });
  });

  it('blocks emit on invalid JSON taskConfigJson and sets jsonError', () => {
    const emitted: WorkflowBpmnElementConfig[] = [];
    component.configChange.subscribe((cfg) => emitted.push(cfg));

    component.config = {
      id: 'service-task-1',
      type: 'bpmn:ServiceTask',
      flowableTopic: 'ai-task',
      taskConfigJson: '{"valid": true}',
    };
    component.ngOnChanges({
      config: {
        currentValue: component.config,
        previousValue: null,
        firstChange: true,
        isFirstChange: () => true,
      },
    });

    component.updateTaskConfigJson('invalid-json{');

    expect(component.jsonError).toBe('workflowStudio.bpmn.drawer.invalidJson');
    expect(emitted).toHaveLength(0);
  });

  it('emits condition expression and default flow for sequence flow', () => {
    const emitted: WorkflowBpmnElementConfig[] = [];
    component.configChange.subscribe((cfg) => emitted.push(cfg));

    component.config = {
      id: 'flow-1',
      type: 'bpmn:SequenceFlow',
      conditionExpression: '${score > 80}',
      defaultFlow: false,
    };
    component.ngOnChanges({
      config: {
        currentValue: component.config,
        previousValue: null,
        firstChange: true,
        isFirstChange: () => true,
      },
    });

    component.updateConditionExpression('${score >= 90}');
    component.updateDefaultFlow(true);

    expect(emitted).toHaveLength(2);
    expect(emitted[1]).toMatchObject({
      id: 'flow-1',
      conditionExpression: '${score >= 90}',
      defaultFlow: true,
    });
  });
});

vi.mock('@bpmn-io/properties-panel', () => ({
  CheckboxEntry: vi.fn(),
  Group: vi.fn(),
  ListGroup: vi.fn(),
  SelectEntry: vi.fn(),
  TextAreaEntry: vi.fn(),
  TextFieldEntry: vi.fn(),
  isCheckboxEntryEdited: vi.fn(),
  isSelectEntryEdited: vi.fn(),
  isTextAreaEntryEdited: vi.fn(),
  isTextFieldEntryEdited: vi.fn(),
}));

vi.mock('bpmn-js-properties-panel', () => ({
  useService: vi.fn(),
}));

import { FlowablePropertiesProvider } from './flowable-properties-provider';
import { readFlowableServiceTaskConfig } from './flowable-service-task-mapper';
import { TextAreaEntry } from '@bpmn-io/properties-panel';
import { useService } from 'bpmn-js-properties-panel';

interface TestEntry {
  id: string;
}

interface TestGroup {
  id: string;
  label: string;
  shouldOpen?: boolean;
  entries: TestEntry[];
}

describe('flowable properties provider', () => {
  beforeEach(() => {
    vi.mocked(TextAreaEntry).mockClear();
    vi.mocked(useService).mockReset();
  });

  it('adds Flowable Service Task groups to service tasks only', () => {
    const provider = new FlowablePropertiesProvider(propertiesPanelStub(), injectorStub());
    const updateGroups = provider.getGroups({
      id: 'Task_1',
      type: 'bpmn:ServiceTask',
      businessObject: businessObjectStub({ id: 'Task_1' }),
    });

    const groups = updateGroups([{ id: 'general', label: 'General', entries: [] }]);

    expect((groups as TestGroup[]).map((group) => group.id)).toEqual([
      'general',
      'flowableImplementation',
      'flowableFields',
      'flowableVariables',
      'flowableExecution',
      'flowableExceptions',
      'flowableListeners',
      'flowableAdvanced',
    ]);
  });

  it('shows external-worker topic entries only for external-worker type', () => {
    const provider = new FlowablePropertiesProvider(propertiesPanelStub(), injectorStub());
    const updateGroups = provider.getGroups({
      id: 'Task_1',
      type: 'bpmn:ServiceTask',
      businessObject: businessObjectStub({ id: 'Task_1', type: 'external-worker' }),
    });

    const groups = updateGroups([]);
    const groupIds = (groups as TestGroup[]).map((group) => group.id);
    const executionEntryIds = (groups as TestGroup[])
      .find((group) => group.id === 'flowableExecution')
      ?.entries.map((entry) => entry.id);

    expect(groupIds).toContain('flowableInputMappings');
    expect(groupIds).toContain('flowableOutputMappings');
    expect(executionEntryIds).toContain('flowable-topic');
    expect(executionEntryIds).toContain('flowable-doNotIncludeVariables');
  });

  it('hides external-worker-only groups when another implementation is selected', () => {
    const provider = new FlowablePropertiesProvider(propertiesPanelStub(), injectorStub());
    const updateGroups = provider.getGroups({
      id: 'Task_1',
      type: 'bpmn:ServiceTask',
      businessObject: businessObjectStub({
        id: 'Task_1',
        class: 'com.example.ScoreDelegate',
        type: 'external-worker',
      }),
    });

    const groupIds = (updateGroups([]) as TestGroup[]).map((group) => group.id);

    expect(groupIds).not.toContain('flowableInputMappings');
    expect(groupIds).not.toContain('flowableOutputMappings');
  });

  it('creates draft rows for Flowable list groups', () => {
    const cases = [
      ['flowableFields', 'fields'],
      ['flowableExceptions', 'exceptionMappings'],
      ['flowableListeners', 'executionListeners'],
    ] as const;

    for (const [groupId, listKey] of cases) {
      const element = {
        id: 'Task_1',
        type: 'bpmn:ServiceTask',
        businessObject: businessObjectStub({ id: 'Task_1' }),
      };
      const provider = new FlowablePropertiesProvider(
        propertiesPanelStub(),
        injectorStub(writerServicesStub()),
      );
      const group = provider
        .getGroups(element)([])
        .find((candidate) => candidate.id === groupId);

      group?.add?.({ stopPropagation: vi.fn() } as unknown as Event);

      expect(readFlowableServiceTaskConfig(element.businessObject)[listKey]).toHaveLength(1);
    }
  });

  it('creates draft rows for external-worker input and output mappings', () => {
    const cases = [
      ['flowableInputMappings', 'inputMappings'],
      ['flowableOutputMappings', 'outputMappings'],
    ] as const;

    for (const [groupId, listKey] of cases) {
      const element = {
        id: 'Task_1',
        type: 'bpmn:ServiceTask',
        businessObject: businessObjectStub({ id: 'Task_1', type: 'external-worker' }),
      };
      const provider = new FlowablePropertiesProvider(
        propertiesPanelStub(),
        injectorStub(writerServicesStub()),
      );
      const group = provider
        .getGroups(element)([])
        .find((candidate) => candidate.id === groupId);

      group?.add?.({ stopPropagation: vi.fn() } as unknown as Event);

      expect(readFlowableServiceTaskConfig(element.businessObject)[listKey]).toHaveLength(1);
    }
  });

  it('adds a BPMN condition expression editor to sequence flows', () => {
    const services = writerServicesStub();
    vi.mocked(useService).mockImplementation((name: string) => {
      if (name === 'modeling') {
        return services.modeling;
      }
      if (name === 'bpmnFactory') {
        return services.bpmnFactory;
      }
      if (name === 'translate') {
        return (value: string) => value;
      }
      return undefined;
    });
    const flow = {
      id: 'Flow_1',
      type: 'bpmn:SequenceFlow',
      businessObject: sequenceFlowBusinessObjectStub({ id: 'Flow_1' }),
      source: { businessObject: {} },
    };
    flow.source.businessObject = { default: flow.businessObject };
    const provider = new FlowablePropertiesProvider(propertiesPanelStub(), injectorStub(services));

    const groups = provider.getGroups(flow)([]);
    const group = groups.find((candidate) => candidate.id === 'condition');
    expect(group?.shouldOpen).toBe(true);
    group?.entries?.[0].component({ element: flow, id: group.entries[0].id });
    const entryProps = vi.mocked(TextAreaEntry).mock.calls.at(-1)?.[0];

    entryProps.setValue('${approved}');

    expect((flow.businessObject.conditionExpression as any).body).toBe('${approved}');
    expect(services.modeling.updateProperties).toHaveBeenCalledWith(flow.source, {
      default: undefined,
    });
  });

  it('captures condition writer services before textarea commits values', () => {
    const services = writerServicesStub();
    let rendered = false;
    vi.mocked(useService).mockImplementation((name: string) => {
      if (name === 'translate') {
        return (value: string) => value;
      }
      if (rendered) {
        throw new Error('useService outside render context');
      }
      if (name === 'modeling') {
        return services.modeling;
      }
      if (name === 'bpmnFactory') {
        return services.bpmnFactory;
      }
      return undefined;
    });
    const flow = {
      id: 'Flow_1',
      type: 'bpmn:SequenceFlow',
      businessObject: sequenceFlowBusinessObjectStub({ id: 'Flow_1' }),
      source: { businessObject: {} },
    };
    const provider = new FlowablePropertiesProvider(propertiesPanelStub(), injectorStub(services));
    const group = provider
      .getGroups(flow)([])
      .find((candidate) => candidate.id === 'condition');

    group?.entries?.[0].component({ element: flow, id: group.entries[0].id });
    rendered = true;
    const entryProps = vi.mocked(TextAreaEntry).mock.calls.at(-1)?.[0];

    entryProps.setValue('${approved}');

    expect((flow.businessObject.conditionExpression as any).body).toBe('${approved}');
  });

  it('replaces the built-in condition group with the Flowable sequence flow editor', () => {
    const provider = new FlowablePropertiesProvider(propertiesPanelStub(), injectorStub());
    const updateGroups = provider.getGroups({
      id: 'Flow_1',
      type: 'bpmn:SequenceFlow',
      businessObject: sequenceFlowBusinessObjectStub({ id: 'Flow_1' }),
      source: { businessObject: { $type: 'bpmn:ServiceTask' } },
    });

    const groups = updateGroups([
      { id: 'general', label: 'General', entries: [] },
      { id: 'condition', label: 'Condition', entries: [{ id: 'conditionType', component: {} }] },
      { id: 'documentation', label: 'Documentation', entries: [] },
    ]);

    expect((groups as TestGroup[]).map((group) => group.id)).toEqual([
      'general',
      'condition',
      'documentation',
    ]);
    expect(
      (groups as TestGroup[])
        .find((group) => group.id === 'condition')
        ?.entries.map((entry) => entry.id),
    ).toEqual(['conditionExpression']);
  });

  it('does not add Flowable groups to start events', () => {
    const provider = new FlowablePropertiesProvider(propertiesPanelStub(), injectorStub());
    const updateGroups = provider.getGroups({
      id: 'Start_1',
      type: 'bpmn:StartEvent',
      businessObject: businessObjectStub({ id: 'Start_1', $type: 'bpmn:StartEvent' }),
    });

    expect(updateGroups([{ id: 'general', label: 'General', entries: [] }])).toEqual([
      { id: 'general', label: 'General', entries: [] },
    ]);
  });
});

function propertiesPanelStub(): any {
  return {
    registerProvider: vi.fn(),
  };
}

function injectorStub(services: { modeling?: any; bpmnFactory?: any } = {}): any {
  return {
    get: vi.fn((name: string) => {
      if (name === 'modeling') {
        return services.modeling ?? {};
      }
      if (name === 'bpmnFactory') {
        return services.bpmnFactory ?? {};
      }
      return (value: string) => value;
    }),
  };
}

function writerServicesStub(): { modeling: any; bpmnFactory: any } {
  return {
    modeling: {
      updateProperties: vi.fn((element: any, properties: Record<string, unknown>) => {
        Object.assign(element.businessObject, properties);
      }),
      updateModdleProperties: vi.fn(
        (_: any, moddleElement: any, properties: Record<string, unknown>) => {
          Object.assign(moddleElement, properties);
        },
      ),
    },
    bpmnFactory: {
      create: vi.fn((type: string, properties: Record<string, unknown> = {}) => ({
        $type: type,
        ...properties,
      })),
    },
  };
}

function businessObjectStub(values: Record<string, unknown>): any {
  return {
    $type: 'bpmn:ServiceTask',
    ...values,
    get(name: string) {
      const key = name.replace(/^flowable:/, '');
      return this[key];
    },
  };
}

function sequenceFlowBusinessObjectStub(values: Record<string, unknown>): any {
  return {
    $type: 'bpmn:SequenceFlow',
    ...values,
    get(name: string) {
      return this[name];
    },
  };
}

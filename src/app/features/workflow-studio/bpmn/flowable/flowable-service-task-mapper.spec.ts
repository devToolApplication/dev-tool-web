import { BpmnModdle } from 'bpmn-moddle';

import { flowableModdle } from './flowable-moddle';
import {
  FlowableServiceTaskConfig,
  createFlowableServiceTaskMapper,
  readFlowableServiceTaskConfig,
} from './flowable-service-task-mapper';

describe('flowable service task mapper', () => {
  it('reads Flowable-native service task attributes and extension elements', async () => {
    const serviceTask = await parseServiceTask(`
      <bpmn:serviceTask
        id="Task_1"
        name="Score"
        flowable:class="com.example.ScoreDelegate"
        flowable:resultVariableName="score"
        flowable:useLocalScopeForResultVariable="true"
        flowable:storeResultVariableAsTransient="true"
        flowable:async="true"
        flowable:asyncLeave="true"
        flowable:exclusive="false"
        flowable:skipExpression="\${skipScore}"
        flowable:triggerable="true"
        flowable:extensionId="scoreTask"
        flowable:formKey="scoreForm">
        <bpmn:extensionElements>
          <flowable:field name="threshold">
            <flowable:string>80</flowable:string>
          </flowable:field>
          <flowable:field name="rule">
            <flowable:expression>\${ruleBean.score(execution)}</flowable:expression>
          </flowable:field>
          <flowable:externalWorkerInParameter source="candidate" target="candidate" transient="true" />
          <flowable:externalWorkerOutParameter sourceExpression="\${result.value}" target="score" />
          <flowable:mapException errorCode="SCORE_FAILED" includeChildExceptions="true" rootCause="true">com.example.ScoreException</flowable:mapException>
          <flowable:failedJobRetryTimeCycle>R3/PT5M</flowable:failedJobRetryTimeCycle>
          <flowable:executionListener event="start" delegateExpression="\${auditListener}" />
        </bpmn:extensionElements>
      </bpmn:serviceTask>
    `);

    expect(readFlowableServiceTaskConfig(serviceTask)).toEqual({
      id: 'Task_1',
      name: 'Score',
      implementationType: 'class',
      className: 'com.example.ScoreDelegate',
      delegateExpression: '',
      expression: '',
      type: '',
      topic: '',
      doNotIncludeVariables: false,
      resultVariableName: 'score',
      useLocalScopeForResultVariable: true,
      storeResultVariableAsTransient: true,
      async: true,
      asyncLeave: true,
      exclusive: false,
      skipExpression: '${skipScore}',
      triggerable: true,
      extensionId: 'scoreTask',
      formKey: 'scoreForm',
      fields: [
        { name: 'threshold', valueType: 'string', value: '80' },
        { name: 'rule', valueType: 'expression', value: '${ruleBean.score(execution)}' },
      ],
      inputMappings: [
        { sourceType: 'source', source: 'candidate', target: 'candidate', transient: true },
      ],
      outputMappings: [
        {
          sourceType: 'sourceExpression',
          source: '${result.value}',
          target: 'score',
          transient: false,
        },
      ],
      exceptionMappings: [
        {
          exceptionClass: 'com.example.ScoreException',
          errorCode: 'SCORE_FAILED',
          includeChildExceptions: true,
          rootCause: true,
        },
      ],
      failedJobRetryTimeCycle: 'R3/PT5M',
      executionListeners: [
        {
          event: 'start',
          implementationType: 'delegateExpression',
          implementation: '${auditListener}',
          transaction: '',
          customPropertiesResolverType: 'none',
          customPropertiesResolver: '',
        },
      ],
    });
  });

  it('writes one primary implementation and clears legacy taskConfigJson', async () => {
    const serviceTask = await parseServiceTask(`
      <bpmn:serviceTask id="Task_1" flowable:class="com.example.Old" flowable:taskConfigJson="{}" />
    `);
    const mapper = createFlowableServiceTaskMapper(modelingStub(), bpmnFactoryStub());

    mapper.write(serviceTaskElement(serviceTask), {
      ...readFlowableServiceTaskConfig(serviceTask),
      implementationType: 'delegateExpression',
      className: '',
      delegateExpression: '${scoreDelegate}',
      expression: '${oldExpression}',
      type: 'http',
      topic: 'old-topic',
    });

    const config = readFlowableServiceTaskConfig(serviceTask);
    expect(config.implementationType).toBe('delegateExpression');
    expect(config.delegateExpression).toBe('${scoreDelegate}');
    expect(config.className).toBe('');
    expect(config.expression).toBe('');
    expect(config.type).toBe('');
    expect(config.topic).toBe('');
    expect(get(serviceTask, 'flowable:taskConfigJson')).toBeUndefined();
  });

  it('keeps draft implementation type while the implementation value is empty', async () => {
    const serviceTask = await parseServiceTask('<bpmn:serviceTask id="Task_1" />');
    const mapper = createFlowableServiceTaskMapper(modelingStub(), bpmnFactoryStub());

    mapper.write(
      serviceTaskElement(serviceTask),
      {
        ...readFlowableServiceTaskConfig(serviceTask),
        implementationType: 'class',
        className: '',
      },
      { includeDraftRows: true },
    );

    const config = readFlowableServiceTaskConfig(serviceTask);
    const xml = await serializeServiceTask(serviceTask);
    expect(config.implementationType).toBe('class');
    expect(xml).not.toContain('flowable:class=""');
  });

  it('keeps draft list row discriminators while row values are empty', async () => {
    const serviceTask = await parseServiceTask('<bpmn:serviceTask id="Task_1" />');
    const mapper = createFlowableServiceTaskMapper(modelingStub(), bpmnFactoryStub());

    mapper.write(
      serviceTaskElement(serviceTask),
      {
        ...readFlowableServiceTaskConfig(serviceTask),
        implementationType: 'type',
        type: 'external-worker',
        fields: [{ name: '', valueType: 'expression', value: '' }],
        inputMappings: [
          { sourceType: 'sourceExpression', source: '', target: '', transient: false },
        ],
        outputMappings: [
          { sourceType: 'sourceExpression', source: '', target: '', transient: false },
        ],
        executionListeners: [
          {
            event: 'start',
            implementationType: 'delegateExpression',
            implementation: '',
            transaction: '',
            customPropertiesResolverType: 'expression',
            customPropertiesResolver: '',
          },
        ],
      },
      { includeDraftRows: true },
    );

    const config = readFlowableServiceTaskConfig(serviceTask);
    expect(config.fields[0].valueType).toBe('expression');
    expect(config.inputMappings[0].sourceType).toBe('sourceExpression');
    expect(config.outputMappings[0].sourceType).toBe('sourceExpression');
    expect(config.executionListeners[0].implementationType).toBe('delegateExpression');
    expect(config.executionListeners[0].customPropertiesResolverType).toBe('expression');
  });

  it('serializes draft fields, exceptions and listeners without throwing', async () => {
    const serviceTask = await parseServiceTask('<bpmn:serviceTask id="Task_1" />');
    const mapper = createFlowableServiceTaskMapper(modelingStub(), bpmnFactoryStub());

    mapper.write(
      serviceTaskElement(serviceTask),
      {
        ...readFlowableServiceTaskConfig(serviceTask),
        fields: [{ name: '', valueType: 'string', value: '' }],
        exceptionMappings: [
          {
            exceptionClass: '',
            errorCode: '',
            includeChildExceptions: false,
            rootCause: false,
          },
        ],
        executionListeners: [
          {
            event: 'start',
            implementationType: 'class',
            implementation: '',
            transaction: '',
            customPropertiesResolverType: 'none',
            customPropertiesResolver: '',
          },
        ],
      },
      { includeDraftRows: true },
    );

    const xml = await serializeServiceTask(serviceTask);
    expect(xml).not.toContain('undefined');
    expect(xml).toContain('<flowable:field name="">');
    expect(xml).toContain('<flowable:mapException>');
    expect(xml).toContain('<flowable:executionListener event="start" class="" />');
  });

  it('writes mappings, fields, exceptions, retry cycle, listeners, and external-worker fields', async () => {
    const serviceTask = await parseServiceTask('<bpmn:serviceTask id="Task_1" />');
    const mapper = createFlowableServiceTaskMapper(modelingStub(), bpmnFactoryStub());
    const config: FlowableServiceTaskConfig = {
      ...readFlowableServiceTaskConfig(serviceTask),
      implementationType: 'type',
      type: 'external-worker',
      topic: 'score-topic',
      doNotIncludeVariables: true,
      fields: [{ name: 'message', valueType: 'string', value: 'Hello' }],
      inputMappings: [
        {
          sourceType: 'sourceExpression',
          source: '${input.candidate}',
          target: 'candidate',
          transient: false,
        },
      ],
      outputMappings: [
        { sourceType: 'source', source: 'result', target: 'score', transient: true },
      ],
      exceptionMappings: [
        {
          exceptionClass: 'java.lang.IllegalStateException',
          errorCode: 'BAD_STATE',
          includeChildExceptions: false,
          rootCause: false,
        },
      ],
      failedJobRetryTimeCycle: 'R5/PT1M',
      executionListeners: [
        {
          event: 'end',
          implementationType: 'class',
          implementation: 'com.example.EndListener',
          transaction: 'committed',
          customPropertiesResolverType: 'expression',
          customPropertiesResolver: '${propsResolver}',
        },
      ],
    };

    mapper.write(serviceTaskElement(serviceTask), config);

    const xml = await serializeServiceTask(serviceTask);
    expect(xml).toContain('flowable:type="external-worker"');
    expect(xml).toContain('flowable:topic="score-topic"');
    expect(xml).toContain('flowable:doNotIncludeVariables="true"');
    expect(xml).toContain('<flowable:field name="message">');
    expect(xml).toContain('<flowable:string>Hello</flowable:string>');
    expect(xml).toContain(
      '<flowable:externalWorkerInParameter sourceExpression="${input.candidate}" target="candidate" />',
    );
    expect(xml).toContain(
      '<flowable:externalWorkerOutParameter source="result" target="score" transient="true" />',
    );
    expect(xml).toContain(
      '<flowable:mapException errorCode="BAD_STATE">java.lang.IllegalStateException</flowable:mapException>',
    );
    expect(xml).toContain(
      '<flowable:failedJobRetryTimeCycle>R5/PT1M</flowable:failedJobRetryTimeCycle>',
    );
    expect(xml).toContain(
      '<flowable:executionListener event="end" class="com.example.EndListener" onTransaction="committed" customPropertiesResolverExpression="${propsResolver}" />',
    );
  });

  it('does not mutate extension elements when a mapping row is invalid', async () => {
    const serviceTask = await parseServiceTask('<bpmn:serviceTask id="Task_1" />');
    const mapper = createFlowableServiceTaskMapper(modelingStub(), bpmnFactoryStub());

    mapper.write(serviceTaskElement(serviceTask), {
      ...readFlowableServiceTaskConfig(serviceTask),
      inputMappings: [{ sourceType: 'source', source: '', target: 'candidate', transient: false }],
    });

    expect(readFlowableServiceTaskConfig(serviceTask).inputMappings).toEqual([]);
  });

  it('preserves Flowable extension elements not owned by the Service Task editor', async () => {
    const serviceTask = await parseServiceTask(`
      <bpmn:serviceTask id="Task_1">
        <bpmn:extensionElements>
          <flowable:in source="legacySource" target="legacyTarget" />
          <flowable:out source="legacyResult" target="legacyOutput" />
        </bpmn:extensionElements>
      </bpmn:serviceTask>
    `);
    const mapper = createFlowableServiceTaskMapper(modelingStub(), bpmnFactoryStub());

    mapper.write(serviceTaskElement(serviceTask), {
      ...readFlowableServiceTaskConfig(serviceTask),
      implementationType: 'delegateExpression',
      delegateExpression: '${scoreDelegate}',
    });

    const xml = await serializeServiceTask(serviceTask);
    expect(xml).toContain('<flowable:in source="legacySource" target="legacyTarget" />');
    expect(xml).toContain('<flowable:out source="legacyResult" target="legacyOutput" />');
  });
});

async function parseServiceTask(serviceTaskXml: string): Promise<any> {
  const moddle = new BpmnModdle({ flowable: flowableModdle });
  const { rootElement } = await moddle.fromXML(
    `<?xml version="1.0" encoding="UTF-8"?>
    <bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:flowable="http://flowable.org/bpmn">
      <bpmn:process id="Process_1">
        ${serviceTaskXml}
      </bpmn:process>
    </bpmn:definitions>`,
    'bpmn:Definitions',
  );
  return rootElement.rootElements[0].flowElements[0];
}

async function serializeServiceTask(serviceTask: any): Promise<string> {
  const moddle = new BpmnModdle({ flowable: flowableModdle });
  const definitions = moddle.create('bpmn:Definitions', {
    rootElements: [
      moddle.create('bpmn:Process', {
        id: 'Process_1',
        flowElements: [serviceTask],
      }),
    ],
  });
  serviceTask.$parent = definitions.rootElements[0];
  const { xml } = await moddle.toXML(definitions, { format: true });
  return xml;
}

function serviceTaskElement(serviceTask: any): any {
  return { id: serviceTask.id, type: 'bpmn:ServiceTask', businessObject: serviceTask };
}

function get(element: any, name: string): unknown {
  return element.get(name);
}

function modelingStub(): any {
  return {
    updateProperties: (_element: any, properties: Record<string, unknown>) => {
      for (const [key, value] of Object.entries(properties)) {
        _element.businessObject.set(key, value);
      }
    },
    updateModdleProperties: (
      _element: any,
      moddleElement: any,
      properties: Record<string, unknown>,
    ) => Object.assign(moddleElement, properties),
  };
}

function bpmnFactoryStub(): any {
  const moddle = new BpmnModdle({ flowable: flowableModdle });
  return {
    create: (type: string, properties: Record<string, unknown>) => moddle.create(type, properties),
  };
}

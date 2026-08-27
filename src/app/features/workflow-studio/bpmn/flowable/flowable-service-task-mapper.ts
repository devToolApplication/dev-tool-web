export type FlowableImplementationType =
  | 'none'
  | 'class'
  | 'delegateExpression'
  | 'expression'
  | 'type';
export type FlowableValueType = 'string' | 'expression';
export type FlowableMappingSourceType = 'source' | 'sourceExpression';
export type FlowableListenerImplementationType = 'class' | 'delegateExpression' | 'expression';
export type FlowableResolverType = 'none' | 'class' | 'delegateExpression' | 'expression';

export interface FlowableFieldConfig {
  name: string;
  valueType: FlowableValueType;
  value: string;
}

export interface FlowableVariableMappingConfig {
  sourceType: FlowableMappingSourceType;
  source: string;
  target: string;
  transient: boolean;
}

export interface FlowableExceptionMappingConfig {
  exceptionClass: string;
  errorCode: string;
  includeChildExceptions: boolean;
  rootCause: boolean;
}

export interface FlowableExecutionListenerConfig {
  event: string;
  implementationType: FlowableListenerImplementationType;
  implementation: string;
  transaction: string;
  customPropertiesResolverType: FlowableResolverType;
  customPropertiesResolver: string;
}

export interface FlowableServiceTaskConfig {
  id: string;
  name: string;
  implementationType: FlowableImplementationType;
  className: string;
  delegateExpression: string;
  expression: string;
  type: string;
  topic: string;
  doNotIncludeVariables: boolean;
  resultVariableName: string;
  useLocalScopeForResultVariable: boolean;
  storeResultVariableAsTransient: boolean;
  async: boolean;
  asyncLeave: boolean;
  exclusive: boolean;
  skipExpression: string;
  triggerable: boolean;
  extensionId: string;
  formKey: string;
  fields: FlowableFieldConfig[];
  inputMappings: FlowableVariableMappingConfig[];
  outputMappings: FlowableVariableMappingConfig[];
  exceptionMappings: FlowableExceptionMappingConfig[];
  failedJobRetryTimeCycle: string;
  executionListeners: FlowableExecutionListenerConfig[];
}

export interface FlowableServiceTaskWriteOptions {
  includeDraftRows?: boolean;
}

interface BpmnElement {
  businessObject: ModdleElement;
}

interface Modeling {
  updateProperties(element: BpmnElement, properties: Record<string, unknown>): void;
  updateModdleProperties(
    element: BpmnElement,
    moddleElement: ModdleElement,
    properties: Record<string, unknown>,
  ): void;
}

interface BpmnFactory {
  create(type: string, properties?: Record<string, unknown>): ModdleElement;
}

interface ModdleElement {
  $type?: string;
  $parent?: ModdleElement;
  $attrs?: Record<string, unknown>;
  extensionElements?: ModdleElement;
  values?: ModdleElement[];
  fields?: ModdleElement[];
  get?: (name: string) => unknown;
  set?: (name: string, value: unknown) => void;
  [key: string]: unknown;
}

const EXTENSION_TYPES = new Set([
  'flowable:Field',
  'flowable:ExternalWorkerInParameter',
  'flowable:ExternalWorkerOutParameter',
  'flowable:MapException',
  'flowable:FailedJobRetryTimeCycle',
  'flowable:ExecutionListener',
]);

const DRAFT_META = new WeakMap<ModdleElement, Record<string, unknown>>();

export function readFlowableServiceTaskConfig(
  serviceTask: ModdleElement,
): FlowableServiceTaskConfig {
  const className = stringValue(getModdle(serviceTask, 'flowable:class'));
  const delegateExpression = stringValue(getModdle(serviceTask, 'flowable:delegateExpression'));
  const expression = stringValue(getModdle(serviceTask, 'flowable:expression'));
  const type = stringValue(getModdle(serviceTask, 'flowable:type'));
  const draft = DRAFT_META.get(serviceTask);

  return {
    id: stringValue(getModdle(serviceTask, 'id')),
    name: stringValue(getModdle(serviceTask, 'name')),
    implementationType: implementationTypeOf(
      { className, delegateExpression, expression, type },
      draft?.['implementationType'],
    ),
    className,
    delegateExpression,
    expression,
    type,
    topic: stringValue(getModdle(serviceTask, 'flowable:topic')),
    doNotIncludeVariables: booleanValue(getModdle(serviceTask, 'flowable:doNotIncludeVariables')),
    resultVariableName: stringValue(getModdle(serviceTask, 'flowable:resultVariableName')),
    useLocalScopeForResultVariable: booleanValue(
      getModdle(serviceTask, 'flowable:useLocalScopeForResultVariable'),
    ),
    storeResultVariableAsTransient: booleanValue(
      getModdle(serviceTask, 'flowable:storeResultVariableAsTransient'),
    ),
    async: booleanValue(getModdle(serviceTask, 'flowable:async')),
    asyncLeave: booleanValue(getModdle(serviceTask, 'flowable:asyncLeave')),
    exclusive: booleanValue(getModdle(serviceTask, 'flowable:exclusive'), true),
    skipExpression: stringValue(getModdle(serviceTask, 'flowable:skipExpression')),
    triggerable: booleanValue(getModdle(serviceTask, 'flowable:triggerable')),
    extensionId: stringValue(getModdle(serviceTask, 'flowable:extensionId')),
    formKey: stringValue(getModdle(serviceTask, 'flowable:formKey')),
    fields: extensionValues(serviceTask, 'flowable:Field').map(readField),
    inputMappings: extensionValues(serviceTask, 'flowable:ExternalWorkerInParameter').map(
      readMapping,
    ),
    outputMappings: extensionValues(serviceTask, 'flowable:ExternalWorkerOutParameter').map(
      readMapping,
    ),
    exceptionMappings: extensionValues(serviceTask, 'flowable:MapException').map(
      readExceptionMapping,
    ),
    failedJobRetryTimeCycle: stringValue(
      extensionValues(serviceTask, 'flowable:FailedJobRetryTimeCycle')[0]?.['body'],
    ),
    executionListeners: extensionValues(serviceTask, 'flowable:ExecutionListener').map(
      readExecutionListener,
    ),
  };
}

export function createFlowableServiceTaskMapper(modeling: Modeling, bpmnFactory: BpmnFactory) {
  return {
    write(
      element: BpmnElement,
      config: FlowableServiceTaskConfig,
      options: FlowableServiceTaskWriteOptions = {},
    ): void {
      const serviceTask = element.businessObject;
      const type = config.implementationType === 'type' ? clean(config.type) : '';
      rememberDraftMeta(serviceTask, config, options);
      const extensionElements = ensureExtensionElements(
        element,
        serviceTask,
        modeling,
        bpmnFactory,
      );
      const preservedValues = (extensionElements.values ?? []).filter(
        (value) => !EXTENSION_TYPES.has(value.$type ?? ''),
      );
      const flowableValues = [
        ...config.fields
          .filter((field) => options.includeDraftRows || validField(field))
          .map((field) => createField(field, extensionElements, bpmnFactory)),
        ...(type === 'external-worker'
          ? [
              ...externalWorkerMappings(
                config.inputMappings,
                'flowable:ExternalWorkerInParameter',
                extensionElements,
                bpmnFactory,
                options,
              ),
              ...externalWorkerMappings(
                config.outputMappings,
                'flowable:ExternalWorkerOutParameter',
                extensionElements,
                bpmnFactory,
                options,
              ),
            ]
          : []),
        ...config.exceptionMappings
          .filter((mapping) => options.includeDraftRows || validExceptionMapping(mapping))
          .map((mapping) => createExceptionMapping(mapping, extensionElements, bpmnFactory)),
        ...retryCycle(config.failedJobRetryTimeCycle, extensionElements, bpmnFactory),
        ...config.executionListeners
          .filter((listener) => options.includeDraftRows || validExecutionListener(listener))
          .map((listener) => createExecutionListener(listener, extensionElements, bpmnFactory)),
      ];

      modeling.updateModdleProperties(element, extensionElements, {
        values: [...preservedValues, ...flowableValues],
      });
      modeling.updateProperties(element, serviceTaskProperties(config, type));
    },
  };
}

function serviceTaskProperties(
  config: FlowableServiceTaskConfig,
  type: string,
): Record<string, unknown> {
  return {
    class: config.implementationType === 'class' ? clean(config.className) || undefined : undefined,
    delegateExpression:
      config.implementationType === 'delegateExpression'
        ? clean(config.delegateExpression) || undefined
        : undefined,
    expression:
      config.implementationType === 'expression'
        ? clean(config.expression) || undefined
        : undefined,
    type: type || undefined,
    topic: type === 'external-worker' ? clean(config.topic) || undefined : undefined,
    doNotIncludeVariables:
      type === 'external-worker' && config.doNotIncludeVariables ? true : undefined,
    resultVariableName: clean(config.resultVariableName) || undefined,
    useLocalScopeForResultVariable: config.useLocalScopeForResultVariable || undefined,
    storeResultVariableAsTransient: config.storeResultVariableAsTransient || undefined,
    async: config.async || undefined,
    asyncLeave: config.asyncLeave || undefined,
    exclusive: config.exclusive === false ? false : undefined,
    skipExpression: clean(config.skipExpression) || undefined,
    triggerable: config.triggerable || undefined,
    extensionId: clean(config.extensionId) || undefined,
    formKey: clean(config.formKey) || undefined,
    taskConfigJson: undefined,
  };
}

function implementationTypeOf(
  values: Pick<
    FlowableServiceTaskConfig,
    'className' | 'delegateExpression' | 'expression' | 'type'
  >,
  draftValue: unknown,
): FlowableImplementationType {
  if (values.className) {
    return 'class';
  }
  if (values.delegateExpression) {
    return 'delegateExpression';
  }
  if (values.expression) {
    return 'expression';
  }
  if (values.type) {
    return 'type';
  }
  if (isImplementationType(draftValue)) {
    return draftValue;
  }
  return 'none';
}

function readField(field: ModdleElement): FlowableFieldConfig {
  const expression = stringValue(getModdle(field, 'expression'));
  const draft = DRAFT_META.get(field);
  return {
    name: stringValue(getModdle(field, 'name')),
    valueType: expression ? 'expression' : fieldValueType(draft?.['valueType']),
    value:
      expression ||
      stringValue(getModdle(field, 'string')) ||
      stringValue(getModdle(field, 'stringValue')),
  };
}

function readMapping(parameter: ModdleElement): FlowableVariableMappingConfig {
  const sourceExpression = stringValue(getModdle(parameter, 'sourceExpression'));
  const draft = DRAFT_META.get(parameter);
  return {
    sourceType: sourceExpression ? 'sourceExpression' : mappingSourceType(draft?.['sourceType']),
    source: sourceExpression || stringValue(getModdle(parameter, 'source')),
    target: stringValue(getModdle(parameter, 'target')),
    transient: booleanValue(getModdle(parameter, 'transient')),
  };
}

function readExceptionMapping(mapping: ModdleElement): FlowableExceptionMappingConfig {
  return {
    exceptionClass: stringValue(mapping['body']),
    errorCode: stringValue(getModdle(mapping, 'errorCode')),
    includeChildExceptions: booleanValue(getModdle(mapping, 'includeChildExceptions')),
    rootCause: booleanValue(getModdle(mapping, 'rootCause')),
  };
}

function readExecutionListener(listener: ModdleElement): FlowableExecutionListenerConfig {
  const className = stringValue(
    getModdle(listener, 'flowable:class') ?? getModdle(listener, 'class'),
  );
  const delegateExpression = stringValue(getModdle(listener, 'delegateExpression'));
  const expression = stringValue(getModdle(listener, 'expression'));
  const customClass = stringValue(getModdle(listener, 'customPropertiesResolverClass'));
  const customDelegateExpression = stringValue(
    getModdle(listener, 'customPropertiesResolverDelegateExpression'),
  );
  const customExpression = stringValue(getModdle(listener, 'customPropertiesResolverExpression'));
  const draft = DRAFT_META.get(listener);
  const implementationType = className
    ? 'class'
    : delegateExpression
      ? 'delegateExpression'
      : expression
        ? 'expression'
        : listenerImplementationType(draft?.['implementationType']);

  return {
    event: stringValue(getModdle(listener, 'event')),
    implementationType,
    implementation: className || delegateExpression || expression,
    transaction: stringValue(getModdle(listener, 'onTransaction')),
    customPropertiesResolverType: customClass
      ? 'class'
      : customDelegateExpression
        ? 'delegateExpression'
        : customExpression
          ? 'expression'
          : resolverType(draft?.['customPropertiesResolverType']),
    customPropertiesResolver: customClass || customDelegateExpression || customExpression,
  };
}

function rememberDraftMeta(
  serviceTask: ModdleElement,
  config: FlowableServiceTaskConfig,
  options: FlowableServiceTaskWriteOptions,
): void {
  if (!options.includeDraftRows) {
    DRAFT_META.delete(serviceTask);
    return;
  }

  DRAFT_META.set(serviceTask, {
    implementationType: config.implementationType,
  });
}

function createField(
  field: FlowableFieldConfig,
  parent: ModdleElement,
  bpmnFactory: BpmnFactory,
): ModdleElement {
  const valueKey = field.valueType === 'expression' ? 'expression' : 'string';
  const element = withParent(
    bpmnFactory.create('flowable:Field', {
      name: clean(field.name),
      [valueKey]: clean(field.value),
    }),
    parent,
  );
  DRAFT_META.set(element, { valueType: field.valueType });
  return element;
}

function externalWorkerMappings(
  mappings: FlowableVariableMappingConfig[],
  type: 'flowable:ExternalWorkerInParameter' | 'flowable:ExternalWorkerOutParameter',
  parent: ModdleElement,
  bpmnFactory: BpmnFactory,
  options: FlowableServiceTaskWriteOptions,
): ModdleElement[] {
  return mappings
    .filter((mapping) => options.includeDraftRows || validMapping(mapping))
    .map((mapping) => {
      const sourceKey = mapping.sourceType === 'sourceExpression' ? 'sourceExpression' : 'source';
      const element = withParent(
        bpmnFactory.create(type, {
          [sourceKey]: clean(mapping.source),
          target: clean(mapping.target),
          transient: mapping.transient || undefined,
        }),
        parent,
      );
      DRAFT_META.set(element, { sourceType: mapping.sourceType });
      return element;
    });
}

function createExceptionMapping(
  mapping: FlowableExceptionMappingConfig,
  parent: ModdleElement,
  bpmnFactory: BpmnFactory,
): ModdleElement {
  return withParent(
    bpmnFactory.create('flowable:MapException', {
      errorCode: clean(mapping.errorCode) || undefined,
      includeChildExceptions: mapping.includeChildExceptions || undefined,
      rootCause: mapping.rootCause || undefined,
      body: clean(mapping.exceptionClass),
    }),
    parent,
  );
}

function retryCycle(
  value: string,
  parent: ModdleElement,
  bpmnFactory: BpmnFactory,
): ModdleElement[] {
  const body = clean(value);
  return body
    ? [withParent(bpmnFactory.create('flowable:FailedJobRetryTimeCycle', { body }), parent)]
    : [];
}

function createExecutionListener(
  listener: FlowableExecutionListenerConfig,
  parent: ModdleElement,
  bpmnFactory: BpmnFactory,
): ModdleElement {
  const implementationKey =
    listener.implementationType === 'class' ? 'class' : listener.implementationType;
  const resolverKey = resolverProperty(listener.customPropertiesResolverType);
  const element = withParent(
    bpmnFactory.create('flowable:ExecutionListener', {
      event: clean(listener.event),
      [implementationKey]: clean(listener.implementation),
      onTransaction: clean(listener.transaction) || undefined,
      ...(resolverKey
        ? { [resolverKey]: clean(listener.customPropertiesResolver) || undefined }
        : {}),
    }),
    parent,
  );
  DRAFT_META.set(element, {
    implementationType: listener.implementationType,
    customPropertiesResolverType: listener.customPropertiesResolverType,
  });
  return element;
}

function resolverProperty(type: FlowableResolverType): string | null {
  if (type === 'class') {
    return 'customPropertiesResolverClass';
  }
  if (type === 'delegateExpression') {
    return 'customPropertiesResolverDelegateExpression';
  }
  if (type === 'expression') {
    return 'customPropertiesResolverExpression';
  }
  return null;
}

function ensureExtensionElements(
  element: BpmnElement,
  serviceTask: ModdleElement,
  modeling: Modeling,
  bpmnFactory: BpmnFactory,
): ModdleElement {
  if (serviceTask.extensionElements) {
    return serviceTask.extensionElements;
  }

  const extensionElements = withParent(
    bpmnFactory.create('bpmn:ExtensionElements', { values: [] }),
    serviceTask,
  );
  modeling.updateProperties(element, { extensionElements });
  return extensionElements;
}

function extensionValues(element: ModdleElement, type: string): ModdleElement[] {
  return (element.extensionElements?.values ?? []).filter((value) => value.$type === type);
}

function validField(field: FlowableFieldConfig): boolean {
  return !!clean(field.name) && !!clean(field.value);
}

function validMapping(mapping: FlowableVariableMappingConfig): boolean {
  return !!clean(mapping.source) && !!clean(mapping.target);
}

function validExceptionMapping(mapping: FlowableExceptionMappingConfig): boolean {
  return !!clean(mapping.exceptionClass);
}

function validExecutionListener(listener: FlowableExecutionListenerConfig): boolean {
  return !!clean(listener.event) && !!clean(listener.implementation);
}

function getModdle(element: ModdleElement, name: string): unknown {
  if (element.get) {
    const value = element.get(name);
    if (value !== undefined) {
      return value;
    }
  }
  const plainKey = name.replace(/^flowable:/, '');
  return element[name] ?? element[plainKey] ?? element.$attrs?.[name] ?? element.$attrs?.[plainKey];
}

function withParent<T extends ModdleElement>(element: T, parent: ModdleElement): T {
  element.$parent = parent;
  return element;
}

function clean(value: string | null | undefined): string {
  return (value ?? '').trim();
}

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function booleanValue(value: unknown, defaultValue = false): boolean {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }
  return value === true || value === 'true';
}

function isImplementationType(value: unknown): value is FlowableImplementationType {
  return (
    value === 'none' ||
    value === 'class' ||
    value === 'delegateExpression' ||
    value === 'expression' ||
    value === 'type'
  );
}

function fieldValueType(value: unknown): FlowableValueType {
  return value === 'expression' ? 'expression' : 'string';
}

function mappingSourceType(value: unknown): FlowableMappingSourceType {
  return value === 'sourceExpression' ? 'sourceExpression' : 'source';
}

function listenerImplementationType(value: unknown): FlowableListenerImplementationType {
  if (value === 'delegateExpression') {
    return 'delegateExpression';
  }
  if (value === 'expression') {
    return 'expression';
  }
  return 'class';
}

function resolverType(value: unknown): FlowableResolverType {
  if (value === 'class' || value === 'delegateExpression' || value === 'expression') {
    return value;
  }
  return 'none';
}

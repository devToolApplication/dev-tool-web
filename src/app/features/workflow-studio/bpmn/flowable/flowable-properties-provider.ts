
function getAttr(bo: any, key: string): any {
  if (!bo) return undefined;
  if (typeof bo.get === 'function') {
    return bo.get(key);
  }
  const plain = key.replace(/^flowable:/, '');
  return bo[key] ?? bo[plain] ?? bo.$attrs?.[key] ?? bo.$attrs?.[plain];
}

import {
  CheckboxEntry,
  Group,
  ListGroup,
  SelectEntry,
  TextAreaEntry,
  TextFieldEntry,
  isCheckboxEntryEdited,
  isSelectEntryEdited,
  isTextAreaEntryEdited,
  isTextFieldEntryEdited,
} from '@bpmn-io/properties-panel';
import { useService } from 'bpmn-js-properties-panel';

import {
  FlowableImplementationType,
  FlowableServiceTaskConfig,
  FlowableVariableMappingConfig,
  createFlowableServiceTaskMapper,
  readFlowableServiceTaskConfig,
} from './flowable-service-task-mapper';

interface PropertiesPanel {
  registerProvider(priority: number, provider: FlowablePropertiesProvider): void;
}

interface Injector {
  get(name: string): any;
}

interface PanelGroup {
  id: string;
  label: string;
  element?: any;
  component?: any;
  entries?: PanelEntry[];
  items?: PanelListItem[];
  shouldOpen?: boolean;
  add?: (event: Event) => void;
}

interface PanelEntry {
  id: string;
  component: any;
  isEdited?: any;
  [key: string]: unknown;
}

interface PanelListItem {
  id: string;
  label: string;
  entries: PanelEntry[];
  autoFocusEntry?: string;
  remove?: (event: Event) => void;
}

interface WriterServices {
  modeling: any;
  bpmnFactory: any;
}

const CALL_ACTIVITY_GROUPS: Array<(element: any, injector: Injector) => PanelGroup | null> = [
  flowableCallActivityGroup,
  flowableCallActivityInParamsGroup,
  flowableCallActivityOutParamsGroup,
];

const SERVICE_TASK_GROUPS: Array<(element: any, injector: Injector) => PanelGroup | null> = [
  flowableImplementationGroup,
  flowableFieldsGroup,
  flowableVariablesGroup,
  flowableInputMappingsGroup,
  flowableOutputMappingsGroup,
  flowableExecutionGroup,
  flowableExceptionsGroup,
  flowableListenersGroup,
  flowableAdvancedGroup,
];

export class FlowablePropertiesProvider {
  static $inject = ['propertiesPanel', 'injector'];

  constructor(
    propertiesPanel: PropertiesPanel,
    private readonly injector: Injector,
  ) {
    propertiesPanel.registerProvider(500, this);
  }

  getGroups(element: any): (groups: PanelGroup[]) => PanelGroup[] {
    return (groups) => {
      if (isServiceTask(element)) {
        return [
          ...groups,
          ...SERVICE_TASK_GROUPS.map((group) => group(element, this.injector)).filter(
            (group): group is PanelGroup => group !== null,
          ),
        ];
      }

      if (isCallActivity(element)) {
        return [
          ...groups,
          ...CALL_ACTIVITY_GROUPS.map((group) => group(element, this.injector)).filter(
            (group): group is PanelGroup => group !== null,
          ),
        ];
      }

      if (isSequenceFlow(element)) {
        return upsertConditionGroup(groups, sequenceFlowConditionGroup(element, this.injector));
      }

      return groups;
    };
  }
}

export const FlowablePropertiesProviderModule = {
  __init__: ['flowablePropertiesProvider'],
  flowablePropertiesProvider: ['type', FlowablePropertiesProvider],
};

function flowableImplementationGroup(element: any, injector: Injector): PanelGroup {
  const translate = injector.get('translate');
  const implementationType = readConfig(element).implementationType;
  const entries: PanelEntry[] = [
    entry('flowable-implementationType', FlowableImplementationTypeEntry, isSelectEntryEdited),
  ];

  if (implementationType === 'class') {
    entries.push(entry('flowable-class', FlowableClassEntry, isTextFieldEntryEdited));
  }
  if (implementationType === 'delegateExpression') {
    entries.push(
      entry('flowable-delegateExpression', FlowableDelegateExpressionEntry, isTextFieldEntryEdited),
    );
  }
  if (implementationType === 'expression') {
    entries.push(entry('flowable-expression', FlowableExpressionEntry, isTextFieldEntryEdited));
  }
  if (implementationType === 'type') {
    entries.push(entry('flowable-type', FlowableTypeEntry, isTextFieldEntryEdited));
  }

  return {
    id: 'flowableImplementation',
    label: translate('Implementation'),
    component: Group,
    entries,
  };
}

function flowableFieldsGroup(element: any, injector: Injector): PanelGroup {
  const translate = injector.get('translate');
  const config = readConfig(element);
  const services = writerServices(injector);
  return listGroup(
    'flowableFields',
    translate('Fields'),
    element,
    config.fields,
    (field, index) => ({
      id: `${element.id}-flowable-field-${index}`,
      label: field.name || translate('<empty>'),
      entries: [
        rowEntry('flowable-field-name', index, FlowableFieldNameEntry),
        rowEntry(
          'flowable-field-valueType',
          index,
          FlowableFieldValueTypeEntry,
          isSelectEntryEdited,
        ),
        rowEntry('flowable-field-value', index, FlowableFieldValueEntry, isTextAreaEntryEdited),
      ],
      autoFocusEntry: `flowable-field-name-${index}`,
      remove: removeListItem(element, 'fields', index, services),
    }),
    addListItem(element, 'fields', { name: '', valueType: 'string', value: '' }, services),
  );
}

function flowableVariablesGroup(element: any, injector: Injector): PanelGroup {
  const translate = injector.get('translate');
  return {
    id: 'flowableVariables',
    label: translate('Variables'),
    component: Group,
    entries: [
      entry('flowable-resultVariableName', FlowableResultVariableNameEntry, isTextFieldEntryEdited),
      entry(
        'flowable-useLocalScopeForResultVariable',
        FlowableUseLocalScopeEntry,
        isCheckboxEntryEdited,
      ),
      entry(
        'flowable-storeResultVariableAsTransient',
        FlowableStoreTransientEntry,
        isCheckboxEntryEdited,
      ),
    ],
  };
}

function flowableInputMappingsGroup(element: any, injector: Injector): PanelGroup | null {
  const translate = injector.get('translate');
  const config = readConfig(element);
  const services = writerServices(injector);
  if (!isExternalWorkerConfig(config)) {
    return null;
  }
  return listGroup(
    'flowableInputMappings',
    translate('Input mappings'),
    element,
    config.inputMappings,
    (mapping, index) =>
      mappingListItem(element, mapping, index, 'inputMappings', services, translate),
    addListItem(
      element,
      'inputMappings',
      {
        sourceType: 'source',
        source: '',
        target: '',
        transient: false,
      },
      services,
    ),
  );
}

function flowableOutputMappingsGroup(element: any, injector: Injector): PanelGroup | null {
  const translate = injector.get('translate');
  const config = readConfig(element);
  const services = writerServices(injector);
  if (!isExternalWorkerConfig(config)) {
    return null;
  }
  return listGroup(
    'flowableOutputMappings',
    translate('Output mappings'),
    element,
    config.outputMappings,
    (mapping, index) =>
      mappingListItem(element, mapping, index, 'outputMappings', services, translate),
    addListItem(
      element,
      'outputMappings',
      {
        sourceType: 'source',
        source: '',
        target: '',
        transient: false,
      },
      services,
    ),
  );
}

function flowableExecutionGroup(element: any, injector: Injector): PanelGroup {
  const translate = injector.get('translate');
  const config = readConfig(element);
  const entries = [
    entry('flowable-async', FlowableAsyncEntry, isCheckboxEntryEdited),
    entry('flowable-asyncLeave', FlowableAsyncLeaveEntry, isCheckboxEntryEdited),
    entry('flowable-exclusive', FlowableExclusiveEntry, isCheckboxEntryEdited),
  ];

  if (isExternalWorkerConfig(config)) {
    entries.push(
      entry('flowable-topic', FlowableTopicEntry, isTextFieldEntryEdited),
      entry(
        'flowable-doNotIncludeVariables',
        FlowableDoNotIncludeVariablesEntry,
        isCheckboxEntryEdited,
      ),
    );
  }

  return {
    id: 'flowableExecution',
    label: translate('Execution'),
    component: Group,
    entries,
  };
}

function flowableExceptionsGroup(element: any, injector: Injector): PanelGroup {
  const translate = injector.get('translate');
  const config = readConfig(element);
  const services = writerServices(injector);
  return listGroup(
    'flowableExceptions',
    translate('Exceptions'),
    element,
    config.exceptionMappings,
    (mapping, index) => ({
      id: `${element.id}-flowable-exception-${index}`,
      label: mapping.errorCode || mapping.exceptionClass || translate('<empty>'),
      entries: [
        rowEntry('flowable-exception-class', index, FlowableExceptionClassEntry),
        rowEntry('flowable-exception-errorCode', index, FlowableExceptionErrorCodeEntry),
        rowEntry(
          'flowable-exception-includeChildExceptions',
          index,
          FlowableExceptionIncludeChildrenEntry,
          isCheckboxEntryEdited,
        ),
        rowEntry(
          'flowable-exception-rootCause',
          index,
          FlowableExceptionRootCauseEntry,
          isCheckboxEntryEdited,
        ),
      ],
      autoFocusEntry: `flowable-exception-class-${index}`,
      remove: removeListItem(element, 'exceptionMappings', index, services),
    }),
    addListItem(
      element,
      'exceptionMappings',
      {
        exceptionClass: '',
        errorCode: '',
        includeChildExceptions: false,
        rootCause: false,
      },
      services,
    ),
  );
}

function flowableListenersGroup(element: any, injector: Injector): PanelGroup {
  const translate = injector.get('translate');
  const config = readConfig(element);
  const services = writerServices(injector);
  return listGroup(
    'flowableListeners',
    translate('Listeners'),
    element,
    config.executionListeners,
    (listener, index) => ({
      id: `${element.id}-flowable-listener-${index}`,
      label: listener.event || listener.implementation || translate('<empty>'),
      entries: [
        rowEntry('flowable-listener-event', index, FlowableListenerEventEntry, isSelectEntryEdited),
        rowEntry(
          'flowable-listener-implementationType',
          index,
          FlowableListenerImplementationTypeEntry,
          isSelectEntryEdited,
        ),
        rowEntry('flowable-listener-implementation', index, FlowableListenerImplementationEntry),
        rowEntry('flowable-listener-transaction', index, FlowableListenerTransactionEntry),
        rowEntry(
          'flowable-listener-resolverType',
          index,
          FlowableListenerResolverTypeEntry,
          isSelectEntryEdited,
        ),
        rowEntry('flowable-listener-resolver', index, FlowableListenerResolverEntry),
      ],
      autoFocusEntry: `flowable-listener-event-${index}`,
      remove: removeListItem(element, 'executionListeners', index, services),
    }),
    addListItem(
      element,
      'executionListeners',
      {
        event: 'start',
        implementationType: 'class',
        implementation: '',
        transaction: '',
        customPropertiesResolverType: 'none',
        customPropertiesResolver: '',
      },
      services,
    ),
  );
}

function flowableAdvancedGroup(element: any, injector: Injector): PanelGroup {
  const translate = injector.get('translate');
  return {
    id: 'flowableAdvanced',
    label: translate('Advanced'),
    component: Group,
    entries: [
      entry('flowable-skipExpression', FlowableSkipExpressionEntry, isTextFieldEntryEdited),
      entry('flowable-triggerable', FlowableTriggerableEntry, isCheckboxEntryEdited),
      entry('flowable-extensionId', FlowableExtensionIdEntry, isTextFieldEntryEdited),
      entry('flowable-formKey', FlowableFormKeyEntry, isTextFieldEntryEdited),
      entry(
        'flowable-failedJobRetryTimeCycle',
        FlowableFailedJobRetryEntry,
        isTextFieldEntryEdited,
      ),
    ],
  };
}

function sequenceFlowConditionGroup(element: any, injector: Injector): PanelGroup {
  const translate = injector.get('translate');
  void element;
  return {
    id: 'condition',
    label: translate('Condition'),
    component: Group,
    shouldOpen: true,
    entries: [
      entry(
        'conditionExpression',
        SequenceFlowConditionExpressionEntry,
        isTextAreaEntryEdited,
      ),
    ],
  };
}

function upsertConditionGroup(groups: PanelGroup[], conditionGroup: PanelGroup): PanelGroup[] {
  let inserted = false;
  const nextGroups = groups.flatMap((group) => {
    if (group.id !== 'condition' && group.id !== 'workflowCondition') {
      return [group];
    }
    if (inserted) {
      return [];
    }
    inserted = true;
    return [conditionGroup];
  });

  return inserted ? nextGroups : [...nextGroups, conditionGroup];
}

function FlowableImplementationTypeEntry(props: any): any {
  return selectEntry(
    props,
    'Implementation type',
    (config) => config.implementationType,
    (value) => ({
      implementationType: value as FlowableImplementationType,
    }),
    [
      { label: 'None', value: 'none' },
      { label: 'Java class', value: 'class' },
      { label: 'Delegate expression', value: 'delegateExpression' },
      { label: 'Expression', value: 'expression' },
      { label: 'Built-in type', value: 'type' },
    ],
    useWriterServices(),
  );
}

function FlowableClassEntry(props: any): any {
  return textEntry(
    props,
    'Java class',
    (config) => config.className,
    (value) => ({ className: value }),
    useWriterServices(),
  );
}

function FlowableDelegateExpressionEntry(props: any): any {
  return textEntry(
    props,
    'Delegate expression',
    (config) => config.delegateExpression,
    (value) => ({ delegateExpression: value }),
    useWriterServices(),
  );
}

function FlowableExpressionEntry(props: any): any {
  return textEntry(
    props,
    'Expression',
    (config) => config.expression,
    (value) => ({ expression: value }),
    useWriterServices(),
  );
}

function FlowableTypeEntry(props: any): any {
  return textEntry(
    props,
    'Type',
    (config) => config.type,
    (value) => ({ type: value }),
    useWriterServices(),
  );
}

function FlowableResultVariableNameEntry(props: any): any {
  return textEntry(
    props,
    'Result variable',
    (config) => config.resultVariableName,
    (value) => ({ resultVariableName: value }),
    useWriterServices(),
  );
}

function FlowableUseLocalScopeEntry(props: any): any {
  return checkboxEntry(
    props,
    'Use local scope',
    (config) => config.useLocalScopeForResultVariable,
    (value) => ({
      useLocalScopeForResultVariable: value,
    }),
    useWriterServices(),
  );
}

function FlowableStoreTransientEntry(props: any): any {
  return checkboxEntry(
    props,
    'Store result transient',
    (config) => config.storeResultVariableAsTransient,
    (value) => ({
      storeResultVariableAsTransient: value,
    }),
    useWriterServices(),
  );
}

function FlowableAsyncEntry(props: any): any {
  return checkboxEntry(
    props,
    'Async before',
    (config) => config.async,
    (value) => ({ async: value }),
    useWriterServices(),
  );
}

function FlowableAsyncLeaveEntry(props: any): any {
  return checkboxEntry(
    props,
    'Async leave',
    (config) => config.asyncLeave,
    (value) => ({ asyncLeave: value }),
    useWriterServices(),
  );
}

function FlowableExclusiveEntry(props: any): any {
  return checkboxEntry(
    props,
    'Exclusive',
    (config) => config.exclusive,
    (value) => ({ exclusive: value }),
    useWriterServices(),
  );
}

function FlowableTopicEntry(props: any): any {
  return textEntry(
    props,
    'Topic',
    (config) => config.topic,
    (value) => ({ topic: value }),
    useWriterServices(),
  );
}

function FlowableDoNotIncludeVariablesEntry(props: any): any {
  return checkboxEntry(
    props,
    'Do not include variables',
    (config) => config.doNotIncludeVariables,
    (value) => ({
      doNotIncludeVariables: value,
    }),
    useWriterServices(),
  );
}

function FlowableSkipExpressionEntry(props: any): any {
  return textEntry(
    props,
    'Skip expression',
    (config) => config.skipExpression,
    (value) => ({ skipExpression: value }),
    useWriterServices(),
  );
}

function FlowableTriggerableEntry(props: any): any {
  return checkboxEntry(
    props,
    'Triggerable',
    (config) => config.triggerable,
    (value) => ({ triggerable: value }),
    useWriterServices(),
  );
}

function FlowableExtensionIdEntry(props: any): any {
  return textEntry(
    props,
    'Extension ID',
    (config) => config.extensionId,
    (value) => ({ extensionId: value }),
    useWriterServices(),
  );
}

function FlowableFormKeyEntry(props: any): any {
  return textEntry(
    props,
    'Form key',
    (config) => config.formKey,
    (value) => ({ formKey: value }),
    useWriterServices(),
  );
}

function FlowableFailedJobRetryEntry(props: any): any {
  return textEntry(
    props,
    'Failed job retry cycle',
    (config) => config.failedJobRetryTimeCycle,
    (value) => ({
      failedJobRetryTimeCycle: value,
    }),
    useWriterServices(),
  );
}

function SequenceFlowConditionExpressionEntry(props: any): any {
  const services = useWriterServices();
  return TextAreaEntry({
    element: props.element,
    id: props.id,
    label: translate('Condition expression'),
    getValue: () => readSequenceFlowCondition(props.element),
    setValue: (value: string) =>
      writeSequenceFlowCondition(props.element, value ?? '', services),
    debounce: debounce(),
    autoResize: true,
  });
}

function FlowableFieldNameEntry(props: any): any {
  return listTextEntry(props, 'Name', 'fields', 'name', useWriterServices());
}

function FlowableFieldValueTypeEntry(props: any): any {
  return listSelectEntry(
    props,
    'Value type',
    'fields',
    'valueType',
    [
      { label: 'String', value: 'string' },
      { label: 'Expression', value: 'expression' },
    ],
    useWriterServices(),
  );
}

function FlowableFieldValueEntry(props: any): any {
  return listTextAreaEntry(props, 'Value', 'fields', 'value', useWriterServices());
}

function FlowableMappingSourceTypeEntry(props: any): any {
  return listSelectEntry(
    props,
    'Source type',
    props.listKey,
    'sourceType',
    [
      { label: 'Variable', value: 'source' },
      { label: 'Expression', value: 'sourceExpression' },
    ],
    useWriterServices(),
  );
}

function FlowableMappingSourceEntry(props: any): any {
  return listTextEntry(props, 'Source', props.listKey, 'source', useWriterServices());
}

function FlowableMappingTargetEntry(props: any): any {
  return listTextEntry(props, 'Target', props.listKey, 'target', useWriterServices());
}

function FlowableMappingTransientEntry(props: any): any {
  return listCheckboxEntry(props, 'Transient', props.listKey, 'transient', useWriterServices());
}

function mappingListItem(
  element: any,
  mapping: FlowableVariableMappingConfig,
  index: number,
  listKey: 'inputMappings' | 'outputMappings',
  services: WriterServices,
  translate: (value: string) => string,
): PanelListItem {
  return {
    id: `${element.id}-flowable-${listKey}-${index}`,
    label: mapping.target || mapping.source || translate('<empty>'),
    entries: [
      rowEntry(
        'flowable-mapping-sourceType',
        index,
        FlowableMappingSourceTypeEntry,
        isSelectEntryEdited,
        { listKey },
      ),
      rowEntry(
        'flowable-mapping-source',
        index,
        FlowableMappingSourceEntry,
        isTextFieldEntryEdited,
        { listKey },
      ),
      rowEntry(
        'flowable-mapping-target',
        index,
        FlowableMappingTargetEntry,
        isTextFieldEntryEdited,
        { listKey },
      ),
      rowEntry(
        'flowable-mapping-transient',
        index,
        FlowableMappingTransientEntry,
        isCheckboxEntryEdited,
        { listKey },
      ),
    ],
    autoFocusEntry: `flowable-mapping-source-${index}`,
    remove: removeListItem(element, listKey, index, services),
  };
}

function FlowableExceptionClassEntry(props: any): any {
  return listTextEntry(
    props,
    'Exception class',
    'exceptionMappings',
    'exceptionClass',
    useWriterServices(),
  );
}

function FlowableExceptionErrorCodeEntry(props: any): any {
  return listTextEntry(props, 'Error code', 'exceptionMappings', 'errorCode', useWriterServices());
}

function FlowableExceptionIncludeChildrenEntry(props: any): any {
  return listCheckboxEntry(
    props,
    'Include child exceptions',
    'exceptionMappings',
    'includeChildExceptions',
    useWriterServices(),
  );
}

function FlowableExceptionRootCauseEntry(props: any): any {
  return listCheckboxEntry(
    props,
    'Root cause',
    'exceptionMappings',
    'rootCause',
    useWriterServices(),
  );
}

function FlowableListenerEventEntry(props: any): any {
  return listSelectEntry(
    props,
    'Event',
    'executionListeners',
    'event',
    [
      { label: 'Start', value: 'start' },
      { label: 'End', value: 'end' },
    ],
    useWriterServices(),
  );
}

function FlowableListenerImplementationTypeEntry(props: any): any {
  return listSelectEntry(
    props,
    'Implementation type',
    'executionListeners',
    'implementationType',
    [
      { label: 'Java class', value: 'class' },
      { label: 'Delegate expression', value: 'delegateExpression' },
      { label: 'Expression', value: 'expression' },
    ],
    useWriterServices(),
  );
}

function FlowableListenerImplementationEntry(props: any): any {
  return listTextEntry(
    props,
    'Implementation',
    'executionListeners',
    'implementation',
    useWriterServices(),
  );
}

function FlowableListenerTransactionEntry(props: any): any {
  return listTextEntry(
    props,
    'Transaction',
    'executionListeners',
    'transaction',
    useWriterServices(),
  );
}

function FlowableListenerResolverTypeEntry(props: any): any {
  return listSelectEntry(
    props,
    'Resolver type',
    'executionListeners',
    'customPropertiesResolverType',
    [
      { label: 'None', value: 'none' },
      { label: 'Java class', value: 'class' },
      { label: 'Delegate expression', value: 'delegateExpression' },
      { label: 'Expression', value: 'expression' },
    ],
    useWriterServices(),
  );
}

function FlowableListenerResolverEntry(props: any): any {
  return listTextEntry(
    props,
    'Resolver',
    'executionListeners',
    'customPropertiesResolver',
    useWriterServices(),
  );
}

function listGroup<T>(
  id: string,
  label: string,
  element: any,
  items: T[],
  mapItem: (item: T, index: number) => PanelListItem,
  add: (event: Event) => void,
): PanelGroup {
  return {
    id,
    label,
    element,
    component: ListGroup,
    items: items.map(mapItem),
    add,
  };
}

function entry(id: string, component: any, isEdited = isTextFieldEntryEdited): PanelEntry {
  return { id, component, isEdited };
}

function rowEntry(
  id: string,
  index: number,
  component: any,
  isEdited = isTextFieldEntryEdited,
  extra: Record<string, unknown> = {},
): PanelEntry {
  return { id: `${id}-${index}`, component, isEdited, rowIndex: index, ...extra };
}

function textEntry(
  props: any,
  label: string,
  get: (config: FlowableServiceTaskConfig) => string,
  patch: (value: string) => Partial<FlowableServiceTaskConfig>,
  services: WriterServices,
): any {
  return TextFieldEntry({
    element: props.element,
    id: props.id,
    label: translate(label),
    getValue: () => get(readConfig(props.element)),
    setValue: (value: string) => writePatch(props.element, patch(value ?? ''), services),
    debounce: debounce(),
  });
}

function selectEntry(
  props: any,
  label: string,
  get: (config: FlowableServiceTaskConfig) => string,
  patch: (value: string) => Partial<FlowableServiceTaskConfig>,
  options: Array<{ label: string; value: string }>,
  services: WriterServices,
): any {
  return SelectEntry({
    element: props.element,
    id: props.id,
    label: translate(label),
    getValue: () => get(readConfig(props.element)),
    setValue: (value: string) => writePatch(props.element, patch(value), services),
    getOptions: () => options.map((option) => ({ ...option, label: translate(option.label) })),
  });
}

function checkboxEntry(
  props: any,
  label: string,
  get: (config: FlowableServiceTaskConfig) => boolean,
  patch: (value: boolean) => Partial<FlowableServiceTaskConfig>,
  services: WriterServices,
): any {
  return CheckboxEntry({
    element: props.element,
    id: props.id,
    label: translate(label),
    getValue: () => get(readConfig(props.element)),
    setValue: (value: boolean) => writePatch(props.element, patch(value), services),
  });
}

function listTextEntry(
  props: any,
  label: string,
  listKey: keyof FlowableServiceTaskConfig,
  fieldKey: string,
  services: WriterServices,
): any {
  return TextFieldEntry({
    element: props.element,
    id: props.id,
    label: translate(label),
    getValue: () =>
      String((readConfig(props.element)[listKey] as any[])[props.rowIndex]?.[fieldKey] ?? ''),
    setValue: (value: string) =>
      writeListPatch(props.element, listKey, props.rowIndex, fieldKey, value ?? '', services),
    debounce: debounce(),
  });
}

function listTextAreaEntry(
  props: any,
  label: string,
  listKey: keyof FlowableServiceTaskConfig,
  fieldKey: string,
  services: WriterServices,
): any {
  return TextAreaEntry({
    element: props.element,
    id: props.id,
    label: translate(label),
    getValue: () =>
      String((readConfig(props.element)[listKey] as any[])[props.rowIndex]?.[fieldKey] ?? ''),
    setValue: (value: string) =>
      writeListPatch(props.element, listKey, props.rowIndex, fieldKey, value ?? '', services),
    debounce: debounce(),
    autoResize: true,
  });
}

function listSelectEntry(
  props: any,
  label: string,
  listKey: keyof FlowableServiceTaskConfig,
  fieldKey: string,
  options: Array<{ label: string; value: string }>,
  services: WriterServices,
): any {
  return SelectEntry({
    element: props.element,
    id: props.id,
    label: translate(label),
    getValue: () =>
      String((readConfig(props.element)[listKey] as any[])[props.rowIndex]?.[fieldKey] ?? ''),
    setValue: (value: string) =>
      writeListPatch(props.element, listKey, props.rowIndex, fieldKey, value, services),
    getOptions: () => options.map((option) => ({ ...option, label: translate(option.label) })),
  });
}

function listCheckboxEntry(
  props: any,
  label: string,
  listKey: keyof FlowableServiceTaskConfig,
  fieldKey: string,
  services: WriterServices,
): any {
  return CheckboxEntry({
    element: props.element,
    id: props.id,
    label: translate(label),
    getValue: () => !!(readConfig(props.element)[listKey] as any[])[props.rowIndex]?.[fieldKey],
    setValue: (value: boolean) =>
      writeListPatch(props.element, listKey, props.rowIndex, fieldKey, value, services),
  });
}

function addListItem<T extends keyof FlowableServiceTaskConfig>(
  element: any,
  listKey: T,
  item: ArrayItem<FlowableServiceTaskConfig[T]>,
  services: WriterServices,
): (event: Event) => void {
  return (event) => {
    event.stopPropagation();
    const config = readConfig(element);
    writePatch(
      element,
      {
        [listKey]: [...(config[listKey] as any[]), item],
      },
      services,
    );
  };
}

function removeListItem<T extends keyof FlowableServiceTaskConfig>(
  element: any,
  listKey: T,
  index: number,
  services: WriterServices,
): (event: Event) => void {
  return (event) => {
    event.stopPropagation();
    const config = readConfig(element);
    writePatch(
      element,
      {
        [listKey]: (config[listKey] as any[]).filter((_, itemIndex) => itemIndex !== index),
      },
      services,
    );
  };
}

function writeListPatch(
  element: any,
  listKey: keyof FlowableServiceTaskConfig,
  index: number,
  fieldKey: string,
  value: unknown,
  services: WriterServices,
): void {
  const config = readConfig(element);
  const list = [...(config[listKey] as any[])];
  list[index] = { ...list[index], [fieldKey]: value };
  writePatch(element, { [listKey]: list }, services);
}

function readConfig(element: any): FlowableServiceTaskConfig {
  return readFlowableServiceTaskConfig(element.businessObject);
}

function writePatch(
  element: any,
  patch: Partial<FlowableServiceTaskConfig>,
  services: WriterServices,
): void {
  const config = { ...readConfig(element), ...patch };
  createFlowableServiceTaskMapper(services.modeling, services.bpmnFactory).write(element, config, {
    includeDraftRows: true,
  });
}

function useWriterServices(): WriterServices {
  return {
    modeling: useService('modeling'),
    bpmnFactory: useService('bpmnFactory'),
  };
}

function debounce(): any {
  return useService('debounceInput', true);
}

function translate(value: string): string {
  return (useService('translate', true) ?? ((label: string) => label))(value);
}

function isServiceTask(element: any): boolean {
  return (
    element?.type === 'bpmn:ServiceTask' || element?.businessObject?.$type === 'bpmn:ServiceTask'
  );
}

function isSequenceFlow(element: any): boolean {
  return (
    element?.type === 'bpmn:SequenceFlow' || element?.businessObject?.$type === 'bpmn:SequenceFlow'
  );
}

function isExternalWorkerConfig(config: FlowableServiceTaskConfig): boolean {
  return config.implementationType === 'type' && config.type === 'external-worker';
}

function readSequenceFlowCondition(element: any): string {
  const conditionExpression = element?.businessObject?.conditionExpression;
  const value = conditionExpression?.get?.('body') ?? conditionExpression?.body;
  return typeof value === 'string' ? value : '';
}

function writeSequenceFlowCondition(element: any, value: string, services: WriterServices): void {
  const body = value.trim() ? value : '';
  const businessObject = element.businessObject;
  const conditionExpression = body
    ? withParent(services.bpmnFactory.create('bpmn:FormalExpression', { body }), businessObject)
    : undefined;

  if (conditionExpression && element.source?.businessObject?.default === businessObject) {
    services.modeling.updateProperties(element.source, { default: undefined });
  }
  services.modeling.updateProperties(element, { conditionExpression });
}

function withParent<T extends { $parent?: unknown }>(element: T, parent: unknown): T {
  element.$parent = parent;
  return element;
}

function writerServices(injector: Injector): WriterServices {
  return {
    modeling: injector.get('modeling'),
    bpmnFactory: injector.get('bpmnFactory'),
  };
}

type ArrayItem<T> = T extends Array<infer I> ? I : never;


function flowableCallActivityGroup(element: any, injector: Injector): PanelGroup {
  const translate = injector.get('translate');
  return {
    id: 'flowableCallActivity',
    label: translate('Call Activity (Flowable)'),
    component: Group,
    entries: [
      entry('flowable-calledElement', FlowableCalledElementEntry, isTextFieldEntryEdited),
      entry('flowable-inheritVariables', FlowableInheritVariablesEntry, isCheckboxEntryEdited),
      entry('flowable-sameDeployment', FlowableSameDeploymentEntry, isCheckboxEntryEdited),
      entry('flowable-fallbackToDefaultTenant', FlowableFallbackTenantEntry, isCheckboxEntryEdited),
      entry('flowable-inheritBusinessKey', FlowableInheritBusinessKeyEntry, isCheckboxEntryEdited),
    ],
  };
}

function FlowableCalledElementEntry(props: any): any {
  const debounceInput = debounce();
  const translateFn = useService('translate', true) ?? ((label: string) => label);
  const { modeling } = useWriterServices();
  return TextFieldEntry({
    element: props.element,
    id: props.id,
    label: translateFn('Called Element'),
    debounce: debounceInput,
    getValue: () => props.element?.businessObject?.calledElement ?? '',
    setValue: (value: string) => {
      modeling.updateProperties(props.element, { calledElement: value?.trim() || undefined });
    },
  });
}

function FlowableInheritVariablesEntry(props: any): any {
  const translateFn = useService('translate', true) ?? ((label: string) => label);
  const { modeling } = useWriterServices();
  return CheckboxEntry({
    element: props.element,
    id: props.id,
    label: translateFn('Inherit Variables'),
    getValue: () => !!(props.element?.businessObject?.get?.('flowable:inheritVariables') ?? props.element?.businessObject?.inheritVariables),
    setValue: (value: boolean) => {
      modeling.updateProperties(props.element, { 'flowable:inheritVariables': value });
    },
  });
}

function FlowableSameDeploymentEntry(props: any): any {
  const translateFn = useService('translate', true) ?? ((label: string) => label);
  const { modeling } = useWriterServices();
  return CheckboxEntry({
    element: props.element,
    id: props.id,
    label: translateFn('Same Deployment'),
    getValue: () => !!(props.element?.businessObject?.get?.('flowable:sameDeployment') ?? props.element?.businessObject?.sameDeployment),
    setValue: (value: boolean) => {
      modeling.updateProperties(props.element, { 'flowable:sameDeployment': value });
    },
  });
}

function FlowableFallbackTenantEntry(props: any): any {
  const translateFn = useService('translate', true) ?? ((label: string) => label);
  const { modeling } = useWriterServices();
  return CheckboxEntry({
    element: props.element,
    id: props.id,
    label: translateFn('Fallback to Default Tenant'),
    getValue: () => !!(props.element?.businessObject?.get?.('flowable:fallbackToDefaultTenant') ?? props.element?.businessObject?.fallbackToDefaultTenant),
    setValue: (value: boolean) => {
      modeling.updateProperties(props.element, { 'flowable:fallbackToDefaultTenant': value });
    },
  });
}

function FlowableInheritBusinessKeyEntry(props: any): any {
  const translateFn = useService('translate', true) ?? ((label: string) => label);
  const { modeling } = useWriterServices();
  return CheckboxEntry({
    element: props.element,
    id: props.id,
    label: translateFn('Inherit Business Key'),
    getValue: () => !!(props.element?.businessObject?.get?.('flowable:inheritBusinessKey') ?? props.element?.businessObject?.inheritBusinessKey),
    setValue: (value: boolean) => {
      modeling.updateProperties(props.element, { 'flowable:inheritBusinessKey': value });
    },
  });
}

function flowableCallActivityInParamsGroup(element: any, injector: Injector): PanelGroup {
  const translate = injector.get('translate');
  const services = writerServices(injector);
  const params = readIOParams(element, 'flowable:In');
  return listGroup(
    'flowableCallActivityInParams',
    translate('In Parameters'),
    element,
    params,
    (param, index) => ({
      id: element.id + '-flowable-in-' + index,
      label: param.target || translate('<empty>'),
      entries: [
        rowEntry('flowable-in-sourceType', index, FlowableInSourceTypeEntry, isSelectEntryEdited),
        rowEntry('flowable-in-source', index, FlowableInSourceEntry, isTextFieldEntryEdited),
        rowEntry('flowable-in-target', index, FlowableInTargetEntry, isTextFieldEntryEdited),
      ],
      autoFocusEntry: 'flowable-in-target-' + index,
      remove: removeIOParam(element, 'flowable:In', index, services),
    }),
    addIOParam(element, 'flowable:In', { source: '', target: '', sourceType: 'source' }, services),
  );
}

function flowableCallActivityOutParamsGroup(element: any, injector: Injector): PanelGroup {
  const translate = injector.get('translate');
  const services = writerServices(injector);
  const params = readIOParams(element, 'flowable:Out');
  return listGroup(
    'flowableCallActivityOutParams',
    translate('Out Parameters'),
    element,
    params,
    (param, index) => ({
      id: element.id + '-flowable-out-' + index,
      label: param.target || translate('<empty>'),
      entries: [
        rowEntry('flowable-out-sourceType', index, FlowableOutSourceTypeEntry, isSelectEntryEdited),
        rowEntry('flowable-out-source', index, FlowableOutSourceEntry, isTextFieldEntryEdited),
        rowEntry('flowable-out-target', index, FlowableOutTargetEntry, isTextFieldEntryEdited),
      ],
      autoFocusEntry: 'flowable-out-target-' + index,
      remove: removeIOParam(element, 'flowable:Out', index, services),
    }),
    addIOParam(element, 'flowable:Out', { source: '', target: '', sourceType: 'source' }, services),
  );
}

function readIOParams(element: any, type: string): Array<{ source: string; sourceExpression: string; target: string; sourceType: string }> {
  const values: any[] = element?.businessObject?.extensionElements?.values ?? [];
  return values
    .filter((val: any) => val.$type === type)
    .map((val: any) => ({
      source: val.source ?? '',
      sourceExpression: val.sourceExpression ?? '',
      target: val.target ?? '',
      sourceType: val.sourceExpression ? 'sourceExpression' : 'source',
    }));
}

function FlowableInSourceTypeEntry(props: any): any {
  const translateFn = useService('translate', true) ?? ((label: string) => label);
  const services = useWriterServices();
  return SelectEntry({
    element: props.element,
    id: props.id,
    label: translateFn('Source Type'),
    getValue: () => readIOParams(props.element, 'flowable:In')[props.rowIndex]?.sourceType ?? 'source',
    setValue: (val: string) => writeIOParamField(props.element, 'flowable:In', props.rowIndex, 'sourceType', val, services),
    getOptions: () => [
      { label: translateFn('Source Variable'), value: 'source' },
      { label: translateFn('Source Expression'), value: 'sourceExpression' },
    ],
  });
}

function FlowableInSourceEntry(props: any): any {
  const debounceInput = debounce();
  const translateFn = useService('translate', true) ?? ((label: string) => label);
  const services = useWriterServices();
  const current = readIOParams(props.element, 'flowable:In')[props.rowIndex];
  const isExpr = current?.sourceType === 'sourceExpression';
  return TextFieldEntry({
    element: props.element,
    id: props.id,
    label: translateFn(isExpr ? 'Source Expression' : 'Source Variable'),
    debounce: debounceInput,
    getValue: () => (isExpr ? current?.sourceExpression : current?.source) ?? '',
    setValue: (val: string) => writeIOParamField(props.element, 'flowable:In', props.rowIndex, isExpr ? 'sourceExpression' : 'source', val, services),
  });
}

function FlowableInTargetEntry(props: any): any {
  const debounceInput = debounce();
  const translateFn = useService('translate', true) ?? ((label: string) => label);
  const services = useWriterServices();
  return TextFieldEntry({
    element: props.element,
    id: props.id,
    label: translateFn('Target Variable'),
    debounce: debounceInput,
    getValue: () => readIOParams(props.element, 'flowable:In')[props.rowIndex]?.target ?? '',
    setValue: (val: string) => writeIOParamField(props.element, 'flowable:In', props.rowIndex, 'target', val, services),
  });
}

function FlowableOutSourceTypeEntry(props: any): any {
  const translateFn = useService('translate', true) ?? ((label: string) => label);
  const services = useWriterServices();
  return SelectEntry({
    element: props.element,
    id: props.id,
    label: translateFn('Source Type'),
    getValue: () => readIOParams(props.element, 'flowable:Out')[props.rowIndex]?.sourceType ?? 'source',
    setValue: (val: string) => writeIOParamField(props.element, 'flowable:Out', props.rowIndex, 'sourceType', val, services),
    getOptions: () => [
      { label: translateFn('Source Variable'), value: 'source' },
      { label: translateFn('Source Expression'), value: 'sourceExpression' },
    ],
  });
}

function FlowableOutSourceEntry(props: any): any {
  const debounceInput = debounce();
  const translateFn = useService('translate', true) ?? ((label: string) => label);
  const services = useWriterServices();
  const current = readIOParams(props.element, 'flowable:Out')[props.rowIndex];
  const isExpr = current?.sourceType === 'sourceExpression';
  return TextFieldEntry({
    element: props.element,
    id: props.id,
    label: translateFn(isExpr ? 'Source Expression' : 'Source Variable'),
    debounce: debounceInput,
    getValue: () => (isExpr ? current?.sourceExpression : current?.source) ?? '',
    setValue: (val: string) => writeIOParamField(props.element, 'flowable:Out', props.rowIndex, isExpr ? 'sourceExpression' : 'source', val, services),
  });
}

function FlowableOutTargetEntry(props: any): any {
  const debounceInput = debounce();
  const translateFn = useService('translate', true) ?? ((label: string) => label);
  const services = useWriterServices();
  return TextFieldEntry({
    element: props.element,
    id: props.id,
    label: translateFn('Target Variable'),
    debounce: debounceInput,
    getValue: () => readIOParams(props.element, 'flowable:Out')[props.rowIndex]?.target ?? '',
    setValue: (val: string) => writeIOParamField(props.element, 'flowable:Out', props.rowIndex, 'target', val, services),
  });
}

function addIOParam(element: any, type: string, defaultVal: { source: string; target: string; sourceType: string }, services: WriterServices) {
  return (event: Event) => {
    event.stopPropagation();
    const bo = element.businessObject;
    let ext = bo.extensionElements;
    if (!ext) {
      ext = withParent(services.bpmnFactory.create('bpmn:ExtensionElements', { values: [] }), bo);
      services.modeling.updateProperties(element, { extensionElements: ext });
    }
    const param = withParent(services.bpmnFactory.create(type, { source: defaultVal.source, target: defaultVal.target }), ext);
    services.modeling.updateModdleProperties(element, ext, { values: [...(ext.values ?? []), param] });
  };
}

function removeIOParam(element: any, type: string, index: number, services: WriterServices) {
  return (event: Event) => {
    event.stopPropagation();
    const ext = element.businessObject.extensionElements;
    if (!ext || !ext.values) return;
    const filtered = ext.values.filter((v: any) => v.$type === type);
    const toRemove = filtered[index];
    if (!toRemove) return;
    services.modeling.updateModdleProperties(element, ext, { values: ext.values.filter((v: any) => v !== toRemove) });
  };
}

function writeIOParamField(element: any, type: string, index: number, field: string, val: string, services: WriterServices) {
  const bo = element.businessObject;
  let ext = bo.extensionElements;
  if (!ext || !ext.values) return;
  const filtered = ext.values.filter((v: any) => v.$type === type);
  const targetObj = filtered[index];
  if (!targetObj) return;

  if (field === 'sourceType') {
    if (val === 'sourceExpression') {
      const src = targetObj.source;
      targetObj.source = undefined;
      targetObj.sourceExpression = src || '';
    } else {
      const expr = targetObj.sourceExpression;
      targetObj.sourceExpression = undefined;
      targetObj.source = expr || '';
    }
  } else {
    targetObj[field] = val;
  }
  services.modeling.updateModdleProperties(element, targetObj, { [field]: val });
}

function isCallActivity(element: any): boolean {
  return element?.type === 'bpmn:CallActivity' || element?.businessObject?.$type === 'bpmn:CallActivity';
}

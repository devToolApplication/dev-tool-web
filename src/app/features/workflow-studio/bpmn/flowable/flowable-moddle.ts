export const flowableModdle = {
  name: 'Flowable',
  uri: 'http://flowable.org/bpmn',
  prefix: 'flowable',
  xml: {
    tagAlias: 'lowerCase',
  },
  associations: [],
  types: [
    {
      name: 'ServiceTaskExtensions',
      isAbstract: true,
      extends: ['bpmn:ServiceTask'],
      properties: [
        { name: 'class', isAttr: true, type: 'String' },
        { name: 'expression', isAttr: true, type: 'String' },
        { name: 'delegateExpression', isAttr: true, type: 'String' },
        { name: 'type', isAttr: true, type: 'String' },
        { name: 'topic', isAttr: true, type: 'String' },
        { name: 'doNotIncludeVariables', isAttr: true, type: 'Boolean', default: false },
        { name: 'resultVariableName', isAttr: true, type: 'String' },
        { name: 'useLocalScopeForResultVariable', isAttr: true, type: 'Boolean', default: false },
        { name: 'storeResultVariableAsTransient', isAttr: true, type: 'Boolean', default: false },
        { name: 'skipExpression', isAttr: true, type: 'String' },
        { name: 'triggerable', isAttr: true, type: 'Boolean', default: false },
        { name: 'extensionId', isAttr: true, type: 'String' },
        { name: 'formKey', isAttr: true, type: 'String' },
        { name: 'taskConfigJson', isAttr: true, type: 'String' },
      ],
    },
    {
      name: 'AsyncCapable',
      isAbstract: true,
      extends: ['bpmn:Activity', 'bpmn:Gateway', 'bpmn:Event'],
      properties: [
        { name: 'async', isAttr: true, type: 'Boolean', default: false },
        { name: 'asyncLeave', isAttr: true, type: 'Boolean', default: false },
        { name: 'exclusive', isAttr: true, type: 'Boolean', default: true },
      ],
    },
    {
      name: 'Field',
      superClass: ['Element'],
      properties: [
        { name: 'name', isAttr: true, type: 'String' },
        { name: 'stringValue', isAttr: true, type: 'String' },
        { name: 'string', type: 'String' },
        { name: 'expression', type: 'String' },
      ],
    },
    {
      name: 'ExternalWorkerInParameter',
      superClass: ['IOParameter'],
    },
    {
      name: 'ExternalWorkerOutParameter',
      superClass: ['IOParameter'],
    },
    {
      name: 'In',
      superClass: ['IOParameter'],
    },
    {
      name: 'Out',
      superClass: ['IOParameter'],
    },
    {
      name: 'IOParameter',
      isAbstract: true,
      superClass: ['Element'],
      properties: [
        { name: 'source', isAttr: true, type: 'String' },
        { name: 'sourceExpression', isAttr: true, type: 'String' },
        { name: 'target', isAttr: true, type: 'String' },
        { name: 'transient', isAttr: true, type: 'Boolean', default: false },
      ],
    },
    {
      name: 'MapException',
      superClass: ['Element'],
      properties: [
        { name: 'errorCode', isAttr: true, type: 'String' },
        { name: 'includeChildExceptions', isAttr: true, type: 'Boolean', default: false },
        { name: 'rootCause', isAttr: true, type: 'Boolean', default: false },
        { name: 'body', isBody: true, type: 'String' },
      ],
    },
    {
      name: 'FailedJobRetryTimeCycle',
      superClass: ['Element'],
      properties: [{ name: 'body', isBody: true, type: 'String' }],
    },
    {
      name: 'ExecutionListener',
      superClass: ['Element'],
      properties: [
        { name: 'event', isAttr: true, type: 'String' },
        { name: 'class', isAttr: true, type: 'String' },
        { name: 'expression', isAttr: true, type: 'String' },
        { name: 'delegateExpression', isAttr: true, type: 'String' },
        { name: 'onTransaction', isAttr: true, type: 'String' },
        { name: 'customPropertiesResolverClass', isAttr: true, type: 'String' },
        { name: 'customPropertiesResolverExpression', isAttr: true, type: 'String' },
        { name: 'customPropertiesResolverDelegateExpression', isAttr: true, type: 'String' },
        { name: 'fields', type: 'Field', isMany: true },
      ],
    },
  ],
} as const;

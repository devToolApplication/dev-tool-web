# Workflow Flowable Native Service Task FE Design

Date: 2026-08-26
Status: DRAFT FOR USER REVIEW

## 1. Goal

Standardize Workflow Studio's BPMN Service Task editing around Flowable-native
runtime fields only.

The frontend should let a user configure a Flowable Service Task that the
backend can run directly with Flowable, for example by adding a JavaDelegate or
a Spring bean and deploying the BPMN XML. BPMN XML remains the only persisted
workflow source of truth.

## 2. Decision

Use Flowable-native Service Task properties as the primary editor contract:

- `flowable:class`
- `flowable:delegateExpression`
- `flowable:expression`
- `flowable:type`
- `flowable:field`
- `flowable:resultVariableName`
- `flowable:useLocalScopeForResultVariable`
- `flowable:storeResultVariableAsTransient`
- `flowable:async`
- `flowable:asyncLeave`
- `flowable:exclusive`
- `flowable:skipExpression`
- `flowable:triggerable`
- `flowable:topic`
- `flowable:doNotIncludeVariables`
- `flowable:mapException`
- `flowable:failedJobRetryTimeCycle` extension element
- `flowable:extensionId`
- `flowable:formKey`

Do not expose DevTool task presets or custom task config in the Flowable-native
editor. `flowable:topic` appears only when the selected implementation is the
Flowable-native `external-worker` type.

## 3. Current State

`WorkflowBpmnCanvasComponent` already uses `bpmn-js` and
`bpmn-js-properties-panel`, but only the core BPMN provider is registered. This
is why Service Task currently shows only general BPMN fields.

`workflow-bpmn-adapter.ts` currently serializes legacy custom metadata:

- `flowable:type="external-worker"`
- `flowable:topic="ai|mcp|code|http"`
- `flowable:taskConfigJson="..."`

Backend `ai-agent-mcrs` currently uses Flowable 7.2.0 and can parse/deploy BPMN
XML. The current runtime has custom external-worker dispatch code, but this FE
spec deliberately does not model or preserve that custom contract.

## 4. Scope

In scope:

- Frontend BPMN properties support for Flowable Service Task runtime fields.
- Flowable moddle support so imported and edited Flowable extension attributes
  serialize with the `flowable` namespace.
- A typed properties panel grouped like a normal Flowable modeler.
- Camunda-like input/output mapping ergonomics, implemented with Flowable-native
  concepts.
- Frontend tests proving XML import, edit, save, and reload for Flowable fields.
- Removal of DevTool-specific presets and custom task JSON from the active FE
  modeling contract.

Out of scope for this FE spec:

- Backend JavaDelegate implementation.
- Backend validation hardening.
- Runtime migration from existing custom topic/taskConfig KOC flows.
- Backward-compatible round-trip guarantees for DevTool custom Service Task
  metadata.
- Full Flowable Enterprise palette parity.
- User Task, Call Activity, DMN Task, HTTP Task, Mail Task, and Shell Task forms,
  except where Service Task exposes a native `flowable:type` value in advanced
  mode.

## 5. User Experience

Selecting a `bpmn:ServiceTask` opens a Flowable Service Task property surface in
the existing right panel.

Groups:

1. General
2. Implementation
3. Fields
4. Variables
5. Execution
6. Exceptions
7. Listeners
8. Advanced

### 5.1 General

Fields:

- ID
- Name
- Documentation
- Extension ID
- Form key

Purpose:

- ID is the BPMN technical identity.
- Name is diagram display text.
- Documentation is free-form model documentation.
- Extension ID identifies a custom task shape or backend catalog item when
  needed.
- Form key is kept because the Flowable schema allows it on Service Task; it is
  metadata only unless backend form resolution is configured.

### 5.2 Implementation

Implementation type is a segmented choice:

- Java class
- Delegate expression
- Expression
- Built-in type
- None

Field behavior:

- Java class shows `flowable:class`.
- Delegate expression shows `flowable:delegateExpression`.
- Expression shows `flowable:expression`.
- Built-in type shows `flowable:type` values supported by the Flowable 7.2.0
  extension schema: `camel`, `http`, `mail`, `shell`, `dmn`, `case`,
  `send-event`, `external-worker`.
- None clears implementation-specific Flowable attributes after confirmation.

Built-in types are marked as "requires backend module/config" until backend
confirms the matching Flowable module is installed and configured. Java class,
delegate expression, and expression are the primary path.

Validation:

- Exactly one primary implementation may be active.
- Java class should be a fully qualified Java class name.
- Delegate expression and expression should be non-empty expressions.
- Built-in type must be one of the supported values listed above.
- External worker requires a non-empty native `flowable:topic`.

### 5.3 Fields

Class fields are edited as rows:

- Name
- Value type: string value, long string, or expression
- Value

Serialization:

```xml
<extensionElements>
  <flowable:field name="text" stringValue="Hello" />
  <flowable:field name="rule" expression="${ruleBean.resolve(execution)}" />
</extensionElements>
```

Use cases:

- Inject fixed config into a JavaDelegate.
- Inject expressions resolved at runtime.
- Avoid custom JSON config for simple delegate parameters.

UI rule:

- Fields are primary for Java class and delegate expression.
- Fields are hidden for expression implementation unless Advanced is open,
  because Flowable does not support field injection for plain expression
  service tasks.

### 5.4 Variables

The variable editor should feel like Camunda input/output mapping, but serialize
to Flowable-compatible BPMN.

Input mappings:

- Rows: Source, Source type, Target, Transient
- Source type values: variable, expression
- Source maps to `flowable:in source`.
- Expression maps to `flowable:in sourceExpression`.
- Target maps to `flowable:in target`.

Output mappings:

- Rows: Source, Source type, Target, Transient
- Source maps to `flowable:out source`.
- Expression maps to `flowable:out sourceExpression`.
- Target maps to `flowable:out target`.

Result fields:

- `flowable:resultVariableName` for the Service Task result variable.
- `flowable:useLocalScopeForResultVariable`
- `flowable:storeResultVariableAsTransient`

### 5.5 Execution

Fields:

- `flowable:async`
- `flowable:asyncLeave`
- `flowable:exclusive`
- `flowable:skipExpression`
- `flowable:triggerable`
- `flowable:parallelInSameTransaction`, visible only when built-in type is
  `http`.
- `flowable:topic`, visible only when built-in type is `external-worker`.
- `flowable:doNotIncludeVariables`, visible only when built-in type is
  `external-worker`.

Behavior:

- Async means Flowable persists the process state before executing the activity.
- Async leave means Flowable leaves the activity asynchronously.
- Exclusive controls concurrency for async jobs in the same process instance.
- Skip expression is visible only in Advanced because it requires runtime opt-in.
- Triggerable is visible only in Advanced because the backend delegate must
  implement triggerable behavior.

### 5.6 Exceptions

Exception mappings are edited as rows:

- Exception class
- Error code
- Root cause
- Include child exceptions

Serialization target:

```xml
<extensionElements>
  <flowable:mapException errorCode="MY_ERROR" includeChildExceptions="true">
    com.example.BusinessException
  </flowable:mapException>
</extensionElements>
```

Failed job retry is edited as a single ISO-8601 retry cycle string:

- `<flowable:failedJobRetryTimeCycle>`
- Example: `R3/PT5M`

Purpose:

- Exception mapping turns Java exceptions into BPMN errors catchable by boundary
  error events.
- Failed job retry handles technical job retry without custom app retry JSON.

### 5.7 Listeners

Execution listeners are edited as rows:

- Event: start, end
- Implementation type: class, expression, delegate expression
- Implementation value
- Transaction: none, before-commit, committed, rolled-back
- Custom properties resolver: class, expression, delegate expression
- Fields

Serialization target:

```xml
<extensionElements>
  <flowable:executionListener event="start" delegateExpression="${auditListener}" />
</extensionElements>
```

Sequence flow `take` listener belongs to Sequence Flow properties, not Service
Task properties.

### 5.8 Advanced

Advanced shows:

- Raw Flowable attributes detected on the business object.
- Raw `extensionElements` summary.

Advanced allows inspect and preservation first. Direct raw XML editing is not
part of V1 because it makes validation and round-trip tests expensive.

## 6. Architecture

Add one Flowable BPMN support layer under:

```text
src/app/features/workflow-studio/bpmn/flowable/
```

Suggested files:

- `flowable-moddle.json`
- `flowable-service-task.model.ts`
- `flowable-service-task-mapper.ts`
- `flowable-properties-provider.ts`
- `flowable-service-task-properties.component.ts`
- `flowable-mapping-table.component.ts`

`WorkflowBpmnCanvasComponent` remains the owner of `bpmn-js` modeler internals.
It registers:

```ts
moddleExtensions: {
  flowable: flowableModdle,
}
additionalModules: [
  BpmnPropertiesPanelModule,
  BpmnPropertiesProviderModule,
  FlowablePropertiesProviderModule,
]
```

Do not use the npm package `flowable-bpmn-moddle` unless it is verified against
Flowable 7.2. The currently visible npm metadata points to Camunda moddle, so a
small local descriptor is safer and cheaper.

## 7. Data Flow

1. Import BPMN XML into `bpmn-js`.
2. Flowable moddle keeps known `flowable:*` attributes and extension elements
   typed.
3. User edits Service Task properties in the right panel.
4. Mapper applies changes to the selected business object using `modeling` and
   `moddle`.
5. Canvas emits formatted BPMN XML through the existing `bpmnXmlChange` output.
6. Existing save/publish flow sends the XML to backend unchanged.

## 8. Error Handling

Frontend validation:

- Missing implementation value blocks local apply.
- Multiple implementation values are normalized to the selected implementation.
- Invalid Java class format shows a field error.
- Mapping rows require either source or source expression, never both.
- Mapping rows require target.
- Duplicate field names are allowed because Flowable XML allows repeated
  extension rows, but the UI warns because delegates usually expect one value.
- Invalid retry cycle format warns but does not block save until backend
  validator owns the rule.

Round-trip:

- Unknown Flowable-native extension elements are preserved when possible.
- DevTool custom Service Task metadata is not part of the supported FE contract;
  if present in imported XML, it is not rendered, validated, or guaranteed to
  survive normalized Flowable-native editing.
- If a typed mapper cannot safely edit an unknown Flowable-native extension
  element, it leaves it unchanged.

## 9. Testing

Frontend tests:

- Modeler factory registers `moddleExtensions.flowable`.
- Service Task mapper reads `flowable:class`.
- Service Task mapper writes `flowable:delegateExpression` and clears class and
  expression.
- Field injection rows serialize to `<flowable:field>`.
- Input/output rows serialize to `<flowable:in>` and `<flowable:out>`.
- Result variable fields serialize and reload.
- Async/exclusive/asyncLeave fields serialize and reload.
- Exception mappings serialize and reload.
- External-worker native `flowable:topic` and `flowable:doNotIncludeVariables`
  serialize and reload.
- New FE edits emit only Flowable-native Service Task attributes and extension
  elements.
- Invalid mapping rows do not mutate XML.

Suggested commands:

```text
npm test -- --watch=false --include src/app/features/workflow-studio/bpmn/**/*.spec.ts
npm run typecheck
npm run build
```

## 10. Acceptance

- Selecting a Service Task shows Flowable-native properties, not only
  General/Documentation.
- A user can configure Java class, delegate expression, or expression without
  editing XML.
- A user can configure class fields without editing JSON.
- A user can configure input/output variable mappings with Camunda-like rows.
- A user can configure result variable behavior.
- A user can configure async/exclusive execution behavior.
- A user can configure exception mappings and failed job retry cycle.
- A user can configure Flowable-native external-worker metadata when using
  `flowable:type="external-worker"`.
- No DevTool-specific task preset or custom task JSON form is added.
- BPMN XML saved by the frontend is accepted by Flowable XML parsing once the
  backend validator is updated to the same Flowable-native contract.

## 11. Non-Goals

- No backend JavaDelegate code in this FE phase.
- No custom `ai/mcp/code/http` task presets in the Service Task editor.
- No custom task JSON support in the active FE modeling contract.
- No raw full XML editor.
- No Flowable Enterprise-only task palette parity in V1.
- No new npm dependency for a stale or unverified Flowable moddle package.

## 12. References

- Flowable Open Source BPMN constructs:
  https://www.flowable.com/open-source/docs/bpmn/ch07b-BPMN-Constructs
- Flowable Service Task reference:
  https://documentation.flowable.com/latest/reactmodel/bpmn/reference/service-task
- Flowable 7.2 BPMN extension schema:
  https://raw.githubusercontent.com/flowable/flowable-engine/flowable-7.2.0/modules/flowable-bpmn-converter/src/main/resources/org/flowable/impl/bpmn/parser/flowable-bpmn-extensions.xsd

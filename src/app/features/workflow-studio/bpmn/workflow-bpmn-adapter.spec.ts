import {
  workflowConditionToExpression,
  workflowGraphFromBpmnXml,
  workflowGraphToBpmnXml,
} from './workflow-bpmn-adapter';
import type { BpmnWorkflowNode, WorkflowGraph } from '../model/workflow-studio.model';

describe('workflow bpmn adapter', () => {
  it('maps Flowable workflow graphs to BPMN XML without losing node and edge identity', () => {
    const xml = workflowGraphToBpmnXml(sampleGraph(), {
      processId: 'wf-1_v1',
      processName: 'KOC evaluation',
    });

    expect(xml).toContain('<process id="wf_1_v1" name="KOC evaluation" isExecutable="true">');
    expect(xml).toContain('<startEvent id="start" name="Start" />');
    expect(xml).toContain('<serviceTask id="service" name="Service review" />');
    expect(xml).not.toContain('flowable:topic="ai"');
    expect(xml).not.toContain('flowable:taskConfigJson');
    expect(xml).toContain('<exclusiveGateway id="xor" name="Score branch" default="flow-default" />');
    expect(xml).toContain('id="flow-pass" sourceRef="xor" targetRef="service"');
    expect(xml).toContain('devtool:conditionJson="{&quot;type&quot;:&quot;COMPARE&quot;');
    expect(xml).toContain('<conditionExpression xsi:type="tFormalExpression">${input.candidate.followers &gt;= 1000}</conditionExpression>');
  });

  it('prefixes persisted numeric workflow ids so bpmn-js can display the diagram', () => {
    const xml = workflowGraphToBpmnXml(sampleGraph(), {
      processId: '68af7e4f8c8b6d1c2a5e9f01',
    });

    expect(xml).toContain('<process id="wf_68af7e4f8c8b6d1c2a5e9f01"');
    expect(xml).toContain('id="wf_68af7e4f8c8b6d1c2a5e9f01_diagram"');
    expect(xml).toContain('bpmnElement="wf_68af7e4f8c8b6d1c2a5e9f01"');
  });

  it('maps BPMN XML back to backend DTO graph and preserves structured condition metadata', () => {
    const result = workflowGraphFromBpmnXml(workflowGraphToBpmnXml(sampleGraph(), {
      processId: 'wf-1_v1',
    }));

    expect(result.issues).toEqual([]);
    expect(result.processId).toBe('wf_1_v1');
    expect(result.graph.nodes).toEqual(sampleGraph().nodes);
    expect(result.graph.edges).toEqual(sampleGraph().edges);
  });

  it('parses BPMN user tasks through the generic node metadata path', () => {
    const result = workflowGraphFromBpmnXml(`
      <definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL">
        <process id="wf" isExecutable="true">
          <userTask id="manual-review" />
          <serviceTask id="generic-service" />
        </process>
      </definitions>
    `);

    expect(result.graph.nodes).toEqual([
      { id: 'manual-review', type: 'USER_TASK', name: null },
      { id: 'generic-service', type: 'SERVICE_TASK', name: null, config: {}, inputMapping: {}, outputMapping: {}, retryPolicy: {}, timeoutPolicy: {} },
    ]);
    expect(result.issues).toEqual([]);
  });

  it('round-trips KOC V9 Flowable attributes through graph conversion', () => {
    const result = workflowGraphFromBpmnXml(kocV9Fixture());

    expect(result.issues.filter((item) => item.code === 'BPMN_ELEMENT_UNSUPPORTED')).toEqual([]);
    expect(result.graph.nodes.map((node) => node.type)).toContain('CALL_ACTIVITY');
    expect(result.graph.nodes.map((node) => node.type)).toContain('INCLUSIVE_GATEWAY');
    expect(result.graph.nodes.find((node) => node.id === 'KOC_LOAD_CAMPAIGN')).toMatchObject({
      type: 'SERVICE_TASK',
      attributes: { 'flowable:delegateExpression': '${kocLoadCampaignDelegate}' },
    });
    expect(result.graph.nodes.find((node) => node.id === 'CALL_AI_SEARCH_CANDIDATES')).toMatchObject({
      type: 'CALL_ACTIVITY',
      attributes: {
        calledElement: 'ai_call_with_retry_v1',
        'flowable:inheritVariables': 'false',
      },
    });
    expect(result.graph.edges.find((edge) => edge.id === 'Flow_Persist_NewCandidates')).toMatchObject({
      conditionExpression: '${newCandidateCount > 0}',
    });

    const xml = workflowGraphToBpmnXml(result.graph, {
      processId: result.processId ?? undefined,
      processName: 'KOC Candidate Search V9',
    });

    expect(xml).toContain('flowable:delegateExpression="${kocLoadCampaignDelegate}"');
    expect(xml).toContain('<callActivity id="CALL_AI_SEARCH_CANDIDATES" name="AI search" calledElement="ai_call_with_retry_v1" flowable:inheritVariables="false">');
    expect(xml).toContain('flowable:in');
    expect(xml).toContain('target="agent"');
    expect(xml).toContain('sourceExpression="${candidateSearchAgent}"');
    expect(xml).toContain('flowable:out');
    expect(xml).toContain('source="aiOutput"');
    expect(xml).toContain('target="candidateSearchResult"');
    expect(xml).toContain('<inclusiveGateway id="Gateway_PersistDecision" name="Has new data?" default="Flow_Persist_NoNewData">');
    expect(xml).toContain('<conditionExpression xsi:type="tFormalExpression">${newCandidateCount &gt; 0}</conditionExpression>');
  });

  it('round-trips the full KOC V9 BPMN XML file without unsupported element errors or attribute loss', () => {
    const rawXml = `<?xml version='1.0' encoding='utf-8'?>
<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" xmlns:flowable="http://flowable.org/bpmn" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" targetNamespace="http://devtool.vn/workflow">
  <process id="koc_candidate_search_v9" name="KOC Candidate Search V9 - Async Review + AI Evidence" isExecutable="true">
    <startEvent id="StartEvent_1" name="Start">
      <outgoing>Flow_Start_LoadCampaign</outgoing>
    </startEvent>
    <serviceTask id="KOC_LOAD_CAMPAIGN" name="Load campaign" flowable:delegateExpression="\${kocLoadCampaignDelegate}">
      <incoming>Flow_Start_LoadCampaign</incoming>
      <outgoing>Flow_LoadCampaign_Demand</outgoing>
    </serviceTask>
    <serviceTask id="KOC_CALCULATE_SEARCH_DEMAND" name="Calculate search demand" flowable:delegateExpression="\${kocCalculateSearchDemandDelegate}">
      <incoming>Flow_LoadCampaign_Demand</incoming>
      <incoming>Flow_UpdateStats_Demand</incoming>
      <outgoing>Flow_Demand_Decision</outgoing>
    </serviceTask>
    <exclusiveGateway id="Gateway_DemandDecision" name="Can tim them?" default="Flow_Demand_Complete">
      <incoming>Flow_Demand_Decision</incoming>
      <outgoing>Flow_Demand_NeedSearch</outgoing>
      <outgoing>Flow_Demand_Complete</outgoing>
    </exclusiveGateway>
    <sequenceFlow id="Flow_Demand_NeedSearch" name="Can tim them" sourceRef="Gateway_DemandDecision" targetRef="KOC_LOAD_SEARCH_ROUND_HISTORY">
      <conditionExpression xsi:type="tFormalExpression">\${demandState == 'NEED_SEARCH'}</conditionExpression>
    </sequenceFlow>
    <sequenceFlow id="Flow_Demand_Complete" name="Da du approved" sourceRef="Gateway_DemandDecision" targetRef="EndEvent_Success" />
    <serviceTask id="KOC_LOAD_SEARCH_ROUND_HISTORY" name="Load recent search rounds" flowable:delegateExpression="\${kocLoadSearchRoundHistoryDelegate}">
      <incoming>Flow_Demand_NeedSearch</incoming>
      <outgoing>Flow_BuildContext_CallAI</outgoing>
    </serviceTask>
    <callActivity id="CALL_AI_SEARCH_CANDIDATES" name="AI - Tim batch candidate" calledElement="ai_call_with_retry_v1" flowable:inheritVariables="false">
      <extensionElements>
        <flowable:in target="agent" sourceExpression="\${candidateSearchAgent}" />
        <flowable:in target="prompt" sourceExpression="\${candidateSearchPrompt}" />
        <flowable:in target="outputSchema" sourceExpression="\${candidateSearchOutputSchema}" />
        <flowable:in target="timeoutDuration" sourceExpression="\${aiTimeoutDuration}" />
        <flowable:in target="maxAiRetry" sourceExpression="\${maxAiRetry}" />
        <flowable:in target="requestContext" sourceExpression="\${candidateSearchRequestContext}" />
        <flowable:out source="aiOutput" target="candidateSearchResult" />
        <flowable:out source="aiRequestId" target="candidateSearchRequestId" />
        <flowable:out source="aiThreadId" target="candidateSearchThreadId" />
      </extensionElements>
      <incoming>Flow_BuildContext_CallAI</incoming>
      <outgoing>Flow_AI_Search_Completed</outgoing>
    </callActivity>
    <serviceTask id="KOC_CHECK_CANDIDATE_DUPLICATE" name="Kiem tra duplicate" flowable:delegateExpression="\${kocCheckCandidateDuplicateDelegate}">
      <incoming>Flow_AI_Search_Completed</incoming>
      <outgoing>Flow_CheckDuplicate_RecordHistory</outgoing>
    </serviceTask>
    <serviceTask id="KOC_RECORD_SEARCH_HISTORY" name="Ghi search history" flowable:delegateExpression="\${kocRecordSearchHistoryDelegate}">
      <incoming>Flow_CheckDuplicate_RecordHistory</incoming>
      <outgoing>Flow_RecordHistory_PersistDecision</outgoing>
    </serviceTask>
    <inclusiveGateway id="Gateway_PersistDecision" name="Co du lieu moi?" default="Flow_Persist_NoNewData">
      <incoming>Flow_RecordHistory_PersistDecision</incoming>
      <outgoing>Flow_Persist_NewCandidates</outgoing>
      <outgoing>Flow_Persist_NewPosts</outgoing>
      <outgoing>Flow_Persist_NoNewData</outgoing>
    </inclusiveGateway>
    <sequenceFlow id="Flow_Persist_NewCandidates" name="Co candidate moi" sourceRef="Gateway_PersistDecision" targetRef="KOC_UPSERT_CANDIDATE">
      <conditionExpression xsi:type="tFormalExpression">\${newCandidateCount &gt; 0}</conditionExpression>
    </sequenceFlow>
    <sequenceFlow id="Flow_Persist_NewPosts" name="Co post moi" sourceRef="Gateway_PersistDecision" targetRef="KOC_UPSERT_POST">
      <conditionExpression xsi:type="tFormalExpression">\${newPostCount &gt; 0}</conditionExpression>
    </sequenceFlow>
    <sequenceFlow id="Flow_Persist_NoNewData" name="Khong co du lieu moi" sourceRef="Gateway_PersistDecision" targetRef="KOC_NO_NEW_DATA" />
    <serviceTask id="KOC_UPSERT_CANDIDATE" name="Luu candidate moi" flowable:delegateExpression="\${kocUpsertCandidateDelegate}">
      <incoming>Flow_Persist_NewCandidates</incoming>
      <outgoing>Flow_UpsertCandidate_ReviewBatch</outgoing>
    </serviceTask>
    <serviceTask id="KOC_START_CANDIDATE_REVIEWS" name="Start candidate review jobs" flowable:delegateExpression="\${kocStartCandidateReviewsDelegate}">
      <incoming>Flow_UpsertCandidate_ReviewBatch</incoming>
      <outgoing>Flow_Candidate_PersistJoin</outgoing>
    </serviceTask>
    <serviceTask id="KOC_UPSERT_POST" name="Luu bai post moi" flowable:delegateExpression="\${kocUpsertPostDelegate}">
      <incoming>Flow_Persist_NewPosts</incoming>
      <outgoing>Flow_Post_PersistJoin</outgoing>
    </serviceTask>
    <serviceTask id="KOC_NO_NEW_DATA" name="Khong co candidate/post moi" flowable:delegateExpression="\${kocNoNewDataDelegate}">
      <incoming>Flow_Persist_NoNewData</incoming>
      <outgoing>Flow_NoNew_PersistJoin</outgoing>
    </serviceTask>
    <inclusiveGateway id="Gateway_PersistJoin" name="Da xu ly batch">
      <incoming>Flow_Candidate_PersistJoin</incoming>
      <incoming>Flow_Post_PersistJoin</incoming>
      <incoming>Flow_NoNew_PersistJoin</incoming>
      <outgoing>Flow_PersistJoin_UpdateStats</outgoing>
    </inclusiveGateway>
    <serviceTask id="KOC_UPDATE_BATCH_STATS" name="Update batch stats" flowable:delegateExpression="\${kocUpdateBatchStatsDelegate}">
      <incoming>Flow_UpdateRoundStats_UpdateBatchStats</incoming>
      <outgoing>Flow_UpdateStats_Demand</outgoing>
    </serviceTask>
    <endEvent id="EndEvent_Success" name="Search flow complete">
      <incoming>Flow_Demand_Complete</incoming>
    </endEvent>
    <sequenceFlow id="Flow_Start_LoadCampaign" sourceRef="StartEvent_1" targetRef="KOC_LOAD_CAMPAIGN" />
    <sequenceFlow id="Flow_LoadCampaign_Demand" sourceRef="KOC_LOAD_CAMPAIGN" targetRef="KOC_CALCULATE_SEARCH_DEMAND" />
    <sequenceFlow id="Flow_Demand_Decision" sourceRef="KOC_CALCULATE_SEARCH_DEMAND" targetRef="Gateway_DemandDecision" />
    <sequenceFlow id="Flow_BuildContext_CallAI" sourceRef="KOC_LOAD_SEARCH_ROUND_HISTORY" targetRef="CALL_AI_SEARCH_CANDIDATES" name="Load history - AI search" />
    <sequenceFlow id="Flow_CheckDuplicate_RecordHistory" sourceRef="KOC_CHECK_CANDIDATE_DUPLICATE" targetRef="KOC_RECORD_SEARCH_HISTORY" />
    <sequenceFlow id="Flow_RecordHistory_PersistDecision" sourceRef="KOC_RECORD_SEARCH_HISTORY" targetRef="Gateway_PersistDecision" />
    <sequenceFlow id="Flow_Candidate_PersistJoin" sourceRef="KOC_START_CANDIDATE_REVIEWS" targetRef="Gateway_PersistJoin" name="Review jobs started" />
    <sequenceFlow id="Flow_Post_PersistJoin" sourceRef="KOC_UPSERT_POST" targetRef="Gateway_PersistJoin" />
    <sequenceFlow id="Flow_NoNew_PersistJoin" sourceRef="KOC_NO_NEW_DATA" targetRef="Gateway_PersistJoin" />
    <sequenceFlow id="Flow_PersistJoin_UpdateStats" sourceRef="Gateway_PersistJoin" targetRef="KOC_UPDATE_SEARCH_ROUND_STATS" name="Update current search round" />
    <serviceTask id="KOC_UPDATE_SEARCH_ROUND_STATS" name="Update search round metrics" flowable:delegateExpression="\${kocUpdateSearchRoundStatsDelegate}">
      <incoming>Flow_PersistJoin_UpdateStats</incoming>
      <outgoing>Flow_UpdateRoundStats_UpdateBatchStats</outgoing>
    </serviceTask>
    <sequenceFlow id="Flow_UpdateRoundStats_UpdateBatchStats" sourceRef="KOC_UPDATE_SEARCH_ROUND_STATS" targetRef="KOC_UPDATE_BATCH_STATS" />
    <sequenceFlow id="Flow_UpdateStats_Demand" sourceRef="KOC_UPDATE_BATCH_STATS" targetRef="KOC_CALCULATE_SEARCH_DEMAND" name="Recalculate demand" />
    <sequenceFlow id="Flow_AI_Search_Completed" sourceRef="CALL_AI_SEARCH_CANDIDATES" targetRef="KOC_CHECK_CANDIDATE_DUPLICATE" name="AI completed" />
    <sequenceFlow id="Flow_UpsertCandidate_ReviewBatch" sourceRef="KOC_UPSERT_CANDIDATE" targetRef="KOC_START_CANDIDATE_REVIEWS" name="Start review jobs" />
  </process>
</definitions>`;

    const parsed = workflowGraphFromBpmnXml(rawXml);
    expect(parsed.issues).toEqual([]);
    expect(parsed.processId).toBe('koc_candidate_search_v9');
    expect(parsed.graph.nodes).toHaveLength(17);
    expect(parsed.graph.edges).toHaveLength(19);

    const callNode = parsed.graph.nodes.find((n) => n.id === 'CALL_AI_SEARCH_CANDIDATES') as BpmnWorkflowNode;
    expect(callNode).toMatchObject({
      type: 'CALL_ACTIVITY',
      attributes: {
        calledElement: 'ai_call_with_retry_v1',
        'flowable:inheritVariables': 'false',
      },
    });
    expect(callNode.extensionElementsXml).toContain('flowable:in');
    expect(callNode.extensionElementsXml).toContain('flowable:out');

    const serialized = workflowGraphToBpmnXml(parsed.graph, {
      processId: parsed.processId ?? undefined,
      processName: 'KOC Candidate Search V9 - Async Review + AI Evidence',
    });

    expect(serialized).toContain('flowable:delegateExpression="${kocLoadCampaignDelegate}"');
    expect(serialized).toContain('calledElement="ai_call_with_retry_v1"');
    expect(serialized).toContain('flowable:inheritVariables="false"');
    expect(serialized).toContain('flowable:in');
    expect(serialized).toContain('flowable:out');
    expect(serialized).toContain('sourceExpression="${candidateSearchAgent}"');
    expect(serialized).toContain('target="candidateSearchResult"');
    expect(serialized).toContain('<exclusiveGateway id="Gateway_DemandDecision" name="Can tim them?" default="Flow_Demand_Complete">');
    expect(serialized).toContain('<inclusiveGateway id="Gateway_PersistDecision" name="Co du lieu moi?" default="Flow_Persist_NoNewData">');
    expect(serialized).toContain('<conditionExpression xsi:type="tFormalExpression">${demandState == \'NEED_SEARCH\'}</conditionExpression>');
    expect(serialized).toContain('<conditionExpression xsi:type="tFormalExpression">${newCandidateCount &gt; 0}</conditionExpression>');
  });

  it('round-trips the KOC V9 AI retry subprocess event and task nodes', () => {
    const parsed = workflowGraphFromBpmnXml(`
      <definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL">
        <process id="ai_call_with_retry_v1" name="AI call with retry" isExecutable="true">
          <startEvent id="Start_AI">
            <outgoing>Flow_Start_Wait</outgoing>
          </startEvent>
          <eventBasedGateway id="Gateway_Wait_AI" name="Wait callback / timeout">
            <incoming>Flow_Start_Wait</incoming>
            <outgoing>Flow_Wait_Callback</outgoing>
          </eventBasedGateway>
          <intermediateCatchEvent id="Event_AI_Callback" name="AI callback">
            <incoming>Flow_Wait_Callback</incoming>
            <outgoing>Flow_Callback_Review</outgoing>
            <messageEventDefinition id="MessageEventDefinition_AI_Callback" messageRef="Message_AI_Callback" />
          </intermediateCatchEvent>
          <userTask id="UserTask_AI_Incident" name="Resolve AI incident">
            <incoming>Flow_Callback_Review</incoming>
            <outgoing>Flow_Incident_End</outgoing>
          </userTask>
          <endEvent id="End_AI">
            <incoming>Flow_Incident_End</incoming>
          </endEvent>
          <sequenceFlow id="Flow_Start_Wait" sourceRef="Start_AI" targetRef="Gateway_Wait_AI" />
          <sequenceFlow id="Flow_Wait_Callback" sourceRef="Gateway_Wait_AI" targetRef="Event_AI_Callback" />
          <sequenceFlow id="Flow_Callback_Review" sourceRef="Event_AI_Callback" targetRef="UserTask_AI_Incident" />
          <sequenceFlow id="Flow_Incident_End" sourceRef="UserTask_AI_Incident" targetRef="End_AI" />
        </process>
      </definitions>
    `);

    expect(parsed.issues).toEqual([]);
    expect(parsed.graph.nodes.map((node) => node.type)).toEqual([
      'START_EVENT',
      'EVENT_BASED_GATEWAY',
      'INTERMEDIATE_CATCH_EVENT',
      'USER_TASK',
      'END_EVENT',
    ]);
    expect(parsed.graph.nodes.find((node) => node.id === 'Event_AI_Callback')).toMatchObject({
      eventDefinitionsXml: '<messageEventDefinition id="MessageEventDefinition_AI_Callback" messageRef="Message_AI_Callback" />',
      incoming: ['Flow_Wait_Callback'],
      outgoing: ['Flow_Callback_Review'],
    });

    const xml = workflowGraphToBpmnXml(parsed.graph, { processId: parsed.processId ?? undefined });
    expect(xml).toContain('<eventBasedGateway id="Gateway_Wait_AI" name="Wait callback / timeout">');
    expect(xml).toContain('<intermediateCatchEvent id="Event_AI_Callback" name="AI callback">');
    expect(xml).toContain('<messageEventDefinition id="MessageEventDefinition_AI_Callback" messageRef="Message_AI_Callback" />');
    expect(xml).toContain('<userTask id="UserTask_AI_Incident" name="Resolve AI incident">');
  });

  it('compiles structured conditions for display while keeping editor source structured', () => {
    expect(workflowConditionToExpression({
      type: 'COMPOSITE',
      operator: 'OR',
      conditions: [
        {
          type: 'COMPARE',
          left: { path: 'input.score' },
          operator: 'GTE',
          right: { literal: 80 },
        },
        {
          type: 'COMPARE',
          left: { path: 'input.approved' },
          operator: 'EQ',
          right: { literal: true },
        },
      ],
    })).toBe('${(input.score >= 80 || input.approved == true)}');
  });
});

function sampleGraph(): WorkflowGraph {
  return {
    nodes: [
      { id: 'start', type: 'START_EVENT', name: 'Start' },
      { id: 'xor', type: 'EXCLUSIVE_GATEWAY', name: 'Score branch' },
      {
        id: 'service',
        type: 'SERVICE_TASK',
        name: 'Service review',
        config: {},
        inputMapping: {},
        outputMapping: {},
        retryPolicy: {},
        timeoutPolicy: {},
      },
      { id: 'end', type: 'END_EVENT', name: 'End' },
    ],
    edges: [
      { id: 'start-to-xor', source: 'start', target: 'xor', defaultFlow: false },
      {
        id: 'flow-pass',
        source: 'xor',
        target: 'service',
        name: 'Pass',
        condition: {
          type: 'COMPARE',
          left: { path: 'input.candidate.followers' },
          operator: 'GTE',
          right: { literal: 1000 },
        },
        defaultFlow: false,
      },
      { id: 'flow-default', source: 'xor', target: 'end', defaultFlow: true },
    ],
  };
}


function kocV9Fixture(): string {
  return `
    <definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:flowable="http://flowable.org/bpmn" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" targetNamespace="http://devtool.vn/workflow">
      <process id="koc_candidate_search_v9" name="KOC Candidate Search V9" isExecutable="true">
        <startEvent id="StartEvent_1" name="Start">
          <outgoing>Flow_Start_LoadCampaign</outgoing>
        </startEvent>
        <serviceTask id="KOC_LOAD_CAMPAIGN" name="Load campaign" flowable:delegateExpression="\${kocLoadCampaignDelegate}">
          <incoming>Flow_Start_LoadCampaign</incoming>
          <outgoing>Flow_LoadCampaign_Demand</outgoing>
        </serviceTask>
        <callActivity id="CALL_AI_SEARCH_CANDIDATES" name="AI search" calledElement="ai_call_with_retry_v1" flowable:inheritVariables="false">
          <extensionElements>
            <flowable:in target="agent" sourceExpression="\${candidateSearchAgent}" />
            <flowable:out source="aiOutput" target="candidateSearchResult" />
          </extensionElements>
          <incoming>Flow_LoadCampaign_Demand</incoming>
          <outgoing>Flow_AI_Search_Completed</outgoing>
        </callActivity>
        <inclusiveGateway id="Gateway_PersistDecision" name="Has new data?" default="Flow_Persist_NoNewData">
          <incoming>Flow_RecordHistory_PersistDecision</incoming>
          <outgoing>Flow_Persist_NewCandidates</outgoing>
          <outgoing>Flow_Persist_NoNewData</outgoing>
        </inclusiveGateway>
        <endEvent id="EndEvent_Success" name="Done">
          <incoming>Flow_Persist_NoNewData</incoming>
        </endEvent>
        <sequenceFlow id="Flow_Start_LoadCampaign" sourceRef="StartEvent_1" targetRef="KOC_LOAD_CAMPAIGN" />
        <sequenceFlow id="Flow_LoadCampaign_Demand" sourceRef="KOC_LOAD_CAMPAIGN" targetRef="CALL_AI_SEARCH_CANDIDATES" />
        <sequenceFlow id="Flow_AI_Search_Completed" sourceRef="CALL_AI_SEARCH_CANDIDATES" targetRef="Gateway_PersistDecision" />
        <sequenceFlow id="Flow_Persist_NewCandidates" sourceRef="Gateway_PersistDecision" targetRef="KOC_LOAD_CAMPAIGN">
          <conditionExpression xsi:type="tFormalExpression">\${newCandidateCount > 0}</conditionExpression>
        </sequenceFlow>
        <sequenceFlow id="Flow_Persist_NoNewData" sourceRef="Gateway_PersistDecision" targetRef="EndEvent_Success" />
      </process>
    </definitions>
  `;
}

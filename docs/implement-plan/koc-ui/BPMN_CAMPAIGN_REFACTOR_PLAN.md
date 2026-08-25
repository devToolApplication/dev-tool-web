# KOC Management BPMN Campaign Refactor Plan

## 1. Mục tiêu

Sau khi Workflow Studio đã chuyển sang mô hình BPMN, KOC Management cần được refactor để không còn tự đóng vai trò như một workflow designer thứ hai.

Boundary cần chốt:

```text
Campaign = business configuration + workflow reference
Workflow Studio = execution logic
Workflow Run = runtime source of truth
```

Campaign chỉ giữ các cấu hình nghiệp vụ cần thiết để chạy một chiến dịch. Toàn bộ execution logic như agent, provider, rule, threshold, retry, timeout, gateway và điều kiện chuyển nhánh phải thuộc BPMN Workflow.

Kiến trúc đích:

```text
┌──────────────────────────────┐
│        KOC Campaign          │
│                              │
│ name                         │
│ code                         │
│ description                  │
│ targetAccepted               │
│ discoveryInput               │
│ workflowDefinitionId         │
│ workflowVersionId            │
└──────────────┬───────────────┘
               │
               │ pin published version
               ▼
┌──────────────────────────────┐
│       BPMN Workflow          │
│                              │
│ Discovery                    │
│ MCP / HTTP                   │
│ Evidence Collection          │
│ Code Rules                   │
│ AI Evaluation                │
│ Gateway Conditions           │
│ Final Decision               │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│       Workflow Run           │
│                              │
│ node status                  │
│ evidence                     │
│ output                       │
│ error                        │
│ final outcome                │
└──────────────────────────────┘
```

---

## 2. Nguyên tắc bắt buộc

1. Campaign không được chứa execution logic của BPMN.
2. Campaign phải pin chính xác một published workflow version.
3. Không tự động nâng campaign cũ sang workflow version mới.
4. Candidate runtime phải lấy từ Workflow Run thật, không hard-code các bước KOC.
5. Workflow Studio là nguồn workflow duy nhất; không duy trì thêm KOC workflow builder riêng.
6. Save Draft và Ready/Start phải có validation khác nhau.
7. Campaign lifecycle và Workflow Run lifecycle phải độc lập.
8. UI KOC chỉ hiển thị business configuration và runtime/result phù hợp với vai trò operator.

---

# Phase 1 — Chuẩn hóa Campaign ↔ BPMN contract

## Mục tiêu

Tạo contract mới để Campaign tham chiếu BPMN Workflow thay vì lưu các cấu hình execution riêng.

## 1.1. Thay đổi Campaign model

Các field execution cũ cần đánh dấu deprecated và loại khỏi payload tạo mới:

```ts
// Legacy - không dùng cho campaign mới
interface LegacyKocCampaignExecutionConfig {
  discoveryExecution?: unknown;
  screeningExecution?: unknown;
  discoverySignals?: unknown[];
  searchStrategies?: unknown[];
  screeningRules?: unknown[];
}
```

Contract đích:

```ts
export interface KocCampaignWorkflowRef {
  workflowDefinitionId: string;
  workflowVersionId: string;
  workflowVersion: number;
  workflowName?: string;
}

export interface KocCampaignDiscoveryInput {
  keywords: string[];
  maximumCandidates?: number;
}

export interface KocCampaignDetail extends KocCampaignSummary {
  description?: string;

  workflow: KocCampaignWorkflowRef;

  discoveryInput: KocCampaignDiscoveryInput;

  maximumScreened?: number;

  version: number;

  topRejectionReasons?: KocRejectionReasonSummary[];
}
```

Payload tạo/sửa:

```ts
export interface KocCampaignUpsertPayload {
  name: string;
  code?: string;
  description?: string;

  targetAccepted: number;

  workflowDefinitionId: string;
  workflowVersionId: string;

  discoveryInput: {
    keywords: string[];
    maximumCandidates?: number;
  };

  maximumScreened?: number;
}
```

## 1.2. Pin workflow version

Campaign phải lưu cả:

```text
workflowDefinitionId
workflowVersionId
```

Không chỉ lưu `workflowDefinitionId`.

Ví dụ:

```text
Campaign A → Workflow KOC Screening → Published v4

Sau đó publish v5

Campaign A → vẫn chạy v4
Campaign B → có thể chọn v5
```

Không được tự nâng version cho campaign đang tồn tại.

## 1.3. Start validation

Pseudo code:

```ts
function validateStartCampaign(campaign: KocCampaignDetail): void {
  assertRequired(campaign.workflow.workflowDefinitionId);
  assertRequired(campaign.workflow.workflowVersionId);

  const workflowVersion = workflowService.getVersion(
    campaign.workflow.workflowDefinitionId,
    campaign.workflow.workflowVersionId,
  );

  assert(workflowVersion.status === 'PUBLISHED');
  assert(campaign.targetAccepted > 0);
  assert(campaign.discoveryInput.keywords.length > 0);
}
```

## 1.4. FE files chính

- `src/app/features/koc-management/model/koc-campaign.model.ts`
- `src/app/features/koc-management/model/koc-campaign-wizard.model.ts`
- `src/app/features/koc-management/services/koc-campaign-api.service.ts`
- campaign fixtures/specs liên quan

## 1.5. Acceptance Criteria

- [ ] Campaign lưu được `workflowDefinitionId`.
- [ ] Campaign lưu được `workflowVersionId`.
- [ ] Campaign mới không serialize `screeningRules`.
- [ ] Campaign mới không serialize `discoveryExecution`.
- [ ] Campaign mới không serialize agent/provider configuration.
- [ ] Publish workflow version mới không thay đổi workflow version của campaign cũ.

## 1.6. Tests

```ts
it('pins campaign to an exact published workflow version');
it('does not serialize agent configuration into campaign payload');
it('does not serialize screening rules');
it('does not silently move an existing campaign to a newer workflow version');
```

---

# Phase 2 — Thay Campaign Wizard bằng Campaign Form đơn giản

## Mục tiêu

Loại bỏ wizard 4 bước đang khiến màn tạo Campaign trở thành một workflow designer thứ hai.

Hiện tại:

```text
General
  ↓
Discovery
  ↓
Screening
  ↓
Review
```

Đích:

```text
Create / Edit Campaign
```

trên một page duy nhất.

## 2.1. Layout đề xuất

```text
Create Campaign

┌──────────────────────────────────────────────┐
│ Basic information                            │
│                                              │
│ Name             [ Summer Mom Campaign ]     │
│ Code             [ summer-mom-2026      ]    │
│ Description      [                       ]    │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│ Goal                                         │
│                                              │
│ Target accepted KOC         [ 30 ]            │
│ Candidate limit             [ 300 ]           │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│ Discovery input                              │
│                                              │
│ Keywords                                     │
│ [mẹ bỉm] [nuôi con] [review sữa] [+ Add]     │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│ Workflow                                     │
│                                              │
│ KOC Standard Screening                       │
│ Published v4                                 │
│                                              │
│ Discovery → Research → Screening → Decision  │
│                                              │
│ [Change workflow]          [View workflow]    │
└──────────────────────────────────────────────┘

▸ Advanced

                         [Save Draft]
                         [Create & Start]
```

## 2.2. Advanced section

Chỉ chứa business limits:

- `maximumCandidates`
- `maximumScreened`

Không được đưa các execution setting sau vào Campaign Form:

- agent
- provider
- retry
- timeout
- rule
- priority
- threshold
- evidenceKey
- gateway
- edge condition

## 2.3. Form draft mới

```ts
export interface KocCampaignFormDraft {
  name: string;
  code: string;
  description?: string;

  targetAccepted: number;

  discoveryKeywords: string[];
  maximumCandidates?: number;
  maximumScreened?: number;

  workflowDefinitionId: string;
  workflowVersionId: string;
}
```

## 2.4. Component structure

Ưu tiên rename rõ trách nhiệm:

```text
pages/
  campaign-form/
    campaign-form.component.ts
    campaign-form.component.html
    campaign-form.component.css
    campaign-form.component.spec.ts
```

Sau khi route đã chuyển hoàn toàn, xóa:

```text
pages/campaign-wizard/
```

Nếu cần migration ngắn hạn, có thể đổi implementation bên trong wizard trước rồi rename ở commit sau, nhưng trạng thái cuối phải là `campaign-form`.

## 2.5. Code generation

Ưu tiên backend generate code nếu user không nhập.

Nếu FE generate preview:

```ts
function generateCampaignCode(name: string): string {
  return slugify(name);
}
```

Không bắt user phải hiểu kỹ thuật naming để tạo campaign.

## 2.6. Save Draft vs Start

Save Draft chỉ validate tối thiểu:

```ts
function validateDraft(draft: KocCampaignFormDraft): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!draft.name.trim()) {
    errors.push({ field: 'name', code: 'required' });
  }

  return errors;
}
```

Start validate đầy đủ:

```ts
function validateExecutableCampaign(
  draft: KocCampaignFormDraft,
  workflowVersion: WorkflowVersion,
): ValidationError[] {
  requireField(draft.name);
  requirePositive(draft.targetAccepted);
  requireNonEmpty(draft.discoveryKeywords);
  requireField(draft.workflowDefinitionId);
  requireField(draft.workflowVersionId);

  assert(workflowVersion.status === 'PUBLISHED');
}
```

Nguyên tắc:

```text
Save Draft ≠ Ready To Run
```

## 2.7. Tests

```ts
it('creates campaign with minimum business configuration');
it('allows an incomplete campaign to be saved as draft');
it('blocks start when workflow is missing');
it('blocks start when workflow version is not published');
it('blocks start without discovery keywords');
it('does not expose agent/provider/rule configuration');
```

## 2.8. Acceptance Criteria

- [ ] Không còn stepper General/Discovery/Screening/Review.
- [ ] Campaign create/edit nằm trên một page.
- [ ] User không cần cấu hình agent/provider/rule.
- [ ] Save Draft cho phép campaign chưa đủ điều kiện chạy.
- [ ] Create & Start chỉ chạy nếu executable validation pass.
- [ ] Mobile/tablet layout không bị horizontal overflow.

---

# Phase 3 — Workflow Selector và hợp nhất Workflow Template

## Mục tiêu

Workflow Studio trở thành canonical workflow catalog. KOC Management không maintain workflow template engine riêng.

## 3.1. Dùng canonical Workflow API

Campaign Form lấy workflow từ Workflow Studio API, ví dụ:

```text
GET /workflows/page
```

Backend nên support filter:

```text
domain=KOC
status=ACTIVE
published=true
```

Nếu backend chưa support ngay, FE có thể filter tạm:

```ts
const eligibleWorkflows = workflows.filter(
  workflow =>
    workflow.status === 'ACTIVE' &&
    workflow.currentPublishedVersionId,
);
```

FE filtering chỉ là bước chuyển tiếp. Long-term filtering phải nằm ở API.

## 3.2. Workflow metadata

Đề xuất bổ sung metadata:

```ts
export interface WorkflowDefinition {
  // existing fields
  domain?: string;
  tags?: string[];
}
```

Ví dụ:

```json
{
  "domain": "KOC",
  "tags": ["candidate-screening", "production"]
}
```

## 3.3. Selector UX

Không dùng dropdown dài.

Selected state:

```text
Workflow

┌────────────────────────────────────┐
│ KOC Standard Screening             │
│ Published v4                       │
│                                    │
│ Candidate discovery and screening  │
│                                    │
│                     [Selected ✓]   │
└────────────────────────────────────┘

[Change]
```

`Change` mở drawer:

```text
Select Workflow

Search ___________________

● KOC Standard Screening
  Published v4

○ KOC Fast Screening
  Published v2

○ KOC Deep Research
  Published v7
```

## 3.4. View Workflow

Cho deep-link sang Workflow Studio.

Edit route hiện có thể dùng:

```text
/ai-agent-mcrs/workflows/{workflowId}/edit
```

Nhưng cần hỗ trợ readonly behavior cho user chỉ có quyền đọc.

Long-term nên có route read-only rõ ràng:

```text
/ai-agent-mcrs/workflows/{workflowId}
```

## 3.5. Loại bỏ KOC workflow template duplication

Sau migration xóa hoặc deprecate:

```text
pages/workflow-template-list/
KocWorkflowTemplateSummary
getWorkflowTemplates()
/koc/templates/workflows
```

Nếu Screening Template hiện cũng chỉ đại diện cho rule execution thì cần migrate logic đó vào Workflow/BPMN tương tự.

## 3.6. Tests

```ts
it('shows only eligible KOC workflows');
it('selects only a published workflow version');
it('pins the selected published version');
it('opens selected workflow in Workflow Studio');
it('does not use the legacy KOC workflow template endpoint');
```

## 3.7. Acceptance Criteria

- [ ] Campaign Form dùng Workflow Studio API.
- [ ] `workflowTemplateId` flow cũ được xóa hoặc migrate hoàn toàn.
- [ ] KOC không còn một workflow catalog riêng.
- [ ] User thấy chính xác published version đang chọn.
- [ ] Workflow version được pin khi save campaign.

---

# Phase 4 — Refactor Campaign Detail thành BPMN-centric

## Mục tiêu

Campaign Detail hiển thị business progress và workflow runtime, không hiển thị/edit rule configuration như trước.

## 4.1. Tabs

Hiện tại:

```text
Overview
Discovery
Candidates
Rules
Activity
```

Đổi thành:

```text
Overview
Candidates
Workflow
Discovery
Activity
```

## 4.2. Overview

Giữ business funnel:

- Discovered
- Unique
- Screened
- Rejected
- Review
- Accepted
- Waiting

Thêm Workflow Runtime summary:

```text
Workflow Runtime

Running        12
Waiting         3
Completed     180
Failed          2
```

Không gộp runtime status vào campaign lifecycle status.

## 4.3. Workflow tab

Thay tab `Rules`.

```text
Workflow

KOC Standard Screening
Published v4

Workflow definition
koc-standard-screening

Campaign pinned version
v4

Runs
238

Completed
218

Running
12

Waiting
6

Failed
2

[View Workflow]      [View Runs]
```

Có thể hiển thị mini-flow để người vận hành hiểu workflow, nhưng dữ liệu phải lấy từ BPMN definition.

Không hard-code:

```text
Start
 ↓
Discovery
 ↓
Basic Screening
 ↓
Evidence Research
 ↓
AI Evaluation
 ↓
Final Decision
```

Nếu BPMN thay đổi thì UI phải phản ánh BPMN mới.

## 4.4. Discovery tab

Giữ các business metric hữu ích:

- found
- new
- duplicate
- yield
- run count

Action `Run Strategy` hiện tại không nên gọi trực tiếp execution strategy nữa.

Nếu cần manual action, đổi abstraction thành:

```text
Run Discovery
```

Flow đúng:

```text
Campaign command
      ↓
BPMN workflow
      ↓
Discovery task
```

Không:

```text
UI
 ↓
run internal strategy directly
```

Nếu cần action chạy strategy thấp-level cho debug, chỉ expose trong Admin/Debug permission.

## 4.5. Tests

```ts
it('does not expose screening rule editor');
it('shows pinned workflow version');
it('shows workflow runtime statistics separately from campaign lifecycle');
it('deep-links to workflow definition');
it('deep-links to workflow runs');
```

## 4.6. Acceptance Criteria

- [ ] Tab Rules bị loại bỏ.
- [ ] Có Workflow tab.
- [ ] Workflow tab hiển thị đúng pinned version.
- [ ] Overview vẫn tập trung business funnel.
- [ ] Runtime statistics không làm thay đổi campaign lifecycle status.
- [ ] Normal operator không gọi trực tiếp internal discovery strategy.

---

# Phase 5 — Candidate Detail dùng Workflow Run thật

## Mục tiêu

Loại bỏ hard-coded timeline và sử dụng Workflow Run làm runtime source of truth.

## 5.1. Bỏ hard-coded timeline

Không dùng cấu hình dạng:

```ts
const workflowTimeline = [
  'discovery',
  'cheapFilter',
  'basicResearch',
  'rules',
  'engagementResearch',
  'finalize',
];
```

Candidate đã có `workflowRunId`, nên flow mới:

```text
GET candidate
      │
      ├── candidate details
      │
      ├── evidence
      │
      └── workflowRunId
                 │
                 ▼
        GET /workflows/runs/{runId}
```

## 5.2. Candidate Detail layout

```text
Nguyễn Văn A

ACCEPTED              COMPLETED

Summary
────────────────

Followers       32,123
Evidence         18
Decision         ACCEPTED
Reason           ...

Workflow execution
──────────────────────────

KOC Screening v4

✓ Search profile
✓ Follower validation
✓ Parent evidence
✓ Child evidence
● Engagement evaluation
○ Final decision

                     [Open BPMN Run]
```

## 5.3. Runtime mapping

Render trực tiếp từ runtime nodes:

```ts
workflowRun.nodes.map(node => ({
  id: node.nodeId,
  title: node.nodeName ?? node.nodeId,
  type: node.nodeType,
  status: node.executionStatus,
  outcome: node.outcome,
  reason: node.reason,
  errorCode: node.errorCode,
  errorMessage: node.errorMessage,
}));
```

Không map `nodeId` vào danh sách business step hard-code.

## 5.4. Node name

Preferred backend contract:

```ts
export interface WorkflowNodeExecution {
  nodeId: string;
  nodeName?: string;
  nodeType: WorkflowNodeType;
  executionStatus: WorkflowNodeExecutionStatus;
  // ...
}
```

Backend enrich `nodeName` từ workflow version để mọi client dùng được.

Fallback tạm thời nếu backend chưa bổ sung `nodeName`:

1. Load Workflow Run.
2. Lấy `workflowVersionId`.
3. Load workflow version.
4. Parse BPMN metadata và resolve node name.

Không duy trì map KOC node name trong FE.

## 5.5. Open BPMN Run

Deep-link:

```text
/ai-agent-mcrs/workflow-runs/{runId}
```

## 5.6. Loading/error behavior

Nếu candidate có `workflowRunId` nhưng runtime API lỗi:

- Candidate detail vẫn render.
- Workflow section hiển thị error state riêng.
- Có Retry action.
- Không biến toàn page thành error.

Nếu candidate legacy không có `workflowRunId`:

- Hiển thị `Legacy execution`/`Runtime information unavailable`.
- Không dựng timeline giả.

## 5.7. Tests

```ts
it('renders execution nodes from workflow run');
it('does not use hard-coded KOC workflow stages');
it('opens workflow run detail from workflowRunId');
it('keeps candidate detail usable when workflow run API fails');
it('shows legacy fallback when workflowRunId is missing');
```

## 5.8. Acceptance Criteria

- [ ] Candidate timeline được sinh từ Workflow Run.
- [ ] Không tồn tại hard-coded six-step KOC timeline.
- [ ] Node status phản ánh runtime thật.
- [ ] Có link mở Workflow Run.
- [ ] Runtime API error không phá Candidate Detail.

---

# Phase 6 — Lifecycle, Permission và Legacy Cleanup

## Mục tiêu

Chốt boundary kiến trúc, quyền truy cập và loại bỏ code legacy sau khi contract/UI mới ổn định.

## 6.1. Campaign lifecycle

Campaign lifecycle chỉ phản ánh campaign business state:

```text
DRAFT
READY
RUNNING
PAUSED
COMPLETED
STOPPED
```

Cần review lại `BLOCKED`.

Nếu `BLOCKED` hiện chỉ mang nghĩa một hoặc nhiều Workflow Run lỗi thì không nên dùng làm Campaign status.

Ví dụ UI:

```text
Campaign        RUNNING

Runtime
Running         12
Waiting          3
Error            2
```

Campaign vẫn `RUNNING` khi một vài candidate workflow bị lỗi.

## 6.2. Permission split

Không dùng `AI_AGENT_WORKFLOW_WRITE` để tạo/edit Campaign.

Đề xuất:

```text
KOC_CAMPAIGN_READ
KOC_CAMPAIGN_WRITE
KOC_CAMPAIGN_START
KOC_CAMPAIGN_STOP
```

Workflow giữ:

```text
AI_AGENT_WORKFLOW_READ
AI_AGENT_WORKFLOW_WRITE
AI_AGENT_WORKFLOW_PUBLISH
```

Permission matrix:

| Action | Campaign permission | Workflow permission |
| --- | --- | --- |
| Xem campaign | KOC_CAMPAIGN_READ | Không |
| Tạo/sửa campaign | KOC_CAMPAIGN_WRITE | AI_AGENT_WORKFLOW_READ |
| Chọn workflow | KOC_CAMPAIGN_WRITE | AI_AGENT_WORKFLOW_READ |
| Start campaign | KOC_CAMPAIGN_START | Không |
| Stop campaign | KOC_CAMPAIGN_STOP | Không |
| Xem BPMN | Không | AI_AGENT_WORKFLOW_READ |
| Edit BPMN | Không | AI_AGENT_WORKFLOW_WRITE |
| Publish BPMN | Không | AI_AGENT_WORKFLOW_PUBLISH |

## 6.3. Legacy migration

Nếu đã có campaign production lưu config cũ:

```text
Legacy Campaign
   │
   ├── discoveryExecution
   ├── searchStrategies
   └── screeningRules
            │
            ▼
generate BPMN workflow
            │
            ▼
publish workflow version
            │
            ▼
campaign.workflowDefinitionId
campaign.workflowVersionId
```

Sau migration, legacy fields được đánh dấu deprecated.

Backend có thể duy trì compatibility tạm thời:

```ts
if (campaign.workflowVersionId) {
  runBpmnCampaign();
} else {
  runLegacyCampaign();
}
```

Nhưng FE mới tuyệt đối không được tạo legacy campaign nữa.

Sau khi verify migration:

```text
remove legacy execution path
remove legacy fields
remove legacy KOC workflow APIs
remove legacy rule builder UI
```

## 6.4. Cleanup candidates

Review và xóa/deprecate các phần sau nếu không còn reference:

- `campaign-wizard/*`
- legacy wizard model/helpers
- KOC-specific workflow template list
- KOC-specific screening rule editor
- legacy workflow template service methods
- hard-coded candidate workflow timeline
- old campaign rule tab
- dead `workflowTemplateId` query-param behavior

## 6.5. Tests

```ts
it('uses campaign permissions instead of workflow write permission');
it('keeps campaign lifecycle independent from candidate workflow failures');
it('does not create legacy campaign payloads');
it('contains no active route to the legacy KOC workflow template flow');
```

## 6.6. Acceptance Criteria

- [ ] Campaign permission không phụ thuộc Workflow Write.
- [ ] Workflow permissions vẫn độc lập.
- [ ] Campaign lifecycle không bị đồng nhất với Workflow Run status.
- [ ] Legacy execution path có migration/deprecation rõ ràng.
- [ ] Không còn dead route hoặc dead query param liên quan workflow template cũ.

---

# 3. Danh sách file FE dự kiến ảnh hưởng

| Khu vực | File/Folder | Action |
| --- | --- | --- |
| Campaign contract | `src/app/features/koc-management/model/koc-campaign.model.ts` | Refactor |
| Campaign draft | `src/app/features/koc-management/model/koc-campaign-wizard.model.ts` | Replace/Remove |
| Campaign create/edit | `src/app/features/koc-management/pages/campaign-wizard/*` | Replace with campaign-form |
| Campaign form | `src/app/features/koc-management/pages/campaign-form/*` | Create |
| Campaign API | `src/app/features/koc-management/services/koc-campaign-api.service.ts` | Refactor payload/runtime calls |
| KOC Workflow API | `src/app/features/koc-management/services/koc-workflow-api.service.ts` | Deprecate duplicate workflow calls |
| Workflow templates | `src/app/features/koc-management/pages/workflow-template-list/*` | Remove after migration |
| Campaign Detail | `src/app/features/koc-management/pages/campaign-detail/*` | Refactor tabs/runtime |
| Candidate Detail | `src/app/features/koc-management/pages/candidate-detail/*` | Use Workflow Run |
| KOC routes | `src/app/features/koc-management/koc-management.routes.ts` | Refactor routes/permissions |
| KOC module/imports | KOC feature imports | Cleanup |
| Workflow API | `src/app/features/workflow-studio/api/workflow-api.service.ts` | Reuse/extend |
| Workflow models | `src/app/features/workflow-studio/model/workflow-studio.model.ts` | Add metadata/runtime fields if needed |

---

# 4. Backend/API changes cần phối hợp

FE không nên workaround lâu dài các contract thiếu ở backend.

Backend cần support tối thiểu:

## Campaign

- `workflowDefinitionId`
- `workflowVersionId`
- discovery business input
- create/save draft
- executable validation trước start

## Workflow query

Nên có filter:

```text
domain=KOC
status=ACTIVE
published=true
```

## Workflow Run

Nên trả thêm:

```ts
nodeName?: string;
```

trong `WorkflowNodeExecution`.

## Runtime aggregate

Campaign Detail sẽ tốt hơn nếu backend cung cấp aggregate thay vì FE tự load hàng trăm run:

```ts
interface CampaignWorkflowRuntimeSummary {
  total: number;
  running: number;
  waiting: number;
  completed: number;
  failed: number;
}
```

Không query toàn bộ Workflow Run rồi aggregate ở browser.

---

# 5. Thứ tự triển khai

## P0 — Bắt buộc trước khi tiếp tục mở rộng KOC

1. Phase 1 — Campaign ↔ Workflow contract.
2. Phase 2 — Campaign Form đơn giản.
3. Phase 5 — Candidate Detail dùng Workflow Run thật.

Lý do: đây là ba điểm đang vi phạm boundary BPMN rõ nhất.

## P1 — Hoàn thiện kiến trúc UI

4. Phase 3 — Workflow selector + bỏ KOC workflow template duplication.
5. Phase 4 — Campaign Detail BPMN-centric.
6. Fix Save Draft/Start validation hoàn chỉnh.

## P2 — Cleanup/production hardening

7. Phase 6 — Permission split.
8. Legacy migration.
9. Xóa code/routes/models cũ.
10. Runtime deep-link và error states.

---

# 6. Quy tắc triển khai cho AI/dev

Mỗi phase phải làm độc lập đủ để test và review.

Không được refactor toàn bộ KOC feature trong một commit lớn.

Mỗi phase cần:

1. Đọc implementation hiện tại của file được sửa.
2. Liệt kê exact files sẽ thay đổi trước khi code.
3. Không sửa ngoài scope nếu không cần thiết.
4. Không tạo thêm abstraction chỉ để chuẩn bị cho tương lai.
5. Không copy Workflow Studio logic vào KOC Management.
6. Reuse Workflow Studio models/services khi responsibility phù hợp.
7. Không hard-code BPMN node IDs/names vào KOC UI.
8. Không đặt execution config vào Campaign model mới.
9. Update unit tests cùng phase.
10. Build/test feature trước khi đánh dấu phase hoàn thành.

---

# 7. Definition of Done tổng thể

Refactor hoàn thành khi người tạo Campaign chỉ cần hiểu:

```text
Tôi muốn tìm ai?
Tôi cần bao nhiêu KOC?
Dùng workflow nghiệp vụ nào?
```

Người tạo Campaign không cần cấu hình:

```text
AI agent nào
provider nào
rule priority bao nhiêu
evidenceKey gì
threshold nào
gateway chạy ra sao
retry mấy lần
timeout bao lâu
```

Các cấu hình này thuộc Workflow Studio/BPMN.

Technical DoD:

- [ ] Campaign pin exact published workflow version.
- [ ] Create Campaign không còn wizard execution configuration.
- [ ] Campaign payload không chứa agent/provider/rule execution config.
- [ ] Workflow Studio là canonical workflow source.
- [ ] Candidate Detail render Workflow Run thật.
- [ ] Campaign Detail có Workflow tab thay Rules tab.
- [ ] Campaign lifecycle độc lập runtime status.
- [ ] Campaign permissions độc lập workflow editing permissions.
- [ ] Legacy KOC workflow/template/rule UI được migrate và loại bỏ.
- [ ] Không còn hard-coded KOC workflow timeline.
- [ ] Unit tests cover pinning, draft/start validation và runtime rendering.

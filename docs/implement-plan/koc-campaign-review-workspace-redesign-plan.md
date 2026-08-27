# KOC Campaign Review Workspace - Redesign Implementation Plan

## 1. Mục tiêu

Thiết kế lại toàn bộ chức năng quản lý và phê duyệt KOC theo hướng **Campaign Review Workspace**, không phụ thuộc UI/logic màn hình cũ.

Mục tiêu nghiệp vụ:

1. Sau khi cấu hình/start campaign, user đi thẳng vào khu vực theo dõi kết quả tìm KOC.
2. User xem được campaign đã tìm thấy những candidate nào.
3. Phân biệt rõ:
   - AI/Workflow evaluation
   - Human final decision
4. User xem được:
   - Profile candidate
   - Link profile
   - Danh sách bài post
   - Danh sách evidence
   - AI recommendation / confidence / criteria result
   - Human approval/rejection
   - Reviewer
   - Review time
   - Review reason/note
5. User có thể review liên tục nhiều candidate mà không phải chuyển qua nhiều page.
6. Review Queue chỉ là cross-campaign inbox, không phải entity/UI trung tâm.

## Non-goals

Không làm các việc sau:

- Không giữ backward compatibility cho màn KOC approval cũ.
- Không tạo legacy route redirect.
- Không viết adapter map model cũ sang model mới.
- Không duy trì hai bộ service API song song.
- Không giữ Review Detail/Candidate Detail cũ để fallback.
- Không ưu tiên giảm diff; ưu tiên domain mới sạch và dễ maintain.

---

# 2. Kiến trúc UX mới

## 2.1. Create Campaign cũng được redesign hoàn toàn

Màn tạo campaign cũ không được giữ lại logic wizard `General -> Discovery -> Screening -> Review`.

Không expose các cấu hình kỹ thuật như:

```text
agent
provider
discovery signal weight
search strategy
maxQueries
AI/CODE rule
conditionKey
evidenceKey
whenEvidenceMatches
whenEvidenceMissing
lookbackDays
```

Màn Create Campaign mới chỉ mô tả **WHAT user muốn tìm**.

Workflow/BPMN chịu trách nhiệm **HOW hệ thống tìm và đánh giá**.

Flow mới:

```text
Step 1: Campaign
Step 2: Search Requirements
Step 3: Review & Start
```

Không có audience ratio 60/40 hoặc phân bổ nhóm cứng.

---

## 2.2. Step 1 - Campaign

Mục tiêu: nhập thông tin campaign và quota business.

Fields:

```text
Campaign name *
Description

Target approved KOCs *
Maximum candidates to find *
```

Không yêu cầu user nhập campaign code.

Backend có thể tự sinh code/id.

Data model:

```ts
interface CampaignGoal {
  targetApproved: number;
  candidateLimit: number;
}
```

UI gợi ý:

```text
Create Campaign

Campaign name
[ Back to School - Parent KOC ]

Description
[ Tìm KOC phù hợp cho chiến dịch... ]

Target approved KOCs
[ 100 ]

Maximum candidates to find
[ 300 ]

[Cancel]                         [Continue]
```

---

## 2.3. Step 2 - Search Requirements

Đây là phần cấu hình quan trọng nhất.

Thiết kế theo hai lớp:

```text
Structured Search Scope
+
Flexible AI Requirements
```

### Structured Search Scope

Chỉ giữ các filter deterministic, rõ nghĩa và không cần AI suy luận:

```text
Platforms
Followers
Location
Language
Recent activity
```

Ví dụ:

```text
Platforms
[Facebook] [TikTok]

Followers
Min: 5,000
Max: 200,000

Location
Vietnam

Language
Vietnamese

Recent activity
Last 90 days
```

Structured filter có thể optional tùy campaign.

### AI Search Instructions

Có một textarea để user mô tả tổng thể đối tượng cần tìm:

```text
What kind of KOC are you looking for?

[ Tìm các phụ huynh có con từ 3-6 tuổi,
  thường xuyên chia sẻ nội dung về giáo dục,
  chăm sóc trẻ hoặc đời sống gia đình.
  Không ưu tiên tài khoản bán hàng thuần túy. ]
```

Model:

```ts
interface CampaignSearchConfig {
  instructions?: string;
  scope: CampaignSearchScope;
  requirements: CampaignRequirement[];
}
```

### Flexible AI Requirements

Không hard-code enum kiểu:

```text
PARENT
SELLER
CHILD_AGE
CONTENT_TOPIC
```

Requirement là cấu hình generic:

```ts
interface CampaignRequirement {
  id: string;

  title: string;
  description: string;

  importance:
    | 'REQUIRED'
    | 'PREFERRED';

  minimumConfidence?: number;
  minimumEvidence?: number;
}
```

Ví dụ:

```text
Requirement 1

Title
Phụ huynh có con nhỏ

Description
Ứng viên là bố/mẹ có con từ 3-6 tuổi.

Importance
Required

Minimum confidence
80%

Minimum evidence
2
```

Requirement khác:

```text
Title
Nội dung giáo dục

Description
Ứng viên thường xuyên có bài viết liên quan
đến giáo dục, trường học hoặc phát triển trẻ nhỏ.

Importance
Required
```

Requirement khác:

```text
Title
Không phải seller thuần túy

Description
Trang cá nhân không chủ yếu dùng để bán hàng
hoặc quảng cáo sản phẩm liên tục.

Importance
Preferred
```

UI:

```text
AI Requirements

1. Phụ huynh có con 3-6 tuổi
   REQUIRED
   confidence >= 80%
   evidence >= 2

2. Có nội dung giáo dục / trẻ em
   REQUIRED
   confidence >= 70%

3. Không phải seller thuần túy
   PREFERRED
   confidence >= 70%

[+ Add requirement]
```

Không có ratio 6/4, 60/40 hoặc target distribution.

---

## 2.4. AI Requirement Evaluation

Input requirement flexible nhưng output AI phải structured.

Model:

```ts
interface RequirementEvaluation {
  requirementId: string;

  result:
    | 'PASS'
    | 'FAIL'
    | 'UNKNOWN';

  confidence: number;

  summary: string;

  evidenceIds: string[];
}
```

Ví dụ:

```json
{
  "requirementId": "parent-young-child",
  "result": "PASS",
  "confidence": 0.91,
  "summary": "Candidate repeatedly mentions her 5-year-old daughter.",
  "evidenceIds": [
    "ev-101",
    "ev-107"
  ]
}
```

Flow:

```text
Campaign Requirement
        ↓
AI searches / inspects candidate
        ↓
Collect profile + posts
        ↓
Collect evidence
        ↓
Evaluate requirement
        ↓
PASS / FAIL / UNKNOWN
        ↓
confidence + summary + evidenceIds
```

Cùng một `requirementId` phải được dùng xuyên suốt:

```text
Campaign Config
      ↓
AI Evaluation
      ↓
Evidence
      ↓
Candidate Review Workspace
      ↓
Human Approval
```

Không tạo một bộ criteria riêng cho review.

---

## 2.5. Step 3 - Review & Start

Bước cuối chỉ hiển thị business summary.

Ví dụ:

```text
Review Campaign

Back to School - Parent KOC

Goal
100 approved KOCs

Candidate limit
300

Search Scope
Facebook
TikTok
Vietnam
Vietnamese

AI Search Instructions
Tìm các phụ huynh có con từ 3-6 tuổi...

Requirements
✓ Phụ huynh có con 3-6 tuổi
✓ Nội dung giáo dục / trẻ em
✓ Không phải seller thuần túy

Workflow
KOC Search & Evaluation

[Back]

[Save Draft]                 [Start Campaign]
```

Không show:

```text
agent
provider
conditionKey
evidenceKey
retry
timeout
node
gateway
```

Sau khi Start:

```text
POST /koc/campaigns/{campaignId}/start
```

Navigate:

```text
/koc/campaigns/:campaignId/review
```

---

## 2.6. Campaign domain mới

Campaign model:

```ts
interface KocCampaign {
  id: string;

  name: string;
  description?: string;

  status:
    | 'DRAFT'
    | 'RUNNING'
    | 'PAUSED'
    | 'COMPLETED'
    | 'STOPPED';

  goal: CampaignGoal;

  search: CampaignSearchConfig;

  workflow: CampaignWorkflowRef;

  createdAt?: string;
  updatedAt?: string;
}
```

Search scope:

```ts
interface CampaignSearchScope {
  platforms?: string[];

  minFollowers?: number;
  maxFollowers?: number;

  locations?: string[];
  languages?: string[];

  recentActivityDays?: number;
}
```

Workflow reference:

```ts
interface CampaignWorkflowRef {
  workflowTemplateId: string;
  workflowVersion?: number;
}
```

Campaign không chứa technical workflow config chi tiết.

---

## 2.7. Create Campaign API

Create/update payload:

```http
POST /koc/campaigns
PUT /koc/campaigns/{campaignId}
```

Example:

```json
{
  "name": "Back to School",
  "description": "Tìm KOC phụ huynh",
  "goal": {
    "targetApproved": 100,
    "candidateLimit": 300
  },
  "search": {
    "instructions": "Tìm phụ huynh có con từ 3-6 tuổi...",
    "scope": {
      "platforms": ["FACEBOOK", "TIKTOK"],
      "minFollowers": 5000,
      "maxFollowers": 200000,
      "locations": ["VN"],
      "languages": ["vi"],
      "recentActivityDays": 90
    },
    "requirements": [
      {
        "id": "parent-young-child",
        "title": "Phụ huynh có con nhỏ",
        "description": "Ứng viên là bố/mẹ có con từ 3-6 tuổi.",
        "importance": "REQUIRED",
        "minimumConfidence": 0.8,
        "minimumEvidence": 2
      }
    ]
  },
  "workflow": {
    "workflowTemplateId": "koc-search-evaluation-v1"
  }
}
```

Start:

```http
POST /koc/campaigns/{campaignId}/start
```

---

## 2.8. Workflow responsibility

Campaign cung cấp:

```text
goal
search scope
search instructions
AI requirements
```

BPMN/workflow chịu trách nhiệm:

```text
Find candidate
↓
Upsert candidate
↓
Check duplicate
↓
Collect profile
↓
Collect posts
↓
Generate evidence
↓
Evaluate requirements
↓
Generate AI recommendation
↓
Ready for human review
```

Thay đổi BPMN không được yêu cầu sửa Create Campaign UI nếu domain campaign không đổi.

---

## 2.9. Frontend structure cho Create Campaign

Xóa `campaign-wizard` cũ và tạo mới:

```text
pages/
  campaign-create/
  campaign-edit/

components/
  campaign-basic-form/
  campaign-goal-form/
  campaign-search-scope/
  campaign-search-instructions/
  campaign-requirement-list/
  campaign-requirement-editor/
  campaign-workflow-selector/
  campaign-review-summary/

stores/
  campaign-editor.store.ts
```

Model:

```text
campaign.model.ts
campaign-goal.model.ts
campaign-search.model.ts
campaign-requirement.model.ts
campaign-workflow.model.ts
```

Không reuse `koc-campaign-wizard.model.ts`.

Không tạo mapper từ wizard model cũ sang model mới.

---

Giảm toàn bộ luồng business xuống còn 3 màn chính:

```text
Campaign List
    ↓
Campaign Review Workspace
    ├── Campaign overview
    ├── Candidate result list
    └── Candidate review detail

Global Review Inbox
    ↓
Reuse Candidate Review Detail
```

Bỏ toàn bộ màn business cũ và code mới theo kiến trúc mới:

```text
Campaign List
Campaign Review Workspace
Global Review Inbox
```

Không giữ `Campaign Detail`, `Campaign Wizard`, `Candidate List`, `Candidate Detail`, `Review Queue`, `Review Detail` để tương thích ngược.
Không tạo adapter, wrapper, redirect hoặc bridge cho logic UI cũ.

Các màn kỹ thuật/debug workflow nếu thực sự cần sẽ tách riêng khỏi business KOC review.

---

# 3. Route đề xuất

```text
/ai-agent-mcrs/koc/campaigns

/ai-agent-mcrs/koc/campaigns/create

/ai-agent-mcrs/koc/campaigns/:campaignId/edit

/ai-agent-mcrs/koc/campaigns/:campaignId/review

/ai-agent-mcrs/koc/review
```

Deep-link chính thức:

```text
/ai-agent-mcrs/koc/campaigns/:campaignId/review/:candidateId
```

Sau khi start campaign:

```ts
router.navigate([
  '/ai-agent-mcrs/koc/campaigns',
  campaignId,
  'review'
]);
```

Đây là navigation chuẩn duy nhất sau khi start campaign.

---

# 4. Campaign Review Workspace

## 4.1 Header

Hiển thị:

- Campaign name
- Campaign status
- Approved target
- Found candidates
- Evaluated candidates
- Pending review
- Approved
- Rejected
- Progress %

Actions:

```text
[Campaign Settings]
[Pause / Resume]
[Refresh]
```

## 4.2 Summary cards

```text
Found
AI Evaluated
Need Review
Approved
Rejected
```

Click card -> filter candidate list.

## 4.3 Filter

```text
Search candidate

Platform
AI Recommendation
Human Review Status
Confidence
Follower range
Evidence availability
```

Recommended quick filters:

```text
All
Need Review
AI Recommend Approve
AI Recommend Reject
Approved
Rejected
```

## 4.4 Candidate list

Column/card information:

```text
Candidate
Platform
Followers
AI Recommendation
AI Confidence
Evidence Count
Human Decision
Reviewer
Reviewed At
Action
```

Không hiển thị workflow/node/execution technical field ở list business.

---

# 5. Master-detail review layout

Desktop sử dụng master-detail:

```text
┌─────────────────────────┬─────────────────────────────────────────┐
│ Candidate List          │ Candidate Review Detail                 │
│                         │                                         │
│ Candidate A             │ Profile                                 │
│ Candidate B             │ AI Assessment                           │
│ Candidate C             │ Posts / Evidence / History              │
│ ...                     │                                         │
│                         │                         Reject Approve   │
└─────────────────────────┴─────────────────────────────────────────┘
```

Mobile/tablet có thể chuyển detail sang full page / drawer.

## Yêu cầu UX

Sau khi approve/reject:

```text
save decision
↓
update current item status
↓
select next pending candidate
```

Không bắt user quay lại list.

---

# 6. Candidate Review Detail

Chia thành các section chính:

```text
Profile
AI Assessment
Posts
Evidence
Review History
Human Decision
```

---

# 7. Candidate Profile

Hiển thị:

```text
Display name
Platform
Profile URL
Avatar nếu có
Followers
Following
Total posts scanned
Source
Found by agent
Found at
```

Action:

```text
[Open Profile]
```

Không bắt buộc hiển thị workflowRunId ở business view.

Technical details có thể nằm trong collapsible:

```text
Technical Details
```

---

# 8. AI Assessment

Không dùng một field `reason` duy nhất.

Cấu trúc hiển thị:

```text
AI Recommendation
APPROVE / REJECT / NEED_REVIEW

Confidence
89%

Summary
...

Criteria Evaluation

Parent / Child relationship
PASS
96%

Child age
PASS
82%

Seller activity
FAIL
72%

Follower rule
PASS
100%
```

Mỗi criterion phải link được về evidence liên quan.

---

# 9. Posts

Posts là first-class business object.

Mỗi post hiển thị:

```text
Platform
Published at
Content excerpt
Metrics
Evidence detected
Original URL
```

Ví dụ:

```text
Facebook
24/08/2026

"Bé nhà mình chuẩn bị vào lớp 1..."

Likes: 1.2K
Comments: 83
Shares: 12

Evidence:
- Parent relationship
- Child grade

[Open Original]
```

## Sorting

Default:

```text
Most relevant evidence first
```

Optional:

```text
Newest
Oldest
Most engagement
```

---

# 10. Evidence

Không hiển thị evidence thành flat list.

Group theo campaign criterion:

```text
Parent / Child Relationship
  PASS

  Evidence A
  Evidence B

Child Age
  PASS

  Evidence C

Seller Activity
  FAIL

  Evidence D
```

Mỗi evidence:

```text
excerpt
source type
source URL
source post
observedAt
AI agent/provider nếu cần technical view
```

Click evidence từ criterion phải scroll/open đúng evidence.

---

# 11. Human Review

Phải tách hoàn toàn với AI recommendation.

## State

```ts
type HumanReviewStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED';
```

## Approve

Approve note là optional.

Dialog:

```text
Approve candidate?

Note
[ optional ]

Cancel
Approve
```

## Reject

Reject reason bắt buộc.

```text
Reject candidate?

Reason
[ dropdown ]

Note
[ optional ]

Cancel
Reject
```

Recommended reject reason codes:

```text
WRONG_AUDIENCE
INSUFFICIENT_EVIDENCE
SELLER_HEAVY_CONTENT
LOW_CONTENT_QUALITY
SUSPICIOUS_PROFILE
DUPLICATE
OTHER
```

Nếu `OTHER` -> note bắt buộc.

## Security

Frontend KHÔNG gửi `reviewedBy`.

Backend phải lấy reviewer từ authenticated principal / access token.

---

# 12. Review History / Audit

Hiển thị timeline:

```text
27/08 14:10
AI evaluated candidate
Recommendation: APPROVE 89%

27/08 14:18
lamld APPROVED candidate

27/08 14:20
Campaign aggregate updated
```

History phải support future re-review.

---

# 13. Bulk Review

Candidate list hỗ trợ checkbox.

Actions:

```text
Approve Selected
Reject Selected
```

## Guard

Khi bulk approve:

```text
Selected: 10
AI approve: 8
AI reject: 1
Need review: 1
```

Nếu có candidate trái AI recommendation -> show warning.

Không silently approve.

Reject bulk bắt buộc chọn reason.

---

# 14. Domain model mới

## 14.1 CampaignCandidate

```ts
export interface CampaignCandidate {
  id: string;
  campaignId: string;

  profile: CandidateProfile;

  state:
    | 'DISCOVERED'
    | 'EVALUATING'
    | 'READY_FOR_REVIEW'
    | 'APPROVED'
    | 'REJECTED';

  aiEvaluation?: CandidateAiEvaluation;

  humanReview?: CandidateHumanReview;

  postsCount: number;
  evidenceCount: number;

  foundAt?: string;
  updatedAt?: string;
}
```

---

## 14.2 CandidateProfile

```ts
export interface CandidateProfile {
  displayName: string;
  platform: string;

  profileUrl?: string;
  avatarUrl?: string;

  followers?: number;
  following?: number;

  source?: string;
}
```

---

## 14.3 CandidateAiEvaluation

```ts
export interface CandidateAiEvaluation {
  recommendation:
    | 'APPROVE'
    | 'REJECT'
    | 'NEED_REVIEW';

  confidence?: number;

  summary?: string;

  criteria: CandidateCriterionEvaluation[];

  evaluatedAt?: string;

  agentCode?: string;
}
```

---

## 14.4 CandidateCriterionEvaluation

```ts
export interface CandidateCriterionEvaluation {
  criterionId: string;

  name: string;

  result:
    | 'PASS'
    | 'FAIL'
    | 'UNKNOWN';

  confidence?: number;

  reason?: string;

  evidenceIds: string[];
}
```

---

## 14.5 CandidateHumanReview

```ts
export interface CandidateHumanReview {
  status:
    | 'PENDING'
    | 'APPROVED'
    | 'REJECTED';

  reasonCode?: string;

  note?: string;

  reviewer?: {
    userId: string;
    displayName: string;
  };

  reviewedAt?: string;
}
```

---

## 14.6 CandidatePost

```ts
export interface CandidatePost {
  id: string;

  platform: string;

  url: string;

  content?: string;

  publishedAt?: string;

  metrics?: {
    likes?: number;
    comments?: number;
    shares?: number;
    views?: number;
  };

  evidenceIds: string[];
}
```

---

## 14.7 CandidateEvidence

```ts
export interface CandidateEvidence {
  id: string;

  criterionId: string;

  type: string;

  excerpt?: string;

  sourceUrl?: string;

  sourcePostId?: string;

  observedAt?: string;
}
```

---

# 15. API Contract

## 15.1 Campaign candidate page

```http
GET /koc/campaigns/{campaignId}/candidates
```

Query:

```text
page
size
search
state
aiRecommendation
humanReviewStatus
platform
minConfidence
maxConfidence
minFollowers
maxFollowers
sort
```

Response:

```json
{
  "content": [],
  "page": 0,
  "size": 20,
  "totalElements": 0
}
```

---

## 15.2 Review context

Preferred endpoint:

```http
GET /koc/campaigns/{campaignId}/candidates/{candidateId}/review-context
```

Response:

```json
{
  "candidate": {},
  "aiEvaluation": {},
  "posts": [],
  "evidence": [],
  "humanReview": {},
  "history": []
}
```

Mục tiêu:

- tránh frontend gọi 4-5 endpoint
- đảm bảo snapshot nhất quán
- giảm orchestration trong Angular component

---

## 15.3 Submit decision

```http
POST /koc/campaigns/{campaignId}/candidates/{candidateId}/review
```

Approve:

```json
{
  "decision": "APPROVED",
  "note": "Optional"
}
```

Reject:

```json
{
  "decision": "REJECTED",
  "reasonCode": "WRONG_AUDIENCE",
  "note": "..."
}
```

Backend tự thêm:

```text
reviewedBy
reviewedAt
```

---

## 15.4 Bulk decision

```http
POST /koc/campaigns/{campaignId}/candidates/review-bulk
```

Example:

```json
{
  "candidateIds": ["1", "2", "3"],
  "decision": "APPROVED",
  "note": "..."
}
```

---

# 16. Frontend component structure

Đề xuất mới:

```text
koc-management/
├── pages/
│   ├── campaign-list/
│   ├── campaign-create/
│   ├── campaign-edit/
│   ├── campaign-review/
│   │   ├── campaign-review.component.ts
│   │   ├── campaign-review.component.html
│   │   └── campaign-review.component.scss
│   └── global-review-inbox/
│
├── components/
│   ├── campaign-basic-form/
│   ├── campaign-goal-form/
│   ├── campaign-search-scope/
│   ├── campaign-search-instructions/
│   ├── campaign-requirement-list/
│   ├── campaign-requirement-editor/
│   ├── campaign-workflow-selector/
│   ├── campaign-review-summary/
│   ├── campaign-review-header/
│   ├── campaign-candidate-filter/
│   ├── campaign-candidate-list/
│   ├── candidate-review-panel/
│   ├── candidate-profile-card/
│   ├── candidate-ai-assessment/
│   ├── candidate-post-list/
│   ├── candidate-evidence-list/
│   ├── candidate-review-history/
│   └── candidate-review-action-bar/
│
├── model/
│   ├── campaign.model.ts
│   ├── campaign-goal.model.ts
│   ├── campaign-search.model.ts
│   ├── campaign-requirement.model.ts
│   ├── campaign-workflow.model.ts
│   ├── campaign-candidate.model.ts
│   ├── candidate-ai-evaluation.model.ts
│   ├── candidate-human-review.model.ts
│   ├── candidate-post.model.ts
│   └── candidate-evidence.model.ts
│
├── stores/
│   ├── campaign-editor.store.ts
│   └── campaign-review.store.ts
│
└── services/
    ├── campaign-api.service.ts
    └── campaign-review-api.service.ts
```

---

# 17. State management

Không nhét toàn bộ state vào page component.

Tạo:

```text
CampaignReviewStore
```

State:

```ts
interface CampaignReviewState {
  campaignId: string | null;

  query: CandidateReviewQuery;

  candidates: CampaignCandidate[];

  selectedCandidateId: string | null;

  selectedReviewContext: CandidateReviewContext | null;

  summary: CampaignReviewSummary | null;

  listLoading: boolean;
  detailLoading: boolean;
  savingDecision: boolean;
}
```

Responsibilities:

```text
loadCampaign
loadCandidates
selectCandidate
reloadCandidateContext
approve
reject
bulkApprove
bulkReject
nextPendingCandidate
updateRealtimeEvent
```

---

# 18. Realtime update

Nếu hệ thống hiện tại có SSE/WebSocket event:

Campaign Review Workspace listen theo:

```text
campaignId
```

Event types đề xuất:

```text
CANDIDATE_DISCOVERED
CANDIDATE_AI_EVALUATED
CANDIDATE_READY_FOR_REVIEW
CANDIDATE_APPROVED
CANDIDATE_REJECTED
CAMPAIGN_PROGRESS_UPDATED
```

Không reload toàn page.

Update:

```text
summary counters
candidate row
selected candidate context nếu liên quan
```

---

# 19. Permission

Recommended permissions:

```text
AI_AGENT_KOC_READ
AI_AGENT_KOC_REVIEW
AI_AGENT_KOC_CAMPAIGN_WRITE
```

Behavior:

### READ

```text
view candidate
view posts
view evidence
view decisions
```

### REVIEW

```text
approve
reject
bulk review
```

### CAMPAIGN_WRITE

```text
edit campaign
start
pause
resume
stop
```

UI phải hide/disable actions đúng permission.

Backend vẫn enforce permission independently.

---

# 20. Greenfield implementation trong KOC module

Không làm migration UI và không giữ backward compatibility với màn cũ.

## Giữ lại

Chỉ giữ:

```text
campaign-list
```

`campaign-list` được phép refactor để khớp domain/API mới.

`campaign-wizard` cũ KHÔNG giữ lại.
Create/Edit Campaign được code mới theo thiết kế `Campaign -> Search Requirements -> Review & Start`.

## Xóa khỏi kiến trúc mới

```text
campaign-detail
campaign-wizard
candidate-list
candidate-detail
review-detail
review-queue
```

Không tạo redirect legacy.
Không giữ route legacy.
Không giữ component legacy ở trạng thái deprecated.
Không reuse model cũ chỉ để tránh sửa code.

Sau khi feature mới hoạt động và test pass, xóa code cũ ngay trong cùng implementation scope:

```text
old pages
old services
old models không còn dùng
old routes
old translations
old styles
dead tests
dead permissions mapping
```

## Nguyên tắc implementation

```text
NEW DOMAIN
    ↓
NEW API CONTRACT
    ↓
NEW STORE
    ↓
NEW COMPONENTS
    ↓
NEW ROUTES
    ↓
REMOVE OLD CODE
```

Không implement kiểu:

```text
new component
    ↓
adapter old service
    ↓
map old model
    ↓
fallback old route
```

Mục tiêu là codebase sau khi hoàn thành chỉ còn một implementation chính cho KOC review.

---

# 21. Implementation phases

---

## Phase 1 - Campaign domain + Create Campaign

### Backend

- Tạo campaign domain mới: goal + search scope + flexible AI requirements + workflow reference.
- Bỏ API contract phụ thuộc discovery signals/search strategies/screening rules cũ.
- Implement create/update/start campaign theo payload mới.
- Requirement phải có stable `requirementId`.
- Không hard-code loại AI requirement theo enum business cụ thể.

### Frontend

- Xóa `campaign-wizard` cũ.
- Implement `CampaignEditorStore`.
- Implement 3 bước:
  - Campaign
  - Search Requirements
  - Review & Start
- Implement structured search scope.
- Implement natural-language search instructions.
- Implement flexible requirement editor.
- Start campaign redirect vào Campaign Review Workspace.

### Acceptance

- User tạo campaign mà không thấy agent/provider/rule kỹ thuật.
- Không có audience ratio.
- Requirement arbitrary natural language được lưu nguyên vẹn.
- Structured filter và AI requirement được tách rõ.
- Start campaign mở `/campaigns/:campaignId/review`.

---

## Phase 2 - Review domain + API contract

### Backend

- Tạo DTO mới cho campaign candidate.
- Tách AI evaluation khỏi human review.
- Tạo post DTO.
- Chuẩn hóa evidence liên kết criterion/post.
- Thêm review audit.
- Thêm campaign candidate page endpoint.
- Thêm review-context endpoint.
- Thêm review decision endpoint.
- Thêm bulk review endpoint.

### Frontend

- Tạo model mới.
- Tạo service mới.
- Không sửa UI trước khi API contract ổn định.

### Acceptance

- Có thể query candidate theo campaign.
- AI result và human decision độc lập.
- Response chứa reviewer/reviewedAt.
- Candidate có posts/evidence.

---

## Phase 3 - Campaign Review Workspace shell

Implement:

```text
Header
Summary
Filters
Candidate List
Master-detail layout
```

Chưa cần approve/reject.

### Acceptance

- Start campaign redirect vào workspace.
- List candidates load theo campaign.
- Filter hoạt động.
- Chọn candidate cập nhật URL/deep-link.
- Responsive layout hoạt động.

---

## Phase 4 - Candidate review context

Implement:

```text
Profile
AI Assessment
Posts
Evidence
History
```

### Acceptance

- Profile mở external link.
- AI criteria hiển thị theo campaign rule.
- Post liên kết được evidence.
- Evidence group theo criterion.
- History có audit.

---

## Phase 5 - Human approval

Implement:

```text
sticky action bar
approve dialog
reject dialog
decision API
next candidate
permission guard
```

### Acceptance

- Approve không bắt reason.
- Reject bắt reason.
- Backend xác định reviewer.
- UI update ngay sau decision.
- Auto select next pending candidate.
- Không double-submit khi request đang chạy.

---

## Phase 6 - Bulk review

Implement:

```text
checkbox
bulk toolbar
bulk approve
bulk reject
AI mismatch warning
```

### Acceptance

- Không bulk submit khi selection empty.
- Reject bulk bắt reason.
- Warning nếu AI recommendation khác human action.
- Update list và counters sau bulk request.

---

## Phase 7 - Global Review Inbox

Implement cross-campaign inbox.

Columns:

```text
Campaign
Candidate
AI Recommendation
Confidence
Waiting Since
Status
```

Click:

```text
open campaign review workspace
select candidate
```

Không tạo review detail riêng.

---

## Phase 8 - Realtime + hard removal

- Subscribe campaign events.
- Update list incrementally.
- Xóa toàn bộ page/component/service cũ đã được thay thế.
- Xóa toàn bộ route cũ, không redirect.
- Xóa model cũ không còn dùng.
- Xóa translation key cũ.
- Xóa style cũ.
- Xóa test cũ không còn đúng domain.
- Chạy dependency/import scan để đảm bảo không còn dead reference.

---

# 22. Pseudo flow

## Load campaign

```ts
onInit() {
  campaignId = route.paramMap.get('campaignId');

  store.initialize(campaignId);

  if (candidateIdFromRoute) {
    store.selectCandidate(candidateIdFromRoute);
  }
}
```

## Select candidate

```ts
selectCandidate(candidateId: string) {
  state.selectedCandidateId = candidateId;

  router.updateUrl(candidateId);

  api.getReviewContext(
    state.campaignId,
    candidateId
  ).subscribe(context => {
    state.selectedReviewContext = context;
  });
}
```

## Approve

```ts
approve(note?: string) {
  if (state.savingDecision) {
    return;
  }

  state.savingDecision = true;

  api.reviewCandidate({
    campaignId,
    candidateId,
    decision: 'APPROVED',
    note
  }).subscribe({
    next: review => {
      updateCandidate(review);
      updateSummary();
      selectNextPendingCandidate();
    },
    complete: () => {
      state.savingDecision = false;
    }
  });
}
```

## Reject

```ts
reject(reasonCode: string, note?: string) {
  if (!reasonCode) {
    showValidationError();
    return;
  }

  api.reviewCandidate({
    campaignId,
    candidateId,
    decision: 'REJECTED',
    reasonCode,
    note
  });
}
```

---

# 23. Tests

## Unit test - Campaign Editor Store

Test:

```text
create draft
update campaign goal
update structured search scope
add/remove/edit arbitrary AI requirement
preserve natural-language requirement content
save draft
start campaign
redirect to review workspace
```

## Unit test - Review Store

Test:

```text
load campaign candidates
apply filter
select candidate
load review context
approve
reject
auto next candidate
update summary
prevent duplicate submit
handle API error
```

## Unit test - Human Decision

Cases:

```text
approve without note -> valid

reject without reason -> invalid

reject OTHER without note -> invalid

reject OTHER with note -> valid
```

## Component test

```text
create campaign does not expose technical workflow fields
requirement editor accepts arbitrary natural-language input
summary card changes filter
candidate click opens detail
profile URL opens external link
criterion click navigates evidence
approve opens dialog
reject opens dialog
sticky action remains visible
```

## API integration test

```text
reviewer cannot be spoofed by FE
reviewedAt generated by backend
campaign/candidate mismatch rejected
duplicate review behavior defined
unauthorized user gets 403
requirement id remains stable across create/read/evaluation
```

## E2E

Scenario:

```text
create campaign
configure structured scope
add arbitrary AI requirements
review campaign
start campaign
redirect to review workspace
wait/load candidates
open candidate
view AI assessment by requirement
open post
view evidence
approve
auto move next
reject next candidate
filter approved
filter rejected
open global inbox
```

---

# 24. Error / empty states

Must support:

```text
Campaign has no candidate yet
AI evaluation running
Candidate has no posts
Candidate has no evidence
Review context failed
Profile URL unavailable
Candidate deleted / invalid
Campaign stopped
Permission denied
```

Không render blank panel.

---

# 25. Performance requirements

- Candidate list server-side pagination.
- Không fetch posts/evidence cho toàn list.
- Fetch review-context chỉ khi select candidate.
- Cache selected context ngắn hạn.
- Cancel request cũ khi user click candidate liên tục.
- Virtual scroll nếu campaign có hàng nghìn candidate.
- Không reload toàn campaign sau mỗi review.

---

# 26. UI clean-code rules

- Page component chỉ orchestration.
- Business state nằm trong store/facade.
- Không gọi API trực tiếp từ leaf component.
- Không duplicate approve/reject logic.
- Không duplicate badge mapping ở nhiều component.
- Dùng shared pipes/components cho status.
- Không hard-code translation text.
- Dùng theme token hiện tại, không hard-code color.
- Tách business view và technical/debug view.
- Không dùng raw backend enum làm label trực tiếp.
- Create Campaign không chứa technical workflow configuration.
- Không hard-code enum cho các semantic AI requirement.

---

# 27. Definition of Done

Feature chỉ hoàn thành khi:

- [ ] `campaign-wizard` cũ đã bị xóa.
- [ ] Create Campaign chỉ còn 3 bước: Campaign / Search Requirements / Review & Start.
- [ ] Không còn audience ratio.
- [ ] Không expose agent/provider/CODE rule/AI rule/conditionKey/evidenceKey trên Create Campaign.
- [ ] User có thể nhập natural-language AI requirements tùy ý.
- [ ] Structured search scope tách khỏi AI requirements.
- [ ] Requirement có stable ID dùng xuyên suốt AI evaluation/evidence/review.
- [ ] Start campaign mở Campaign Review Workspace.
- [ ] User xem toàn bộ candidate của campaign.
- [ ] User phân biệt rõ AI recommendation và human decision.
- [ ] User xem profile URL.
- [ ] User xem posts.
- [ ] User xem evidence theo criterion/requirement.
- [ ] User xem AI summary/confidence/requirement result.
- [ ] User approve candidate.
- [ ] User reject candidate với reason.
- [ ] Hệ thống lưu reviewer từ authentication context.
- [ ] Hiển thị reviewer + reviewedAt.
- [ ] Có review history.
- [ ] Approve/reject xong tự chuyển candidate tiếp theo.
- [ ] Có filter pending/approved/rejected.
- [ ] Có bulk review.
- [ ] Có Global Review Inbox.
- [ ] Review Inbox reuse Candidate Review Detail.
- [ ] Permission được enforce cả FE và BE.
- [ ] Có unit/integration/E2E test.
- [ ] Không còn route legacy.
- [ ] Không còn page/component/service legacy đã được thay thế.
- [ ] Không còn model compatibility layer cho review/candidate/campaign wizard cũ.
- [ ] Không còn duplicate Candidate Detail / Review Detail logic.
- [ ] Codebase chỉ còn một flow chính cho KOC review.

---

# 28. Thứ tự ưu tiên triển khai

Không nên code UI toàn bộ một lần.

Recommended sequence:

```text
1. Chốt Campaign domain mới + flexible AI requirements
2. Chốt Create/Update/Start Campaign API
3. Làm Create/Edit Campaign mới
4. Chốt Candidate/Review domain + API
5. Làm Workspace shell
6. Làm Candidate Review Detail
7. Làm Approve / Reject
8. Làm Bulk Review
9. Làm Global Inbox
10. Realtime
11. Hard-delete code cũ + dead-code cleanup
```

Phần quan trọng nhất cần review kỹ trước khi code là:

```text
CampaignRequirement model
RequirementEvaluation model
AI evaluation model
Human review model
Review-context API
Candidate/Post/Evidence relationship
```

Nếu các phần này sạch thì UI phía sau sẽ đơn giản và ổn định.

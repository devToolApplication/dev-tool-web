# Traceability

| Requirement | Phase | Plan | Automated Test | Review | Local Live/E2E | Test Env Live/E2E | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| REQ-001 Campaign Review Workspace is the central KOC business flow | P03 | PENDING | E2E-001 | PENDING | PENDING | PENDING | DRAFT |
| REQ-002 Create Campaign has only Campaign / Search Requirements / Review & Start | P01 | `02-phases/01-campaign-domain-create-campaign/PLAN.md` | UT-001, CT-001, E2E-001 | PENDING | PENDING | PENDING | PLANNED |
| REQ-003 Campaign creation captures goal and quota fields | P01 | `02-phases/01-campaign-domain-create-campaign/PLAN.md` | UT-001, API-001 | PENDING | PENDING | PENDING | PLANNED |
| REQ-004 Search Requirements split structured scope from AI requirements | P01 | `02-phases/01-campaign-domain-create-campaign/PLAN.md` | UT-001, CT-002 | PENDING | PENDING | PENDING | PLANNED |
| REQ-005 AI requirements are arbitrary natural-language criteria with stable IDs | P01 | `02-phases/01-campaign-domain-create-campaign/PLAN.md` | UT-002, API-006 | PENDING | PENDING | PENDING | PLANNED |
| REQ-006 AI evaluation output maps back to requirement IDs and evidence IDs | P02, P04 | PENDING | UT-004, API-006 | PENDING | PENDING | PENDING | DRAFT |
| REQ-007 Campaign stores workflow reference but no detailed execution config | P01 | `02-phases/01-campaign-domain-create-campaign/PLAN.md` | UT-003, CT-001, API-001 | PENDING | PENDING | PENDING | PLANNED |
| REQ-008 Review API/domain separates candidate, profile, AI, human review, posts, evidence, history | P02 | PENDING | API-002 | PENDING | PENDING | PENDING | DRAFT |
| REQ-009 Workspace supports header, summary, filters, list, master-detail, and deep-link selection | P03 | PENDING | UT-005, CT-003, E2E-001 | PENDING | PENDING | PENDING | DRAFT |
| REQ-010 Candidate detail shows profile, AI assessment, posts, grouped evidence, history, and decision UI | P04 | PENDING | CT-004, E2E-001 | PENDING | PENDING | PENDING | DRAFT |
| REQ-011 Individual approval/rejection works with validation and auto-next | P05 | PENDING | UT-006, API-003, E2E-001 | PENDING | PENDING | PENDING | DRAFT |
| REQ-012 Bulk review works with selection guards and AI mismatch warning | P06 | PENDING | UT-007, API-004, E2E-002 | PENDING | PENDING | PENDING | DRAFT |
| REQ-013 Global Review Inbox opens the campaign workspace and reuses candidate detail | P07 | PENDING | CT-005, E2E-003 | PENDING | PENDING | PENDING | DRAFT |
| SEC-001 Frontend does not send reviewer identity | P05, P06 | `02-phases/01-campaign-domain-create-campaign/PLAN.md` | API-005 | PENDING | PENDING | PENDING | PLANNED |
| SEC-002 FE and backend enforce KOC read/review/campaign-write permissions | P01, P05, P06, P07 | PENDING | UT-008, API-007, E2E-004 | PENDING | PENDING | PENDING | DRAFT |
| PERF-001 Candidate list scales without loading all detail data | P03, P04 | PENDING | PERF-001 | PENDING | PENDING | PENDING | DRAFT |
| PERF-002 Workspace updates avoid full reloads | P08 | PENDING | UT-009, E2E-005 | PENDING | PENDING | PENDING | DRAFT |
| NFR-001 Legacy KOC screens/routes/adapters are removed after replacement | P08 | PENDING | SCAN-001 | PENDING | PENDING | PENDING | DRAFT |
| NFR-002 Business state lives in stores/facades, not leaf components | P01, P03, P05 | `02-phases/01-campaign-domain-create-campaign/PLAN.md` | CR-001 | PENDING | PENDING | PENDING | PLANNED |

## Test IDs

- UT-001 Campaign editor store draft/update/save/start tests.
- UT-002 Flexible requirement add/edit/remove/preserve tests.
- UT-003 Payload excludes agent/provider/rule/discovery execution fields.
- UT-004 AI evaluation maps criteria to requirement and evidence IDs.
- UT-005 Campaign review store load/filter/select/deep-link tests.
- UT-006 Human approve/reject/OTHER-note/auto-next tests.
- UT-007 Bulk review selection/reason/mismatch warning tests.
- UT-008 Permission action visibility tests.
- UT-009 Realtime or polling update reducer tests.
- CT-001 Create Campaign hides technical workflow fields.
- CT-002 Requirement editor accepts arbitrary natural-language input.
- CT-003 Summary/filter/list/master-detail component interaction.
- CT-004 Candidate detail profile/posts/evidence/history interaction.
- CT-005 Global inbox navigation into campaign workspace.
- API-001 Create/update/start campaign contract.
- API-002 Candidate page and review-context contract.
- API-003 Individual review decision contract.
- API-004 Bulk review contract.
- API-005 Reviewer spoofing rejected.
- API-006 Requirement ID stability through create/read/evaluation.
- API-007 Unauthorized user receives 403.
- E2E-001 Create campaign to individual review happy path.
- E2E-002 Bulk review guarded path.
- E2E-003 Global inbox path.
- E2E-004 Permission denied path.
- E2E-005 Realtime or polling update path.
- PERF-001 List/detail fetch boundary measurement.
- SCAN-001 Dead legacy route/import scan.
- CR-001 Code review confirms state ownership and no compatibility layer.

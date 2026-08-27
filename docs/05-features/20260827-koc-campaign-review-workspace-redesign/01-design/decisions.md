# Decisions

| ID | Decision | Status | Notes |
| --- | --- | --- | --- |
| DEC-001 | Use a greenfield KOC review implementation, not adapters around legacy screens. | ACCEPTED | From source plan. |
| DEC-002 | Create Campaign describes WHAT users want, not HOW the workflow executes. | ACCEPTED | Agent/provider/rule config stays in workflow/BPMN. |
| DEC-003 | Flexible AI requirements are generic natural-language criteria with stable IDs. | ACCEPTED | Do not hard-code semantic enums such as parent/seller/child age. |
| DEC-004 | Campaign Review Workspace is the main campaign result/review surface. | ACCEPTED | Review Queue becomes only a cross-campaign inbox. |
| DEC-005 | Human review is independent from AI recommendation. | ACCEPTED | Reject requires reason; approve note is optional. |
| DEC-006 | Backend derives reviewer identity. | ACCEPTED | FE must not submit `reviewedBy`; FE-first mocks must preserve this boundary. |
| DEC-007 | Remove legacy routes without redirects. | ACCEPTED | Legacy URL compatibility is intentionally out of scope. |
| DEC-008 | Implement frontend first, by phases, and delete legacy code after replacement passes. | ACCEPTED | Backend integration follows FE contract stabilization. |
| DEC-009 | Pin campaigns to a published workflow version reference. | ACCEPTED | Do not store only a template ID for runnable campaigns. |
| DEC-010 | Use a full-page candidate detail route on mobile. | ACCEPTED | Drawer can be reconsidered later. |
| DEC-011 | Use polling/manual refresh until realtime phase. | ACCEPTED | Realtime is not a prerequisite for the core FE flow. |
| DEC-012 | Defer final permission constant names. | DEFERRED | Permission behavior remains required later; exact names are not needed now. |

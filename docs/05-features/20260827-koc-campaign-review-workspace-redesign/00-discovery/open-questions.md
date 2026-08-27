# Open Questions

| ID | Question | Decision | Status |
| --- | --- | --- | --- |
| OQ-001 | FE-only first or FE+backend contract together? | FE first. Build mocks and contract shape in FE; backend integration follows. | CLOSED |
| OQ-002 | Campaign workflow reference shape? | Pin published workflow version, not only template ID. | CLOSED |
| OQ-003 | Duplicate review submit behavior? | Reject with conflict unless explicit re-review. | CLOSED |
| OQ-004 | Future re-review state model? | Add audit entry and preserve prior decision history. | CLOSED |
| OQ-005 | Mobile candidate detail UX? | Full-page detail route first. | CLOSED |
| OQ-006 | Realtime fallback? | Polling/manual refresh until realtime phase. | CLOSED |
| OQ-007 | Bulk reject payload shape? | Require `reasonCode`; require note when reason is `OTHER`. | CLOSED |
| OQ-008 | API error response contract? | Define FE-side domain errors for mismatch, invalid candidate, stopped campaign, duplicate decision, and permission denied. | CLOSED |
| OQ-009 | Permission constants final names? | Not needed for the current FE-first scope. Decide when permission work enters scope. | DEFERRED |

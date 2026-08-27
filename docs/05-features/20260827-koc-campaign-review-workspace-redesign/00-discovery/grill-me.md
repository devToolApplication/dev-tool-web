# Grill Me

## Skill Preflight

`$autonomous-dev-workflow` was invoked explicitly.

Resolved workflow skills for this documentation round:

| Skill | Resolved path | Status |
| --- | --- | --- |
| autonomous-dev-workflow | `D:/AI/agent-skills/autonomous-dev-workflow/SKILL.md` | verified |
| grill-me equivalent | `D:/AI/agent-skills/grilling/SKILL.md` | verified |
| brainstorming | `D:/AI/agent-skills/brainstorming/SKILL.md` | verified |
| dispatching-parallel-agents | `D:/AI/agent-skills/dispatching-parallel-agents/SKILL.md` | verified |
| gsd-plan-phase | `D:/AI/agent-skills/gsd-plan-phase/SKILL.md` | verified |

## Facts From Repository

- Source plan exists at
  `docs/implement-plan/koc-campaign-review-workspace-redesign-plan.md`.
- The newest remote campaign doc change is commit
  `af01e0a docs: redesign KOC campaign creation with flexible AI requirements`.
- Current KOC routes still include legacy campaign, candidate, and review pages.
- Current campaign model still serializes execution-oriented fields into create
  payloads.

## Frontier Questions

1. Should Phase 1 be frontend-only against mocks, or should FE and backend API
   contracts be implemented together?

   Answer: frontend first. Build the FE domain, create/edit flow, mocks, and
   contract shape now. Backend integration can follow after the FE shape is
   stable.

2. Should Create Campaign require selecting a concrete workflow version, or only
   a workflow template ID?

   Answer: select and store a published workflow version reference so old
   campaigns do not silently move.

3. What should happen on duplicate human review submit?

   Answer: duplicate submit is rejected with conflict unless the request is an
   explicit re-review.

4. What is the mobile layout for candidate detail?

   Answer: use a full-page detail route on mobile.

5. What is the realtime fallback when SSE/WebSocket is unavailable?

   Answer: use polling plus manual refresh. Realtime remains a later phase.

6. Should old KOC URLs break immediately?

   Answer: yes for the legacy routes named in the source plan. Keep only the
   agreed new routes, with no redirect compatibility layer.

7. What is the bulk reject payload shape?

   Answer: require `reasonCode`; require note when reason is `OTHER`.

8. What is the API error response contract?

   Answer: define a FE-side domain error contract now for campaign/candidate
   mismatch, invalid candidate, stopped campaign, duplicate decision, and
   permission denied. Backend can align later.

9. What are the final permission constants?

   Answer: not needed for the current frontend-first planning scope. Defer the
   exact names until permission work enters scope.

## Discovery Status

Critical discovery questions are answered or deliberately deferred. Requirements
are locked for frontend-first Phase P01 planning.

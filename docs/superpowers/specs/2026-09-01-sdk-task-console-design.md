# SDK task console design

## Goal

Replace the existing `/admin/system-management/ai-agent-execution` experience with a full SDK task console for running prompts and inspecting server-side run history.

The frontend MUST call AI Agent MCRS only. AI Agent MCRS owns the admin proxy to Codex SDK task endpoints.

## Scope

- Add the route `/admin/system-management/ai-agent-execution` back to the Angular feature route surface if it is missing.
- Build one split-pane page:
  - Left pane: full run prompt form.
  - Right pane: task run history list and selected run detail.
- Add an AI Agent MCRS admin proxy for SDK task runs.
- Use Codex SDK async task run history, not browser-local history.
- Extend the Codex SDK task contract so the run form can submit the same fields the page exposes.

## Backend design

AI Agent MCRS exposes a thin admin controller under:

```text
/ai-agent-mcrs/v1/admin/sdk/tasks
```

Required endpoints:

```text
POST /runs
GET  /runs
GET  /runs/{taskId}
```

The controller delegates to the existing Codex SDK Feign client layer and proxies Codex SDK:

```text
POST /v1/ai/tasks/runs
GET  /v1/ai/tasks/runs
GET  /v1/ai/tasks/runs/{taskId}
```

The proxy returns SDK response payloads under `BaseResponse.data` without renaming SDK fields. It must validate required submit fields and must not expose callback secrets in list rows.

The Codex SDK task request contract MUST accept the page fields used by the form:

- `agentCode`
- `provider`
- `prompt`
- `threadId`
- `workingDirectory`
- `model`
- `reasoningEffort`
- `outputSchema`
- `requestContext`
- `callbackUrl`
- `callbackAuthSecretCode`

## Submit request

The page sends the full SDK task request:

```json
{
  "agentCode": "koc-search-agent",
  "provider": "codex",
  "prompt": "Find candidates for this campaign.",
  "threadId": "optional-thread",
  "workingDirectory": "/workspace",
  "model": "gpt-5.2",
  "reasoningEffort": "medium",
  "outputSchema": {},
  "requestContext": {},
  "callbackUrl": "https://example.test/callback",
  "callbackAuthSecretCode": "optional-secret-code"
}
```

Required UI validation:

- `agentCode` and `prompt` are required.
- `provider` accepts `codex` or `claude` when supplied.
- `outputSchema` and `requestContext` must be valid JSON objects when non-empty.
- Optional string fields are trimmed; empty optional fields are omitted.

## Frontend design

Use a feature page in the existing Angular app, mounted at `/admin/system-management/ai-agent-execution`.

The page uses existing shared UI primitives:

- `app-page-shell` for title, breadcrumb, loading, and error state.
- `app-section-panel` for form/history/detail sections.
- `app-input-area` for prompt and JSON editor fields.
- `app-select`, `app-input-text`, `app-button`, `app-action-toolbar`, `app-tabs`, and `app-json-viewer` where they already fit.

Layout:

- Desktop: two columns. Left column is the submit form. Right column contains history list above or beside selected detail depending on available width.
- Tablet/mobile: panes stack vertically, form first, history second, detail after selected row.
- The page must not use nested cards for primary sections.

Run form fields:

- Core: agent, provider, prompt, thread ID, working directory.
- Advanced: model, reasoning effort, output schema JSON, request context JSON.
- Callback: callback URL, callback auth secret code.
- Actions: `Run`, `Reset`.

History list:

- Newest first.
- Server-side pagination.
- Filters: status, agent, provider, thread ID, and created date range.
- Row fields: status, agent, provider, created time, duration, task ID.
- Selecting a row loads detail by `taskId`.

Detail panel tabs:

- Summary: status, timing, agent, provider, task ID, error summary.
- Request: submitted request fields, with sensitive callback secret hidden.
- Events: ordered run events and callback/error markers.
- Output: structured output, stdout, stderr, duration, exit code.
- Raw JSON: full response for debugging.

## Runtime behavior

- `Run` calls `POST /ai-agent-mcrs/v1/admin/sdk/tasks/runs` through the frontend `adminAiGenerator` base URL.
- On `202 Accepted`, the page refreshes history and selects the new task.
- Selected `RUNNING` tasks poll detail on a light 5-second interval and stop when terminal.
- Manual refresh is available for history and detail.
- Empty history keeps the run form usable.
- Backend/network errors show recoverable page or section-level errors.
- JSON validation errors block submit before the request leaves the browser.

## Data ownership

- `SdkTaskApiService` owns HTTP calls.
- `SdkTaskConsoleComponent` owns view state for the first version.
- No shared store in the first version; the component state is local to the page.

## Testing

Backend:

- Controller contract tests for `POST /runs`, `GET /runs`, and `GET /runs/{taskId}`.
- Feign contract tests for Codex SDK task run endpoints.
- Proxy tests confirm request fields, filters, and sensitive field masking.

Frontend:

- Component tests for submit payload normalization, JSON validation, polling stop, and detail selection.
- Route/menu test for `/admin/system-management/ai-agent-execution`.
- Playwright route-mocked test covering load history, run prompt, select detail, and responsive stacking.
- Contract test for the route query mapping `status`, `agentCode`, `provider`, `threadId`, `createdFrom`, and `createdTo`.

## Non-goals

- No direct frontend calls to Codex SDK.
- No local browser-only task history.
- No live streaming console in this version.
- No new dependency for JSON editing or table rendering.
- No SDK task cancel/retry unless the server endpoint already exists.

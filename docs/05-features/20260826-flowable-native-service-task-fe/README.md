# Flowable Native Service Task FE

Date: 2026-08-26
Status: Implemented

## Goal

Make Workflow Studio edit Flowable-native Service Task configuration directly in
the bpmn-js properties panel.

## Scope

- Register a local Flowable moddle descriptor.
- Add a Flowable Service Task properties provider.
- Support Flowable-native implementation, field injection, variable mappings,
  execution flags, exception mappings, failed-job retry cycle, and listeners.
- Remove active FE reliance on DevTool legacy task presets and custom task JSON.

## Workflow Notes

- `$autonomous-dev-workflow` was invoked explicitly.
- `.planning/` is absent in this frontend repo.
- `gsd-sdk query init.plan-phase` failed because its npm cache module is missing.
- Local `docs/05-features` artifacts are used as the durable phase record.

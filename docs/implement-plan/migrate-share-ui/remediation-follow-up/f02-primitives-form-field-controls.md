# F02 — Primitive/FormField/Control Cleanup

## Goal

Finish the primitive foundation so field presentation is owned by FormField/FieldBlock and controls focus on value/accessibility behavior.

## Scope

```text
src/app/shared/ui/primitives/base-input.ts
src/app/shared/ui/primitives/input-*/
src/app/shared/ui/primitives/select*/
src/app/shared/ui/primitives/password/
src/app/shared/ui/primitives/date-picker/
src/app/shared/ui/primitives/check-box/
src/app/shared/ui/primitives/radio-button/
src/app/shared/ui/primitives/toggle-*/
src/app/shared/ui/patterns/form-input/component/field-block/
```

## 1. Reduce BaseInput

Current presentation concerns to move out:

```text
label
helpText
errorMessage
invalid presentation
floating-label variant
fluid layout
icon layout
presentation tooltip
```

Target BaseInput responsibility:

```ts
abstract class BaseInput<T> implements ControlValueAccessor {
  value: T | null;
  disabled: boolean;
  readonly: boolean;

  writeValue(...)
  registerOnChange(...)
  registerOnTouched(...)
  setDisabledState(...)

  protected commit(...)
  protected touch()
}
```

Common semantic/accessibility attributes such as `name`, `required`, `aria-describedby`, `inputmode`, `autocomplete` may live on the specific control API when required.

## 2. FormField owns label/help/error

Target shape:

```text
FormField
  label
  optional/required marker
  description
  projected control
  help OR error
```

IDs must be deterministic per rendered field and wired to the control:

```text
control id
label for
aria-describedby -> description/help/error ids
aria-invalid
```

Do not rely on placeholder as label.

## 3. Standardize size vocabulary

Use one shared size vocabulary where appropriate:

```text
sm
md
lg
```

Remove `small|large` compatibility from new core contracts after consumers migrate.

## 4. Control API normalization

Audit each control for:

```text
value type
name
disabled
readonly
required
autocomplete
inputmode
spellcheck
aria-describedby
focus-visible
```

Avoid broad `any`; use generic option types.

Example:

```ts
export interface SelectOption<T = unknown> {
  label: string;
  value: T;
  disabled?: boolean;
}
```

## 5. Validation timing

Field errors are shown after interaction/blur or failed submit, not immediately on untouched fields.

## Tests

For each core primitive:

```text
CVA write/change/touched
label association through FormField
aria-describedby
aria-invalid
required/optional
keyboard interaction
focus-visible
readonly/disabled distinction
```

## Search gates

```bash
rg "FloatLabelType|variant: FloatLabelType|placeholder \|\| ' '" src/app/shared/ui
rg "@Input\(\) label|@Input\(\) helpText|@Input\(\) errorMessage" src/app/shared/ui/primitives
```

Any remaining occurrence must be justified as a component-specific requirement, not generic BaseInput presentation.

## Definition of Done

- BaseInput is minimal CVA/value state;
- FormField owns label/help/error presentation;
- no floating-label default behavior;
- core controls expose consistent semantic/accessibility attributes;
- option/value types are generic or `unknown`-based;
- tests cover CVA and a11y wiring;
- no compatibility API introduced.

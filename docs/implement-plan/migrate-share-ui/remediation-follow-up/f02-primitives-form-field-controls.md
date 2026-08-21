# F02 — Primitive and FormField Contract Cleanup

## Goal

Make primitives low-level, predictable and accessible. `FormField`/`FieldBlock` owns field presentation; controls own control behavior.

## Current debt

`BaseInput` currently owns CVA plus labels, placeholders, help, errors, floating-label mode, tooltip, icons, layout/fluid state and old `small|large` sizing. This duplicates field presentation and makes controls inconsistent.

## F02.1 — Shrink BaseInput

Target responsibility:

```ts
abstract class BaseInput<T> implements ControlValueAccessor {
  value: T | null;
  disabled: boolean;
  readonly: boolean;

  writeValue(value: T | null): void;
  registerOnChange(fn: ...): void;
  registerOnTouched(fn: ...): void;
  setDisabledState(disabled: boolean): void;

  protected commit(value: T | null): void;
  protected touch(): void;
}
```

Move out of BaseInput:

```text
label
helpText
errorMessage
invalid presentation
FloatLabelType / floating-label variant
fluid/layout behavior
tooltip presentation
iconClass presentation
autofocus policy when not genuinely common
```

Delete old types:

```text
InputSize = 'small' | 'large'
FloatLabelType = 'in' | 'on' | 'over'
```

Use standardized size where a control actually needs it:

```ts
type ControlSize = 'sm' | 'md' | 'lg';
```

## F02.2 — Make FormField the presentation owner

`FormField`/`FieldBlock` owns:

```text
input id association
label
required/optional indicator
description
help/hint
error text
aria-describedby
layout spacing
```

Suggested contract:

```ts
interface FormFieldPresentation {
  inputId: string;
  label?: string;
  description?: string;
  help?: string;
  error?: string;
  required?: boolean;
  optional?: boolean;
}
```

Control gets only IDs/ARIA it needs:

```text
id/name
describedBy
aria-invalid
```

## F02.3 — Normalize control APIs

Review:

```text
InputText
InputArea
InputNumber
Password
Select
SelectMulti
AutoComplete
Checkbox
Radio
DatePicker
Toggle*
ColorPicker
InputMulti
```

Common behavioral contract:

```text
value
valueChange / CVA
disabled
readonly when meaningful
required when native semantics matter
name
autocomplete
inputMode
ariaDescribedBy
size sm|md|lg only if visually supported
```

Do not make every control inherit a giant common API if the property has no semantic meaning.

## F02.4 — Select option typing

Replace broad `any[]` options with typed contracts:

```ts
export interface SelectOption<T = string | number | boolean | null> {
  label: string;
  value: T;
  disabled?: boolean;
}
```

Use generics where practical.

## Tests

For each primary primitive class:

```text
CVA write/register/touched
value emission
disabled semantics
readonly semantics where supported
label association through FormField host
help/error aria-describedby
keyboard behavior
size contract
```

Primitive tests should use minimal dependencies, not full `SharedModule` by default.

## Search gates

```bash
rg "FloatLabelType|variant: FloatLabelType|InputSize" src/app/shared/ui
rg "size=\"small\"|size=\"large\"" src/app
```

Expected old sizing/floating-label contracts: zero.

Review BaseInput for forbidden presentation ownership:

```bash
rg "label|helpText|errorMessage|tooltip|iconClass|fluid" src/app/shared/ui/primitives/base-input.ts
```

Expected: none unless explicitly justified as behavioral control state.

## Definition of Done

- BaseInput is a small CVA/control-state abstraction;
- FormField owns label/help/error/ARIA presentation;
- controls expose consistent, semantically valid APIs;
- old floating-label and `small|large` contracts deleted;
- options no longer use broad `any[]` at public boundary;
- consumer migration complete;
- unit + format + lint + build gates pass.

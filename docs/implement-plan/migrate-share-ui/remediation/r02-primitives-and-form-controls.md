# R02 — Primitive and Form Control Cleanup

## Objective

Make primitive controls small, consistent and type-safe before the Form engine is rewritten. `BaseInput` must become a control-value foundation only; presentation belongs to `FormField`.

## Scope

```text
src/app/shared/ui/primitives/base-input.ts
src/app/shared/ui/primitives/input-text/**
src/app/shared/ui/primitives/input-area/**
src/app/shared/ui/primitives/input-number/**
src/app/shared/ui/primitives/password/**
src/app/shared/ui/primitives/select/**
src/app/shared/ui/primitives/select-multi/**
src/app/shared/ui/primitives/auto-complete/**
src/app/shared/ui/primitives/date-picker/**
src/app/shared/ui/primitives/check-box/**
src/app/shared/ui/primitives/radio-button/**
src/app/shared/ui/primitives/toggle-switch/**
form-field / field-block area
```

## Required architecture

```text
FormField
  owns label/help/error/required/optional/aria linkage
    ↓
Primitive Control
  owns value/interaction/native input behavior
    ↓
BaseInput/CVA helper
  owns only ControlValueAccessor plumbing
```

## 1. Reduce BaseInput

Remove presentation inputs such as:

```text
label
helpText
errorMessage
invalid presentation
floating-label variant
fluid layout
icon presentation
tooltip presentation
```

Target pseudocode:

```ts
@Directive()
export abstract class BaseInput<T> implements ControlValueAccessor {
  @Input() value: T | null = null;
  @Input() disabled = false;
  @Input() readonly = false;

  private onChange: (value: T | null) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  writeValue(value: T | null): void {
    this.value = value;
  }

  registerOnChange(fn: (value: T | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.disabled = disabled;
  }

  protected commit(value: T | null): void {
    this.value = value;
    this.onChange(value);
  }

  protected touch(): void {
    this.onTouched();
  }
}
```

If some primitives do not benefit from inheritance, remove inheritance rather than forcing all controls through BaseInput.

## 2. FormField becomes presentation owner

Rewrite the existing field wrapper directly; do not keep `FieldBlock` and `FormField` in parallel.

Target responsibilities:

```text
control id
label
required / optional indicator
description
help text
error text
aria-describedby composition
aria-invalid state
```

Pseudocode:

```html
<div class="form-field">
  <label [for]="controlId">
    {{ label }}
    @if (optional) { <span>Optional</span> }
  </label>

  @if (description) {
    <p [id]="descriptionId">{{ description }}</p>
  }

  <ng-content />

  @if (error) {
    <p [id]="errorId" role="alert">{{ error }}</p>
  } @else if (helpText) {
    <p [id]="helpId">{{ helpText }}</p>
  }
</div>
```

The native/custom control receives one composed `aria-describedby` string from the wrapper state.

## 3. Standardize control API

Use consistent terminology where applicable:

```ts
size?: 'sm' | 'md' | 'lg';
disabled?: boolean;
readonly?: boolean;
required?: boolean;
name?: string;
ariaLabel?: string;
ariaDescribedBy?: string | null;
```

Control-specific browser attributes must remain configurable:

```text
autocomplete
inputmode
spellcheck
min/max/step
rows
accept
```

Do not hard-code `autocomplete="off"` unless a concrete field demands it.

## 4. Remove floating labels as default

Persistent labels are the default form UX. Delete placeholder tricks such as `placeholder=" "` that exist only to activate float-label CSS.

Placeholder is supplemental input guidance, not the label.

## 5. Type option/value models

Prefer generic option types:

```ts
export interface SelectOption<TValue = unknown> {
  label: string;
  value: TValue;
  disabled?: boolean;
}
```

Avoid `any[]` in public primitive contracts.

## 6. Group semantics

For checkbox/radio groups use semantic `fieldset`/`legend` or equivalent accessible grouping. Switches are immediate binary actions, not substitutes for every boolean input.

## Tests

### Base control

```text
CVA writeValue
registerOnChange propagation
touched on blur
setDisabledState
disabled prevents interaction
readonly behavior where supported
```

### FormField

```ts
it('links label to control')
it('links help text with aria-describedby')
it('links error with aria-describedby')
it('sets aria-invalid when invalid')
it('shows optional marker when configured')
it('keeps persistent label when placeholder exists')
```

### Keyboard/a11y

```text
Input: normal Tab/focus
Select/Autocomplete: keyboard navigation
Checkbox/Radio: Space and group semantics
Date control: keyboard reachable
```

## Quality gates

```bash
npm run format:check
npm run lint
npm run build
npm test -- --watch=false
npm run build-storybook
npm run test-storybook:ci
```

## Definition of Done

- BaseInput contains CVA/control state, not field presentation.
- Floating-label types are removed from the shared foundation.
- FormField owns label/help/error/ARIA relationships.
- Core controls expose consistent size/disabled/readonly/ARIA contracts.
- Public control options are typed; no new `any` APIs introduced.
- Representative real form consumer renders correctly with persistent labels.
- Keyboard/a11y tests pass.
# Review Slice 01 — Form Reactivity + Projection Test + ESLint

Baseline: `master` at `0db81106599a8d9a2ab35c74bbae732ae6f5b630`.

Scope của slice này chỉ có 3 việc. Không sửa Table/Tree/Drawer trong slice này.

## 1. Fix FormInput reactivity

Vấn đề hiện tại:

- `engine` là plain property nhưng được đọc trong `computed()`/`effect()`.
- `config`, `loading`, `submitting` là plain inputs nhưng `layout`/`submitDisabled` dùng `computed()`.
- Sau khi bỏ revision signals, việc thay engine/config/loading/submitting có thể không invalidate computed/effect đúng cách.

### Checklist

- [ ] Không đưa `DoCheck`, revision counter hoặc JSON signature trở lại.
- [ ] `engine` phải có reactive source rõ ràng (`signal` hoặc equivalent Angular signal input architecture).
- [ ] `layout` phải recompute khi config thay đổi.
- [ ] `submitDisabled` phải recompute khi `loading`, `submitting`, readonly hoặc action state thay đổi.
- [ ] Rebuild engine phải làm các computed/effect subscribe engine mới.
- [ ] `engine: any` phải được thay bằng type rõ ràng nếu chạm vào contract này.

### Pseudo code

```ts
readonly engine = signal<FormEngine<FormModel> | null>(null);

readonly layout = computed(() => {
  const config = this.configSignal();
  return resolveLayout(config.layout);
});

readonly submitDisabled = computed(() =>
  this.loadingSignal()
  || this.submittingSignal()
  || this.readonlyMode()
  || !this.engine()?.valid()
);

private rebuildEngine(): void {
  this.engine.set(
    createFormEngine(
      this.configSignal(),
      this.contextSignal(),
      this.initialValueSignal()
    )
  );
}
```

### Tests bắt buộc

```ts
it('recomputes layout after config input changes', () => {
  setConfig({ layout: { density: 'comfortable' } });
  expect(component.layout().density).toBe('comfortable');

  setConfig({ layout: { density: 'compact' } });
  expect(component.layout().density).toBe('compact');
});
```

```ts
it('recomputes submitDisabled when loading/submitting changes', () => {
  component.loading = false;
  component.submitting = false;
  detectInputChanges();
  expect(component.submitDisabled()).toBe(false);

  component.loading = true;
  detectInputChanges();
  expect(component.submitDisabled()).toBe(true);
});
```

```ts
it('tracks the rebuilt engine instead of the old engine', () => {
  const first = component.engine();
  replaceConfigAndInitialValue();
  const second = component.engine();

  expect(second).not.toBe(first);
  expect(component.getModel()).toEqual(newModel);
});
```

---

## 2. Replace fake form-actions tests with one real HostComponent test

Vấn đề hiện tại:

- Có 2 test cùng mục tiêu.
- Cả hai dùng `document.createElement()`/`appendChild()` nên bypass Angular content projection.

### Checklist

- [ ] Xóa 2 test fake/duplicate hiện tại.
- [ ] Tạo một HostComponent có template thật chứa `<app-form-input>` và `<div form-actions>`.
- [ ] Assert đúng 1 Save và 1 Cancel.
- [ ] Click Cancel gọi host handler.
- [ ] Invalid submit không emit.
- [ ] Valid submit emit đúng 1 lần.
- [ ] `loading=true` và `submitting=true` chặn submit.

### Pseudo code

```ts
@Component({
  template: `
    <app-form-input
      [config]="config"
      [context]="context"
      [initialValue]="model"
      [loading]="loading"
      [submitting]="submitting"
      (formSubmit)="onSubmit($event)">
      <div form-actions>
        <button type="button" data-testid="cancel" (click)="onCancel()">Cancel</button>
        <button type="submit" data-testid="save">Save</button>
      </div>
    </app-form-input>
  `
})
class FormInputHostComponent {}
```

### Test chính

```ts
it('projects one action bar and submits through the real form contract', () => {
  expect(queryAll('[data-testid="save"]').length).toBe(1);
  expect(queryAll('[data-testid="cancel"]').length).toBe(1);

  click('[data-testid="cancel"]');
  expect(host.cancelSpy).toHaveBeenCalledTimes(1);

  click('[data-testid="save"]');
  expect(host.submitSpy).not.toHaveBeenCalled();

  setRequiredField('Valid title');
  click('[data-testid="save"]');
  expect(host.submitSpy).toHaveBeenCalledTimes(1);
});
```

Rule: không dùng `document.createElement()` để giả lập projection.

---

## 3. Setup real ESLint

Vấn đề hiện tại:

```json
"lint": "tsc --noEmit"
```

Đây là type-check, không phải lint.

### Checklist

- [ ] Add ESLint + TypeScript ESLint.
- [ ] Add Angular ESLint + template parser/plugin.
- [ ] Add `eslint.config.*`.
- [ ] `lint` = `eslint .`.
- [ ] `lint:fix` = `eslint . --fix`.
- [ ] Bắt unused vars/imports.
- [ ] Bắt explicit `any` trong shared core/public contracts ở mức phù hợp.
- [ ] Có Angular template accessibility lint.

### package.json target

```json
{
  "scripts": {
    "lint": "eslint .",
    "lint:fix": "eslint . --fix"
  }
}
```

---

## Gate của Slice 01

Chỉ báo `SLICE_01_COMPLETE` khi tất cả pass:

```bash
npm run format:check
npm run lint
npm run build
npm test -- --watch=false
```

Và search:

```bash
rg "DoCheck|engineRevision|inputRevision|lastContextSignature" src/app/shared/ui/patterns/form-input
```

Expected: zero.

```bash
rg '"lint": "tsc --noEmit"' package.json
```

Expected: zero.

Không mark UI-002/UI-007/UI-008 `RESOLVED` trước khi slice này pass.
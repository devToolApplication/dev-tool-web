# Phase 04 — Xóa BaseCrudPage và sửa Page Composition

## Mục tiêu

Xóa hoàn toàn `BaseCrudPage` và chuyển CRUD page về composition trực tiếp từ `PageShell`, `PageHeader`, `FormInput` và form actions.

Đây là xóa abstraction cũ, không tạo `BaseCrudPageV2`.

## Files bị loại bỏ

Toàn bộ:

```text
src/app/shared/ui/patterns/base-crud-page/
  base-crud-page.component.ts
  base-crud-page.component.html
  base-crud-page.component.css
  base-crud-page.component.spec.ts
  base-crud-page.model.ts
  base-crud-page.stories.ts
  index.ts
```

Sau khi migrate consumer cuối cùng:

```text
DELETE directory
DELETE export từ patterns/index.ts
DELETE export/import từ shared.module.ts
```

## Vì sao phải xóa

`BaseCrudPage` đang sở hữu:

- title/description;
- actions;
- info section;
- form;
- API/field errors;
- busy/submitting;
- dirty helper.

Đây là feature/page orchestration, không phải reusable visual primitive.

Nó cũng lặp responsibility với:

- `PageShell`;
- `PageHeader`;
- `FormInput`;
- `StickyFormActions`.

## Rewrite `PageShell`

Current PageShell nên được làm "dumb layout".

Giữ:

- page max width;
- header slot;
- summary slot;
- toolbar slot;
- content slot.

Bỏ:

- loading;
- error;
- empty;
- retry;

khỏi PageShell nếu hiện đang builtin.

Pseudo:

```ts
type PageWidth = 'form' | 'content' | 'data' | 'full';

@Component(...)
class PageShellComponent {
  width = input<PageWidth>('content');
}
```

Pseudo HTML:

```html
<div class="page-shell" [class]="'page-shell--' + width">
  <header class="page-shell__header">
    <ng-content select="[page-header]" />
  </header>

  <ng-content select="[page-summary]" />
  <ng-content select="[page-toolbar]" />

  <main class="page-shell__content">
    <ng-content />
  </main>
</div>
```

## Rewrite `PageHeader`

PageHeader là nguồn title duy nhất.

Pseudo API:

```ts
interface PageHeaderInputs {
  title: string;
  subtitle?: string;
  breadcrumb?: BreadcrumbItem[];
  back?: PageBackAction;
  status?: StatusPresentation;
}
```

Slots:

```text
page-header-actions
```

Nhưng Save của long form ưu tiên sticky form actions, không nhất thiết đặt ở header.

## CRUD page target

### Create

```html
<app-page-shell width="form">
  <app-page-header
    page-header
    title="Create job"
    subtitle="Configure a new scheduled job."
    [breadcrumb]="breadcrumbs"
  />

  <app-form-input
    [config]="formConfig"
    [initialValue]="initialValue"
    [apiError]="apiError()"
    [externalErrors]="fieldErrors()"
    [submitting]="saving()"
    (formSubmit)="createJob($event)"
    (dirtyChange)="dirty.set($event)"
  >
    <app-sticky-form-actions
      form-actions
      submitLabel="Create job"
      [dirty]="dirty()"
      [submitting]="saving()"
      (cancel)="cancel()"
    />
  </app-form-input>
</app-page-shell>
```

### Edit

```html
<app-page-shell width="form">
  <app-page-header
    page-header
    [title]="job().name"
    subtitle="Edit job configuration."
    [status]="jobStatus()"
  />

  @if (loading()) {
    <app-loading-skeleton type="form" />
  } @else if (loadError()) {
    <app-error-state ... />
  } @else {
    <app-form-input ... />
  }
</app-page-shell>
```

Page state nằm ở feature template, không trong PageShell.

## CRUD controller logic nằm ở feature

Pseudo:

```ts
class JobEditPage {
  job = signal<Job | null>(null);
  loading = signal(true);
  saving = signal(false);
  apiError = signal<string | null>(null);
  fieldErrors = signal<Record<string, string>>({});

  async save(value: JobFormValue) {
    this.saving.set(true);
    this.apiError.set(null);
    this.fieldErrors.set({});

    try {
      await this.jobService.update(this.jobId, value);
      this.markSaved();
    } catch (error) {
      const parsed = mapApiError(error);
      this.apiError.set(parsed.formError);
      this.fieldErrors.set(parsed.fieldErrors);
    } finally {
      this.saving.set(false);
    }
  }
}
```

Không tạo generic `CrudEditorService` trừ khi sau khi migrate nhiều page mới chứng minh có logic hoàn toàn giống nhau.

## Unsaved changes

Guard có thể giữ nếu generic.

Page expose dirty state:

```ts
canDeactivate(): boolean | Observable<boolean> {
  return !this.dirty() || this.confirmLeave();
}
```

Nếu existing `unsaved-changes.guard.ts` dùng tốt thì giữ và giảm coupling.

## `ConfigTemplateForm`

Nếu wrapper hiện chỉ:

```text
SectionPanel
  FormInput
SectionPanel
  Advanced JSON
```

thì bỏ wrapper này khi migrate consumer.

Feature compose trực tiếp.

## Test plan

### Compile migration

Search repo phải trả 0 reference tới:

```text
BaseCrudPageComponent
BaseCrudPageConfig
app-base-crud-page
```

### Unit — PageShell

- width class đúng.
- content projection đúng.
- không tự render loading/error/empty.
- không sở hữu API/business state.

### Unit — PageHeader

- một h1 duy nhất.
- breadcrumb semantics.
- back action keyboard.
- status không phá accessible heading.

### Feature integration — Job Create/Edit

- load success.
- load error + retry.
- valid save.
- invalid client-side không gọi service.
- API general error.
- API field error.
- save loading prevents duplicate submit.
- dirty guard.
- successful save resets dirty state.
- cancel behavior.

### Responsive

Desktop:

```text
PageHeader
Form content max-width
Sticky action bar
```

Mobile:

- header action không overflow.
- primary save full-width hoặc appropriate layout.
- section nav chuyển compact.
- no nested horizontal scrolling.

### Accessibility

- chỉ một page h1.
- form sections dùng h2/h3 hợp lý.
- page state error focus/announcement hợp lý.
- action order keyboard hợp lý.

## Definition of Done

- `base-crud-page` directory deleted.
- không export BaseCrudPage trong SharedModule/pattern index.
- ít nhất Job Create/Edit đã compose trực tiếp.
- không có duplicate heading do PageShell + CRUD wrapper.
- PageShell không chứa application state branching.
- CRUD logic nằm ở feature.

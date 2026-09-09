import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-unsupported-task-screen',
  standalone: false,
  template: `
    <div class="unsupported-task-screen p-4">
      <app-empty-state
        title="userTask.unsupported.title"
        description="userTask.unsupported.description"
        iconClass="pi pi-exclamation-triangle"
      ></app-empty-state>
      @if (formKey) {
        <p class="text-xs text-muted-foreground text-center mt-2">
          formKey: {{ formKey }}
        </p>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UnsupportedTaskScreenComponent {
  @Input() formKey?: string;
}

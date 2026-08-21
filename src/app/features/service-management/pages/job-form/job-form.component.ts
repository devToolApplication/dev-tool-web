import { Component, inject, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastService } from '@core/notifications/toast.service';
import { BaseCrudPageComponent } from '@shared/ui/patterns/base-crud-page/base-crud-page.component';
import type { BaseCrudPageActionConfig } from '@shared/ui/patterns/base-crud-page';
import type { FormContext } from '@shared/ui/patterns/form-input/models/form-config.model';
import { buildJobFormScreen } from '../../model/service-management.config';
import type { ServiceFormMode } from '../../model/service-management.model';

@Component({
  selector: 'app-job-form',
  standalone: false,
  templateUrl: './job-form.component.html',
  styleUrl: './job-form.component.css',
})
export class JobFormComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);

  @ViewChild(BaseCrudPageComponent) private readonly crudPage?: BaseCrudPageComponent;

  readonly mode = this.route.snapshot.data['mode'] as ServiceFormMode;
  readonly screen = buildJobFormScreen(this.mode, this.route.snapshot.paramMap.get('id') ?? undefined);
  readonly context: FormContext = { user: null, mode: this.mode };

  model = this.screen.model;

  hasUnsavedChanges(): boolean {
    return this.crudPage?.hasUnsavedChanges() ?? false;
  }

  onValueChange(value: unknown): void {
    this.model = (value ?? {}) as Record<string, unknown>;
  }

  onAction(action: BaseCrudPageActionConfig): void {
    if (action.id === 'cancel') {
      void this.navigateBack();
    }
  }

  onSubmit(): void {
    this.crudPage?.markFormPristine();
    this.toastService.success(this.mode === 'create' ? 'createSuccess' : 'updateSuccess');
    void this.navigateBack();
  }

  private async navigateBack(): Promise<void> {
    await this.router.navigateByUrl(this.screen.backLink);
  }
}

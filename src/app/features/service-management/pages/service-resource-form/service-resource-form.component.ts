import { Component, inject, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastService } from '@core/notifications/toast.service';
import { BaseCrudPageComponent } from '@shared/ui/patterns/base-crud-page/base-crud-page.component';
import type { BaseCrudPageActionConfig } from '@shared/ui/patterns/base-crud-page';
import type { FormContext } from '@shared/ui/patterns/form-input/models/form-config.model';
import { buildServiceResourceFormScreen } from '../../model/service-management.config';
import type {
  ManagedServiceId,
  ServiceFormMode,
  ServiceResourceKind,
} from '../../model/service-management.model';

interface ServiceResourceFormRouteData {
  serviceId: ManagedServiceId;
  resourceKind: ServiceResourceKind;
  mode: ServiceFormMode;
}

@Component({
  selector: 'app-service-resource-form',
  standalone: false,
  templateUrl: './service-resource-form.component.html',
  styleUrl: './service-resource-form.component.css',
})
export class ServiceResourceFormComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);

  @ViewChild(BaseCrudPageComponent) private readonly crudPage?: BaseCrudPageComponent;

  readonly screen = buildServiceResourceFormScreen(
    this.routeData.serviceId,
    this.routeData.resourceKind,
    this.routeData.mode,
    this.route.snapshot.paramMap.get('id') ?? undefined,
  );
  readonly context: FormContext = { user: null, mode: this.routeData.mode };

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
    this.toastService.success(this.screen.mode === 'create' ? 'createSuccess' : 'updateSuccess');
    void this.navigateBack();
  }

  private async navigateBack(): Promise<void> {
    await this.router.navigateByUrl(this.screen.backLink);
  }

  private get routeData(): ServiceResourceFormRouteData {
    return this.route.snapshot.data as ServiceResourceFormRouteData;
  }
}

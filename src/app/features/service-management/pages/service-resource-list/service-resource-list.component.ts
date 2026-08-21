import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import type { ActionToolbarAction } from '@shared/ui/layout/action-toolbar/action-toolbar.component';
import type { TableAction } from '@shared/ui/patterns/table/models/table-config.model';
import {
  buildServiceResourceListScreen,
  filterServiceResources,
  resourceDetailItems,
} from '../../model/service-management.config';
import type {
  ManagedServiceId,
  ServiceResourceKind,
  ServiceResourceRecord,
} from '../../model/service-management.model';

interface ServiceResourceRouteData {
  serviceId: ManagedServiceId;
  resourceKind: ServiceResourceKind;
}

@Component({
  selector: 'app-service-resource-list',
  standalone: false,
  templateUrl: './service-resource-list.component.html',
  styleUrl: './service-resource-list.component.css',
})
export class ServiceResourceListComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly filterValues = signal<Record<string, unknown>>({});
  readonly selectedRecord = signal<ServiceResourceRecord | null>(null);
  readonly drawerOpen = signal(false);

  readonly screen = buildServiceResourceListScreen(this.routeData.serviceId, this.routeData.resourceKind);
  readonly records = computed(() => filterServiceResources(this.screen.records, this.filterValues()));
  readonly selectedRecordDetails = computed(() => {
    const record = this.selectedRecord();
    return record ? resourceDetailItems(record) : [];
  });

  onToolbarAction(action: ActionToolbarAction): void {
    if (action.id === 'create') {
      void this.router.navigate(['create'], { relativeTo: this.route });
    }
  }

  onFilterChange(values: Record<string, unknown>): void {
    this.filterValues.set(values);
  }

  onFilterReset(): void {
    this.filterValues.set({});
  }

  openDetail(record: ServiceResourceRecord): void {
    this.selectedRecord.set(record);
    this.drawerOpen.set(true);
  }

  onTableAction(event: { action: TableAction; row: ServiceResourceRecord }): void {
    switch (event.action.id) {
      case 'view':
        this.openDetail(event.row);
        break;
      case 'edit':
        void this.router.navigate([event.row.id, 'edit'], { relativeTo: this.route });
        break;
      default:
        break;
    }
  }

  editSelectedRecord(): void {
    const record = this.selectedRecord();
    if (!record) {
      return;
    }

    void this.router.navigate([record.id, 'edit'], { relativeTo: this.route });
  }

  closeDrawer(): void {
    this.drawerOpen.set(false);
  }

  private get routeData(): ServiceResourceRouteData {
    return this.route.snapshot.data as ServiceResourceRouteData;
  }
}

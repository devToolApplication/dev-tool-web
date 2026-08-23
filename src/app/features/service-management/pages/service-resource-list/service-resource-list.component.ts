import { Component, computed, inject, signal } from '@angular/core';
import { I18nService } from '@core/i18n/i18n.service';
import { ActivatedRoute, Router } from '@angular/router';
import type { ActionToolbarAction } from '@shared/ui/layout/action-toolbar/action-toolbar.component';
import type { TableAction, TableDensity, TableExportRequest } from '@shared/ui/patterns/table';
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
import {
  exportTableRequestAsCsv,
  readTableViewState,
  type ServiceManagementTableViewState,
  writeTableViewState,
} from '../../utils/table-view-state';

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
  private readonly i18nService = inject(I18nService);
  private readonly resourceRouteData = this.route.snapshot.data as ServiceResourceRouteData;
  private readonly tableStateKey = `service-management.${this.resourceRouteData.serviceId}.${this.resourceRouteData.resourceKind}.table`;
  private readonly tableExportFileName = `service-management-${this.resourceRouteData.serviceId}-${this.resourceRouteData.resourceKind}.csv`;

  readonly filterValues = signal<Record<string, unknown>>({});
  readonly selectedRecord = signal<ServiceResourceRecord | null>(null);
  readonly drawerOpen = signal(false);

  readonly screen = buildServiceResourceListScreen(
    this.resourceRouteData.serviceId,
    this.resourceRouteData.resourceKind,
  );
  readonly tableViewState = signal<ServiceManagementTableViewState>(
    readTableViewState(this.tableStateKey, this.screen.table),
  );
  readonly records = computed(() =>
    filterServiceResources(this.screen.records, this.filterValues()),
  );
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

  onTableAction(event: {
    action: TableAction<ServiceResourceRecord>;
    row: ServiceResourceRecord;
  }): void {
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

  onTableColumnVisibilityChange(columnVisibility: string[]): void {
    this.updateTableViewState({ columnVisibility });
  }

  onTableDensityChange(density: TableDensity): void {
    this.updateTableViewState({ density });
  }

  onTableExport(request: TableExportRequest<ServiceResourceRecord>): void {
    exportTableRequestAsCsv(request, this.screen.table, this.tableExportFileName, {
      formatHeader: (header) => this.i18nService.t(header),
    });
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

  private updateTableViewState(patch: Partial<ServiceManagementTableViewState>): void {
    const nextState = { ...this.tableViewState(), ...patch };
    this.tableViewState.set(nextState);
    writeTableViewState(this.tableStateKey, nextState);
  }
}

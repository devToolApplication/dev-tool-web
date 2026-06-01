import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DataFormResponse } from '../data-access/models/data-form.model';
import { DataFormService } from '../data-access/api/data-form.service';
import { BasePagedList } from '../../../../shared/ui/table/component/table/base-paged-list';
import { TableConfig } from '../../../../shared/ui/table/models/table-config.model';

@Component({
  selector: 'app-data-form-list',
  standalone: false,
  templateUrl: './data-form-list.component.html'
})
export class DataFormListComponent extends BasePagedList<DataFormResponse> implements OnInit {
  readonly tableConfig: TableConfig = {
    title: 'dataForm.list.title',
    stateKey: 'admin.data-forms',
    emptyTitle: 'shared.table.emptyTitle',
    emptyDescription: 'shared.table.emptyDescription',
    errorTitle: 'dataForm.list.loadError',
    columns: [
      { field: 'formName', header: 'dataForm.list.columns.formName', sortable: true },
      { field: 'formCode', header: 'dataForm.list.columns.formCode', sortable: true },
      { field: 'status', header: 'dataForm.list.columns.status', sortable: true },
      { field: 'updatedAt', header: 'dataForm.list.columns.updatedAt', sortable: true }
    ],
    filters: [
      { field: 'formName', label: 'dataForm.list.columns.formName', placeholder: 'dataForm.list.searchPlaceholder' },
      {
        field: 'status',
        label: 'dataForm.list.columns.status',
        type: 'select',
        options: [
          { label: 'shared.status.active', value: 'ACTIVE' },
          { label: 'shared.status.inactive', value: 'INACTIVE' }
        ]
      }
    ]
  };

  constructor(
    private readonly dataFormService: DataFormService,
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {
    super(route, router, 10, ['updatedAt,desc']);
  }

  ngOnInit(): void {
    this.loadPage();
  }

  onCreate(): void {
    void this.router.navigate(['/admin/data-forms/create']);
  }

  loadPage(): void {
    this.runPageRequest(
      this.dataFormService.getPage(this.page, this.pageSize, this.sorts, this.filters),
      { errorMessage: 'dataForm.list.loadError' }
    );
  }
}

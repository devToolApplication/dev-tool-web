import { Component, OnInit, TemplateRef, ViewChild, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { ToastService } from '@core/notifications/toast.service';
import { I18nService } from '@core/i18n/i18n.service';
import type { TableAction } from '@shared/ui/patterns/table/models/table-config.model';
import { KocCampaignService } from '../../services/koc-campaign.service';
import {
  KocCampaignItem,
  KocCampaignQueryParams,
  KocCandidateItem,
} from '../../models/koc-campaign.model';
import {
  buildKocCampaignFilterFields,
  buildKocCampaignListActions,
  buildKocCampaignTableConfig,
  buildKocCandidateTableConfig,
  kocCampaignDetailItems,
} from '../../models/koc-campaign.config';

@Component({
  selector: 'app-koc-campaign-list',
  standalone: false,
  templateUrl: './koc-campaign-list.component.html',
  styleUrl: './koc-campaign-list.component.css',
})
export class KocCampaignListComponent implements OnInit {
  private readonly campaignService = inject(KocCampaignService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly i18n = inject(I18nService);

  readonly tableConfig = buildKocCampaignTableConfig();
  readonly candidateTableConfig = buildKocCandidateTableConfig();
  readonly actions = buildKocCampaignListActions();
  readonly filterFields = buildKocCampaignFilterFields();

  @ViewChild('workflowStatusCellTpl') workflowStatusCellTpl?: TemplateRef<{ row: KocCampaignItem }>;
  readonly activeStepDetail = signal<string | null>(null);

  readonly campaigns = signal<KocCampaignItem[]>([]);
  readonly loading = signal(false);
  readonly totalRecords = signal(0);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);
  readonly filterValues = signal<Record<string, unknown>>({});

  // Drawer detail & candidates
  readonly drawerOpen = signal(false);
  readonly selectedCampaign = signal<KocCampaignItem | null>(null);
  readonly approvedCandidates = signal<KocCandidateItem[]>([]);
  readonly candidatesLoading = signal(false);
  readonly detailItems = signal<ReturnType<typeof kocCampaignDetailItems>>([]);

  // Create / Edit / Clone Dialog
  formDialogVisible = false;
  isEdit = false;
  isClone = false;
  editCampaignId: string | null = null;
  cloneSourceId: string | null = null;
  formSubmitting = signal(false);

  // Delete Confirmation Dialog
  deleteDialogVisible = false;
  readonly campaignToDelete = signal<KocCampaignItem | null>(null);
  readonly deleting = signal(false);

  form: FormGroup = this.fb.group({
    name: ['', [Validators.required]],
    niche: ['TECH'],
    targetCount: [5, [Validators.required, Validators.min(1)]],
    minScore: [70.0, [Validators.required, Validators.min(0), Validators.max(100)]],
    searchPrompt: [''],
    reviewPrompt: [''],
  });

  get nicheOptions(): { label: string; value: string }[] {
    return [
      { label: this.i18n.t('kocCampaign.niche.tech') || 'Công nghệ (TECH)', value: 'TECH' },
      { label: this.i18n.t('kocCampaign.niche.beauty') || 'Làm đẹp & Mỹ phẩm (BEAUTY)', value: 'BEAUTY' },
      { label: this.i18n.t('kocCampaign.niche.fashion') || 'Thời trang (FASHION)', value: 'FASHION' },
      { label: this.i18n.t('kocCampaign.niche.lifestyle') || 'Đời sống (LIFESTYLE)', value: 'LIFESTYLE' },
      { label: this.i18n.t('kocCampaign.niche.food') || 'Ẩm thực (FOOD)', value: 'FOOD' },
      { label: this.i18n.t('kocCampaign.niche.fitness') || 'Sức khỏe (FITNESS)', value: 'FITNESS' },
      { label: this.i18n.t('kocCampaign.niche.travel') || 'Du lịch (TRAVEL)', value: 'TRAVEL' },
    ];
  }

  ngOnInit(): void {
    void this.loadData();
  }

  async loadData(): Promise<void> {
    this.loading.set(true);
    try {
      const filters = this.filterValues();
      const params: KocCampaignQueryParams = {
        page: this.pageIndex(),
        size: this.pageSize(),
        keyword: (filters['keyword'] as string) || undefined,
        niche: (filters['niche'] as string) || undefined,
        workflowStatus: (filters['workflowStatus'] as string) || undefined,
      };

      const res = await firstValueFrom(this.campaignService.getCampaignPage(params));
      const items = res?.data || (res as any)?.content || [];
      this.campaigns.set(items);
      this.totalRecords.set(res?.metadata?.totalElements || (res as any)?.totalElements || items.length);
    } catch (err: unknown) {
      this.toast.error(extractErrorMessage(err));
    } finally {
      this.loading.set(false);
    }
  }

  onFilterChange(values: Record<string, unknown>): void {
    this.filterValues.set(values);
    this.pageIndex.set(0);
    void this.loadData();
  }

  onFilterReset(): void {
    this.filterValues.set({});
    this.pageIndex.set(0);
    void this.loadData();
  }

  onPageChange(event: { page: number; rows: number }): void {
    this.pageIndex.set(event.page);
    this.pageSize.set(event.rows);
    void this.loadData();
  }

  onToolbarAction(action: { id: string }): void {
    if (action.id === 'create') {
      this.openCreateDialog();
    } else if (action.id === 'refresh') {
      void this.loadData();
    }
  }

  onTableAction(event: { action: TableAction<KocCampaignItem>; row: KocCampaignItem }): void {
    switch (event.action.id) {
      case 'viewCandidates':
        void this.openDetail(event.row);
        break;
      case 'approveTask':
        void this.router.navigate(['/tasks'], {
          queryParams: { businessKey: event.row.id },
        });
        break;
      case 'edit':
        this.openEditDialog(event.row);
        break;
      case 'clone':
        this.openCloneDialog(event.row);
        break;
      case 'delete':
        void this.handleDelete(event.row);
        break;
      default:
        break;
    }
  }

  async openDetail(campaign: KocCampaignItem): Promise<void> {
    this.selectedCampaign.set(campaign);
    this.detailItems.set(kocCampaignDetailItems(campaign));
    this.drawerOpen.set(true);
    this.candidatesLoading.set(true);

    try {
      const candidates = await firstValueFrom(this.campaignService.getCampaignCandidates(campaign.id));
      this.approvedCandidates.set(candidates);
    } catch (err: unknown) {
      this.toast.error(extractErrorMessage(err));
      this.approvedCandidates.set([]);
    } finally {
      this.candidatesLoading.set(false);
    }
  }

  closeDrawer(): void {
    this.drawerOpen.set(false);
    this.selectedCampaign.set(null);
    this.approvedCandidates.set([]);
  }

  onApproveTaskFromDrawer(): void {
    const campaign = this.selectedCampaign();
    this.closeDrawer();
    if (campaign) {
      void this.router.navigate(['/tasks'], {
        queryParams: { businessKey: campaign.id },
      });
    }
  }

  openCreateDialog(): void {
    this.isEdit = false;
    this.isClone = false;
    this.editCampaignId = null;
    this.cloneSourceId = null;
    this.form.reset({
      name: '',
      niche: 'TECH',
      targetCount: 5,
      minScore: 70.0,
      searchPrompt: '',
      reviewPrompt: '',
    });
    this.formDialogVisible = true;
  }

  openEditDialog(campaign: KocCampaignItem): void {
    this.isEdit = true;
    this.isClone = false;
    this.editCampaignId = campaign.id;
    this.cloneSourceId = null;
    this.form.reset({
      name: campaign.name,
      niche: campaign.niche || 'TECH',
      targetCount: campaign.targetCount || 5,
      minScore: campaign.minScore || 70.0,
      searchPrompt: campaign.searchPrompt || '',
      reviewPrompt: campaign.reviewPrompt || '',
    });
    this.formDialogVisible = true;
  }

  openCloneDialog(campaign: KocCampaignItem): void {
    this.isEdit = false;
    this.isClone = true;
    this.editCampaignId = null;
    this.cloneSourceId = campaign.id;
    const prefix = this.i18n.t('kocCampaign.clonePrefix') || '(Bản sao)';
    this.form.reset({
      name: `${prefix} ${campaign.name}`,
      niche: campaign.niche || 'TECH',
      targetCount: campaign.targetCount || 5,
      minScore: campaign.minScore || 70.0,
      searchPrompt: campaign.searchPrompt || '',
      reviewPrompt: campaign.reviewPrompt || '',
    });
    this.formDialogVisible = true;
  }

  closeFormDialog(): void {
    this.formDialogVisible = false;
    this.editCampaignId = null;
    this.cloneSourceId = null;
    this.isClone = false;
  }

  async submitForm(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.formSubmitting.set(true);
    try {
      const val = this.form.value;
      if (this.isClone && this.cloneSourceId) {
        await firstValueFrom(this.campaignService.cloneCampaign(this.cloneSourceId, val));
        this.toast.success('kocCampaign.toast.cloneSuccess');
      } else if (this.isEdit && this.editCampaignId) {
        await firstValueFrom(this.campaignService.updateCampaign(this.editCampaignId, val));
        this.toast.success('kocCampaign.toast.updateSuccess');
      } else {
        await firstValueFrom(this.campaignService.createAndStartCampaign(val));
        this.toast.success('kocCampaign.toast.createSuccess');
      }
      this.closeFormDialog();
      await this.loadData();
    } catch (err: unknown) {
      this.toast.error(extractErrorMessage(err));
    } finally {
      this.formSubmitting.set(false);
    }
  }

  handleDelete(campaign: KocCampaignItem): void {
    this.campaignToDelete.set(campaign);
    this.deleteDialogVisible = true;
  }

  cancelDelete(): void {
    this.deleteDialogVisible = false;
    this.campaignToDelete.set(null);
  }

  async executeDelete(): Promise<void> {
    const campaign = this.campaignToDelete();
    if (!campaign) return;

    this.deleting.set(true);
    try {
      await firstValueFrom(this.campaignService.deleteCampaign(campaign.id));
      this.toast.success('kocCampaign.toast.deleteSuccess');
      this.deleteDialogVisible = false;
      this.campaignToDelete.set(null);
      await this.loadData();
    } catch (err: unknown) {
      this.toast.error(extractErrorMessage(err));
    } finally {
      this.deleting.set(false);
    }
  }

  formatNumber(num?: number): string {
    if (num == null) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toLocaleString();
  }
}

function extractErrorMessage(error: unknown): string {
  if (error && typeof error === 'object') {
    const obj = error as { error?: { errorMessage?: string; message?: string }; errorMessage?: string; message?: string };
    if (obj.error?.errorMessage) return obj.error.errorMessage;
    if (obj.error?.message) return obj.error.message;
    if (obj.errorMessage) return obj.errorMessage;
    if (obj.message) return obj.message;
  }
  return typeof error === 'string' ? error : 'Đã có lỗi xảy ra';
}

import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { ToastService } from '@core/notifications/toast.service';
import { KeycloakService } from '@core/auth/keycloak.service';
import { I18nService } from '@core/i18n/i18n.service';
import { KocCampaignService } from '../../services/koc-campaign.service';
import {
  KocCandidateApprovalItem,
  WorkflowTask,
} from '../../models/koc-campaign.model';
import {
  buildKocCandidateApprovalTableConfig,
} from '../../models/koc-campaign.config';

export type KocTaskType = 'APPROVE' | 'DECISION' | 'MANUAL_2FA' | 'GENERAL';

@Component({
  selector: 'app-koc-candidate-approval',
  standalone: false,
  templateUrl: './koc-candidate-approval.component.html',
  styleUrl: './koc-candidate-approval.component.css',
})
export class KocCandidateApprovalComponent implements OnInit {
  private readonly campaignService = inject(KocCampaignService);
  private readonly toast = inject(ToastService);
  private readonly keycloak = inject(KeycloakService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly i18n = inject(I18nService);

  readonly candidateTableConfig = buildKocCandidateApprovalTableConfig();

  readonly tasks = signal<WorkflowTask[]>([]);
  readonly loading = signal(false);
  readonly campaignId = signal<string | null>(null);

  // Review Drawer State
  readonly drawerOpen = signal(false);
  readonly selectedTask = signal<WorkflowTask | null>(null);
  readonly taskVariables = signal<Record<string, unknown>>({});
  readonly candidates = signal<KocCandidateApprovalItem[]>([]);
  readonly candidatesLoading = signal(false);
  readonly completing = signal(false);

  // Action Confirmation Dialog
  readonly confirmDialogVisible = signal(false);
  readonly confirmDialogHeader = signal('');
  readonly confirmDialogMessage = signal('');
  readonly confirmDialogBtnLabel = signal('confirm');
  readonly confirmDialogVariant = signal<'primary' | 'destructive'>('primary');
  private confirmAction: (() => Promise<void>) | null = null;

  readonly currentTaskType = computed<KocTaskType>(() => {
    const task = this.selectedTask();
    return task ? this.getTaskType(task) : 'GENERAL';
  });

  ngOnInit(): void {
    const queryCampaignId = this.route.snapshot.queryParamMap.get('campaignId');
    if (queryCampaignId) {
      this.campaignId.set(queryCampaignId);
    }
    void this.loadTasks();
  }

  get currentUsername(): string {
    return (this.keycloak.userInfo as Record<string, any> | undefined)?.['preferred_username'] || 'admin';
  }

  selectedCandidatesCount(): number {
    return this.candidates().filter((c) => c.selected).length;
  }

  getTaskType(task: WorkflowTask): KocTaskType {
    const key = task.taskDefinitionKey || '';
    const name = (task.name || '').toLowerCase();
    if (key === 'userTaskDiscoveryDecision' || name.includes('decision') || name.includes('quyết định')) {
      return 'DECISION';
    }
    if (key === 'userTaskManualApprove' || name.includes('2fa') || name.includes('chạm số')) {
      return 'MANUAL_2FA';
    }
    if (
      key === 'userTaskApproveCandidates' ||
      name.includes('koc') ||
      name.includes('candidate') ||
      name.includes('phê duyệt')
    ) {
      return 'APPROVE';
    }
    return 'GENERAL';
  }

  getTaskTypeLabel(task: WorkflowTask): string {
    const type = this.getTaskType(task);
    switch (type) {
      case 'APPROVE':
        return 'kocApproval.taskType.approve';
      case 'DECISION':
        return 'kocApproval.taskType.decision';
      case 'MANUAL_2FA':
        return 'kocApproval.taskType.manual2fa';
      default:
        return 'kocApproval.taskType.general';
    }
  }

  getTaskTypeVariant(task: WorkflowTask): 'info' | 'warning' | 'success' | 'default' {
    const type = this.getTaskType(task);
    switch (type) {
      case 'APPROVE':
        return 'success';
      case 'DECISION':
        return 'warning';
      case 'MANUAL_2FA':
        return 'info';
      default:
        return 'default';
    }
  }

  isKocTask(task: WorkflowTask): boolean {
    const key = task.taskDefinitionKey || '';
    const name = (task.name || '').toLowerCase();
    return (
      key === 'userTaskApproveCandidates' ||
      key === 'userTaskDiscoveryDecision' ||
      key === 'userTaskManualApprove' ||
      name.includes('koc') ||
      name.includes('candidate') ||
      name.includes('decision') ||
      name.includes('phê duyệt') ||
      name.includes('2fa') ||
      name.includes('tìm kiếm')
    );
  }

  clearCampaignFilter(): void {
    this.campaignId.set(null);
    void this.router.navigate(['/koc/approval']);
    void this.loadTasks();
  }

  async loadTasks(): Promise<void> {
    this.loading.set(true);
    try {
      const currentCampaignId = this.campaignId();
      const res = await firstValueFrom(
        this.campaignService.getPendingApprovalTasks(0, 50, currentCampaignId || undefined)
      );
      const allTasks = (res as any)?.data || (res as any)?.content || [];
      const kocTasks = allTasks.filter((t: WorkflowTask) => this.isKocTask(t));
      this.tasks.set(kocTasks.length > 0 ? kocTasks : allTasks);

      // If taskId passed via queryParam, auto open
      const queryTaskId = this.route.snapshot.queryParamMap.get('taskId');
      if (queryTaskId) {
        const matched = this.tasks().find((t) => t.id === queryTaskId);
        if (matched) {
          void this.openReview(matched);
        }
      }
    } catch (err: unknown) {
      this.toast.error(extractErrorMessage(err));
    } finally {
      this.loading.set(false);
    }
  }

  async openReview(task: WorkflowTask): Promise<void> {
    this.selectedTask.set(task);
    this.drawerOpen.set(true);
    this.candidatesLoading.set(true);

    try {
      const vars = await firstValueFrom(this.campaignService.getTaskVariables(task.id));
      this.taskVariables.set(vars);

      const rawCandidates =
        (vars['qualifiedCandidates'] as any[]) ||
        (vars['allReviewedCandidates'] as any[]) ||
        (vars['reviewedCandidates'] as any[]) ||
        [];
      const mapped: KocCandidateApprovalItem[] = rawCandidates.map((item) => ({
        externalProfileId: item.externalProfileId || item.profileId || item.id,
        fullName: item.fullName || item.name || 'N/A',
        profileUrl: item.profileUrl || item.url || '',
        platform: item.platform || 'FACEBOOK',
        followerCount: item.followerCount || item.followers || 0,
        engagementRate: item.engagementRate || 0,
        score: item.score != null ? Number(item.score) : 0,
        analysis: item.analysis || {
          strengths: item.strengths || [],
          weaknesses: item.weaknesses || [],
          matchReason: item.matchReason || '',
        },
        selected: (item.score != null ? Number(item.score) : 0) >= (Number(vars['minScore']) || 70.0),
      }));

      this.candidates.set(mapped);
    } catch (err: unknown) {
      this.toast.error(extractErrorMessage(err));
      this.candidates.set([]);
    } finally {
      this.candidatesLoading.set(false);
    }
  }

  closeDrawer(): void {
    this.drawerOpen.set(false);
    this.selectedTask.set(null);
    this.candidates.set([]);
    this.taskVariables.set({});
  }

  toggleCandidate(candidate: KocCandidateApprovalItem): void {
    candidate.selected = !candidate.selected;
    this.candidates.update((list) => [...list]);
  }

  selectAll(): void {
    this.candidates.update((list) =>
      list.map((c) => ({ ...c, selected: true }))
    );
  }

  deselectAll(): void {
    this.candidates.update((list) =>
      list.map((c) => ({ ...c, selected: false }))
    );
  }

  async claimTask(task: WorkflowTask): Promise<void> {
    try {
      await firstValueFrom(this.campaignService.claimTask(task.id, this.currentUsername));
      this.toast.success('workflowStudio.lifecycle.taskClaimSuccess');
      await this.loadTasks();
    } catch (err: unknown) {
      this.toast.error(extractErrorMessage(err));
    }
  }

  async unclaimTask(task: WorkflowTask): Promise<void> {
    try {
      await firstValueFrom(this.campaignService.unclaimTask(task.id));
      this.toast.success('workflowStudio.lifecycle.taskUnclaimSuccess');
      await this.loadTasks();
    } catch (err: unknown) {
      this.toast.error(extractErrorMessage(err));
    }
  }

  openConfirm(
    header: string,
    message: string,
    btnLabel: string,
    variant: 'primary' | 'destructive',
    action: () => Promise<void>
  ): void {
    this.confirmDialogHeader.set(header);
    this.confirmDialogMessage.set(message);
    this.confirmDialogBtnLabel.set(btnLabel);
    this.confirmDialogVariant.set(variant);
    this.confirmAction = action;
    this.confirmDialogVisible.set(true);
  }

  cancelConfirm(): void {
    this.confirmDialogVisible.set(false);
    this.confirmAction = null;
  }

  async executeConfirm(): Promise<void> {
    if (!this.confirmAction) return;
    const action = this.confirmAction;
    this.confirmDialogVisible.set(false);
    this.confirmAction = null;
    await action();
  }

  approveSelected(): void {
    const task = this.selectedTask();
    if (!task) return;

    const selected = this.candidates().filter((c) => c.selected);
    if (selected.length === 0) {
      this.toast.error('kocApproval.toast.selectAtLeastOne');
      return;
    }

    const templateMsg = this.i18n.t('kocApproval.confirmApprove');
    const msg = templateMsg.replace('{count}', String(selected.length));

    this.openConfirm(
      'kocApproval.dialog.approveHeader',
      msg,
      'kocApproval.action.approveSelectedSimple',
      'primary',
      async () => {
        this.completing.set(true);
        try {
          await firstValueFrom(
            this.campaignService.completeApprovalTask(task.id, selected, true)
          );
          this.toast.success('kocApproval.toast.approveSuccess');
          this.closeDrawer();
          await this.loadTasks();
        } catch (err: unknown) {
          this.toast.error(extractErrorMessage(err));
        } finally {
          this.completing.set(false);
        }
      }
    );
  }

  rejectAll(): void {
    const task = this.selectedTask();
    if (!task) return;

    const msg = this.i18n.t('kocApproval.confirmReject');
    this.openConfirm(
      'kocApproval.dialog.rejectHeader',
      msg,
      'kocApproval.action.rejectAll',
      'destructive',
      async () => {
        this.completing.set(true);
        try {
          await firstValueFrom(
            this.campaignService.completeApprovalTask(task.id, [], false)
          );
          this.toast.success('kocApproval.toast.rejectSuccess');
          this.closeDrawer();
          await this.loadTasks();
        } catch (err: unknown) {
          this.toast.error(extractErrorMessage(err));
        } finally {
          this.completing.set(false);
        }
      }
    );
  }

  submitDiscoveryDecision(decision: 'FIND_MORE' | 'STOP'): void {
    const task = this.selectedTask();
    if (!task) return;

    const msgKey =
      decision === 'FIND_MORE'
        ? 'kocApproval.confirmDecisionFindMore'
        : 'kocApproval.confirmDecisionStop';
    const btnLabel =
      decision === 'FIND_MORE'
        ? 'kocApproval.decision.findMore'
        : 'kocApproval.decision.stop';

    this.openConfirm(
      'kocApproval.dialog.decisionHeader',
      this.i18n.t(msgKey),
      btnLabel,
      'primary',
      async () => {
        this.completing.set(true);
        try {
          await firstValueFrom(this.campaignService.completeDiscoveryDecisionTask(task.id, decision));
          this.toast.success('kocApproval.toast.decisionSuccess');
          this.closeDrawer();
          await this.loadTasks();
        } catch (err: unknown) {
          this.toast.error(extractErrorMessage(err));
        } finally {
          this.completing.set(false);
        }
      }
    );
  }

  confirmManual2fa(): void {
    const task = this.selectedTask();
    if (!task) return;

    this.openConfirm(
      'kocApproval.dialog.manual2faHeader',
      this.i18n.t('kocApproval.confirmManual2fa'),
      'kocApproval.manual2fa.confirm',
      'primary',
      async () => {
        this.completing.set(true);
        try {
          await firstValueFrom(this.campaignService.completeManual2faTask(task.id));
          this.toast.success('kocApproval.toast.manual2faSuccess');
          this.closeDrawer();
          await this.loadTasks();
        } catch (err: unknown) {
          this.toast.error(extractErrorMessage(err));
        } finally {
          this.completing.set(false);
        }
      }
    );
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
    const obj = error as {
      error?: { errorMessage?: string; message?: string };
      errorMessage?: string;
      message?: string;
    };
    if (obj.error?.errorMessage) return obj.error.errorMessage;
    if (obj.error?.message) return obj.error.message;
    if (obj.errorMessage) return obj.errorMessage;
    if (obj.message) return obj.message;
  }
  return typeof error === 'string' ? error : 'Đã có lỗi xảy ra';
}

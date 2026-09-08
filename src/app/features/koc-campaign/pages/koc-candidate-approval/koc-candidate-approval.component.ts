import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { ToastService } from '@core/notifications/toast.service';
import { KeycloakService } from '@core/auth/keycloak.service';
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

      const rawCandidates = (vars['reviewedCandidates'] as any[]) || [];
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

  async approveSelected(): Promise<void> {
    const task = this.selectedTask();
    if (!task) return;

    const selected = this.candidates().filter((c) => c.selected);
    if (selected.length === 0) {
      this.toast.error('kocApproval.toast.selectAtLeastOne');
      return;
    }

    const confirmed = window.confirm(
      `Bạn có chắc chắn muốn phê duyệt ${selected.length} KOC này để lưu chính thức vào hệ thống?`
    );
    if (!confirmed) return;

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

  async rejectAll(): Promise<void> {
    const task = this.selectedTask();
    if (!task) return;

    const confirmed = window.confirm(
      'Bạn có chắc chắn muốn từ chối toàn bộ ứng viên và kết thúc nhiệm vụ?'
    );
    if (!confirmed) return;

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

  async submitDiscoveryDecision(decision: 'FIND_MORE' | 'STOP'): Promise<void> {
    const task = this.selectedTask();
    if (!task) return;

    const message =
      decision === 'FIND_MORE'
        ? 'Bạn có chắc muốn tiếp tục quét thêm các vòng tiếp theo để tìm thêm ứng viên KOC?'
        : 'Bạn có chắc muốn dừng tìm kiếm và chuyển sang bước phê duyệt ứng viên đã tìm được?';
    if (!window.confirm(message)) return;

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

  async confirmManual2fa(): Promise<void> {
    const task = this.selectedTask();
    if (!task) return;

    if (!window.confirm('Bạn xác nhận đã phê duyệt / chạm số trên ứng dụng Facebook trên thiết bị tin cậy?')) return;

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

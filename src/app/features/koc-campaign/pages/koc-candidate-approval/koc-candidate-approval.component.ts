import { Component, OnInit, inject, signal } from '@angular/core';
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

  // Review Drawer State
  readonly drawerOpen = signal(false);
  readonly selectedTask = signal<WorkflowTask | null>(null);
  readonly taskVariables = signal<Record<string, unknown>>({});
  readonly candidates = signal<KocCandidateApprovalItem[]>([]);
  readonly candidatesLoading = signal(false);
  readonly completing = signal(false);

  ngOnInit(): void {
    void this.loadTasks();
  }

  get currentUsername(): string {
    return (this.keycloak.userInfo as Record<string, any> | undefined)?.['preferred_username'] || 'admin';
  }

  selectedCandidatesCount(): number {
    return this.candidates().filter((c) => c.selected).length;
  }

  async loadTasks(): Promise<void> {
    this.loading.set(true);
    try {
      const res = await firstValueFrom(this.campaignService.getPendingApprovalTasks(0, 50));
      const allTasks = (res as any)?.data || (res as any)?.content || [];
      // Filter tasks related to KOC candidate approval
      const kocTasks = allTasks.filter(
        (t: WorkflowTask) =>
          t.taskDefinitionKey === 'userTaskApproveCandidates' ||
          (t.name && t.name.toLowerCase().includes('koc')) ||
          (t.name && t.name.toLowerCase().includes('candidate'))
      );
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

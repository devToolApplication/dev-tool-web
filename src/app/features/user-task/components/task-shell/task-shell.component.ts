import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from "@angular/core";
import { Router } from "@angular/router";
import { I18nService } from "@core/i18n/i18n.service";
import { KeyValueItem } from "@shared/ui/data-display/key-value-list/key-value-list.component";
import { TimelineItem } from "@shared/ui/data-display/timeline/timeline.component";
import { TaskScreenRegistry } from "../../registry/task-screen.registry";
import { TaskHostStore } from "../../services/task-host.store";

@Component({
  selector: "app-task-shell",
  standalone: false,
  templateUrl: "./task-shell.component.html",
  styleUrl: "./task-shell.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskShellComponent {
  readonly store = inject(TaskHostStore);
  private readonly registry = inject(TaskScreenRegistry);
  private readonly router = inject(Router);
  private readonly i18n = inject(I18nService);

  readonly isHistoryDrawerOpen = signal<boolean>(false);

  readonly dynamicScreen = computed(() => this.registry.get(this.store.formKey()));
  readonly screenComponent = computed(() => this.dynamicScreen()?.component ?? null);

  readonly screenInputs = computed(() => ({
    task: this.store.task(),
    content: this.store.detail()?.content,
  }));

  readonly taskInfoItems = computed<KeyValueItem[]>(() => {
    const t = this.store.task();
    if (!t) return [];

    return [
      {
        label: this.i18n.t("userTask.taskInfo.id"),
        value: t.taskId,
        copyable: true,
      },
      {
        label: this.i18n.t("userTask.taskInfo.formKey"),
        value: t.formKey,
      },
      {
        label: this.i18n.t("userTask.column.workflow"),
        value: t.processDefinitionName || "-",
      },
      {
        label: this.i18n.t("userTask.taskInfo.processInstanceId"),
        value: t.processInstanceId,
        copyable: true,
      },
      {
        label: this.i18n.t("userTask.taskInfo.businessKey"),
        value: t.businessKey || "-",
        copyable: !!t.businessKey,
      },
      {
        label: this.i18n.t("userTask.taskInfo.assignee"),
        value: t.assignee || this.i18n.t("userTask.taskInfo.unassigned"),
      },
      {
        label: this.i18n.t("userTask.taskInfo.priority"),
        value: t.priority,
        type: "number",
      },
      {
        label: this.i18n.t("userTask.taskInfo.createdAt"),
        value: t.createdAt,
        type: "datetime",
      },
      {
        label: this.i18n.t("userTask.taskInfo.dueAt"),
        value: t.dueAt || "-",
        type: t.dueAt ? "datetime" : "text",
      },
    ];
  });

  readonly timelineItems = computed<TimelineItem[]>(() => {
    return this.store.history().map((item) => {
      const isClaim = item.type === "CLAIM";
      const actionText = item.action ? ` (${item.action})` : "";
      const title = isClaim
        ? `${item.userId || "User"} ${this.i18n.t("userTask.history.claimedBy")}`
        : `${item.userId || "User"} ${this.i18n.t("userTask.history.actionBy")}${actionText}`;

      return {
        id: item.id,
        title,
        description: item.comment || item.message || undefined,
        time: item.time,
        icon: isClaim ? "pi pi-user-check" : "pi pi-check-circle",
        variant: isClaim ? "info" : "success",
      };
    });
  });

  navigateBack(): void {
    void this.router.navigate(["/tasks"]);
  }

  openHistoryDrawer(): void {
    this.isHistoryDrawerOpen.set(true);
  }

  closeHistoryDrawer(): void {
    this.isHistoryDrawerOpen.set(false);
  }
}
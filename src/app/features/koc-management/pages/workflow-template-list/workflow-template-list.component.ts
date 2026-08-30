import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type { KocWorkflowTemplateSummary } from '../../model/koc-workflow.model';
import { KocWorkflowApiService } from '../../services/koc-workflow-api.service';

@Component({
  selector: 'app-workflow-template-list',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './workflow-template-list.component.html',
  styleUrl: './workflow-template-list.component.css',
})
export class WorkflowTemplateListComponent implements OnInit {
  private readonly workflowApi = inject(KocWorkflowApiService);

  readonly templates = signal<KocWorkflowTemplateSummary[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    void this.loadTemplates();
  }

  async loadTemplates(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const templates = await firstValueFrom(this.workflowApi.getWorkflowTemplates());
      this.templates.set(templates ?? []);
    } catch (err) {
      this.error.set(errorMessage(err));
    } finally {
      this.loading.set(false);
    }
  }

}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'koc.workflowTemplates.error.loadFailed';
}

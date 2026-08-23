import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
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
  private readonly router = inject(Router);

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

  useTemplate(template: KocWorkflowTemplateSummary): void {
    void this.router.navigate(['/ai-agent-mcrs/koc/campaigns/create'], {
      queryParams: { workflowTemplateId: template.templateId },
    });
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'koc.workflowTemplates.error.loadFailed';
}

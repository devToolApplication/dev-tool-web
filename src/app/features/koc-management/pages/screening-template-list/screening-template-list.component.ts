import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import type { KocScreeningTemplateSummary } from '../../model/koc-workflow.model';
import { KocWorkflowApiService } from '../../services/koc-workflow-api.service';

@Component({
  selector: 'app-screening-template-list',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './screening-template-list.component.html',
  styleUrl: './screening-template-list.component.css',
})
export class ScreeningTemplateListComponent implements OnInit {
  private readonly workflowApi = inject(KocWorkflowApiService);
  private readonly router = inject(Router);

  readonly templates = signal<KocScreeningTemplateSummary[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    void this.loadTemplates();
  }

  async loadTemplates(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const templates = await firstValueFrom(this.workflowApi.getScreeningTemplates());
      this.templates.set(templates ?? []);
    } catch (err) {
      this.error.set(errorMessage(err));
    } finally {
      this.loading.set(false);
    }
  }

  useTemplate(template: KocScreeningTemplateSummary): void {
    void this.router.navigate(['/ai-agent-mcrs/koc/campaigns/create'], {
      queryParams: { screeningTemplateId: template.templateId },
    });
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'koc.screeningTemplates.error.loadFailed';
}

import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-koc-route-placeholder',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './koc-route-placeholder.component.html',
})
export class KocRoutePlaceholderComponent {
  private readonly route = inject(ActivatedRoute);

  readonly title = this.routeData('title', 'koc.phase1.placeholder.title');
  readonly subtitle = this.routeData('subtitle', 'koc.phase1.placeholder.subtitle');
  readonly sectionTitle = this.routeData('sectionTitle', 'koc.phase1.placeholder.sectionTitle');

  readonly status = {
    label: 'koc.phase1.status.foundation',
    variant: 'info' as const,
    icon: 'pi pi-wrench',
  };

  private routeData(key: string, fallback: string): string {
    const value = this.route.snapshot.data[key];
    return typeof value === 'string' ? value : fallback;
  }
}

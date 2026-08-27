import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-koc-campaign-review',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './campaign-review.component.html',
  styleUrl: './campaign-review.component.css',
})
export class CampaignReviewComponent {
  private readonly route = inject(ActivatedRoute);

  readonly campaignId = this.route.snapshot.paramMap.get('campaignId') ?? '';
  readonly candidateId = this.route.snapshot.paramMap.get('candidateId');
  readonly title = 'koc.campaignReview.title';
  readonly subtitle = 'koc.campaignReview.subtitle';
  readonly sectionTitle = 'koc.campaignReview.sectionTitle';
}

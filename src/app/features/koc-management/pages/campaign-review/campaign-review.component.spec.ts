import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';

import { TranslateContentPipe } from '../../../../shared/pipes/translate-content.pipe';
import { CampaignReviewComponent } from './campaign-review.component';

describe('CampaignReviewComponent', () => {
  let fixture: ComponentFixture<CampaignReviewComponent>;
  let component: CampaignReviewComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CampaignReviewComponent, TranslateContentPipe],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ campaignId: 'campaign-7', candidateId: 'candidate-3' }),
            },
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });

    fixture = TestBed.createComponent(CampaignReviewComponent);
    component = fixture.componentInstance;
  });

  it('reads campaign and candidate ids from the route', () => {
    fixture.detectChanges();

    expect(component.campaignId).toBe('campaign-7');
    expect(component.candidateId).toBe('candidate-3');
    expect(fixture.nativeElement.textContent).toContain('campaign-7');
  });

  it('uses i18n keys for review placeholder chrome', () => {
    expect(component.title).toBe('koc.campaignReview.title');
    expect(component.subtitle).toBe('koc.campaignReview.subtitle');
    expect(component.sectionTitle).toBe('koc.campaignReview.sectionTitle');
  });
});

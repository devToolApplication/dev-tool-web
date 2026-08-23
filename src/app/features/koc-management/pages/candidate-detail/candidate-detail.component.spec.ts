import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';

import type { KocCandidateDetail } from '../../model/koc-candidate.model';
import type { KocEvidenceItem } from '../../model/koc-evidence.model';
import { KocCandidateApiService } from '../../services/koc-candidate-api.service';
import { TranslateContentPipe } from '../../../../shared/pipes/translate-content.pipe';
import { CandidateDetailComponent } from './candidate-detail.component';

describe('CandidateDetailComponent', () => {
  let fixture: ComponentFixture<CandidateDetailComponent>;
  let component: CandidateDetailComponent;
  let api: {
    getCandidate: ReturnType<typeof vi.fn>;
    getEvidence: ReturnType<typeof vi.fn>;
  };

  const candidate: KocCandidateDetail = {
    candidateId: 'candidate-1',
    campaignId: 'campaign-1',
    displayName: 'Parent creator',
    decision: 'WAITING',
    executionStatus: 'WAITING_DEPENDENCY',
    followers: 1200,
    screeningProgress: 60,
    reason: 'Facebook auth expired',
    evidenceCount: 2,
    workflowRunId: 'workflow-1',
  };

  const evidence: KocEvidenceItem[] = [
    {
      evidenceId: 'evidence-1',
      state: 'FOUND',
      sourceType: 'FACEBOOK_POST',
      observedAt: '2026-08-23T08:00:00Z',
      excerpt: 'Parent post about school achievement',
      sourceUrl: 'https://example.test/post',
      coverage: 'Matched achievement evidence',
      agentCode: 'engagement-research',
      provider: 'codex',
    },
    {
      evidenceId: 'evidence-2',
      state: 'FETCH_ERROR',
      sourceType: 'FACEBOOK_PROFILE',
      coverage: 'Facebook MCP auth expired',
      agentCode: 'profile-research',
      provider: 'claude',
    },
  ];

  beforeEach(() => {
    api = {
      getCandidate: vi.fn(() => of(candidate)),
      getEvidence: vi.fn(() => of(evidence)),
    };

    TestBed.configureTestingModule({
      declarations: [CandidateDetailComponent, TranslateContentPipe],
      providers: [
        { provide: KocCandidateApiService, useValue: api },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ candidateId: 'candidate-1' }),
            },
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });

    fixture = TestBed.createComponent(CandidateDetailComponent);
    component = fixture.componentInstance;
  });

  it('loads candidate evidence and keeps FETCH_ERROR as infrastructure state', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    expect(api.getCandidate).toHaveBeenCalledWith('candidate-1');
    expect(api.getEvidence).toHaveBeenCalledWith('candidate-1');
    expect(component.candidate()).toEqual(candidate);
    expect(component.evidence()).toEqual(evidence);
    expect(component.evidenceStateLabel(evidence[1])).toBe('koc.evidence.state.fetchError');
    expect(component.evidenceStateVariant(evidence[1])).toBe('danger');
    expect(component.primaryDecisionLabel()).toBe('koc.candidate.status.waiting');
  });

  it('opens evidence in a right-side drawer with business fact first and technical detail second', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    component.openEvidence(evidence[0]);

    expect(component.selectedEvidence()).toEqual(evidence[0]);
    expect(component.evidenceDrawerOpen()).toBe(true);
    expect(component.selectedEvidenceDetails().map((item) => item.label)).toEqual([
      'koc.evidence.drawer.businessFact',
      'koc.evidence.drawer.sourceType',
      'koc.evidence.drawer.observedAt',
      'koc.evidence.drawer.coverage',
      'koc.evidence.drawer.agent',
      'koc.evidence.drawer.provider',
    ]);
    expect(component.selectedEvidenceExecutionDetails().map((item) => item.label)).toEqual([
      'koc.evidence.drawer.agent',
      'koc.evidence.drawer.provider',
      'koc.evidence.drawer.executionPolicy',
    ]);
  });

  it('builds a simple workflow timeline without exposing model or reasoning settings', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.workflowTimeline().map((item) => item.title)).toEqual([
      'koc.workflow.step.discovery',
      'koc.workflow.step.cheapFilter',
      'koc.workflow.step.basicResearch',
      'koc.workflow.step.rules',
      'koc.workflow.step.engagementResearch',
      'koc.workflow.step.finalize',
    ]);
    expect(JSON.stringify(component.workflowTimeline())).not.toMatch(/model|reasoningEffort|systemPrompt|mcpConfig/);
  });
  it('generates accessible evidenceAriaLabel including state, coverage, and excerpt', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const label0 = component.evidenceAriaLabel(evidence[0]);
    expect(label0).toContain('koc.evidence.state.found');
    expect(label0).toContain('Matched achievement evidence');
    expect(label0).toContain('Parent post about school achievement');

    const label1 = component.evidenceAriaLabel(evidence[1]);
    expect(label1).toContain('koc.evidence.state.fetchError');
    expect(label1).toContain('koc.evidence.coverage.infrastructureUnknown');
    expect(label1).toContain('Facebook MCP auth expired');

    const buttons = fixture.nativeElement.querySelectorAll('.candidate-detail__evidence');
    expect(buttons.length).toBe(evidence.length);
    expect(buttons[0].getAttribute('aria-label')).toBe(label0);
    expect(buttons[1].getAttribute('aria-label')).toBe(label1);
  });
});
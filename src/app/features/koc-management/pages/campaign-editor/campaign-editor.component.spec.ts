import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';

import { PermissionService } from '@core/auth/permission.service';
import { TranslateContentPipe } from '../../../../shared/pipes/translate-content.pipe';
import type { CampaignEditorSavedCampaign } from '../../services/koc-campaign-editor-api.service';
import { CampaignEditorStore } from '../../stores/campaign-editor.store';
import {
  toCampaignEditorPayload,
  type CampaignEditorStepId,
  type CampaignEditorValidationIssue,
} from '../../model/koc-campaign-editor.model';
import { CampaignEditorComponent } from './campaign-editor.component';

describe('CampaignEditorComponent', () => {
  let fixture: ComponentFixture<CampaignEditorComponent>;
  let component: CampaignEditorComponent;
  let store: ReturnType<typeof createStoreStub>;
  let router: { navigate: ReturnType<typeof vi.fn> };
  let permissionService: { has: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    localStorage.setItem('app-language', 'en');
    store = createStoreStub();
    router = { navigate: vi.fn(() => Promise.resolve(true)) };
    permissionService = { has: vi.fn(() => true) };

    TestBed.configureTestingModule({
      declarations: [CampaignEditorComponent, TranslateContentPipe],
      providers: [
        { provide: Router, useValue: router },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ campaignId: 'campaign-7' }),
              data: { mode: 'edit' },
            },
          },
        },
        { provide: PermissionService, useValue: permissionService },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    TestBed.overrideComponent(CampaignEditorComponent, {
      set: {
        providers: [{ provide: CampaignEditorStore, useValue: store }],
      },
    });

    fixture = TestBed.createComponent(CampaignEditorComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    localStorage.removeItem('app-language');
  });

  it('uses i18n keys for campaign editor chrome and choices', () => {
    expect(component.pageTitle).toBe('koc.campaigns.edit.title');
    expect(component.pageSubtitle).toBe('koc.campaigns.edit.subtitle');
    expect(component.steps.map((step) => step.label)).toEqual([
      'koc.campaignEditor.step.campaign',
      'koc.campaignEditor.step.searchRequirements',
      'koc.campaignEditor.step.reviewStart',
    ]);
    expect(component.importanceOptions.map((option) => option.label)).toEqual([
      'koc.campaignEditor.importance.required',
      'koc.campaignEditor.importance.preferred',
    ]);
  });

  it('renders the three business steps', () => {
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Campaign');
    expect(text).toContain('Search requirements');
    expect(text).toContain('Review & start');
    expect(store.initialize).toHaveBeenCalledWith('campaign-7');
  });

  it('does not render legacy technical workflow fields', () => {
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    [
      'agent',
      'provider',
      'conditionKey',
      'evidenceKey',
      'maxQueries',
      'screeningRules',
      'discoveryExecution',
    ].forEach((legacyText) => expect(text).not.toContain(legacyText));
  });

  it('does not duplicate section headings inside section panels', () => {
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.campaign-editor__section-heading h2')).toHaveLength(0);
  });

  it('lets a user add an arbitrary AI requirement', () => {
    component.addRequirement();
    component.updateRequirement('req-1', {
      title: 'Natural creator fit',
      description: 'Find creators who explain the product in their own words.',
    });

    expect(store.addRequirement).toHaveBeenCalled();
    expect(store.updateRequirement).toHaveBeenCalledWith('req-1', {
      title: 'Natural creator fit',
      description: 'Find creators who explain the product in their own words.',
    });
  });

  it('saves a valid draft through the store', async () => {
    await component.saveDraft();

    expect(store.saveDraft).toHaveBeenCalled();
  });

  it('delegates unsaved changes checks to the store', () => {
    store.hasUnsavedChanges.mockReturnValue(true);

    expect(component.hasUnsavedChanges()).toBe(true);
  });

  it('starts and navigates to the campaign review route', async () => {
    store.startCampaign.mockResolvedValue(savedCampaign());

    await component.startCampaign();

    expect(store.startCampaign).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith([
      '/ai-agent-mcrs/koc/campaigns',
      'campaign-99',
      'review',
    ]);
  });

  it('returns to the first invalid step when start validation fails', async () => {
    store.activeStepId.mockReturnValue('reviewStart');
    store.startCampaign.mockResolvedValue(null);
    store.validationIssues.mockReturnValue([{ path: 'name', key: 'nameRequired' }]);

    await component.startCampaign();

    expect(store.setStep).toHaveBeenCalledWith('campaign');
    expect(router.navigate).not.toHaveBeenCalled();
  });
});

function createStoreStub() {
  const draft = {
    name: 'Back to school',
    description: 'Creator campaign',
    goal: { targetApproved: 10, candidateLimit: 50 },
    search: {
      instructions: 'Use natural language',
      scope: {
        platforms: ['tiktok'],
        minFollowers: 1000,
        maxFollowers: 50000,
        locations: ['Vietnam'],
        languages: ['vi'],
        recentActivityDays: 30,
      },
      requirements: [
        {
          id: 'req-1',
          title: 'Product fit',
          description: 'Creator matches the campaign.',
          importance: 'REQUIRED' as const,
          minimumConfidence: 0.8,
          minimumEvidence: 2,
        },
      ],
    },
    workflow: {
      workflowDefinitionId: 'wf-1',
      workflowVersionId: 'wfv-1',
      workflowVersion: 1,
      workflowName: 'KOC Review',
    },
  };

  return {
    draft: vi.fn(() => draft),
    activeStepId: vi.fn<() => CampaignEditorStepId>(() => 'campaign'),
    loading: vi.fn(() => false),
    saving: vi.fn(() => false),
    error: vi.fn(() => null),
    validationIssues: vi.fn<() => CampaignEditorValidationIssue[]>(() => []),
    dirty: vi.fn(() => false),
    savedCampaignId: vi.fn(() => 'campaign-7'),
    canGoBack: vi.fn(() => false),
    canContinue: vi.fn(() => true),
    initialize: vi.fn(),
    setStep: vi.fn(),
    back: vi.fn(),
    continue: vi.fn(),
    updateDraft: vi.fn(),
    updateGoal: vi.fn(),
    updateScope: vi.fn(),
    updateInstructions: vi.fn(),
    addRequirement: vi.fn(),
    updateRequirement: vi.fn(),
    removeRequirement: vi.fn(),
    saveDraft: vi.fn<() => Promise<CampaignEditorSavedCampaign | null>>(() =>
      Promise.resolve(savedCampaign()),
    ),
    startCampaign: vi.fn<() => Promise<CampaignEditorSavedCampaign | null>>(() =>
      Promise.resolve(savedCampaign()),
    ),
    hasUnsavedChanges: vi.fn(() => false),
    issueFor: vi.fn(() => null),
  };
}

function savedCampaign(): CampaignEditorSavedCampaign {
  return {
    campaignId: 'campaign-99',
    status: 'RUNNING',
    payload: toCampaignEditorPayload(createStoreStub().draft()),
    createdAt: '2026-08-27T00:00:00.000Z',
    updatedAt: '2026-08-27T00:00:00.000Z',
  };
}

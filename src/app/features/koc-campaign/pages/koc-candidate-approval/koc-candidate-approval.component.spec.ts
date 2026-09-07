import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';

import { ToastService } from '@core/notifications/toast.service';
import { KeycloakService } from '@core/auth/keycloak.service';
import { KocCandidateApprovalComponent } from './koc-candidate-approval.component';
import { KocCampaignService } from '../../services/koc-campaign.service';
import { WorkflowTask } from '../../models/koc-campaign.model';
import { TranslateContentPipe } from '@shared/pipes/translate-content.pipe';

describe('KocCandidateApprovalComponent', () => {
  let component: KocCandidateApprovalComponent;
  let fixture: ComponentFixture<KocCandidateApprovalComponent>;
  let campaignService: {
    getPendingApprovalTasks: ReturnType<typeof vi.fn>;
    getTaskVariables: ReturnType<typeof vi.fn>;
    claimTask: ReturnType<typeof vi.fn>;
    unclaimTask: ReturnType<typeof vi.fn>;
    completeApprovalTask: ReturnType<typeof vi.fn>;
  };
  let toast: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };
  let keycloak: { userInfo: { preferred_username: string } };
  let router: { navigate: ReturnType<typeof vi.fn> };

  const mockTask: WorkflowTask = {
    id: 'task-100',
    name: 'Human Approval - Select KOC Candidates',
    taskDefinitionKey: 'userTaskApproveCandidates',
    processInstanceId: 'run-500',
    assignee: null,
  };

  const mockCandidate = {
    externalProfileId: 'fb-123',
    fullName: 'Tech Reviewer A',
    profileUrl: 'https://facebook.com/tech_a',
    platform: 'FACEBOOK',
    followerCount: 65000,
    score: 88.0,
    strengths: ['high engagement'],
    matchReason: 'Good fit for tech niche',
  };

  beforeEach(async () => {
    campaignService = {
      getPendingApprovalTasks: vi.fn().mockReturnValue(
        of({ data: [mockTask], metadata: { totalElements: 1, pageNumber: 0, pageSize: 50 } })
      ),
      getTaskVariables: vi.fn().mockReturnValue(
        of({
          reviewedCandidates: [mockCandidate],
          minScore: 70.0,
        })
      ),
      claimTask: vi.fn().mockReturnValue(of({})),
      unclaimTask: vi.fn().mockReturnValue(of({})),
      completeApprovalTask: vi.fn().mockReturnValue(of(true)),
    };
    toast = { success: vi.fn(), error: vi.fn() };
    keycloak = { userInfo: { preferred_username: 'test-admin' } };
    router = { navigate: vi.fn() };

    await TestBed.configureTestingModule({
      declarations: [KocCandidateApprovalComponent, TranslateContentPipe],
      providers: [
        { provide: KocCampaignService, useValue: campaignService },
        { provide: ToastService, useValue: toast },
        { provide: KeycloakService, useValue: keycloak },
        { provide: Router, useValue: router },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: { get: () => null } } },
        },
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(KocCandidateApprovalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create component and load pending approval tasks', () => {
    expect(component).toBeTruthy();
    expect(campaignService.getPendingApprovalTasks).toHaveBeenCalled();
    expect(component.tasks().length).toBe(1);
    expect(component.tasks()[0].id).toBe('task-100');
  });

  it('should open review drawer and load candidates from task variables', async () => {
    await component.openReview(mockTask);
    expect(component.drawerOpen()).toBe(true);
    expect(campaignService.getTaskVariables).toHaveBeenCalledWith('task-100');
    expect(component.candidates().length).toBe(1);
    expect(component.candidates()[0].fullName).toBe('Tech Reviewer A');
    expect(component.candidates()[0].selected).toBe(true); // score 88 >= 70
  });

  it('should toggle, selectAll and deselectAll candidates', async () => {
    await component.openReview(mockTask);
    expect(component.selectedCandidatesCount()).toBe(1);

    component.deselectAll();
    expect(component.selectedCandidatesCount()).toBe(0);

    component.selectAll();
    expect(component.selectedCandidatesCount()).toBe(1);

    component.toggleCandidate(component.candidates()[0]);
    expect(component.selectedCandidatesCount()).toBe(0);
  });

  it('should approve selected candidates and complete task', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    await component.openReview(mockTask);
    await component.approveSelected();

    expect(campaignService.completeApprovalTask).toHaveBeenCalledWith(
      'task-100',
      expect.any(Array),
      true
    );
    expect(toast.success).toHaveBeenCalledWith('kocApproval.toast.approveSuccess');
    expect(component.drawerOpen()).toBe(false);
  });

  it('should reject all candidates and complete task', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    await component.openReview(mockTask);
    await component.rejectAll();

    expect(campaignService.completeApprovalTask).toHaveBeenCalledWith(
      'task-100',
      [],
      false
    );
    expect(toast.success).toHaveBeenCalledWith('kocApproval.toast.rejectSuccess');
    expect(component.drawerOpen()).toBe(false);
  });
});

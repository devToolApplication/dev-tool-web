import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserTaskModule } from '../../user-task.module';
import { TaskHostStore } from '../../services/task-host.store';
import {
  KocCandidateApprovalContent,
  KocCandidateApprovalItem,
} from '../../models/user-task.model';
import { KocCandidateApprovalScreenComponent } from './koc-candidate-approval-screen.component';

describe('KocCandidateApprovalScreenComponent', () => {
  let fixture: ComponentFixture<KocCandidateApprovalScreenComponent>;
  let component: KocCandidateApprovalScreenComponent;
  const store = {
    registerAdapter: vi.fn(),
    unregisterAdapter: vi.fn(),
  };

  const candidate = (
    externalProfileId: string,
    score: number,
  ): KocCandidateApprovalItem => ({
    externalProfileId,
    fullName: `Candidate ${externalProfileId}`,
    profileUrl: `https://example.com/${externalProfileId}`,
    platform: 'TikTok',
    followerCount: 1000,
    engagementRate: 4.5,
    score,
    strengths: ['Relevant audience'],
    risks: [],
  });

  const content: KocCandidateApprovalContent = {
    campaignId: 'campaign-1',
    campaignName: 'Launch',
    niche: 'Beauty',
    targetCount: 2,
    minScore: 80,
    candidates: [candidate('a', 80), candidate('b', 79), candidate('c', 95)],
  };

  beforeEach(async () => {
    store.registerAdapter.mockClear();
    store.unregisterAdapter.mockClear();
    await TestBed.configureTestingModule({
      imports: [UserTaskModule],
      providers: [{ provide: TaskHostStore, useValue: store }],
    }).compileComponents();

    fixture = TestBed.createComponent(KocCandidateApprovalScreenComponent);
    component = fixture.componentInstance;
    component.content = content;
    fixture.detectChanges();
  });

  it('registers the adapter and selects candidates meeting minScore by default', () => {
    expect(store.registerAdapter).toHaveBeenCalledWith(component);
    expect([...component.selectedIds()]).toEqual(['a', 'c']);
  });

  it('supports individual selection, select qualified, and deselect all', () => {
    component.setSelected('b', true);
    expect(component.selectedIds().has('b')).toBe(true);

    component.deselectAll();
    expect(component.selectedIds().size).toBe(0);

    component.selectAllQualified();
    expect([...component.selectedIds()]).toEqual(['a', 'c']);
  });

  it('requires a selection for APPROVE and submits IDs only', () => {
    component.deselectAll();
    expect(component.validate('APPROVE')).toBe('userTask.kocApproval.selectAtLeastOne');

    component.setSelected('b', true);
    expect(component.validate('APPROVE')).toBe(true);
    expect(component.buildVariables('APPROVE')).toEqual({ approvedCandidateIds: ['b'] });
    expect(component.buildVariables('REJECT')).toEqual({});
  });

  it('renders accessible external profile links with safe rel attributes', () => {
    const links = fixture.nativeElement.querySelectorAll('a[target="_blank"]') as NodeListOf<
      HTMLAnchorElement
    >;
    expect(links.length).toBe(3);
    expect(links[0].getAttribute('aria-label')).toBe('Candidate a');
    expect(links[0].rel).toContain('noopener');
    expect(links[0].rel).toContain('noreferrer');
  });

  it('unregisters only its own adapter on destroy', () => {
    fixture.destroy();
    expect(store.unregisterAdapter).toHaveBeenCalledWith(component);
  });
});

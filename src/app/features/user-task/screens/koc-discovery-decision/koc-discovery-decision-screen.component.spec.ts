import { ComponentFixture, TestBed } from '@angular/core/testing';
import { KocDiscoveryDecisionContent } from '../../models/user-task.model';
import { TaskHostStore } from '../../services/task-host.store';
import { UserTaskModule } from '../../user-task.module';
import { KocDiscoveryDecisionScreenComponent } from './koc-discovery-decision-screen.component';

describe('KocDiscoveryDecisionScreenComponent', () => {
  let fixture: ComponentFixture<KocDiscoveryDecisionScreenComponent>;
  let component: KocDiscoveryDecisionScreenComponent;
  const store = {
    registerAdapter: vi.fn(),
    unregisterAdapter: vi.fn(),
  };

  beforeEach(async () => {
    store.registerAdapter.mockClear();
    store.unregisterAdapter.mockClear();
    await TestBed.configureTestingModule({
      imports: [UserTaskModule],
      providers: [{ provide: TaskHostStore, useValue: store }],
    }).compileComponents();

    fixture = TestBed.createComponent(KocDiscoveryDecisionScreenComponent);
    component = fixture.componentInstance;
    const content: KocDiscoveryDecisionContent = {
      campaignId: 'campaign-1',
      campaignName: 'Launch',
      niche: 'Beauty',
      currentRound: 2,
      roundLimit: 4,
      qualifiedCount: 8,
      targetCount: 12,
      candidatePreview: Array.from({ length: 12 }, (_, index) => ({
        externalProfileId: `candidate-${index}`,
        fullName: `Candidate ${index}`,
        profileUrl: `https://example.com/${index}`,
        platform: 'TikTok',
        followerCount: 1000 + index,
        score: 80 + index,
      })),
    };
    component.content = content;
    fixture.detectChanges();
  });

  it('shows progress values and caps preview at ten rows', () => {
    expect(component.progressItems().map((item) => item.value)).toContain(2);
    expect(component.progressItems().map((item) => item.value)).toContain(4);
    expect(component.progressItems().map((item) => item.value)).toContain(8);
    expect(component.progressItems().map((item) => item.value)).toContain(12);
    expect(component.preview()).toHaveLength(10);
    expect(fixture.nativeElement.querySelectorAll('a[target="_blank"]').length).toBe(10);
  });

  it('accepts only FIND_MORE and STOP and sends no client variables', () => {
    expect(component.validate('FIND_MORE')).toBe(true);
    expect(component.validate('STOP')).toBe(true);
    expect(component.validate('APPROVE')).toBe(false);
    expect(component.buildVariables()).toEqual({});
  });

  it('registers and unregisters its adapter', () => {
    expect(store.registerAdapter).toHaveBeenCalledWith(component);
    fixture.destroy();
    expect(store.unregisterAdapter).toHaveBeenCalledWith(component);
  });
});

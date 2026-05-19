import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { Button } from '../../component/button/button';
import { SharedModule } from '../../shared.module';
import { provideSharedTesting } from '../../testing/shared-test.providers';
import { RealtimeProgressBarComponent } from './realtime-progress-bar.component';

describe('RealtimeProgressBarComponent', () => {
  let fixture: ComponentFixture<RealtimeProgressBarComponent>;
  let component: RealtimeProgressBarComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharedModule],
      providers: provideSharedTesting()
    }).compileComponents();

    fixture = TestBed.createComponent(RealtimeProgressBarComponent);
    component = fixture.componentInstance;
  });

  it('renders running progress and emits detail and cancel actions', () => {
    const cancel = vi.fn();
    const viewDetail = vi.fn();
    component.showCancel = true;
    component.showDetails = true;
    component.state = {
      id: 'JOB-001',
      title: 'Import dataset',
      status: 'running',
      percent: 42,
      current: 21,
      total: 50,
      step: 'VALIDATING',
      message: 'Checking rows',
      cancellable: true
    };
    component.cancel.subscribe(cancel);
    component.viewDetail.subscribe(viewDetail);

    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Import dataset');
    expect(text).toContain('JOB-001');
    expect(text).toContain('VALIDATING');
    expect(text).toContain('Checking rows');
    expect(text).toContain('21 / 50');
    expect((fixture.nativeElement.querySelector('.progress-fill') as HTMLElement).style.width).toBe('42%');

    emitButton('preview');
    emitButton('cancel');

    expect(viewDetail).toHaveBeenCalledOnce();
    expect(cancel).toHaveBeenCalledOnce();
  });

  it('normalizes legacy states and clamps progress safely', () => {
    component.showCancel = true;
    component.state = {
      taskId: 'BT-001',
      taskType: 'BACKTEST',
      status: 'SKIPPED',
      progressPercent: 150
    };

    expect(component.normalized()).toEqual(
      expect.objectContaining({
        id: 'BT-001',
        title: 'BACKTEST',
        status: 'completed',
        percent: 150
      })
    );
    expect(component.percent()).toBe(100);
    expect(component.canCancel()).toBe(false);
  });

  it('renders queued, completed and cancelled states with generic variants', () => {
    const statuses = [
      { status: 'queued' as const, variant: 'info' },
      { status: 'completed' as const, variant: 'success' },
      { status: 'cancelled' as const, variant: 'muted' }
    ];

    for (const item of statuses) {
      fixture.destroy();
      fixture = TestBed.createComponent(RealtimeProgressBarComponent);
      component = fixture.componentInstance;
      component.state = { id: `JOB-${item.status}`, status: item.status };
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain(item.status);
      expect(component.statusVariant(item.status)).toBe(item.variant);
    }
  });

  it('uses indeterminate mode when running without a percent', () => {
    component.state = {
      id: 'JOB-INDET',
      status: 'running'
    };

    fixture.detectChanges();

    expect(component.indeterminate()).toBe(true);
    expect(fixture.nativeElement.querySelector('.progress-fill--indeterminate')).toBeTruthy();
  });

  it('renders failed detail and emits retry without exposing business behavior', () => {
    const retry = vi.fn();
    component.showDetails = true;
    component.state = {
      id: 'JOB-002',
      status: 'failed',
      percent: 64,
      errorMessage: 'Worker failed'
    };
    component.retry.subscribe(retry);

    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Worker failed');

    emitButton('retry');

    expect(retry).toHaveBeenCalledOnce();
  });

  function emitButton(label: string): void {
    const button = fixture.debugElement
      .queryAll(By.directive(Button))
      .map((debugElement) => debugElement.componentInstance as Button)
      .find((instance) => instance.label === label);

    expect(button).toBeTruthy();
    button?.buttonClick.emit();
  }
});

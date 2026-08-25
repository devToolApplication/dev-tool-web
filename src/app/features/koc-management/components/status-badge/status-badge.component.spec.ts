import { statusBadgeForKocStatus } from './status-badge.component';

describe('statusBadgeForKocStatus', () => {
  it('separates infrastructure blocked states from business rejection states', () => {
    expect(statusBadgeForKocStatus('REJECTED')).toEqual(
      expect.objectContaining({
        label: 'koc.candidate.status.rejected',
        variant: 'danger',
        icon: 'pi pi-times-circle',
      }),
    );
    expect(statusBadgeForKocStatus('WAITING_DEPENDENCY')).toEqual(
      expect.objectContaining({
        label: 'koc.execution.status.waitingDependency',
        variant: 'warning',
        icon: 'pi pi-link',
      }),
    );
    expect(statusBadgeForKocStatus('SCREENING_RUNNING')).toEqual(
      expect.objectContaining({
        label: 'koc.execution.status.screeningRunning',
        variant: 'info',
        icon: 'pi pi-sync',
      }),
    );
  });
});

import { TestBed } from '@angular/core/testing';

import { I18nService } from './i18n.service';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ToastService,
        { provide: I18nService, useValue: { t: (key: unknown) => (typeof key === 'string' ? key : '') } }
      ]
    });

    service = TestBed.inject(ToastService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('deduplicates identical toast messages in a short window', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1000);

    service.error('loadError');
    service.error('loadError');

    expect(service.messages().length).toBe(1);
    expect(service.messages()[0]).toEqual(
      expect.objectContaining({ severity: 'error', summary: 'loadError' })
    );
  });

  it('allows the same toast after the dedupe window', () => {
    const now = vi.spyOn(Date, 'now');
    now.mockReturnValueOnce(1000).mockReturnValueOnce(4000);

    service.info('saved');
    service.info('saved');

    expect(service.messages().length).toBe(2);
  });
});

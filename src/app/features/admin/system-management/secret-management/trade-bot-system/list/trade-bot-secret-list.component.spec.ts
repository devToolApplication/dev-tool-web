import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { Observable, of } from 'rxjs';

import { createBasePageResponse } from '../../../../../../core/models/base-response.model';
import { TradeBotSecretResponse } from '../../../../../../core/models/trade-bot/trade-bot-secret.model';
import { TradeBotSecretService } from '../../../../../../core/services/trade-bot-service/trade-bot-secret.service';
import { I18nService } from '../../../../../../core/ui-services/i18n.service';
import { LoadingService } from '../../../../../../core/ui-services/loading.service';
import { ToastService } from '../../../../../../core/ui-services/toast.service';
import { TradeBotSecretListComponent } from './trade-bot-secret-list.component';

describe('TradeBotSecretListComponent', () => {
  let fixture: ComponentFixture<TradeBotSecretListComponent>;
  let component: TradeBotSecretListComponent;
  let serviceMock: Pick<TradeBotSecretService, 'getPage' | 'delete'>;

  const secret: TradeBotSecretResponse = {
    id: 'secret-1',
    category: 'EXCHANGE',
    name: 'Binance key',
    code: 'BINANCE_KEY',
    secretValue: '[masked]',
    status: 'ACTIVE'
  };

  beforeEach(async () => {
    serviceMock = {
      getPage: vi.fn((page: number, size: number) => of(createBasePageResponse([secret], page, size, 1))),
      delete: vi.fn(() => of(secret))
    };

    await TestBed.configureTestingModule({
      declarations: [TradeBotSecretListComponent],
      providers: [
        { provide: TradeBotSecretService, useValue: serviceMock },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap({ page: '0', size: '10' }) } } },
        { provide: Router, useValue: { navigate: vi.fn(() => Promise.resolve(true)) } },
        { provide: LoadingService, useValue: { track: <T>(source$: Observable<T>) => source$ } },
        { provide: ToastService, useValue: { error: vi.fn(), info: vi.fn() } },
        { provide: I18nService, useValue: { t: (key: unknown) => String(key ?? '') } }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(TradeBotSecretListComponent);
    component = fixture.componentInstance;
  });

  it('does not reload the API when table emits the current page state again', () => {
    fixture.detectChanges();

    expect(serviceMock.getPage).toHaveBeenCalledTimes(1);

    component.onPageChange({ page: 0, rows: 10, first: 0 });

    expect(serviceMock.getPage).toHaveBeenCalledTimes(1);

    component.onPageChange({ page: 1, rows: 10, first: 10 });

    expect(serviceMock.getPage).toHaveBeenCalledTimes(2);
    expect(serviceMock.getPage).toHaveBeenLastCalledWith(1, 10, ['category,asc', 'code,asc'], {});
  });
});

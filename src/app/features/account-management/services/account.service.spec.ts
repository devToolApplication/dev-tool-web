import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AccountService } from './account.service';
import { AccountItem } from '../models/account.model';

describe('AccountService', () => {
  let service: AccountService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AccountService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(AccountService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('gets account page with params', () => {
    const mockAccounts: AccountItem[] = [
      {
        id: 'acc-1',
        name: 'GPT Plus',
        type: 'OPENAI',
        username: 'gpt@openai.com',
        status: 'ACTIVE',
      },
    ];

    service.getPage({ page: 0, size: 10, type: 'OPENAI', status: 'ACTIVE' }).subscribe((res) => {
      expect(res.data.length).toBe(1);
      expect(res.data[0].name).toBe('GPT Plus');
    });

    const req = httpMock.expectOne((r) => r.url.includes('/accounts/page') && r.params.get('type') === 'OPENAI');
    expect(req.request.method).toBe('GET');
    req.flush({ data: { data: mockAccounts, metadata: { totalElements: 1 } } });
  });

  it('creates new account', () => {
    const payload = {
      name: 'Claude Pro',
      type: 'CLAUDE',
      username: 'claude@anthropic.com',
      password: 'password123',
    };

    service.create(payload).subscribe((res) => {
      expect(res.id).toBe('acc-2');
      expect(res.name).toBe('Claude Pro');
    });

    const req = httpMock.expectOne((r) => r.url.endsWith('/accounts'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({ data: { id: 'acc-2', ...payload, status: 'ACTIVE' } });
  });

  it('deletes account by id', () => {
    service.delete('acc-1').subscribe((res) => {
      expect(res.id).toBe('acc-1');
    });

    const req = httpMock.expectOne((r) => r.url.endsWith('/accounts/acc-1'));
    expect(req.request.method).toBe('DELETE');
    req.flush({ data: { id: 'acc-1', name: 'Deleted' } });
  });
});
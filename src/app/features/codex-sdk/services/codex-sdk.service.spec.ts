import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { KeycloakService } from '@core/auth/keycloak.service';
import { CodexSdkService } from './codex-sdk.service';
import { CodexPromptRequest } from '../models/codex-sdk.model';

describe('CodexSdkService', () => {
  let service: CodexSdkService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CodexSdkService,
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: KeycloakService,
          useValue: {
            token: 'mock-token-xyz',
          },
        },
      ],
    });
    service = TestBed.inject(CodexSdkService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('TC-FE-CORE-01: should call getThreads with query params', () => {
    const mockResponse = {
      data: {
        data: [{ id: 't-1' }],
        nextCursor: 'cur-456',
      },
      status: 200,
      timestamp: '2026-09-06T00:00:00Z',
    };

    service
      .getThreads({ limit: 15, cursor: 'cur-123', searchTerm: 'refactor', archived: true })
      .subscribe((res) => {
        expect(res.data.length).toBe(1);
        expect(res.nextCursor).toBe('cur-456');
      });

    const req = httpMock.expectOne((r) => r.url.includes('/codex-sdk/threads'));
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('limit')).toBe('15');
    expect(req.request.params.get('cursor')).toBe('cur-123');
    expect(req.request.params.get('searchTerm')).toBe('refactor');
    expect(req.request.params.get('archived')).toBe('true');

    req.flush(mockResponse);
  });

  it('TC-FE-CORE-02: should call getThreadHistory with encoded id', () => {
    const mockResponse = {
      data: {
        id: 'thread#special/123',
        turns: [],
      },
      status: 200,
      timestamp: '2026-09-06T00:00:00Z',
    };

    service.getThreadHistory('thread#special/123').subscribe((res) => {
      expect(res.id).toBe('thread#special/123');
    });

    const req = httpMock.expectOne((r) => r.url.includes('/codex-sdk/threads/thread%23special%2F123'));
    expect(req.request.method).toBe('GET');

    req.flush(mockResponse);
  });

  it('TC-FE-CORE-03: should return AbortController from streamPrompt', () => {
    const req: CodexPromptRequest = { prompt: 'Hello agent' };
    const controller = service.streamPrompt(
      req,
      () => {},
      () => {},
      () => {}
    );

    expect(controller).toBeInstanceOf(AbortController);
    controller.abort();
  });

  it('TC-FE-CORE-04: should return AbortController from streamLiveThread', () => {
    const controller = service.streamLiveThread(
      'thread-run-123',
      () => {},
      () => {},
      () => {}
    );

    expect(controller).toBeInstanceOf(AbortController);
    controller.abort();
  });

  it('TC-FE-CORE-05: processStreamData should emit structuredOutput on result event', () => {
    let emittedToken = '';
    const rawResultEvent = JSON.stringify({
      type: 'result',
      result: {
        execution: {
          structuredOutput: { campaignId: 'c-1', approved: true },
        },
      },
    });

    service.processStreamData(rawResultEvent, (token) => {
      emittedToken = token;
    });

    expect(emittedToken).toContain('"campaignId": "c-1"');
    expect(emittedToken).toContain('"approved": true');
  });
});

import { HTTP_INTERCEPTORS, HttpClient, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { KeycloakService } from '../auth/keycloak.service';
import { AuthInterceptor } from './auth.interceptor';

describe('AuthInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let keycloakService: {
    token?: string;
    handleUnauthorized: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    keycloakService = {
      token: 'access-token',
      handleUnauthorized: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        { provide: KeycloakService, useValue: keycloakService },
        { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
      ]
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('adds bearer token to authenticated requests', () => {
    http.get('/api/items').subscribe();

    const request = httpMock.expectOne('/api/items');
    expect(request.request.headers.get('Authorization')).toBe('Bearer access-token');
    request.flush({});
  });

  it('logs out when an API returns 401', () => {
    http.get('/api/items').subscribe({
      error: () => undefined
    });

    const request = httpMock.expectOne('/api/items');
    request.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    expect(keycloakService.handleUnauthorized).toHaveBeenCalledOnce();
  });
});

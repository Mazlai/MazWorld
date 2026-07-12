import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors, HttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { PLATFORM_ID } from '@angular/core';
import { jwtInterceptor } from './jwt.interceptor';
import { AuthStorageService } from '../services/auth-storage.service';

function setup(token: string | null = 'test_jwt', platformId: string = 'browser') {
  const mockStorage = { getToken: vi.fn().mockReturnValue(token) };

  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(withInterceptors([jwtInterceptor])),
      provideHttpClientTesting(),
      { provide: AuthStorageService, useValue: mockStorage },
      { provide: PLATFORM_ID, useValue: platformId },
    ],
  });

  return {
    http: TestBed.inject(HttpClient),
    httpMock: TestBed.inject(HttpTestingController),
  };
}

describe('jwtInterceptor', () => {
  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
    TestBed.resetTestingModule();
  });

  // ===== URLs publiques =====

  it('ne ajoute pas de header Authorization sur les URLs publiques (login)', () => {
    const { http, httpMock } = setup();

    http.get('/api/auth/discord/login').subscribe();
    const req = httpMock.expectOne('/api/auth/discord/login');

    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('ne ajoute pas de header Authorization sur les URLs publiques (callback)', () => {
    const { http, httpMock } = setup();

    http.post('/api/auth/discord/callback', {}).subscribe();
    const req = httpMock.expectOne('/api/auth/discord/callback');

    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  // ===== URLs privées avec token =====

  it('ajoute le header Authorization: Bearer <token> sur les URLs privées', () => {
    const { http, httpMock } = setup('my_jwt_token');

    http.get('/api/profile').subscribe();
    const req = httpMock.expectOne('/api/profile');

    expect(req.request.headers.get('Authorization')).toBe('Bearer my_jwt_token');
    req.flush({});
  });

  it('active withCredentials sur les URLs privées', () => {
    const { http, httpMock } = setup('my_jwt_token');

    http.get('/api/profile').subscribe();
    const req = httpMock.expectOne('/api/profile');

    expect(req.request.withCredentials).toBe(true);
    req.flush({});
  });

  // ===== URLs privées sans token =====

  it('n\'ajoute pas Authorization si le token est null', () => {
    const { http, httpMock } = setup(null);

    http.get('/api/profile').subscribe();
    const req = httpMock.expectOne('/api/profile');

    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('active quand même withCredentials même sans token', () => {
    const { http, httpMock } = setup(null);

    http.get('/api/stats').subscribe();
    const req = httpMock.expectOne('/api/stats');

    expect(req.request.withCredentials).toBe(true);
    req.flush({});
  });

  // ===== Contexte SSR =====

  it('laisse la requête inchangée en contexte SSR (PLATFORM_ID="server")', () => {
    const { http, httpMock } = setup('my_jwt_token', 'server');

    http.get('/api/profile').subscribe();
    const req = httpMock.expectOne('/api/profile');

    expect(req.request.headers.has('Authorization')).toBe(false);
    expect(req.request.withCredentials).toBe(false);
    req.flush({});
  });
});
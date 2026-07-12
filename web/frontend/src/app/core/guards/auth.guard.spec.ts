import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { authGuard, guestGuard, adminGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';
import { AuthStorageService } from '../services/auth-storage.service';
import type { User } from '../models/user.model';

const MOCK_USER_ADMIN: Partial<User> = { roles: ['ROLE_ADMIN'] };
const MOCK_USER_DEFAULT: Partial<User> = { roles: ['ROLE_USER'] };

function setup(authenticated = false, user: Partial<User> | null = null) {
  const mockAuth = {
    isAuthenticated: vi.fn().mockReturnValue(authenticated),
    currentUser: vi.fn().mockReturnValue(user),
  };
  const mockStorage = { saveRedirectUrl: vi.fn() };
  const mockRouter = {
    createUrlTree: vi.fn().mockImplementation((commands: unknown[]) => commands as unknown as UrlTree),
  };

  TestBed.configureTestingModule({
    providers: [
      { provide: AuthService, useValue: mockAuth },
      { provide: AuthStorageService, useValue: mockStorage },
      { provide: Router, useValue: mockRouter },
    ],
  });

  return { mockAuth, mockStorage, mockRouter };
}

const dummyRoute = {} as never;
const dummyState = (url: string) => ({ url }) as never;

describe('authGuard', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('retourne true quand l\'utilisateur est authentifié', () => {
    setup(true);
    const result = TestBed.runInInjectionContext(() => authGuard(dummyRoute, dummyState('/dashboard')));
    expect(result).toBe(true);
  });

  it('redirige vers "/" quand l\'utilisateur n\'est pas authentifié', () => {
    const { mockRouter } = setup(false);
    const result = TestBed.runInInjectionContext(() => authGuard(dummyRoute, dummyState('/profile')));
    expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/']);
    expect(result).toEqual(['/'] as unknown as UrlTree);
  });

  it('sauvegarde l\'URL de redirection quand non authentifié', () => {
    const { mockStorage } = setup(false);
    TestBed.runInInjectionContext(() => authGuard(dummyRoute, dummyState('/profile')));
    expect(mockStorage.saveRedirectUrl).toHaveBeenCalledWith('/profile');
  });
});

describe('guestGuard', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('retourne true quand l\'utilisateur n\'est pas authentifié', () => {
    setup(false);
    const result = TestBed.runInInjectionContext(() => guestGuard(dummyRoute, dummyState('/')));
    expect(result).toBe(true);
  });

  it('redirige vers "/dashboard" quand l\'utilisateur est déjà authentifié', () => {
    const { mockRouter } = setup(true);
    const result = TestBed.runInInjectionContext(() => guestGuard(dummyRoute, dummyState('/')));
    expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/dashboard']);
    expect(result).toEqual(['/dashboard'] as unknown as UrlTree);
  });
});

describe('adminGuard', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('redirige vers "/" quand l\'utilisateur n\'est pas authentifié', () => {
    const { mockRouter } = setup(false);
    const result = TestBed.runInInjectionContext(() => adminGuard(dummyRoute, dummyState('/stats')));
    expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/']);
    expect(result).toEqual(['/'] as unknown as UrlTree);
  });

  it('redirige vers "/dashboard" quand authentifié mais sans ROLE_ADMIN', () => {
    const { mockRouter } = setup(true, MOCK_USER_DEFAULT);
    const result = TestBed.runInInjectionContext(() => adminGuard(dummyRoute, dummyState('/stats')));
    expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/dashboard']);
    expect(result).toEqual(['/dashboard'] as unknown as UrlTree);
  });

  it('retourne true quand l\'utilisateur a ROLE_ADMIN', () => {
    setup(true, MOCK_USER_ADMIN);
    const result = TestBed.runInInjectionContext(() => adminGuard(dummyRoute, dummyState('/stats')));
    expect(result).toBe(true);
  });
});

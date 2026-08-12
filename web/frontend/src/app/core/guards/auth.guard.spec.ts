import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { authGuard, guestGuard, adminGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';
import { AuthStorageService } from '../services/auth-storage.service';
import type { User } from '../models/user.model';

// Un compte admin réel porte en pratique les deux rôles à la fois (hiérarchie Symfony
// ROLE_ADMIN > ROLE_USER côté backend), pas seulement ROLE_ADMIN isolé.
const ADMIN_AVEC_HIERARCHIE: Partial<User> = { roles: ['ROLE_USER', 'ROLE_ADMIN'] };
const JOUEUR_STANDARD: Partial<User> = { roles: ['ROLE_USER'] };

function monterGuardsAvec(authentifie = false, user: Partial<User> | null = null) {
  const authMock = {
    isAuthenticated: vi.fn().mockReturnValue(authentifie),
    currentUser: vi.fn().mockReturnValue(user),
  };
  const storageMock = { saveRedirectUrl: vi.fn() };
  const routerMock = {
    createUrlTree: vi.fn().mockImplementation((commands: unknown[]) => commands as unknown as UrlTree),
  };

  TestBed.configureTestingModule({
    providers: [
      { provide: AuthService, useValue: authMock },
      { provide: AuthStorageService, useValue: storageMock },
      { provide: Router, useValue: routerMock },
    ],
  });

  return { authMock, storageMock, routerMock };
}

const routeFictive = {} as never;
const etatVers = (url: string) => ({ url }) as never;

describe('Accès aux pages réservées aux joueurs connectés (authGuard)', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('laisse passer un joueur authentifié', () => {
    monterGuardsAvec(true);

    expect(TestBed.runInInjectionContext(() => authGuard(routeFictive, etatVers('/dashboard')))).toBe(true);
  });

  it('renvoie un visiteur non connecté vers la page d\'accueil', () => {
    const { routerMock } = monterGuardsAvec(false);

    const resultat = TestBed.runInInjectionContext(() => authGuard(routeFictive, etatVers('/profile')));

    expect(routerMock.createUrlTree).toHaveBeenCalledWith(['/']);
    expect(resultat).toEqual(['/'] as unknown as UrlTree);
  });

  it('mémorise la page visée pour y revenir après connexion', () => {
    const { storageMock } = monterGuardsAvec(false);

    TestBed.runInInjectionContext(() => authGuard(routeFictive, etatVers('/profile')));

    expect(storageMock.saveRedirectUrl).toHaveBeenCalledWith('/profile');
  });
});

describe('Pages réservées aux visiteurs non connectés (guestGuard, ex. /login)', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('laisse un visiteur non connecté accéder à la page', () => {
    monterGuardsAvec(false);

    expect(TestBed.runInInjectionContext(() => guestGuard(routeFictive, etatVers('/')))).toBe(true);
  });

  it('redirige un joueur déjà connecté vers son dashboard plutôt que de le laisser se reconnecter', () => {
    const { routerMock } = monterGuardsAvec(true);

    const resultat = TestBed.runInInjectionContext(() => guestGuard(routeFictive, etatVers('/')));

    expect(routerMock.createUrlTree).toHaveBeenCalledWith(['/dashboard']);
    expect(resultat).toEqual(['/dashboard'] as unknown as UrlTree);
  });
});

describe('Pages réservées aux administrateurs (adminGuard)', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('bloque un visiteur non connecté avant même de regarder ses rôles', () => {
    const { routerMock } = monterGuardsAvec(false);

    const resultat = TestBed.runInInjectionContext(() => adminGuard(routeFictive, etatVers('/stats')));

    expect(routerMock.createUrlTree).toHaveBeenCalledWith(['/']);
    expect(resultat).toEqual(['/'] as unknown as UrlTree);
  });

  it('renvoie un joueur connecté mais sans ROLE_ADMIN vers son dashboard', () => {
    const { routerMock } = monterGuardsAvec(true, JOUEUR_STANDARD);

    const resultat = TestBed.runInInjectionContext(() => adminGuard(routeFictive, etatVers('/stats')));

    expect(routerMock.createUrlTree).toHaveBeenCalledWith(['/dashboard']);
    expect(resultat).toEqual(['/dashboard'] as unknown as UrlTree);
  });

  it('autorise un admin même quand ROLE_ADMIN coexiste avec ROLE_USER dans le tableau de rôles', () => {
    monterGuardsAvec(true, ADMIN_AVEC_HIERARCHIE);

    expect(TestBed.runInInjectionContext(() => adminGuard(routeFictive, etatVers('/stats')))).toBe(true);
  });

  it('ne plante pas si currentUser() ne renvoie aucun rôle du tout', () => {
    const { routerMock } = monterGuardsAvec(true, {});

    expect(() => TestBed.runInInjectionContext(() => adminGuard(routeFictive, etatVers('/stats')))).not.toThrow();
    expect(routerMock.createUrlTree).toHaveBeenCalledWith(['/dashboard']);
  });
});

import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { HeaderComponent } from './header.component';
import { AuthService } from '../../../core/services/auth.service';

function authMockAvec(opts: { isLoading?: boolean; isAuthenticated?: boolean; roles?: string[] } = {}) {
  return {
    isLoading: vi.fn().mockReturnValue(opts.isLoading ?? false),
    isAuthenticated: vi.fn().mockReturnValue(opts.isAuthenticated ?? false),
    currentUser: vi.fn().mockReturnValue(opts.roles ? { roles: opts.roles } : null),
    userAvatar: vi.fn().mockReturnValue(null),
    displayName: vi.fn().mockReturnValue('Mazlai'),
    loginWithDiscord: vi.fn().mockReturnValue(of(null)),
    logout: vi.fn(),
  };
}

function monterHeader(authOpts?: Parameters<typeof authMockAvec>[0]): {
  fixture: ComponentFixture<HeaderComponent>;
  component: HeaderComponent;
  authMock: ReturnType<typeof authMockAvec>;
} {
  const authMock = authMockAvec(authOpts);
  TestBed.configureTestingModule({
    imports: [HeaderComponent],
    providers: [provideRouter([]), { provide: AuthService, useValue: authMock }],
  });
  const fixture = TestBed.createComponent(HeaderComponent);
  fixture.detectChanges();
  return { fixture, component: fixture.componentInstance, authMock };
}

function contientLienStats(el: HTMLElement): boolean {
  let trouve = false;
  el.querySelectorAll('a').forEach(a => { if (a.textContent?.includes('Stats')) trouve = true; });
  return trouve;
}

afterEach(() => TestBed.resetTestingModule());

describe('Zone actions — dépend de isLoading / isAuthenticated', () => {
  it('affiche un spinner tant que l\'état de connexion n\'est pas encore connu', () => {
    const { fixture } = monterHeader({ isLoading: true });

    expect(fixture.nativeElement.querySelector('app-spinner')).toBeTruthy();
  });

  it('propose la connexion Discord pour un visiteur non authentifié', () => {
    const { fixture } = monterHeader({ isLoading: false, isAuthenticated: false });

    expect(fixture.nativeElement.querySelector('button.btn-discord')).toBeTruthy();
  });

  it('affiche le menu utilisateur (avatar + pseudo) une fois authentifié', () => {
    const { fixture } = monterHeader({ isLoading: false, isAuthenticated: true, roles: ['ROLE_USER'] });

    expect(fixture.nativeElement.querySelector('.user-menu')).toBeTruthy();
  });

  it('retire le bouton de connexion de la zone actions une fois authentifié (pas de doublon avec le menu)', () => {
    const { fixture } = monterHeader({ isLoading: false, isAuthenticated: true, roles: ['ROLE_USER'] });

    expect(fixture.nativeElement.querySelector('.site-header__actions .btn-discord')).toBeFalsy();
  });
});

describe('Lien "Stats" réservé aux administrateurs', () => {
  it('apparaît pour un compte avec ROLE_ADMIN', () => {
    expect(contientLienStats(monterHeader({ isAuthenticated: true, roles: ['ROLE_ADMIN'] }).fixture.nativeElement)).toBe(true);
  });

  it('reste caché pour un joueur standard (ROLE_USER seul)', () => {
    expect(contientLienStats(monterHeader({ isAuthenticated: true, roles: ['ROLE_USER'] }).fixture.nativeElement)).toBe(false);
  });

  it('reste caché pour un visiteur non connecté', () => {
    expect(contientLienStats(monterHeader({ isAuthenticated: false }).fixture.nativeElement)).toBe(false);
  });
});

it('logout() referme le menu utilisateur avant d\'appeler AuthService.logout()', () => {
  const { component, authMock } = monterHeader({ isAuthenticated: true, roles: ['ROLE_USER'] });
  component.isUserMenuOpen.set(true);

  component.logout();

  expect(component.isUserMenuOpen()).toBe(false);
  expect(authMock.logout).toHaveBeenCalledTimes(1);
});

describe('Menu hamburger mobile', () => {
  it('bascule d\'ouvert à fermé et inversement à chaque appel', () => {
    const { component } = monterHeader();
    expect(component.isMobileMenuOpen()).toBe(false);

    component.toggleMobileMenu();
    expect(component.isMobileMenuOpen()).toBe(true);

    component.toggleMobileMenu();
    expect(component.isMobileMenuOpen()).toBe(false);
  });

  it('reflète l\'état ouvert dans aria-expanded, pour les lecteurs d\'écran', () => {
    const { component, fixture } = monterHeader();

    component.toggleMobileMenu();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.mobile-toggle').getAttribute('aria-expanded')).toBe('true');
  });

  it('change le libellé du bouton entre "Ouvrir" et "Fermer" le menu', () => {
    const { component, fixture } = monterHeader();
    const bouton: HTMLButtonElement = fixture.nativeElement.querySelector('.mobile-toggle');
    expect(bouton.getAttribute('aria-label')).toBe('Ouvrir le menu');

    component.toggleMobileMenu();
    fixture.detectChanges();

    expect(bouton.getAttribute('aria-label')).toBe('Fermer le menu');
  });
});

describe('Menu déroulant du profil (desktop)', () => {
  it('toggleUserMenu() bascule l\'état ouvert/fermé', () => {
    const { component } = monterHeader({ isAuthenticated: true, roles: ['ROLE_USER'] });
    expect(component.isUserMenuOpen()).toBe(false);

    component.toggleUserMenu();

    expect(component.isUserMenuOpen()).toBe(true);
  });

  it('reflète l\'état ouvert dans aria-expanded sur le déclencheur du menu', () => {
    const { component, fixture } = monterHeader({ isAuthenticated: true, roles: ['ROLE_USER'] });

    component.toggleUserMenu();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[aria-haspopup="menu"]')?.getAttribute('aria-expanded')).toBe('true');
  });
});

// Navigation clavier du menu déroulant — conforme aux patterns ARIA (menu accessible
// sans souris) : Escape ferme toujours, ArrowDown ouvre le menu depuis le bouton déclencheur.
describe('Navigation clavier du menu utilisateur', () => {
  it('Escape ferme le menu, qu\'il soit ouvert depuis le déclencheur ou depuis l\'intérieur', () => {
    const { component } = monterHeader();
    component.isUserMenuOpen.set(true);

    component.onUserMenuKeydown(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(component.isUserMenuOpen()).toBe(false);

    component.isUserMenuOpen.set(true);
    component.onMenuKeydown(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(component.isUserMenuOpen()).toBe(false);
  });

  it('ArrowDown sur le déclencheur ouvre le menu', () => {
    const { component } = monterHeader();

    component.onUserMenuKeydown(new KeyboardEvent('keydown', { key: 'ArrowDown' }));

    expect(component.isUserMenuOpen()).toBe(true);
  });

  it('Tab depuis l\'intérieur du menu le referme (pas de piège au clavier)', () => {
    const { component } = monterHeader();
    component.isUserMenuOpen.set(true);

    component.onMenuKeydown(new KeyboardEvent('keydown', { key: 'Tab' }));

    expect(component.isUserMenuOpen()).toBe(false);
  });
});

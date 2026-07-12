import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { HeaderComponent } from './header.component';
import { AuthService } from '../../../core/services/auth.service';

function makeAuthMock(opts: { isLoading?: boolean; isAuthenticated?: boolean; roles?: string[] } = {}) {
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

function setup(authOpts?: Parameters<typeof makeAuthMock>[0]): {
  fixture: ComponentFixture<HeaderComponent>;
  component: HeaderComponent;
  mockAuth: ReturnType<typeof makeAuthMock>;
} {
  const mockAuth = makeAuthMock(authOpts);
  TestBed.configureTestingModule({
    imports: [HeaderComponent],
    providers: [provideRouter([]), { provide: AuthService, useValue: mockAuth }],
  });
  const fixture = TestBed.createComponent(HeaderComponent);
  fixture.detectChanges();
  return { fixture, component: fixture.componentInstance, mockAuth };
}

describe('HeaderComponent', () => {
  afterEach(() => TestBed.resetTestingModule());

  // ===== Affichage selon l'état d'authentification =====

  describe('Branchement auth (isLoading / isAuthenticated)', () => {
    it('affiche le spinner quand isLoading est true', () => {
      const { fixture } = setup({ isLoading: true });
      expect(fixture.nativeElement.querySelector('app-spinner')).toBeTruthy();
    });

    it('affiche le bouton de connexion Discord quand non authentifié', () => {
      const { fixture } = setup({ isLoading: false, isAuthenticated: false });
      expect(fixture.nativeElement.querySelector('button.btn-discord')).toBeTruthy();
    });

    it('affiche le menu utilisateur quand authentifié', () => {
      const { fixture } = setup({ isLoading: false, isAuthenticated: true, roles: ['ROLE_USER'] });
      expect(fixture.nativeElement.querySelector('.user-menu')).toBeTruthy();
    });

    it('n\'affiche pas le bouton de connexion dans la zone actions quand authentifié', () => {
      const { fixture } = setup({ isLoading: false, isAuthenticated: true, roles: ['ROLE_USER'] });
      expect(fixture.nativeElement.querySelector('.site-header__actions .btn-discord')).toBeFalsy();
    });
  });

  // ===== Lien Stats conditionnel ROLE_ADMIN =====

  describe('Lien Stats (ROLE_ADMIN)', () => {
    function hasStatsLink(el: HTMLElement): boolean {
      let found = false;
      el.querySelectorAll('a').forEach(a => { if (a.textContent?.includes('Stats')) found = true; });
      return found;
    }

    it('affiche le lien Stats quand l\'utilisateur a ROLE_ADMIN', () => {
      const { fixture } = setup({ isAuthenticated: true, roles: ['ROLE_ADMIN'] });
      expect(hasStatsLink(fixture.nativeElement)).toBe(true);
    });

    it('n\'affiche pas le lien Stats sans ROLE_ADMIN', () => {
      const { fixture } = setup({ isAuthenticated: true, roles: ['ROLE_USER'] });
      expect(hasStatsLink(fixture.nativeElement)).toBe(false);
    });

    it('n\'affiche pas le lien Stats quand non authentifié', () => {
      const { fixture } = setup({ isAuthenticated: false });
      expect(hasStatsLink(fixture.nativeElement)).toBe(false);
    });
  });

  // ===== logout() — ordre des opérations =====

  describe('logout()', () => {
    it('ferme le menu utilisateur avant d\'appeler auth.logout()', () => {
      const { component, mockAuth } = setup({ isAuthenticated: true, roles: ['ROLE_USER'] });
      component.isUserMenuOpen.set(true);
      component.logout();
      expect(component.isUserMenuOpen()).toBe(false);
      expect(mockAuth.logout).toHaveBeenCalledTimes(1);
    });
  });

  // ===== Gestion du menu mobile =====

  describe('toggleMobileMenu()', () => {
    it('bascule isMobileMenuOpen de false à true puis retour', () => {
      const { component } = setup();
      expect(component.isMobileMenuOpen()).toBe(false);
      component.toggleMobileMenu();
      expect(component.isMobileMenuOpen()).toBe(true);
      component.toggleMobileMenu();
      expect(component.isMobileMenuOpen()).toBe(false);
    });

    it('met à jour aria-expanded sur le bouton hamburger', () => {
      const { component, fixture } = setup();
      component.toggleMobileMenu();
      fixture.detectChanges();
      const btn: HTMLButtonElement = fixture.nativeElement.querySelector('.mobile-toggle');
      expect(btn.getAttribute('aria-expanded')).toBe('true');
    });

    it('met à jour aria-label du bouton hamburger selon l\'état', () => {
      const { component, fixture } = setup();
      const btn: HTMLButtonElement = fixture.nativeElement.querySelector('.mobile-toggle');
      expect(btn.getAttribute('aria-label')).toBe('Ouvrir le menu');

      component.toggleMobileMenu();
      fixture.detectChanges();
      expect(btn.getAttribute('aria-label')).toBe('Fermer le menu');
    });
  });

  // ===== Gestion du menu utilisateur =====

  describe('toggleUserMenu()', () => {
    it('bascule isUserMenuOpen', () => {
      const { component } = setup({ isAuthenticated: true, roles: ['ROLE_USER'] });
      expect(component.isUserMenuOpen()).toBe(false);
      component.toggleUserMenu();
      expect(component.isUserMenuOpen()).toBe(true);
    });

    it('met à jour aria-expanded sur le trigger', () => {
      const { component, fixture } = setup({ isAuthenticated: true, roles: ['ROLE_USER'] });
      component.toggleUserMenu();
      fixture.detectChanges();
      const trigger: HTMLButtonElement = fixture.nativeElement.querySelector('[aria-haspopup="menu"]');
      expect(trigger?.getAttribute('aria-expanded')).toBe('true');
    });
  });

  // ===== Navigation clavier =====

  describe('onUserMenuKeydown()', () => {
    it('ferme le menu sur Escape', () => {
      const { component } = setup();
      component.isUserMenuOpen.set(true);
      component.onUserMenuKeydown(new KeyboardEvent('keydown', { key: 'Escape' }));
      expect(component.isUserMenuOpen()).toBe(false);
    });

    it('ouvre le menu sur ArrowDown', () => {
      const { component } = setup();
      component.onUserMenuKeydown(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
      expect(component.isUserMenuOpen()).toBe(true);
    });
  });

  describe('onMenuKeydown()', () => {
    it('ferme le menu sur Tab', () => {
      const { component } = setup();
      component.isUserMenuOpen.set(true);
      component.onMenuKeydown(new KeyboardEvent('keydown', { key: 'Tab' }));
      expect(component.isUserMenuOpen()).toBe(false);
    });

    it('ferme le menu sur Escape', () => {
      const { component } = setup();
      component.isUserMenuOpen.set(true);
      component.onMenuKeydown(new KeyboardEvent('keydown', { key: 'Escape' }));
      expect(component.isUserMenuOpen()).toBe(false);
    });
  });
});

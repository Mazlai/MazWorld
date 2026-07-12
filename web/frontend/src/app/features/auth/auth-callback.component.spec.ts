import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, NEVER } from 'rxjs';
import { AuthCallbackComponent } from './auth-callback.component';
import { AuthService } from '../../core/services/auth.service';
import { AuthStorageService } from '../../core/services/auth-storage.service';
import type { AuthResponse } from '../../core/models/user.model';

const MOCK_RESPONSE: AuthResponse = {
  token: 'jwt_token',
  user: {
    id: 1, user_id: '123', username: 'Mazlai', discord_avatar: null,
    discord_email: null, current_city: 'willowbrook', coins: 0,
    equipped_background: null, roles: ['ROLE_USER'],
  },
};

function setup(
  params: Record<string, string> = {},
  callbackResponse: AuthResponse | 'never' = 'never',
  redirectUrl: string | null = null,
) {
  const mockAuth = {
    handleDiscordCallback: vi.fn().mockReturnValue(
      callbackResponse === 'never' ? NEVER : of(callbackResponse),
    ),
    loginWithDiscord: vi.fn().mockReturnValue(of(null)),
  };
  const mockStorage = { getRedirectUrl: vi.fn().mockReturnValue(redirectUrl), clearRedirectUrl: vi.fn() };
  const mockRouter = { navigateByUrl: vi.fn() };

  TestBed.configureTestingModule({
    imports: [AuthCallbackComponent],
    providers: [
      { provide: ActivatedRoute, useValue: { snapshot: { queryParams: params } } },
      { provide: Router, useValue: mockRouter },
      { provide: AuthService, useValue: mockAuth },
      { provide: AuthStorageService, useValue: mockStorage },
    ],
  });

  const fixture = TestBed.createComponent(AuthCallbackComponent);
  fixture.detectChanges();
  return { component: fixture.componentInstance, mockAuth, mockStorage, mockRouter };
}

describe('AuthCallbackComponent', () => {
  afterEach(() => {
    vi.useRealTimers();
    TestBed.resetTestingModule();
  });

  // ===== Erreurs OAuth Discord =====

  describe('Mapping des erreurs Discord', () => {
    it('mappe access_denied vers un message en français', () => {
      const { component } = setup({ error: 'access_denied' });
      expect(component.error()).toBe('Vous avez refusé l\'autorisation. Veuillez réessayer.');
      expect(component.isLoading()).toBe(false);
    });

    it('mappe server_error vers un message en français', () => {
      const { component } = setup({ error: 'server_error' });
      expect(component.error()).toBe('Erreur serveur Discord. Veuillez réessayer plus tard.');
    });

    it('mappe temporarily_unavailable vers un message en français', () => {
      const { component } = setup({ error: 'temporarily_unavailable' });
      expect(component.error()).toBe('Discord est temporairement indisponible.');
    });

    it('génère un message générique pour un code d\'erreur inconnu', () => {
      const { component } = setup({ error: 'unknown_error_xyz' });
      expect(component.error()).toBe('Erreur Discord : unknown_error_xyz');
    });

    it('ne fait pas d\'appel handleDiscordCallback sur une erreur OAuth', () => {
      const { mockAuth } = setup({ error: 'access_denied' });
      expect(mockAuth.handleDiscordCallback).not.toHaveBeenCalled();
    });
  });

  // ===== Code manquant =====

  describe('Code d\'autorisation absent', () => {
    it('set l\'erreur quand aucun code ni erreur ne sont présents', () => {
      const { component } = setup({});
      expect(component.error()).toBe('Code d\'autorisation manquant. Veuillez réessayer.');
      expect(component.isLoading()).toBe(false);
    });

    it('ne fait pas d\'appel handleDiscordCallback quand le code est absent', () => {
      const { mockAuth } = setup({});
      expect(mockAuth.handleDiscordCallback).not.toHaveBeenCalled();
    });
  });

  // ===== Flux de succès =====

  describe('Flux de succès OAuth', () => {
    it('set successUsername et passe isLoading à false', () => {
      vi.useFakeTimers();
      const { component } = setup({ code: 'valid_code', state: 'state_abc' }, MOCK_RESPONSE);
      expect(component.successUsername()).toBe('Mazlai');
      expect(component.isLoading()).toBe(false);
    });

    it('efface l\'URL de redirection après utilisation', () => {
      vi.useFakeTimers();
      const { mockStorage } = setup({ code: 'valid_code', state: 'state_abc' }, MOCK_RESPONSE);
      expect(mockStorage.clearRedirectUrl).toHaveBeenCalled();
    });

    it('navigue vers /dashboard quand aucune URL n\'est sauvegardée', () => {
      vi.useFakeTimers();
      const { mockRouter } = setup({ code: 'valid_code', state: 'state_abc' }, MOCK_RESPONSE, null);
      vi.runAllTimers();
      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/dashboard');
    });

    it('navigue vers l\'URL sauvegardée quand elle existe', () => {
      vi.useFakeTimers();
      const { mockRouter } = setup({ code: 'valid_code', state: 'state_abc' }, MOCK_RESPONSE, '/profile');
      vi.runAllTimers();
      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/profile');
    });
  });
});
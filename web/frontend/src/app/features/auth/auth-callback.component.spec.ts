import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, NEVER } from 'rxjs';
import { AuthCallbackComponent } from './auth-callback.component';
import { AuthService } from '../../core/services/auth.service';
import { AuthStorageService } from '../../core/services/auth-storage.service';
import type { AuthResponse } from '../../core/models/user.model';

const REPONSE_OAUTH_MAZLAI: AuthResponse = {
  token: 'jwt_token',
  user: {
    id: 1, user_id: '123', username: 'Mazlai', discord_avatar: null,
    discord_email: null, current_city: 'willowbrook', coins: 0,
    equipped_background: null, roles: ['ROLE_USER'],
  },
};

function monterCallback(
  queryParams: Record<string, string> = {},
  reponseCallback: AuthResponse | 'never' = 'never',
  redirectUrl: string | null = null,
) {
  const authMock = {
    handleDiscordCallback: vi.fn().mockReturnValue(reponseCallback === 'never' ? NEVER : of(reponseCallback)),
    loginWithDiscord: vi.fn().mockReturnValue(of(null)),
  };
  const storageMock = { getRedirectUrl: vi.fn().mockReturnValue(redirectUrl), clearRedirectUrl: vi.fn() };
  const routerMock = { navigateByUrl: vi.fn() };

  TestBed.configureTestingModule({
    imports: [AuthCallbackComponent],
    providers: [
      { provide: ActivatedRoute, useValue: { snapshot: { queryParams } } },
      { provide: Router, useValue: routerMock },
      { provide: AuthService, useValue: authMock },
      { provide: AuthStorageService, useValue: storageMock },
    ],
  });

  const fixture = TestBed.createComponent(AuthCallbackComponent);
  fixture.detectChanges();
  return { component: fixture.componentInstance, authMock, storageMock, routerMock };
}

afterEach(() => {
  vi.useRealTimers();
  TestBed.resetTestingModule();
});

describe('Discord renvoie une erreur OAuth (utilisateur a refusé, panne Discord...)', () => {
  it('traduit access_denied en message compréhensible pour le joueur', () => {
    const { component } = monterCallback({ error: 'access_denied' });

    expect(component.error()).toBe('Vous avez refusé l\'autorisation. Veuillez réessayer.');
    expect(component.isLoading()).toBe(false);
  });

  it('traduit server_error en message compréhensible', () => {
    expect(monterCallback({ error: 'server_error' }).component.error()).toBe('Erreur serveur Discord. Veuillez réessayer plus tard.');
  });

  it('traduit temporarily_unavailable en message compréhensible', () => {
    expect(monterCallback({ error: 'temporarily_unavailable' }).component.error()).toBe('Discord est temporairement indisponible.');
  });

  it('affiche le code brut pour un code d\'erreur que Discord n\'a pas encore documenté', () => {
    expect(monterCallback({ error: 'unknown_error_xyz' }).component.error()).toBe('Erreur Discord : unknown_error_xyz');
  });

  it('n\'appelle jamais le backend quand Discord a déjà signalé une erreur', () => {
    const { authMock } = monterCallback({ error: 'access_denied' });

    expect(authMock.handleDiscordCallback).not.toHaveBeenCalled();
  });
});

describe('Code d\'autorisation absent (URL de callback malformée)', () => {
  it('affiche un message d\'erreur explicite plutôt qu\'un écran vide', () => {
    const { component } = monterCallback({});

    expect(component.error()).toBe('Code d\'autorisation manquant. Veuillez réessayer.');
    expect(component.isLoading()).toBe(false);
  });

  it('n\'appelle pas le backend puisqu\'il n\'y a rien à échanger', () => {
    expect(monterCallback({}).authMock.handleDiscordCallback).not.toHaveBeenCalled();
  });
});

describe('Callback réussi — connexion et redirection', () => {
  it('affiche le pseudo du joueur connecté et sort de l\'état de chargement', () => {
    vi.useFakeTimers();
    const { component } = monterCallback({ code: 'valid_code', state: 'state_abc' }, REPONSE_OAUTH_MAZLAI);

    expect(component.successUsername()).toBe('Mazlai');
    expect(component.isLoading()).toBe(false);
  });

  it('efface l\'URL de redirection sauvegardée pour ne pas la réutiliser à la prochaine connexion', () => {
    vi.useFakeTimers();
    const { storageMock } = monterCallback({ code: 'valid_code', state: 'state_abc' }, REPONSE_OAUTH_MAZLAI);

    expect(storageMock.clearRedirectUrl).toHaveBeenCalled();
  });

  it('renvoie vers /dashboard par défaut si aucune page n\'était visée avant la connexion', () => {
    vi.useFakeTimers();
    const { routerMock } = monterCallback({ code: 'valid_code', state: 'state_abc' }, REPONSE_OAUTH_MAZLAI, null);
    vi.runAllTimers();

    expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/dashboard');
  });

  it('renvoie vers la page que le joueur essayait d\'atteindre avant d\'être redirigé au login', () => {
    vi.useFakeTimers();
    const { routerMock } = monterCallback({ code: 'valid_code', state: 'state_abc' }, REPONSE_OAUTH_MAZLAI, '/profile');
    vi.runAllTimers();

    expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/profile');
  });
});

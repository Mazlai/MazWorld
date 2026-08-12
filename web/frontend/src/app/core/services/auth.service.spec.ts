import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';
import { AuthService } from './auth.service';
import { AuthStorageService } from './auth-storage.service';
import type { User, AuthResponse } from '../models/user.model';

const MAZLAI: User = {
  id: 1,
  user_id: '123456789',
  username: 'Mazlai',
  discord_avatar: 'avatar_hash',
  discord_email: null,
  current_city: 'willowbrook',
  coins: 500,
  equipped_background: null,
  roles: ['ROLE_USER'],
};

const REPONSE_AUTH_VALIDE: AuthResponse = { token: 'jwt_token', user: MAZLAI };

function storageMockVierge() {
  return {
    saveToken: vi.fn(), getToken: vi.fn(), clearToken: vi.fn(),
    saveUser: vi.fn(),  getUser: vi.fn(),  clearUser: vi.fn(),
    saveState: vi.fn(), getState: vi.fn().mockReturnValue(null), clearState: vi.fn(),
    saveProcessedCode: vi.fn(), getProcessedCode: vi.fn().mockReturnValue(null), clearProcessedCode: vi.fn(),
    clearAll: vi.fn(),
  };
}

function monterServiceConnecte(user: User = MAZLAI) {
  const storageMock = storageMockVierge();
  const routerMock  = { navigate: vi.fn() };

  TestBed.configureTestingModule({
    providers: [
      AuthService,
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: AuthStorageService, useValue: storageMock },
      { provide: Router, useValue: routerMock },
    ],
  });

  const service = TestBed.inject(AuthService);
  const httpMock = TestBed.inject(HttpTestingController);

  // AuthService tente un rafraîchissement silencieux dès sa construction (restauration
  // de session via le cookie httpOnly) — il faut répondre à cette requête avant de tester quoi que ce soit d'autre.
  httpMock.expectOne(r => r.url.includes('/api/auth/refresh')).flush({ token: 'jwt_token', user });

  return { service, httpMock, storageMock, routerMock };
}

describe('AuthService', () => {
  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
    TestBed.resetTestingModule();
  });

  describe('État dérivé de la session (signals computed)', () => {
    it('isAuthenticated() vaut true après une restauration de session réussie', () => {
      expect(monterServiceConnecte().service.isAuthenticated()).toBe(true);
    });

    it('displayName() reprend le pseudo Discord de l\'utilisateur courant', () => {
      expect(monterServiceConnecte().service.displayName()).toBe('Mazlai');
    });

    it('userAvatar() pointe vers le CDN Discord quand un avatar est défini', () => {
      expect(monterServiceConnecte().service.userAvatar()).toContain('cdn.discordapp.com/avatars/123456789/avatar_hash.png');
    });

    it('userAvatar() retombe sur l\'avatar par défaut Discord si discord_avatar est null', () => {
      const { service } = monterServiceConnecte({ ...MAZLAI, discord_avatar: null });

      expect(service.userAvatar()).toContain('cdn.discordapp.com/embed/avatars/');
    });
  });

  describe('Callback OAuth Discord — protections contre le rejeu', () => {
    it('rejette un code déjà traité (protection contre un double clic ou un replay)', async () => {
      const { service, storageMock } = monterServiceConnecte();
      storageMock.getProcessedCode.mockReturnValue('already_used_code');

      await expect(lastValueFrom(service.handleDiscordCallback('already_used_code', 'state_abc')))
        .rejects.toThrow('Code already processed');
    });

    it('rejette un state qui ne correspond pas à celui sauvegardé (protection CSRF)', async () => {
      const { service, storageMock } = monterServiceConnecte();
      storageMock.getProcessedCode.mockReturnValue(null);
      storageMock.getState.mockReturnValue('expected_state');

      await expect(lastValueFrom(service.handleDiscordCallback('new_code', 'wrong_state')))
        .rejects.toThrow('Invalid state parameter');
    });

    it('sauvegarde le token et renvoie la réponse complète quand code et state sont valides', async () => {
      const { service, httpMock, storageMock } = monterServiceConnecte();
      storageMock.getProcessedCode.mockReturnValue(null);
      storageMock.getState.mockReturnValue(null);

      const promesse = lastValueFrom(service.handleDiscordCallback('valid_code', 'state_abc'));
      httpMock.expectOne(r => r.url.includes('/api/auth/discord/callback')).flush(REPONSE_AUTH_VALIDE);

      const reponse = await promesse;
      expect(reponse.token).toBe('jwt_token');
      expect(storageMock.saveToken).toHaveBeenCalledWith('jwt_token');
    });
  });

  it('logout() vide le stockage local et renvoie le joueur à l\'accueil, même en asynchrone', async () => {
    const { service, httpMock, storageMock, routerMock } = monterServiceConnecte();

    service.logout();
    httpMock.expectOne(r => r.url.includes('/api/auth/logout')).flush({});
    await Promise.resolve(); // laisser le micro-task du subscribe se terminer

    expect(storageMock.clearAll).toHaveBeenCalled();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/']);
  });
});

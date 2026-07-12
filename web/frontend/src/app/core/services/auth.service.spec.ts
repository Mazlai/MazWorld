import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';
import { AuthService } from './auth.service';
import { AuthStorageService } from './auth-storage.service';
import type { User, AuthResponse } from '../models/user.model';

const MOCK_USER: User = {
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

const MOCK_AUTH_RESPONSE: AuthResponse = { token: 'jwt_token', user: MOCK_USER };

function makeStorageMock() {
  return {
    saveToken: vi.fn(), getToken: vi.fn(), clearToken: vi.fn(),
    saveUser: vi.fn(),  getUser: vi.fn(),  clearUser: vi.fn(),
    saveState: vi.fn(), getState: vi.fn().mockReturnValue(null), clearState: vi.fn(),
    saveProcessedCode: vi.fn(), getProcessedCode: vi.fn().mockReturnValue(null), clearProcessedCode: vi.fn(),
    clearAll: vi.fn(),
  };
}

function setup(user: User = MOCK_USER) {
  const mockStorage = makeStorageMock();
  const mockRouter  = { navigate: vi.fn() };

  TestBed.configureTestingModule({
    providers: [
      AuthService,
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: AuthStorageService, useValue: mockStorage },
      { provide: Router, useValue: mockRouter },
    ],
  });

  const service = TestBed.inject(AuthService);
  const httpMock = TestBed.inject(HttpTestingController);

  // Flush la requête initiale initializeAuth()
  httpMock.expectOne(r => r.url.includes('/api/auth/refresh'))
    .flush({ token: 'jwt_token', user });

  return { service, httpMock, mockStorage, mockRouter };
}

describe('AuthService', () => {
  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
    TestBed.resetTestingModule();
  });

  // ===== Signals computed =====

  describe('isAuthenticated()', () => {
    it('retourne true après une initialisation réussie', () => {
      const { service } = setup();
      expect(service.isAuthenticated()).toBe(true);
    });
  });

  describe('displayName()', () => {
    it('retourne le username de l\'utilisateur courant', () => {
      const { service } = setup();
      expect(service.displayName()).toBe('Mazlai');
    });
  });

  describe('userAvatar()', () => {
    it('retourne l\'URL CDN Discord quand discord_avatar est défini', () => {
      const { service } = setup();
      expect(service.userAvatar()).toContain('cdn.discordapp.com/avatars/123456789/avatar_hash.png');
    });

    it('retourne l\'URL de fallback quand discord_avatar est null', () => {
      const { service } = setup({ ...MOCK_USER, discord_avatar: null });
      expect(service.userAvatar()).toContain('cdn.discordapp.com/embed/avatars/');
    });
  });

  // ===== handleDiscordCallback() =====

  describe('handleDiscordCallback()', () => {
    it('rejette si le code a déjà été traité', async () => {
      const { service, mockStorage } = setup();
      mockStorage.getProcessedCode.mockReturnValue('already_used_code');

      await expect(
        lastValueFrom(service.handleDiscordCallback('already_used_code', 'state_abc'))
      ).rejects.toThrow('Code already processed');
    });

    it('rejette si le state ne correspond pas au state sauvegardé', async () => {
      const { service, mockStorage } = setup();
      mockStorage.getProcessedCode.mockReturnValue(null);
      mockStorage.getState.mockReturnValue('expected_state');

      await expect(
        lastValueFrom(service.handleDiscordCallback('new_code', 'wrong_state'))
      ).rejects.toThrow('Invalid state parameter');
    });

    it('retourne l\'AuthResponse et sauvegarde le token en cas de succès', async () => {
      const { service, httpMock, mockStorage } = setup();
      mockStorage.getProcessedCode.mockReturnValue(null);
      mockStorage.getState.mockReturnValue(null);

      const promise = lastValueFrom(service.handleDiscordCallback('valid_code', 'state_abc'));
      httpMock.expectOne(r => r.url.includes('/api/auth/discord/callback')).flush(MOCK_AUTH_RESPONSE);

      const res = await promise;
      expect(res.token).toBe('jwt_token');
      expect(mockStorage.saveToken).toHaveBeenCalledWith('jwt_token');
    });
  });

  // ===== logout() =====

  describe('logout()', () => {
    it('appelle clearAll et navigue vers "/"', async () => {
      const { service, httpMock, mockStorage, mockRouter } = setup();

      service.logout();
      httpMock.expectOne(r => r.url.includes('/api/auth/logout')).flush({});

      // Laisser le micro-task se terminer
      await Promise.resolve();

      expect(mockStorage.clearAll).toHaveBeenCalled();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
    });
  });
});